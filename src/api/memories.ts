import { supabase } from '@/supabase/client';

/** 记忆条目 */
export interface Memory {
  id: number;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  importance: number;
  created_at: string;
  updated_at: string;
}

/** 创建记忆入参 */
export interface CreateMemoryInput {
  title: string;
  content: string;
  tags?: string[];
  importance?: number;
}

/** 更新记忆入参（只传要改的字段） */
export interface UpdateMemoryInput {
  title?: string;
  content?: string;
  tags?: string[];
  importance?: number;
}

/** 列表查询参数 */
export interface ListMemoriesParams {
  /** 关键词（模糊匹配 title/content） */
  search?: string;
  /** 按标签过滤 */
  tag?: string;
  /** 排序字段 */
  orderBy?: 'created_at' | 'updated_at' | 'importance';
  /** 升序/降序 */
  ascending?: boolean;
  /** 分页：第几页（从 1 开始） */
  page?: number;
  /** 分页：每页条数 */
  pageSize?: number;
}

/** 分页结果 */
export interface PagedMemories {
  items: Memory[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 列出当前用户的记忆（分页 + 搜索 + 标签过滤）
 * RLS 保证只能看到自己的数据
 */
export async function listMemories(params: ListMemoriesParams = {}): Promise<PagedMemories> {
  const {
    search,
    tag,
    orderBy = 'created_at',
    ascending = false,
    page = 1,
    pageSize = 20,
  } = params;

  let query = supabase
    .from('memories')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }
  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order(orderBy, { ascending })
    .range(from, to);

  if (error) throw new Error(`查询失败: ${error.message}`);
  return {
    items: (data as Memory[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  };
}

/** 获取单条记忆详情 */
export async function getMemory(id: number): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`获取失败: ${error.message}`);
  return data as Memory;
}

/** 新建记忆 */
export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  const { data, error } = await supabase
    .from('memories')
    .insert({
      title: input.title,
      content: input.content,
      tags: input.tags ?? [],
      importance: input.importance ?? 1,
    })
    .select()
    .single();

  if (error) throw new Error(`创建失败: ${error.message}`);
  return data as Memory;
}

/** 更新记忆（部分更新） */
export async function updateMemory(id: number, input: UpdateMemoryInput): Promise<Memory> {
  const patch: UpdateMemoryInput & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) patch.content = input.content;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.importance !== undefined) patch.importance = input.importance;

  const { data, error } = await supabase
    .from('memories')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`更新失败: ${error.message}`);
  return data as Memory;
}

/** 删除记忆 */
export async function deleteMemory(id: number): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`删除失败: ${error.message}`);
}

/** 获取用户记忆统计（总条数/平均重要度） */
export async function getMemoryStats(): Promise<{ total: number; avgImportance: number }> {
  const { data, error } = await supabase
    .from('memories')
    .select('importance');

  if (error) throw new Error(`统计失败: ${error.message}`);
  const items = (data ?? []) as { importance: number }[];
  if (!items.length) return { total: 0, avgImportance: 0 };
  const avg = items.reduce((s, it) => s + (it.importance ?? 1), 0) / items.length;
  return { total: items.length, avgImportance: Math.round(avg * 10) / 10 };
}
