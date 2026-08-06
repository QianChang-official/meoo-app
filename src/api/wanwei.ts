import Taro from '@tarojs/taro';

/**
 * 宛委枢忆主项目远程控制 API 客户端
 * 连接：主项目 FastAPI 后端（X-API-Key 认证）
 * 覆盖：HTTP 状态 / 模型网关 / 任务进度 / 工具注册 / 记忆 / 灵魂对话 / 审计日志
 */

export interface WanweiConfig {
  /** 后端地址，如 http://10.20.20.4:8080 或 https://wanwei.example.com */
  baseUrl: string;
  /** API Key（X-API-Key 头） */
  apiKey: string;
}

let _config: WanweiConfig | null = null;

export function setWanweiConfig(cfg: WanweiConfig) {
  _config = cfg;
  try {
    Taro.setStorageSync('wanwei_config', cfg);
  } catch { /* ignore */ }
}

export function getWanweiConfig(): WanweiConfig | null {
  if (_config) return _config;
  try {
    const saved = Taro.getStorageSync('wanwei_config');
    if (saved) _config = saved;
  } catch { /* ignore */ }
  return _config;
}

export function clearWanweiConfig() {
  _config = null;
  try { Taro.removeStorageSync('wanwei_config'); } catch { /* ignore */ }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeout?: number;
  raw?: boolean;
}

/** 统一请求封装：X-API-Key 认证 + 错误解析 */
export async function wanweiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const cfg = getWanweiConfig();
  if (!cfg) throw new Error('未配置后端地址，请先到「设置」填写');

  const { method = 'GET', body, timeout = 15000 } = options;
  const url = `${cfg.baseUrl.replace(/\/$/, '')}${path}`;

  try {
    const res = await Taro.request({
      url,
      method,
      timeout,
      header: {
        'X-API-Key': cfg.apiKey,
        'Content-Type': 'application/json',
      },
      data: body as any,
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.data as T;
    }
    // 结构化错误
    let detail = `HTTP ${res.statusCode}`;
    try {
      const d = res.data as any;
      if (typeof d === 'string' && d) detail = d;
      else if (d?.detail) detail = typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail);
      else if (d?.message) detail = d.message;
    } catch { /* ignore */ }
    throw new Error(detail);
  } catch (e: any) {
    if (e?.errMsg?.includes('timeout')) throw new Error('请求超时，检查后端是否可达');
    if (e?.errMsg?.includes('fail')) throw new Error(`网络错误: ${e.errMsg}`);
    throw e;
  }
}

/* ============ 1. HTTP 状态 ============ */

export interface HealthStatus {
  status?: string;
  app?: string;
  version?: string;
  uptime?: string;
  [key: string]: unknown;
}

/** 综合健康检查 */
export const getHealth = () => wanweiRequest<HealthStatus>('/health');
/** 存活探针 */
export const getHealthLive = () => wanweiRequest<HealthStatus>('/health/live');
/** 就绪探针 */
export const getHealthReady = () => wanweiRequest<HealthStatus>('/health/ready');
/** 运行时指标 */
export const getMetrics = () => wanweiRequest<Record<string, unknown>>('/metrics');
/** 竞技场指标 */
export const getArenaMetrics = () => wanweiRequest<Record<string, unknown>>('/arena/metrics');
/** 麒麟 SDK 状态 */
export const getKylinStatus = () => wanweiRequest<Record<string, unknown>>('/kylin/sdk/status');

/* ============ 2. 模型网关 ============ */

export interface ModelProvider {
  name?: string;
  status?: string;
  [key: string]: unknown;
}

/** 模型提供商列表 */
export const getModelProviders = () => wanweiRequest<ModelProvider[]>('/model-gateway/providers');
/** 模型配置列表 */
export const getModelConfigs = () => wanweiRequest<Record<string, unknown>[]>('/model-gateway/configs');
/** 新增模型配置 */
export const addModelConfig = (cfg: Record<string, unknown>) =>
  wanweiRequest('/model-gateway/configs', { method: 'POST', body: cfg });
/** 删除模型配置 */
export const deleteModelConfig = (provider: string) =>
  wanweiRequest(`/model-gateway/configs/${encodeURIComponent(provider)}`, { method: 'DELETE' });

/* ============ 3. 任务进度（workflow） ============ */

export interface WorkflowRun {
  run_id?: string;
  status?: string;
  progress?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/** 任务运行列表 */
export const getWorkflowRuns = () => wanweiRequest<WorkflowRun[]>('/workflow/runs');
/** 任务详情 */
export const getWorkflowRun = (runId: string) =>
  wanweiRequest<WorkflowRun>(`/workflow/runs/${encodeURIComponent(runId)}`);
/** 任务执行轨迹 */
export const getWorkflowTrace = (runId: string) =>
  wanweiRequest<Record<string, unknown>>(`/workflow/runs/${encodeURIComponent(runId)}/trace`);
/** 任务产物列表 */
export const getWorkflowArtifacts = (runId: string) =>
  wanweiRequest<Record<string, unknown>[]>(`/workflow/runs/${encodeURIComponent(runId)}/artifacts`);
/** 任务统计 */
export const getWorkflowStats = () => wanweiRequest<Record<string, unknown>>('/workflow/stats');
/** 发起新任务 */
export const createWorkflowRun = (input: Record<string, unknown>) =>
  wanweiRequest('/workflow/runs', { method: 'POST', body: input });
/** 清理任务 */
export const cleanupWorkflow = () => wanweiRequest('/workflow/cleanup', { method: 'POST' });

/* ============ 4. 工具注册（AI 在用什么） ============ */

/** 已注册工具列表 */
export const getToolRegistry = () => wanweiRequest<Record<string, unknown>[]>('/tool-registry/tools');
/** 技能列表 */
export const getSkillRegistry = () => wanweiRequest<Record<string, unknown>[]>('/tool-registry/skills');

/* ============ 5. 审计日志（含工具调用记录） ============ */

export interface AuditLogItem {
  audit_id?: string;
  event_type?: string;
  payload?: Record<string, unknown>;
  created_at?: string;
  [key: string]: unknown;
}

/** 审计日志（limit 条，可按 trace_id 过滤） */
export const getAuditLogs = (limit = 50, traceId?: string) =>
  wanweiRequest<{ items: AuditLogItem[] }>(
    `/audit/logs?limit=${limit}${traceId ? `&trace_id=${encodeURIComponent(traceId)}` : ''}`,
  );

/* ============ 6. 灵魂对话 ============ */

export interface SoulChatInput {
  soul_id: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
}

export interface SoulChatResult {
  reply?: string;
  content?: string;
  [key: string]: unknown;
}

/** 灵魂对话（带记忆注入） */
export const soulChat = (input: SoulChatInput) =>
  wanweiRequest<SoulChatResult>('/soul/chat', { method: 'POST', body: input, timeout: 60000 });
/** 灵魂状态 */
export const getSoulState = (soulId: string) =>
  wanweiRequest<Record<string, unknown>>(`/soul/state/${encodeURIComponent(soulId)}`);
/** 灵魂情感 */
export const getSoulAffect = (soulId: string) =>
  wanweiRequest<Record<string, unknown>>(`/soul/affect/${encodeURIComponent(soulId)}`);

/* ============ 7. 记忆 ============ */

/** 记忆搜索 */
export const searchMemory = (query: string, limit = 10) =>
  wanweiRequest<Record<string, unknown>[]>(`/memory/search?q=${encodeURIComponent(query)}&limit=${limit}`);
/** 记忆胶囊列表 */
export const getMemoryCapsules = () => wanweiRequest<Record<string, unknown>[]>('/memory/v2/capsules');
/** 记忆事件上报 */
export const postMemoryEvent = (event: Record<string, unknown>) =>
  wanweiRequest('/memory/events', { method: 'POST', body: event });

/* ============ 8. 平台模块 ============ */

/** 平台模块列表 */
export const getPlatformModules = () => wanweiRequest<Record<string, unknown>[]>('/platform/modules');

/** 一键连通性测试：健康 + 模型 + 工具 */
export async function testConnection(): Promise<{
  ok: boolean;
  health?: HealthStatus;
  providers?: ModelProvider[];
  tools?: unknown[];
  error?: string;
}> {
  try {
    const [health, providers, tools] = await Promise.all([
      getHealth(),
      getModelProviders().catch(() => undefined),
      getToolRegistry().catch(() => undefined),
    ]);
    return { ok: true, health, providers, tools };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
