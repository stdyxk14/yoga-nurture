import { notFound } from "next/navigation";
import type { BlockTemplate } from "@/components/yoga/records";
import { formatJapaneseDate } from "@/lib/date-format";
import { requireUserId } from "@/lib/students";

export type BlockCategory = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
  subcategories: BlockSubcategory[];
};

export type BlockSubcategory = {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type DbBlockTemplate = BlockTemplate & {
  categoryId: string | null;
  subcategoryId: string | null;
  durationMinutes: number;
  archived: boolean;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlockListFilters = {
  q?: string;
  category?: string;
  subcategory?: string;
  tag?: string;
  sort?: string;
};

export type BlockFormState = {
  error?: string;
};

type RawBlock = {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  name: string;
  duration_minutes: number;
  purpose: string | null;
  level: string | null;
  cautions: string | null;
  script: string | null;
  memo: string | null;
  favorite: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string | null } | null;
  subcategory?: { id: string; name: string | null } | null;
  block_template_tags?: Array<{ tag?: { id: string; name: string | null } | null }>;
};

type BlockUsageStats = {
  usageCount: number;
  skipCount: number;
  reactionCount: number;
  goodCount: number;
  improvementCount: number;
  latestDate: string;
};

export const defaultBlockCategories = [
  "事前準備",
  "雑談",
  "導入",
  "呼吸法",
  "ウォーミングアップ",
  "スーリャナマスカーラ",
  "立位",
  "立位以外",
  "ターゲットアーサナ",
  "クールダウン",
  "クロージング",
  "その他",
];

export const defaultSubcategories: Record<string, string[]> = {
  導入: ["足指体操", "今日のテーマ説明", "怪我確認", "グラウンディング"],
  呼吸法: ["完全呼吸法", "片鼻呼吸", "胸式呼吸", "腹式呼吸"],
  ウォーミングアップ: ["キャットカウ", "肩まわし", "股関節ほぐし"],
  クールダウン: ["首のストレッチ", "セツヴァンダサルヴァンガ", "ハラアーサナ", "ジャタラパリブルッタアーサナ", "シャヴァーサナ"],
};

export function mapBlock(row: RawBlock, stats?: BlockUsageStats): DbBlockTemplate {
  const tags = (row.block_template_tags ?? [])
    .map((item) => item.tag?.name)
    .filter((tag): tag is string => Boolean(tag));

  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    majorCategory: row.category?.name ?? "未分類",
    minorCategory: row.subcategory?.name ?? "未分類",
    duration: `${row.duration_minutes}分`,
    durationMinutes: row.duration_minutes,
    purpose: row.purpose ?? "",
    level: row.level ?? "",
    cautions: row.cautions ?? "",
    script: row.script ?? "",
    tags,
    memo: row.memo ?? "",
    usageCount: stats?.usageCount ?? 0,
    averageRating: stats?.reactionCount ? Math.round(((stats.goodCount / stats.reactionCount) * 5) * 10) / 10 : 0,
    goodRate: stats?.reactionCount ? Math.round((stats.goodCount / stats.reactionCount) * 100) : null,
    improvementCount: stats?.improvementCount ?? 0,
    skipCount: stats?.skipCount ?? 0,
    lastUsed: stats?.latestDate ? formatJapaneseDate(new Date(stats.latestDate)) : "未使用",
    lastUsedAt: stats?.latestDate ?? "",
    archived: row.archived,
    favorite: row.favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBlockCategories() {
  const { supabase } = await requireUserId();
  const { data: categories, error: categoryError } = await supabase
    .from("block_categories")
    .select("id,name,color,icon,sort_order,archived,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (categoryError) throw new Error(`ブロックカテゴリーを取得できませんでした: ${categoryError.message}`);

  const { data: subcategories, error: subcategoryError } = await supabase
    .from("block_subcategories")
    .select("id,category_id,name,sort_order,archived,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (subcategoryError) throw new Error(`小カテゴリーを取得できませんでした: ${subcategoryError.message}`);

  return (categories ?? []).map((category) => ({
    ...(category as Omit<BlockCategory, "subcategories">),
    subcategories: (subcategories ?? []).filter((subcategory) => subcategory.category_id === category.id) as BlockSubcategory[],
  })) as BlockCategory[];
}

export async function getBlockTags() {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase.from("block_tags").select("id,name").order("name", { ascending: true });
  if (error) throw new Error(`タグを取得できませんでした: ${error.message}`);
  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function getBlocks(filters: BlockListFilters = {}) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("block_templates")
    .select(`
      id,
      category_id,
      subcategory_id,
      name,
      duration_minutes,
      purpose,
      level,
      cautions,
      script,
      memo,
      favorite,
      archived,
      created_at,
      updated_at,
      category:block_categories(id,name),
      subcategory:block_subcategories(id,name),
      block_template_tags(tag:block_tags(id,name))
    `)
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`ブロックテンプレートを取得できませんでした: ${error.message}`);

  const statsByBlock = await getBlockUsageStats(((data ?? []) as unknown as RawBlock[]).map((row) => row.id));
  let blocks = ((data ?? []) as unknown as RawBlock[]).map((row) => mapBlock(row, statsByBlock.get(row.id)));
  const q = filters.q?.trim().toLowerCase();

  if (q) {
    blocks = blocks.filter((block) =>
      [block.name, block.script, block.purpose, block.cautions, block.memo, block.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  if (filters.category) blocks = blocks.filter((block) => block.categoryId === filters.category);
  if (filters.subcategory) blocks = blocks.filter((block) => block.subcategoryId === filters.subcategory);
  if (filters.tag) blocks = blocks.filter((block) => block.tags.includes(filters.tag!));

  if (filters.sort === "duration") {
    blocks = blocks.sort((a, b) => a.durationMinutes - b.durationMinutes);
  } else if (filters.sort === "name") {
    blocks = blocks.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  } else {
    blocks = blocks.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  return blocks;
}

async function getBlockUsageStats(blockIds: string[]) {
  const stats = new Map<string, BlockUsageStats>();
  for (const blockId of blockIds) {
    stats.set(blockId, { usageCount: 0, skipCount: 0, reactionCount: 0, goodCount: 0, improvementCount: 0, latestDate: "" });
  }
  if (!blockIds.length) return stats;

  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_record_blocks")
    .select("block_template_id,done,reaction,improvement_memo,record:lesson_records(record_date,schedule:schedules(starts_at))")
    .in("block_template_id", blockIds);

  if (error) throw new Error(`ブロック使用実績を取得できませんでした: ${error.message}`);

  for (const row of (data ?? []) as Array<{
    block_template_id: string;
    done: boolean | null;
    reaction: "good" | "neutral" | "poor" | null;
    improvement_memo: string | null;
    record?: { record_date: string | null; schedule?: { starts_at: string | null } | Array<{ starts_at: string | null }> | null } | Array<{ record_date: string | null; schedule?: { starts_at: string | null } | Array<{ starts_at: string | null }> | null }> | null;
  }>) {
    const current = stats.get(row.block_template_id);
    if (!current) continue;
    const wasDone = row.done !== false;
    if (wasDone) current.usageCount += 1;
    if (!wasDone) current.skipCount += 1;
    if (wasDone && row.reaction) current.reactionCount += 1;
    if (wasDone && row.reaction === "good") current.goodCount += 1;
    if (row.improvement_memo?.trim()) current.improvementCount += 1;
    const record = firstRelation(row.record);
    const schedule = firstRelation(record?.schedule);
    const dateValue = schedule?.starts_at ?? record?.record_date ?? "";
    if (wasDone && dateValue && dateValue > current.latestDate) current.latestDate = dateValue;
  }

  return stats;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getBlockById(id: string) {
  const block = (await getBlocks()).find((item) => item.id === id);
  if (!block) notFound();
  return block;
}

export function normalizeTag(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function getBlockPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const subcategoryId = String(formData.get("subcategory_id") ?? "") || null;
  const durationMinutes = Number.parseInt(String(formData.get("duration_minutes") ?? "5"), 10);
  const purpose = String(formData.get("purpose") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const cautions = String(formData.get("cautions") ?? "").trim();
  const script = String(formData.get("script") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const tags = formData
    .getAll("tags")
    .map((tag) => normalizeTag(String(tag)))
    .filter(Boolean);

  if (!name) return { error: "ブロック名を入力してください。" };
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return { error: "目安時間は1分以上の数字で入力してください。" };

  return {
    payload: {
      category_id: categoryId,
      subcategory_id: subcategoryId,
      name,
      duration_minutes: durationMinutes,
      purpose,
      level,
      cautions,
      script,
      memo,
    },
    tags: Array.from(new Set(tags)),
  };
}

export async function replaceBlockTags(blockId: string, tags: string[]) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("block_template_tags").delete().eq("block_template_id", blockId);

  for (const tag of tags) {
    const { data: tagRow, error: tagError } = await supabase
      .from("block_tags")
      .upsert({ user_id: userId, name: tag }, { onConflict: "user_id,name" })
      .select("id")
      .single();

    if (tagError || !tagRow) throw new Error(tagError?.message ?? "タグを保存できませんでした。");

    const { error: relationError } = await supabase
      .from("block_template_tags")
      .insert({ block_template_id: blockId, tag_id: tagRow.id });

    if (relationError) throw new Error(relationError.message);
  }
}
