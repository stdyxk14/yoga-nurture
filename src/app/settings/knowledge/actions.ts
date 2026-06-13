"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildKnowledgeFilePath, KNOWLEDGE_BUCKET, parseTags } from "@/lib/knowledge";
import { isUuid } from "@/lib/ids";
import { getOpenAIClient, studentSuggestionModel } from "@/lib/openai/server";
import { requireUserId } from "@/lib/students";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export type KnowledgeActionState = {
  error?: string;
  message?: string;
};

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function isNextRedirect(caught: unknown) {
  return (
    typeof caught === "object" &&
    caught !== null &&
    "digest" in caught &&
    typeof (caught as { digest?: unknown }).digest === "string" &&
    (caught as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function uploadKnowledgeDocumentAction(
  _state: KnowledgeActionState,
  formData: FormData,
): Promise<KnowledgeActionState> {
  const title = getText(formData, "title");
  const sourceType = getText(formData, "source_type") || "handwritten_image";
  const description = getText(formData, "description");
  const manualText = getText(formData, "manual_text");
  const tags = Array.from(new Set(parseTags(formData.get("tags"))));
  const file = formData.get("file");

  if (!title) return { error: "タイトルを入力してください。" };
  if (!["handwritten_image", "handwritten_pdf", "manual_text", "pdf", "image"].includes(sourceType)) {
    return { error: "メモの種類を選択してください。" };
  }

  const isManualText = sourceType === "manual_text";
  const uploadFile = file instanceof File && file.size > 0 ? file : null;

  if (!isManualText && !uploadFile) return { error: "画像またはPDFファイルを選択してください。" };
  if (uploadFile && !allowedMimeTypes.has(uploadFile.type)) return { error: "アップロードできる形式は jpg / png / webp / pdf です。" };
  if (uploadFile && uploadFile.size > 20 * 1024 * 1024) return { error: "ファイルサイズは20MB以下にしてください。" };

  try {
    const { supabase, userId } = await requireUserId();
    const documentId = crypto.randomUUID();
    let filePath: string | null = null;

    if (uploadFile) {
      filePath = buildKnowledgeFilePath(userId, documentId, uploadFile.name);
      const { error: uploadError } = await supabase.storage.from(KNOWLEDGE_BUCKET).upload(filePath, uploadFile, {
        cacheControl: "3600",
        contentType: uploadFile.type,
        upsert: false,
      });

      if (uploadError) return { error: `ファイルをアップロードできませんでした。${uploadError.message}` };
    }

    const status = isManualText ? "ocr_review_needed" : "ocr_pending";
    const { error } = await supabase.from("knowledge_documents").insert({
      id: documentId,
      user_id: userId,
      title,
      source_type: sourceType,
      file_path: filePath,
      file_name: uploadFile?.name ?? null,
      file_mime_type: uploadFile?.type ?? null,
      file_size: uploadFile?.size ?? null,
      description,
      tags,
      status,
      raw_ocr_text: isManualText ? manualText : null,
      cleaned_text: isManualText ? manualText : null,
    });

    if (error) return { error: `学習メモを保存できませんでした。${error.message}` };

    revalidatePath("/settings");
    revalidatePath("/settings/knowledge");
    redirect(`/settings/knowledge/${documentId}`);
  } catch (caught) {
    if (isNextRedirect(caught)) throw caught;
    return { error: caught instanceof Error ? caught.message : "学習メモを保存できませんでした。" };
  }
}

export async function updateKnowledgeReviewAction(id: string, formData: FormData): Promise<void> {
  if (!isUuid(id)) redirectWithError("/settings/knowledge", "学習メモが見つかりません。");

  const rawOcrText = getText(formData, "raw_ocr_text");
  const cleanedText = getText(formData, "cleaned_text");
  const summary = getText(formData, "summary");

  try {
    const { supabase, userId } = await requireUserId();
    const { error } = await supabase
      .from("knowledge_documents")
      .update({
        raw_ocr_text: rawOcrText,
        cleaned_text: cleanedText,
        summary,
        status: cleanedText ? "ocr_review_needed" : "ocr_pending",
        error_message: null,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) redirectWithError(`/settings/knowledge/${id}/review`, `読み取り結果を保存できませんでした。${error.message}`);

    revalidatePath(`/settings/knowledge/${id}`);
    revalidatePath(`/settings/knowledge/${id}/review`);
    redirect(`/settings/knowledge/${id}?message=${encodeURIComponent("読み取り結果を保存しました。")}`);
  } catch (caught) {
    if (isNextRedirect(caught)) throw caught;
    redirectWithError(`/settings/knowledge/${id}/review`, caught instanceof Error ? caught.message : "読み取り結果を保存できませんでした。");
  }
}

export async function createKnowledgeCardDraftAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  if (!isUuid(id)) redirectWithError("/settings/knowledge", "学習メモが見つかりません。");

  try {
    const { supabase, userId } = await requireUserId();
    const { data: document, error: documentError } = await supabase
      .from("knowledge_documents")
      .select("id,title,cleaned_text,summary,tags")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (documentError || !document) {
      redirectWithError(`/settings/knowledge/${id}`, `学習メモを取得できませんでした。${documentError?.message ?? ""}`.trim());
    }

    const content = String(document.cleaned_text ?? "").trim();
    if (!content) redirectWithError(`/settings/knowledge/${id}/review`, "先に読み取り結果を確認・保存してください。");

    const { error } = await supabase.from("knowledge_cards").insert({
      user_id: userId,
      document_id: id,
      title: document.title,
      category: document.summary ? "指導メモ" : "未分類",
      content,
      related_tags: document.tags ?? [],
      mentor_type: "general",
      status: "draft",
    });

    if (error) redirectWithError(`/settings/knowledge/${id}`, `知識カード下書きを作成できませんでした。${error.message}`);

    await supabase.from("knowledge_documents").update({ status: "card_draft" }).eq("id", id).eq("user_id", userId);
    revalidatePath(`/settings/knowledge/${id}`);
    redirect(`/settings/knowledge/${id}?message=${encodeURIComponent("知識カード下書きを作成しました。")}`);
  } catch (caught) {
    if (isNextRedirect(caught)) throw caught;
    redirectWithError(`/settings/knowledge/${id}`, caught instanceof Error ? caught.message : "知識カード下書きを作成できませんでした。");
  }
}

export async function runKnowledgeImageOcrAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  if (!isUuid(id)) redirectWithError("/settings/knowledge", "学習メモが見つかりません。");

  const openai = getOpenAIClient();
  if (!openai) redirectWithError(`/settings/knowledge/${id}/review`, "AI連携は未設定です。OPENAI_API_KEY を設定してください。");

  try {
    const { supabase, userId } = await requireUserId();
    const { data: document, error: documentError } = await supabase
      .from("knowledge_documents")
      .select("id,title,file_path,file_mime_type")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (documentError || !document) {
      redirectWithError(`/settings/knowledge/${id}`, `学習メモを取得できませんでした。${documentError?.message ?? ""}`.trim());
    }
    if (!document.file_path || !document.file_mime_type?.startsWith("image/")) {
      redirectWithError(`/settings/knowledge/${id}/review`, "画像ファイルのみAI OCRを実行できます。PDFは読み取り結果を手動で貼り付けてください。");
    }

    await supabase.from("knowledge_documents").update({ status: "ocr_processing", error_message: null }).eq("id", id).eq("user_id", userId);

    const { data: blob, error: downloadError } = await supabase.storage.from(KNOWLEDGE_BUCKET).download(document.file_path);
    if (downloadError || !blob) {
      await markKnowledgeError(id, `Storageから画像を取得できませんでした。${downloadError?.message ?? ""}`);
      redirectWithError(`/settings/knowledge/${id}/review`, `Storageから画像を取得できませんでした。${downloadError?.message ?? ""}`);
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const dataUrl = `data:${document.file_mime_type};base64,${buffer.toString("base64")}`;
    const completion = await openai.chat.completions.create({
      model: studentSuggestionModel,
      messages: [
        {
          role: "system",
          content:
            "あなたは手書きのヨガ指導メモをOCRする補助者です。画像内の日本語テキストをできるだけ忠実に読み取ってください。推測で内容を補わず、読めない箇所は[判読不能]と書いてください。要約や整形ではなく、読み取りテキストのみ返してください。",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `以下の画像に含まれる手書きメモを読み取ってください。タイトル: ${document.title}` },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1800,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      await markKnowledgeError(id, "OCR結果が空でした。");
      redirectWithError(`/settings/knowledge/${id}/review`, "OCR結果が空でした。時間をおいて再実行してください。");
    }

    const { error: updateError } = await supabase
      .from("knowledge_documents")
      .update({
        raw_ocr_text: text,
        status: "ocr_review_needed",
        error_message: null,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) redirectWithError(`/settings/knowledge/${id}/review`, `OCR結果を保存できませんでした。${updateError.message}`);

    revalidatePath(`/settings/knowledge/${id}`);
    revalidatePath(`/settings/knowledge/${id}/review`);
    redirect(`/settings/knowledge/${id}/review?message=${encodeURIComponent("AI OCRが完了しました。内容を確認して保存してください。")}`);
  } catch (caught) {
    if (isNextRedirect(caught)) throw caught;
    await markKnowledgeError(id, caught instanceof Error ? caught.message : "AI OCRを実行できませんでした。");
    redirectWithError(`/settings/knowledge/${id}/review`, caught instanceof Error ? caught.message : "AI OCRを実行できませんでした。");
  }
}

export async function generateKnowledgeCardDraftWithAiAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  if (!isUuid(id)) redirectWithError("/settings/knowledge", "学習メモが見つかりません。");

  const openai = getOpenAIClient();
  if (!openai) redirectWithError(`/settings/knowledge/${id}/review`, "AI連携は未設定です。OPENAI_API_KEY を設定してください。");

  try {
    const { supabase, userId } = await requireUserId();
    const { data: document, error: documentError } = await supabase
      .from("knowledge_documents")
      .select("id,title,cleaned_text,summary,tags")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (documentError || !document) {
      redirectWithError(`/settings/knowledge/${id}`, `学習メモを取得できませんでした。${documentError?.message ?? ""}`.trim());
    }
    const cleanedText = String(document.cleaned_text ?? "").trim();
    if (!cleanedText) redirectWithError(`/settings/knowledge/${id}/review`, "先に確認済みテキストを保存してください。");

    const completion = await openai.chat.completions.create({
      model: studentSuggestionModel,
      messages: [
        {
          role: "system",
          content:
            "あなたはヨガインストラクターの指導メモをAIメンター用の知識カードに整理する編集者です。医療診断や治療効果の断定を避け、レッスン設計・安全配慮・声かけの実践知として整理してください。必ずJSONだけを返してください。",
        },
        {
          role: "user",
          content: `次の確認済みメモから、知識カード候補を1件作成してください。

返却JSON:
{
  "title": "短いタイトル",
  "category": "分類",
  "content": "AIメンターが参照しやすい本文",
  "do_points": ["実践するとよいこと"],
  "dont_points": ["避けること"],
  "example_phrases": ["声かけ例"],
  "related_tags": ["#タグ"],
  "mentor_type": "body | communication | lesson_design | general"
}

タイトル: ${document.title}
要約: ${document.summary ?? ""}
既存タグ: ${(document.tags ?? []).join(", ")}
確認済みメモ:
${cleanedText.slice(0, 6000)}`,
        },
      ],
      temperature: 0.25,
      max_tokens: 1600,
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    const card = parseKnowledgeCardJson(content);
    if (!card) redirectWithError(`/settings/knowledge/${id}/review`, "AIカード候補のJSONを読み取れませんでした。もう一度生成してください。");

    const { error } = await supabase.from("knowledge_cards").insert({
      user_id: userId,
      document_id: id,
      title: card.title,
      category: card.category,
      content: card.content,
      do_points: card.do_points,
      dont_points: card.dont_points,
      example_phrases: card.example_phrases,
      related_tags: card.related_tags,
      mentor_type: normalizeCardMentorType(card.mentor_type),
      status: "draft",
    });

    if (error) redirectWithError(`/settings/knowledge/${id}/review`, `知識カード候補を保存できませんでした。${error.message}`);

    await supabase.from("knowledge_documents").update({ status: "card_draft" }).eq("id", id).eq("user_id", userId);
    revalidatePath(`/settings/knowledge/${id}`);
    revalidatePath(`/settings/knowledge/${id}/review`);
    redirect(`/settings/knowledge/${id}/review?message=${encodeURIComponent("AIで知識カード候補を作成しました。内容を確認してください。")}`);
  } catch (caught) {
    if (isNextRedirect(caught)) throw caught;
    redirectWithError(`/settings/knowledge/${id}/review`, caught instanceof Error ? caught.message : "AIカード候補を作成できませんでした。");
  }
}

export async function updateKnowledgeCardAction(id: string, cardId: string, formData: FormData): Promise<void> {
  if (!isUuid(id) || !isUuid(cardId)) redirectWithError("/settings/knowledge", "知識カードが見つかりません。");

  const title = getText(formData, "title");
  const category = getText(formData, "category");
  const content = getText(formData, "content");
  const mentorType = normalizeCardMentorType(getText(formData, "mentor_type"));
  const doPoints = splitLines(getText(formData, "do_points"));
  const dontPoints = splitLines(getText(formData, "dont_points"));
  const examplePhrases = splitLines(getText(formData, "example_phrases"));
  const relatedTags = parseTags(formData.get("related_tags"));

  if (!title || !content) redirectWithError(`/settings/knowledge/${id}/review`, "知識カードのタイトルと本文を入力してください。");

  try {
    const { supabase, userId } = await requireUserId();
    const { error } = await supabase
      .from("knowledge_cards")
      .update({
        title,
        category,
        content,
        do_points: doPoints,
        dont_points: dontPoints,
        example_phrases: examplePhrases,
        related_tags: relatedTags,
        mentor_type: mentorType,
      })
      .eq("id", cardId)
      .eq("document_id", id)
      .eq("user_id", userId);

    if (error) redirectWithError(`/settings/knowledge/${id}/review`, `知識カードを保存できませんでした。${error.message}`);

    revalidatePath(`/settings/knowledge/${id}`);
    revalidatePath(`/settings/knowledge/${id}/review`);
    redirect(`/settings/knowledge/${id}/review?message=${encodeURIComponent("知識カード候補を保存しました。")}`);
  } catch (caught) {
    if (isNextRedirect(caught)) throw caught;
    redirectWithError(`/settings/knowledge/${id}/review`, caught instanceof Error ? caught.message : "知識カードを保存できませんでした。");
  }
}

export async function activateKnowledgeCardAction(id: string, cardId: string, formData?: FormData): Promise<void> {
  void formData;
  if (!isUuid(id) || !isUuid(cardId)) redirectWithError("/settings/knowledge", "知識カードが見つかりません。");

  try {
    const { supabase, userId } = await requireUserId();
    const { error } = await supabase
      .from("knowledge_cards")
      .update({ status: "active" })
      .eq("id", cardId)
      .eq("document_id", id)
      .eq("user_id", userId);

    if (error) redirectWithError(`/settings/knowledge/${id}`, `知識カードを有効化できませんでした。${error.message}`);

    await supabase.from("knowledge_documents").update({ status: "active" }).eq("id", id).eq("user_id", userId);
    revalidatePath(`/settings/knowledge/${id}`);
    redirect(`/settings/knowledge/${id}?message=${encodeURIComponent("知識カードを有効化しました。")}`);
  } catch (caught) {
    if (isNextRedirect(caught)) throw caught;
    redirectWithError(`/settings/knowledge/${id}`, caught instanceof Error ? caught.message : "知識カードを有効化できませんでした。");
  }
}

export async function archiveKnowledgeDocumentAction(id: string, formData?: FormData): Promise<void> {
  void formData;
  if (!isUuid(id)) redirectWithError("/settings/knowledge", "学習メモが見つかりません。");

  try {
    const { supabase, userId } = await requireUserId();
    const { error } = await supabase.from("knowledge_documents").update({ status: "archived" }).eq("id", id).eq("user_id", userId);

    if (error) redirectWithError(`/settings/knowledge/${id}`, `学習メモをアーカイブできませんでした。${error.message}`);

    revalidatePath("/settings");
    revalidatePath("/settings/knowledge");
    redirect(`/settings/knowledge?message=${encodeURIComponent("学習メモをアーカイブしました。")}`);
  } catch (caught) {
    if (isNextRedirect(caught)) throw caught;
    redirectWithError(`/settings/knowledge/${id}`, caught instanceof Error ? caught.message : "学習メモをアーカイブできませんでした。");
  }
}

async function markKnowledgeError(id: string, message: string) {
  try {
    const { supabase, userId } = await requireUserId();
    await supabase
      .from("knowledge_documents")
      .update({ status: "error", error_message: message })
      .eq("id", id)
      .eq("user_id", userId);
  } catch {
    // The original action will surface the user-facing error.
  }
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeCardMentorType(value: string) {
  if (value === "body" || value === "communication" || value === "lesson_design" || value === "general") return value;
  return "general";
}

type AiKnowledgeCardPayload = {
  title: string;
  category: string;
  content: string;
  do_points: string[];
  dont_points: string[];
  example_phrases: string[];
  related_tags: string[];
  mentor_type: string;
};

function parseKnowledgeCardJson(value: string): AiKnowledgeCardPayload | null {
  const jsonText = value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(jsonText) as Partial<AiKnowledgeCardPayload>;
    if (!parsed.title || !parsed.content) return null;
    return {
      title: String(parsed.title),
      category: String(parsed.category ?? "未分類"),
      content: String(parsed.content),
      do_points: Array.isArray(parsed.do_points) ? parsed.do_points.map(String) : [],
      dont_points: Array.isArray(parsed.dont_points) ? parsed.dont_points.map(String) : [],
      example_phrases: Array.isArray(parsed.example_phrases) ? parsed.example_phrases.map(String) : [],
      related_tags: Array.isArray(parsed.related_tags) ? parsed.related_tags.map(String) : [],
      mentor_type: String(parsed.mentor_type ?? "general"),
    };
  } catch {
    return null;
  }
}
