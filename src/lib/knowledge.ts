import { notFound } from "next/navigation";
import { isUuid } from "@/lib/ids";
import { requireUserId } from "@/lib/students";

export const KNOWLEDGE_BUCKET = "knowledge-files";

export const knowledgeSourceTypeLabels: Record<string, string> = {
  handwritten_image: "手書き画像",
  handwritten_pdf: "手書きPDF",
  manual_text: "テキストメモ",
  pdf: "PDF",
  image: "画像",
};

export const knowledgeStatusLabels: Record<string, string> = {
  uploaded: "アップロード済み",
  ocr_pending: "OCR待ち",
  ocr_processing: "OCR処理中",
  ocr_review_needed: "確認待ち",
  card_draft: "カード下書き",
  active: "有効",
  archived: "アーカイブ",
  error: "エラー",
};

export const mentorTypeLabels: Record<string, string> = {
  body: "身体分析",
  communication: "寄り添い接客",
  lesson_design: "レッスン設計",
  general: "総合",
};

export type KnowledgeDocument = {
  id: string;
  user_id: string;
  title: string;
  source_type: string;
  file_path: string | null;
  file_name: string | null;
  file_mime_type: string | null;
  file_size: number | null;
  description: string | null;
  tags: string[];
  status: string;
  raw_ocr_text: string | null;
  cleaned_text: string | null;
  summary: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type KnowledgeCard = {
  id: string;
  user_id: string;
  document_id: string | null;
  title: string;
  category: string | null;
  content: string;
  do_points: string[];
  dont_points: string[];
  example_phrases: string[];
  related_tags: string[];
  mentor_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type KnowledgeListFilters = {
  q?: string;
  status?: string;
  sourceType?: string;
  mentorType?: string;
};

export type KnowledgeStats = {
  documents: number;
  reviewNeeded: number;
  activeCards: number;
  errors: number;
};

export function parseTags(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[,\s、#]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

export function formatFileSize(size: number | null) {
  if (!size) return "-";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function buildKnowledgeFilePath(userId: string, documentId: string, fileName: string) {
  const safeName = fileName
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|#%{}^~[\]`]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 120);

  return `${userId}/${documentId}/${safeName || "knowledge-file"}`;
}

export async function getKnowledgeStats(): Promise<KnowledgeStats> {
  const { supabase, userId } = await requireUserId();

  const [documents, reviewNeeded, activeCards, errors] = await Promise.all([
    supabase.from("knowledge_documents").select("id", { count: "exact", head: true }).eq("user_id", userId).neq("status", "archived"),
    supabase.from("knowledge_documents").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "ocr_review_needed"),
    supabase.from("knowledge_cards").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "active"),
    supabase.from("knowledge_documents").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "error"),
  ]);

  return {
    documents: documents.count ?? 0,
    reviewNeeded: reviewNeeded.count ?? 0,
    activeCards: activeCards.count ?? 0,
    errors: errors.count ?? 0,
  };
}

export async function getKnowledgeDocuments(filters: KnowledgeListFilters = {}) {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) {
    return { documents: [] as KnowledgeDocument[], error: `学習メモを取得できませんでした。${error.message}` };
  }

  let documents = (data ?? []) as KnowledgeDocument[];
  const q = filters.q?.trim().toLowerCase();

  if (q) {
    documents = documents.filter((document) =>
      [
        document.title,
        document.file_name,
        document.description,
        document.raw_ocr_text,
        document.cleaned_text,
        document.summary,
        document.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  if (filters.status) documents = documents.filter((document) => document.status === filters.status);
  if (filters.sourceType) documents = documents.filter((document) => document.source_type === filters.sourceType);

  if (filters.mentorType) {
    const { data: cards } = await supabase
      .from("knowledge_cards")
      .select("document_id")
      .eq("user_id", userId)
      .eq("mentor_type", filters.mentorType)
      .not("document_id", "is", null);
    const ids = new Set((cards ?? []).map((card) => card.document_id));
    documents = documents.filter((document) => ids.has(document.id));
  }

  return { documents, error: null };
}

export async function getKnowledgeDocumentById(id: string) {
  if (!isUuid(id)) notFound();

  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { document: null, cards: [] as KnowledgeCard[], signedUrl: null, error: `学習メモを取得できませんでした。${error.message}` };
  }

  if (!data) notFound();

  const { data: cards, error: cardError } = await supabase
    .from("knowledge_cards")
    .select("*")
    .eq("document_id", id)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  let signedUrl: string | null = null;
  const document = data as KnowledgeDocument;

  if (document.file_path) {
    const { data: urlData } = await supabase.storage.from(KNOWLEDGE_BUCKET).createSignedUrl(document.file_path, 60 * 10);
    signedUrl = urlData?.signedUrl ?? null;
  }

  return {
    document,
    cards: (cards ?? []) as KnowledgeCard[],
    signedUrl,
    error: cardError ? `知識カードを取得できませんでした。${cardError.message}` : null,
  };
}

export async function getActiveKnowledgeCardsForAi(limit = 3) {
  const { supabase, userId } = await requireUserId();
  const { data } = await supabase
    .from("knowledge_cards")
    .select("id,title,category,content,do_points,dont_points,example_phrases,related_tags,mentor_type,updated_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(Math.max(limit * 2, limit));

  return (data ?? []) as Array<Pick<
    KnowledgeCard,
    "id" | "title" | "category" | "content" | "do_points" | "dont_points" | "example_phrases" | "related_tags" | "mentor_type" | "updated_at"
  >>;
}

export function formatKnowledgeCardsForPrompt(
  cards: Awaited<ReturnType<typeof getActiveKnowledgeCardsForAi>>,
  mentorType: string,
) {
  const prioritized = [...cards].sort((a, b) => {
    const score = (card: (typeof cards)[number]) => (card.mentor_type === mentorType ? 2 : card.mentor_type === "general" ? 1 : 0);
    return score(b) - score(a);
  });

  return prioritized.slice(0, 3).map((card) => ({
    title: card.title,
    category: card.category ?? "未分類",
    mentorType: card.mentor_type,
    relatedTags: card.related_tags ?? [],
    content: truncateKnowledgeText(card.content, 700),
    doPoints: (card.do_points ?? []).slice(0, 5),
    dontPoints: (card.dont_points ?? []).slice(0, 5),
    examplePhrases: (card.example_phrases ?? []).slice(0, 3),
  }));
}

function truncateKnowledgeText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}
