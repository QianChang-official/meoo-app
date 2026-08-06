/**
 * 微信小程序登录 Edge Function
 *
 * 流程：
 * 1. 前端 wx.login() 拿到 code，POST 到本函数
 * 2. 本函数用 code + AppID + AppSecret 换 openid/unionid（jscode2session）
 * 3. 用 openid 生成 {openid}@wx.local 虚拟邮箱
 * 4. 直接尝试 admin.createUser：成功 → 新用户；返回"已注册"错误 → 已存在用户，走登录路径
 *    （不再用 listUsers 翻页预查，因为大用户量下 perPage 易被服务端 cap，导致漏判）
 * 5. 用 generateLink 生成 magiclink 的 hashed_token，同时拿回用户对象
 * 6. 前端用 supabase.auth.verifyOtp({ token_hash, type: 'magiclink' }) 完成登录
 *
 * 环境变量（必需，需要用户手动配置）：
 * - WX_APP_ID       微信小程序 AppID
 * - WX_APP_SECRET   微信小程序 AppSecret
 *
 * 部署：meoo-cli cloud deploy-function -n wx-mp-login -j false
 *      （-j false 是必须的，登录前用户没有 token）
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Jscode2SessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

// Supabase 在 email 已注册时的错误识别：兼容 code 字段（新版）和 message 关键字（旧版）
function isEmailAlreadyExistsError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  if (e?.code === 'email_exists') return true;
  const msg = (e?.message || '').toLowerCase();
  return msg.includes('already') && (msg.includes('registered') || msg.includes('exists'));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const appid = Deno.env.get('WX_APP_ID');
    const secret = Deno.env.get('WX_APP_SECRET');
    if (!appid || !secret) {
      return new Response(
        JSON.stringify({
          code: 'WX_CONFIG_MISSING',
          error: '微信登录尚未配置：请到「云服务 → 登录认证 → 微信登录」配置 WX_APP_ID 和 WX_APP_SECRET',
        }),
        { status: 503, headers: corsHeaders },
      );
    }

    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ error: '缺少 wx.login 返回的 code 参数' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1) code → openid
    const wxUrl =
      `https://api.weixin.qq.com/sns/jscode2session` +
      `?appid=${encodeURIComponent(appid)}` +
      `&secret=${encodeURIComponent(secret)}` +
      `&js_code=${encodeURIComponent(code)}` +
      `&grant_type=authorization_code`;

    const wxRes = await fetch(wxUrl);
    const wxData: Jscode2SessionResponse = await wxRes.json();
    if (wxData.errcode || !wxData.openid) {
      return new Response(
        JSON.stringify({
          error: `微信登录失败: ${wxData.errmsg || 'unknown'}`,
          errcode: wxData.errcode,
        }),
        { status: 400, headers: corsHeaders },
      );
    }
    const { openid, unionid } = wxData;

    // 2) 用 openid 派生虚拟邮箱（与 meoo 用户名登录的 *@meoo.local 模式一致）
    const email = `${openid}@wx.local`;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // 3) 直接 createUser：新用户直接建好；"email 已注册"错误是合法分支（老用户重复登录），不要 throw
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        provider: 'wechat_miniprogram',
        openid,
        unionid: unionid ?? null,
      },
    });
    if (createErr && !isEmailAlreadyExistsError(createErr)) {
      throw createErr;
    }

    // 4) 生成 magiclink 的 hashed_token（不发邮件，直接拿 token 给前端 verifyOtp）
    //    generateLink 同时返回完整用户对象，免去为老用户再查一次 ID
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: '' },
    });
    if (linkErr) throw linkErr;

    const tokenHash = linkData?.properties?.hashed_token;
    const userId = created?.user?.id ?? linkData?.user?.id ?? null;
    if (!tokenHash) {
      return new Response(JSON.stringify({ error: '生成 magiclink token 失败' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        token_hash: tokenHash,
        user_id: userId,
        openid,
        unionid: unionid ?? null,
      }),
      { headers: corsHeaders },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
