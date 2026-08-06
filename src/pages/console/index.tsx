import { useEffect, useRef, useState } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, ScrollView, Input, Textarea, Button } from '@tarojs/components';
import {
  getWanweiConfig,
  getHealth,
  getModelProviders,
  getWorkflowRuns,
  getToolRegistry,
  getAuditLogs,
  soulChat,
  testConnection,
  type WorkflowRun,
} from '@/api/wanwei';

type Tab = 'status' | 'tasks' | 'tools' | 'chat' | 'logs';

const TAB_LIST: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'status', label: '状态', icon: 'i-lucide-activity' },
  { key: 'tasks', label: '任务', icon: 'i-lucide-list-todo' },
  { key: 'tools', label: '工具', icon: 'i-lucide-wrench' },
  { key: 'chat', label: '对话', icon: 'i-lucide-message-square' },
  { key: 'logs', label: '日志', icon: 'i-lucide-scroll-text' },
];

export default function ConsolePage() {
  const [tab, setTab] = useState<Tab>('status');
  const [cfg, setCfg] = useState(getWanweiConfig());
  const [showSetup, setShowSetup] = useState(!getWanweiConfig());

  // 状态页
  const [health, setHealth] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [connMsg, setConnMsg] = useState('');
  const [connecting, setConnecting] = useState(false);

  // 任务页
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);

  // 工具页
  const [tools, setTools] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);

  // 对话页
  const [chatMsgs, setChatMsgs] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [soulId, setSoulId] = useState('default');

  // 日志页
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        refreshTab(tab);
      }, 10000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, tab]);

  const refreshTab = async (t: Tab = tab) => {
    if (!getWanweiConfig()) return;
    try {
      if (t === 'status') {
        const h = await getHealth();
        setHealth(h);
        getModelProviders().then(setProviders).catch(() => {});
      } else if (t === 'tasks') {
        setRunsLoading(true);
        const r = await getWorkflowRuns();
        setRuns(Array.isArray(r) ? r : []);
      } else if (t === 'tools') {
        setToolsLoading(true);
        const [tl, sl] = await Promise.all([
          getToolRegistry().catch(() => []),
          (await import('@/api/wanwei')).getSkillRegistry().catch(() => []),
        ]);
        setTools(Array.isArray(tl) ? tl : []);
        setSkills(Array.isArray(sl) ? sl : []);
      } else if (t === 'logs') {
        setLogsLoading(true);
        const r = await getAuditLogs(50);
        setLogs(r.items ?? []);
      }
    } catch (e) {
      Taro.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      setRunsLoading(false);
      setToolsLoading(false);
      setLogsLoading(false);
    }
  };

  const onConnect = async () => {
    if (!cfg?.baseUrl || !cfg?.apiKey) {
      Taro.showToast({ title: '请填写地址和 API Key', icon: 'none' });
      return;
    }
    setConnecting(true);
    setConnMsg('');
    try {
      const r = await testConnection();
      if (r.ok) {
        setHealth(r.health ?? null);
        setProviders(r.providers ?? []);
        setConnMsg('✅ 连接成功！');
        setShowSetup(false);
        refreshTab('tasks');
        refreshTab('tools');
      } else {
        setConnMsg(`❌ ${r.error ?? '连接失败'}`);
      }
    } catch (e) {
      setConnMsg(`❌ ${(e as Error).message}`);
    } finally {
      setConnecting(false);
    }
  };

  const onSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const newMsgs = [...chatMsgs, { role: 'user', content: text }];
    setChatMsgs(newMsgs);
    setChatInput('');
    setChatLoading(true);
    try {
      const r = await soulChat({
        soul_id: soulId || 'default',
        messages: newMsgs.map((m) => ({ role: m.role as any, content: m.content })),
      });
      setChatMsgs([...newMsgs, { role: 'assistant', content: (r.reply ?? r.content ?? '（无回复）') as string }]);
    } catch (e) {
      setChatMsgs([...newMsgs, { role: 'assistant', content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  /* ---------- 设置页 ---------- */
  if (showSetup) {
    return (
      <View className="min-h-screen bg-background flex flex-col px-4 pt-8">
        <Text className="text-2xl font-bold text-foreground mb-2">连接宛委枢忆</Text>
        <Text className="text-sm text-muted-foreground mb-6">
          填写后端地址和 API Key，远程控制 AI
        </Text>

        <View className="bg-card border border-border rounded-lg p-3 mb-3">
          <Input
            className="w-full text-sm text-foreground"
            value={cfg?.baseUrl ?? ''}
            placeholder="后端地址，如 http://10.20.20.4:8080"
            placeholderClass="text-muted-foreground"
            onInput={(e) => setCfg({ ...(cfg ?? { apiKey: '' }), baseUrl: e.detail.value })}
          />
        </View>
        <View className="bg-card border border-border rounded-lg p-3 mb-6">
          <Input
            className="w-full text-sm text-foreground"
            value={cfg?.apiKey ?? ''}
            placeholder="API Key（X-API-Key）"
            placeholderClass="text-muted-foreground"
            password
            onInput={(e) => setCfg({ ...(cfg ?? { baseUrl: '' }), apiKey: e.detail.value })}
          />
        </View>

        {connMsg ? <Text className="text-sm mb-3 px-1">{connMsg}</Text> : null}

        <View
          className={`w-full rounded-lg py-3 flex items-center justify-center ${connecting ? 'bg-muted' : 'bg-primary'}`}
          onClick={connecting ? undefined : () => {
            setWanweiConfigLocal(cfg);
            onConnect();
          }}
        >
          <Text className="text-primary-foreground font-medium">{connecting ? '连接中...' : '连接'}</Text>
        </View>
      </View>
    );
  }

  /* ---------- 主控制台 ---------- */
  return (
    <View className="min-h-screen bg-background flex flex-col">
      {/* 顶栏 */}
      <View className="px-4 pt-6 pb-2 flex items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-foreground">AI 控制台</Text>
          <Text className="text-xs text-muted-foreground mt-1 block">
            {getWanweiConfig()?.baseUrl ?? ''}
          </Text>
        </View>
        <View
          className="px-3 py-2 rounded-lg bg-card border border-border flex items-center gap-1"
          onClick={() => setShowSetup(true)}
        >
          <View className="i-lucide-settings w-4 h-4 text-muted-foreground" />
          <Text className="text-xs text-muted-foreground">设置</Text>
        </View>
      </View>

      {/* Tab 栏 */}
      <View className="flex px-2 py-1 gap-1">
        {TAB_LIST.map((t) => (
          <View
            key={t.key}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1 ${
              tab === t.key ? 'bg-primary' : 'bg-transparent'
            }`}
            onClick={() => setTab(t.key)}
          >
            <View className={`${t.icon} w-4 h-4 ${tab === t.key ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            <Text className={`text-xs ${tab === t.key ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
              {t.label}
            </Text>
          </View>
        ))}
      </View>

      {/* 内容区 */}
      <ScrollView className="flex-1 pt-2" scrollY>
        {/* 状态页 */}
        {tab === 'status' && (
          <View>
            <View className="flex gap-2 mb-2">
              <View
                className="flex-1 py-2 rounded-lg bg-primary flex items-center justify-center"
                onClick={() => refreshTab('status')}
              >
                <Text className="text-primary-foreground text-sm">刷新</Text>
              </View>
            </View>
            <View className="bg-card border border-border rounded-lg p-3 mb-2">
              <Text className="text-sm font-medium text-foreground mb-2">健康状态</Text>
              {health ? (
                <View className="flex flex-col gap-1">
                  {Object.entries(health).slice(0, 8).map(([k, v]) => (
                    <View key={k} className="flex justify-between">
                      <Text className="text-xs text-muted-foreground">{k}</Text>
                      <Text className="text-xs text-foreground">{String(v ?? '-')}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-xs text-muted-foreground">未加载</Text>
              )}
            </View>
            <View className="bg-card border border-border rounded-lg p-3 mb-2">
              <Text className="text-sm font-medium text-foreground mb-2">模型提供商</Text>
              {providers.length ? (
                providers.map((p, i) => (
                  <View key={i} className="flex justify-between py-1">
                    <Text className="text-xs text-foreground">{String(p.name ?? p.provider ?? i)}</Text>
                    <Text className="text-xs text-muted-foreground">{String(p.status ?? '-')}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-xs text-muted-foreground">无数据</Text>
              )}
            </View>
          </View>
        )}

        {/* 任务页 */}
        {tab === 'tasks' && (
          <View>
            <View className="flex gap-2 mb-2">
              <View
                className="flex-1 py-2 rounded-lg bg-primary flex items-center justify-center"
                onClick={() => refreshTab('tasks')}
              >
                <Text className="text-primary-foreground text-sm">{runsLoading ? '加载中...' : '刷新'}</Text>
              </View>
            </View>
            {runs.length === 0 && !runsLoading ? (
              <Text className="text-xs text-muted-foreground py-8 text-center block">暂无任务</Text>
            ) : (
              runs.map((r, i) => (
                <View key={i} className="bg-card border border-border rounded-lg p-3 mb-2">
                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-foreground flex-1 mr-2 line-clamp-1">
                      {String(r.run_id ?? `任务${i + 1}`)}
                    </Text>
                    <Text className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground shrink-0">
                      {String(r.status ?? '-')}
                    </Text>
                  </View>
                  {typeof r.progress === 'number' ? (
                    <View className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
                      <View className="h-full bg-primary" style={{ width: `${Math.min(r.progress, 100)}%` }} />
                    </View>
                  ) : null}
                  {r.created_at ? (
                    <Text className="text-xs text-muted-foreground mt-1 block">{String(r.created_at)}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}

        {/* 工具页 */}
        {tab === 'tools' && (
          <View>
            <View className="flex gap-2 mb-2">
              <View
                className="flex-1 py-2 rounded-lg bg-primary flex items-center justify-center"
                onClick={() => refreshTab('tools')}
              >
                <Text className="text-primary-foreground text-sm">{toolsLoading ? '加载中...' : '刷新'}</Text>
              </View>
            </View>
            <Text className="text-xs text-muted-foreground mb-1 px-1">已注册工具 ({tools.length})</Text>
            {tools.map((t, i) => (
              <View key={i} className="bg-card border border-border rounded-lg p-3 mb-2">
                <Text className="text-sm text-foreground">{String(t.name ?? t.tool ?? i)}</Text>
                {t.description ? (
                  <Text className="text-xs text-muted-foreground mt-1 line-clamp-2">{String(t.description)}</Text>
                ) : null}
              </View>
            ))}
            {skills.length ? (
              <>
                <Text className="text-xs text-muted-foreground mb-1 mt-3 px-1">技能 ({skills.length})</Text>
                {skills.map((s, i) => (
                  <View key={i} className="bg-card border border-border rounded-lg p-3 mb-2">
                    <Text className="text-sm text-foreground">{String(s.name ?? s.skill ?? i)}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </View>
        )}

        {/* 对话页 */}
        {tab === 'chat' && (
          <View className="flex flex-col">
            <View className="bg-card border border-border rounded-lg p-3 mb-2">
              <Input
                className="w-full text-sm text-foreground"
                value={soulId}
                placeholder="soul_id（默认 default）"
                placeholderClass="text-muted-foreground"
                onInput={(e) => setSoulId(e.detail.value)}
              />
            </View>
            <View className="flex-1 min-h-[300px] bg-card border border-border rounded-lg p-3 mb-2">
              {chatMsgs.length === 0 ? (
                <Text className="text-xs text-muted-foreground">发送消息与 AI 对话（带记忆注入）</Text>
              ) : (
                chatMsgs.map((m, i) => (
                  <View key={i} className={`mb-2 ${m.role === 'user' ? 'text-right' : ''}`}>
                    <View
                      className={`inline-block max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                        m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}
                    >
                      {m.content}
                    </View>
                  </View>
                ))
              )}
              {chatLoading ? <Text className="text-xs text-muted-foreground">思考中...</Text> : null}
            </View>
            <View className="flex gap-2 mb-4">
              <View className="flex-1 bg-card border border-border rounded-lg px-3 py-2">
                <Textarea
                  className="w-full text-sm text-foreground"
                  value={chatInput}
                  placeholder="输入消息..."
                  placeholderClass="text-muted-foreground"
                  autoHeight
                  onInput={(e) => setChatInput(e.detail.value)}
                />
              </View>
              <View
                className="w-16 rounded-lg bg-primary flex items-center justify-center"
                onClick={onSendChat}
              >
                <Text className="text-primary-foreground text-sm">{chatLoading ? '...' : '发送'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 日志页 */}
        {tab === 'logs' && (
          <View>
            <View className="flex gap-2 mb-2">
              <View
                className="flex-1 py-2 rounded-lg bg-primary flex items-center justify-center"
                onClick={() => refreshTab('logs')}
              >
                <Text className="text-primary-foreground text-sm">{logsLoading ? '加载中...' : '刷新'}</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-lg flex items-center justify-center ${
                  autoRefresh ? 'bg-primary' : 'bg-card border border-border'
                }`}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <Text className={`text-sm ${autoRefresh ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {autoRefresh ? '自动' : '手动'}
                </Text>
              </View>
            </View>
            {logs.length === 0 && !logsLoading ? (
              <Text className="text-xs text-muted-foreground py-8 text-center block">暂无日志</Text>
            ) : (
              logs.map((l, i) => (
                <View key={i} className="bg-card border border-border rounded-lg p-3 mb-2">
                  <View className="flex items-center justify-between">
                    <Text className="text-xs font-medium text-foreground">
                      {String(l.event_type ?? l.type ?? 'log')}
                    </Text>
                    <Text className="text-xs text-muted-foreground shrink-0 ml-2">
                      {String(l.created_at ?? '')}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted-foreground mt-1 break-all line-clamp-3">
                    {JSON.stringify(l.payload ?? l)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function setWanweiConfigLocal(cfg: any) {
  const { setWanweiConfig } = require('@/api/wanwei');
  setWanweiConfig(cfg);
}
