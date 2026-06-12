import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/students";
import { mapBlock, type DbBlockTemplate } from "@/lib/blocks";

export type LessonPlanStatus = "draft" | "ready" | "archived";

export type LessonPlanMeta = {
  place?: string;
  tags?: string[];
};

export type DbLessonPlanBlock = DbBlockTemplate & {
  planBlockId: string;
  sortOrder: number;
  plannedDurationMinutes: number;
  scriptOverride: string;
  cautionsOverride: string;
};

export type DbLessonPlan = {
  id: string;
  name: string;
  theme: string;
  place: string;
  format: "personal" | "group" | "online" | "";
  formatLabel: string;
  totalMinutes: number;
  status: LessonPlanStatus;
  statusLabel: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  blocks: DbLessonPlanBlock[];
  blockCount: number;
  categoryMinutes: Array<{ category: string; minutes: number }>;
};

type RawPlan = {
  id: string;
  name: string;
  theme: string | null;
  duration_minutes: number;
  format: "personal" | "group" | "online" | null;
  memo: string | null;
  status: LessonPlanStatus;
  created_at: string;
  updated_at: string;
};

type RawPlanBlock = {
  id: string;
  lesson_plan_id: string;
  sort_order: number;
  planned_duration_minutes: number | null;
  script_override: string | null;
  cautions_override: string | null;
  block?: Parameters<typeof mapBlock>[0] | null;
};

export type LessonPlanFormState = {
  error?: string;
};

export const lessonPlanStatusOptions: Array<{ value: LessonPlanStatus; label: string }> = [
  { value: "draft", label: "下書き" },
  { value: "ready", label: "準備済み" },
  { value: "archived", label: "アーカイブ" },
];

export const lessonFormatOptions = [
  { value: "group", label: "グループ" },
  { value: "personal", label: "パーソナル" },
  { value: "online", label: "オンライン" },
] as const;

export function getStatusLabel(status: LessonPlanStatus) {
  return lessonPlanStatusOptions.find((option) => option.value === status)?.label ?? "下書き";
}

export function getFormatLabel(format: DbLessonPlan["format"]) {
  return lessonFormatOptions.find((option) => option.value === format)?.label ?? "未設定";
}

export function parsePlanMeta(value: string | null): LessonPlanMeta {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as LessonPlanMeta;
    return {
      place: typeof parsed.place === "string" ? parsed.place : "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((tag): tag is string => typeof tag === "string") : [],
    };
  } catch {
    return { place: "", tags: [] };
  }
}

export function stringifyPlanMeta(meta: LessonPlanMeta) {
  return JSON.stringify({
    place: meta.place?.trim() ?? "",
    tags: Array.from(new Set((meta.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
  });
}

function normalizeTags(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[,\n、]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

export function getLessonPlanPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const theme = String(formData.get("theme") ?? "").trim();
  const place = String(formData.get("place") ?? "").trim();
  const format = String(formData.get("format") ?? "group") as DbLessonPlan["format"];
  const status = String(formData.get("status") ?? "draft") as LessonPlanStatus;
  const blockIds = formData
    .getAll("block_ids")
    .map((value) => String(value))
    .filter(Boolean);
  const tags = normalizeTags(formData.get("tags"));

  if (!name) return { error: "レッスンプラン名を入力してください。" };
  if (!["personal", "group", "online"].includes(format)) return { error: "形式を選択してください。" };
  if (!["draft", "ready", "archived"].includes(status)) return { error: "ステータスを選択してください。" };
  if (!blockIds.length) return { error: "ブロックを1つ以上追加してください。" };

  return {
    payload: {
      name,
      theme,
      format,
      status,
      memo: stringifyPlanMeta({ place, tags }),
    },
    tags,
    blockIds,
  };
}

function buildCategoryMinutes(blocks: DbLessonPlanBlock[]) {
  const totals = new Map<string, number>();
  for (const block of blocks) {
    totals.set(block.majorCategory, (totals.get(block.majorCategory) ?? 0) + block.plannedDurationMinutes);
  }
  return Array.from(totals.entries()).map(([category, minutes]) => ({ category, minutes }));
}

function mapPlan(row: RawPlan, planBlocks: RawPlanBlock[]): DbLessonPlan {
  const meta = parsePlanMeta(row.memo);
  const blocks = planBlocks
    .filter((item) => item.block)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => {
      const block = mapBlock(item.block!);
      return {
        ...block,
        planBlockId: item.id,
        sortOrder: item.sort_order,
        plannedDurationMinutes: item.planned_duration_minutes ?? block.durationMinutes,
        scriptOverride: item.script_override ?? "",
        cautionsOverride: item.cautions_override ?? "",
      };
    });

  return {
    id: row.id,
    name: row.name,
    theme: row.theme ?? "",
    place: meta.place ?? "",
    format: row.format ?? "",
    formatLabel: getFormatLabel(row.format ?? ""),
    totalMinutes: row.duration_minutes,
    status: row.status,
    statusLabel: getStatusLabel(row.status),
    tags: meta.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    blocks,
    blockCount: blocks.length,
    categoryMinutes: buildCategoryMinutes(blocks),
  };
}

async function fetchPlanBlocks(planIds: string[]) {
  if (!planIds.length) return [] as RawPlanBlock[];

  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_plan_blocks")
    .select(`
      id,
      lesson_plan_id,
      sort_order,
      planned_duration_minutes,
      script_override,
      cautions_override,
      block:block_templates(
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
      )
    `)
    .in("lesson_plan_id", planIds)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`レッスンプランのブロックを取得できませんでした: ${error.message}`);
  return (data ?? []) as unknown as RawPlanBlock[];
}

export async function getLessonPlans() {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_plans")
    .select("id,name,theme,duration_minutes,format,memo,status,created_at,updated_at")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`レッスンプランを取得できませんでした: ${error.message}`);

  const plans = (data ?? []) as RawPlan[];
  const blocks = await fetchPlanBlocks(plans.map((plan) => plan.id));
  return plans.map((plan) => mapPlan(plan, blocks.filter((block) => block.lesson_plan_id === plan.id)));
}

export async function getLessonPlanById(id: string) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("lesson_plans")
    .select("id,name,theme,duration_minutes,format,memo,status,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`レッスンプランを取得できませんでした: ${error.message}`);
  if (!data) notFound();

  const blocks = await fetchPlanBlocks([id]);
  return mapPlan(data as RawPlan, blocks);
}
