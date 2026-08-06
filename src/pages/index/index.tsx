import { useCallback, useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Input, ScrollView, Button } from '@tarojs/components';
import { useAuthStore } from '@/store/auth-store';
import { redirectToLogin } from '@/lib/redirect-to-login';
import { listMemories, deleteMemory, getMemoryStats, type Memory } from '@/api/memories';

const IMPORTANCE_COLORS: Record<number, string> = {
  1: 'var(--muted-foreground)',
  2: '#60a5fa',
  3: '#f59e0b',
  4: '#ef4444',
  5: '#dc2626',
};

export default function IndexPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, avgImportance: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async (keyword = '', pageNo = 1) => {
    setLoading(true);
    try {
      const res = await listMemories({ search: keyword, page: pageNo, pageSize: PAGE_SIZE });
      setItems(pageNo === 1 ? res.items : (prev) => [...prev, ...res.items]);
      setTotal(res.total);
      setPage(pageNo);
    } catch (e) {
      Taro.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getMemoryStats());
    } catch {
      /* 统计失败不阻塞 */
    }
  }, []);

  useEffect(() => {
    if (!user) {
      redirectToLogin();
      return;
    }
    load();
    loadStats();
  }, [user, load, loadStats]);

  const onSearch = () => {
    setItems([]);
    load(search, 1);
  };

  const onLoadMore = () => {
    if (items.length < total && !loading) load(search, page + 1);
  };

  const onCreate = () => {
    Taro.navigateTo({ url: '/pages/memory-edit/index' });
  };

  const onEdit = (id: number) => {
    Taro.navigateTo({ url: `/pages/memory-edit/index?id=${id}` });
  };

  const onDelete = (id: number, title: string) => {
    Taro.showModal({
      title: '删除记忆',
      content: `确定删除「${title || '无标题'}」吗？`,
      confirmColor: '#ef4444',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await deleteMemory(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
          load(search, 1);
          loadStats();
        } catch (e) {
          Taro.showToast({ title: (e as Error).message, icon: 'none' });
        }
      },
    });
  };

  return (
    <View className="min-h-screen bg-background flex flex-col">
      {/* 顶部：标题 + 统计 */}
      <View className="px-4 pt-6 pb-2">
        <View className="flex items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">记忆笔记</Text>
          <View
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
            onClick={onCreate}
          >
            <View className="i-lucide-plus w-5 h-5 text-primary-foreground" />
          </View>
        </View>
        <Text className="text-xs text-muted-foreground mt-1">
          共 {stats.total} 条记忆 · 平均重要度 {stats.avgImportance}
        </Text>
      </View>

      {/* 搜索栏 */}
      <View className="px-4 py-2">
        <View className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <View className="i-lucide-search w-4 h-4 text-muted-foreground" />
          <Input
            className="flex-1 text-sm text-foreground"
            value={search}
            placeholder="搜索记忆..."
            placeholderClass="text-muted-foreground"
            onInput={(e) => setSearch(e.detail.value)}
            onConfirm={onSearch}
          />
          {search ? (
            <Text
              className="text-xs text-primary"
              onClick={() => {
                setSearch('');
                load('', 1);
              }}
            >
              清除
            </Text>
          ) : null}
        </View>
      </View>

      {/* 列表 */}
      <ScrollView
        className="flex-1"
        scrollY
        lowerThreshold={80}
        onScrollToLower={onLoadMore}
      >
        <View className="px-4 pb-4">
        {items.length === 0 && !loading ? (
          <View className="py-20 flex flex-col items-center gap-3">
            <View className="i-lucide-inbox w-12 h-12" style={{ color: 'rgba(148,163,184,0.4)' }} />
            <Text className="text-sm text-muted-foreground">
              {search ? '没有匹配的记忆' : '还没有记忆，点右上角 + 新建'}
            </Text>
          </View>
        ) : (
          items.map((m) => (
            <View
              key={m.id}
              className="bg-card border border-border rounded-lg p-3 mb-2"
              onClick={() => onEdit(m.id)}
            >
              <View className="flex items-center justify-between">
                <Text className="text-base font-medium text-foreground flex-1 mr-2 line-clamp-1">
                  {m.title || '无标题'}
                </Text>
                <Text
                  className="text-xs shrink-0"
                  style={{ color: IMPORTANCE_COLORS[m.importance] ?? 'var(--muted-foreground)' }}
                >
                  {'★'.repeat(Math.min(Math.max(m.importance ?? 1, 1), 5))}
                </Text>
              </View>
              <Text className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {m.content || '（空内容）'}
              </Text>
              <View className="flex items-center justify-between mt-2">
                <View className="flex gap-1 flex-wrap flex-1 mr-2">
                  {(m.tags ?? []).slice(0, 3).map((t) => (
                    <Text
                      key={t}
                      className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground"
                    >
                      {t}
                    </Text>
                  ))}
                </View>
                <Text
                  className="text-xs shrink-0 ml-2"
                  style={{ color: '#ef4444' }}
                  onClick={(e) => {
                    e.stopPropagation?.();
                    onDelete(m.id, m.title);
                  }}
                >
                  删除
                </Text>
              </View>
            </View>
          ))
        )}
        {loading ? (
          <View className="py-4 flex justify-center">
            <Text className="text-xs text-muted-foreground">加载中...</Text>
          </View>
        ) : null}
        {items.length > 0 && items.length >= total ? (
          <View className="py-4 flex justify-center">
            <Text className="text-xs text-muted-foreground">— 到底了 —</Text>
          </View>
        ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
