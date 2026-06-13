"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildKnowledgeFilePath, KNOWLEDGE_BUCKET, parseTags } from "@/lib/knowledge";
import { isUuid } from "@/lib/ids";
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
