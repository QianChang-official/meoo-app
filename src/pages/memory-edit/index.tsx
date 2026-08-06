import { useEffect, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { View, Text, Input, Textarea } from '@tarojs/components';
import { createMemory, getMemory, updateMemory } from '@/api/memories';

const IMPORTANCE_OPTIONS = [1, 2, 3, 4, 5];

export default function MemoryEditPage() {
  const router = useRouter();
  const editId = router.params.id ? Number(router.params.id) : null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [importance, setImportance] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      Taro.setNavigationBarTitle({ title: '编辑记忆' });
      getMemory(editId)
        .then((m) => {
          setTitle(m.title);
          setContent(m.content);
          setTagsText((m.tags ?? []).join(','));
          setImportance(m.importance ?? 1);
        })
        .catch((e) => Taro.showToast({ title: (e as Error).message, icon: 'none' }));
    } else {
      Taro.setNavigationBarTitle({ title: '新建记忆' });
    }
  }, [editId]);

  const parseTags = (): string[] =>
    tagsText
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);

  const onSave = async () => {
    if (!title.trim() && !content.trim()) {
      Taro.showToast({ title: '标题和内容至少填一个', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      const input = {
        title: title.trim(),
        content: content.trim(),
        tags: parseTags(),
        importance,
      };
      if (editId) {
        await updateMemory(editId, input);
        Taro.showToast({ title: '已更新', icon: 'success' });
      } else {
        await createMemory(input);
        Taro.showToast({ title: '已保存', icon: 'success' });
      }
      setTimeout(() => Taro.navigateBack(), 600);
    } catch (e) {
      Taro.showToast({ title: (e as Error).message, icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="min-h-screen bg-background flex flex-col px-4 pt-4">
      {/* 标题 */}
      <View className="bg-card border border-border rounded-lg p-3 mb-3">
        <Input
          className="w-full text-lg text-foreground"
          value={title}
          placeholder="标题"
          placeholderClass="text-muted-foreground"
          onInput={(e) => setTitle(e.detail.value)}
        />
      </View>

      {/* 内容 */}
      <View className="bg-card border border-border rounded-lg p-3 mb-3 flex-1">
        <Textarea
          className="w-full h-full min-h-[200px] text-base text-foreground"
          value={content}
          placeholder="写点什么..."
          placeholderClass="text-muted-foreground"
          onInput={(e) => setContent(e.detail.value)}
        />
      </View>

      {/* 标签 */}
      <View className="bg-card border border-border rounded-lg p-3 mb-3">
        <Input
          className="w-full text-sm text-foreground"
          value={tagsText}
          placeholder="标签，用逗号分隔（如：工作,灵感）"
          placeholderClass="text-muted-foreground"
          onInput={(e) => setTagsText(e.detail.value)}
        />
      </View>

      {/* 重要度 */}
      <View className="bg-card border border-border rounded-lg p-3 mb-4">
        <Text className="text-xs text-muted-foreground mb-2">重要度</Text>
        <View className="flex items-center justify-between">
          {IMPORTANCE_OPTIONS.map((n) => (
            <View
              key={n}
              className={`flex-1 mx-1 py-2 rounded-lg flex items-center justify-center ${
                importance === n ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => setImportance(n)}
            >
              <Text
                className={`text-sm ${importance === n ? 'text-primary-foreground' : 'text-muted-foreground'}`}
              >
                {n}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 保存 */}
      <View
        className={`w-full rounded-lg py-3 flex items-center justify-center mb-6 ${
          loading ? 'bg-muted' : 'bg-primary'
        }`}
        onClick={loading ? undefined : onSave}
      >
        <Text className="text-primary-foreground font-medium">
          {loading ? '保存中...' : '保存'}
        </Text>
      </View>
    </View>
  );
}
