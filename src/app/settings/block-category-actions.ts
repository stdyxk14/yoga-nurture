"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { defaultBlockCategories, defaultSubcategories } from "@/lib/blocks";
import { requireUserId } from "@/lib/students";

function parseSortOrder(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function refreshSettings(message: string): never {
  revalidatePath("/settings");
  revalidatePath("/blocks/new");
  revalidatePath("/lessons");
  redirect(`/settings?categoryMessage=${encodeURIComponent(message)}#block-categories`);
}

function showError(message: string): never {
  redirect(`/settings?categoryError=${encodeURIComponent(message)}#block-categories`);
}

export async function createDefaultBlockCategoriesAction() {
  const { supabase, userId } = await requireUserId();

  for (const [index, name] of defaultBlockCategories.entries()) {
    const { data: category, error } = await supabase
      .from("block_categories")
      .upsert(
        {
          user_id: userId,
          name,
          sort_order: index,
          archived: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,name" },
      )
      .select("id,name")
      .single();

    if (error || !category) {
      showError(`初期カテゴリーを作成できませんでした。${error?.message ?? ""}`);
    }

    for (const [subIndex, subName] of (defaultSubcategories[name] ?? []).entries()) {
      const { error: subcategoryError } = await supabase.from("block_subcategories").upsert(
        {
          user_id: userId,
          category_id: category.id,
          name: subName,
          sort_order: subIndex,
          archived: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "category_id,name" },
      );

      if (subcategoryError) {
        showError(`初期小カテゴリーを作成できませんでした。${subcategoryError.message}`);
      }
    }
  }

  refreshSettings("初期カテゴリーを作成しました。");
}

export async function createBlockCategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) showError("大カテゴリー名を入力してください。");

  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("block_categories").insert({
    user_id: userId,
    name,
    sort_order: parseSortOrder(formData.get("sort_order")),
    archived: false,
  });

  if (error) {
    const message = error.code === "23505" ? "同じ名前の大カテゴリーがすでにあります。" : `大カテゴリーを追加できませんでした。${error.message}`;
    showError(message);
  }

  refreshSettings("大カテゴリーを追加しました。");
}

export async function updateBlockCategoryAction(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) showError("大カテゴリー名を入力してください。");

  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("block_categories")
    .update({
      name,
      sort_order: parseSortOrder(formData.get("sort_order")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    const message = error.code === "23505" ? "同じ名前の大カテゴリーがすでにあります。" : `大カテゴリーを更新できませんでした。${error.message}`;
    showError(message);
  }

  refreshSettings("大カテゴリーを更新しました。");
}

export async function archiveBlockCategoryAction(id: string, formData?: FormData) {
  void formData;
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("block_categories")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) showError(`大カテゴリーをアーカイブできませんでした。${error.message}`);
  refreshSettings("大カテゴリーをアーカイブしました。");
}

export async function deleteBlockCategoryAction(id: string, formData?: FormData) {
  void formData;
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("block_categories").delete().eq("id", id).eq("user_id", userId);

  if (error) showError(`大カテゴリーを削除できませんでした。使用中の場合はアーカイブしてください。${error.message}`);
  refreshSettings("大カテゴリーを削除しました。");
}

export async function createBlockSubcategoryAction(formData: FormData) {
  const categoryId = String(formData.get("category_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!categoryId) showError("紐づく大カテゴリーを選択してください。");
  if (!name) showError("小カテゴリー名を入力してください。");

  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("block_subcategories").insert({
    user_id: userId,
    category_id: categoryId,
    name,
    sort_order: parseSortOrder(formData.get("sort_order")),
    archived: false,
  });

  if (error) {
    const message = error.code === "23505" ? "同じ大カテゴリー内に同名の小カテゴリーがあります。" : `小カテゴリーを追加できませんでした。${error.message}`;
    showError(message);
  }

  refreshSettings("小カテゴリーを追加しました。");
}

export async function updateBlockSubcategoryAction(id: string, formData: FormData) {
  const categoryId = String(formData.get("category_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!categoryId) showError("紐づく大カテゴリーを選択してください。");
  if (!name) showError("小カテゴリー名を入力してください。");

  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("block_subcategories")
    .update({
      category_id: categoryId,
      name,
      sort_order: parseSortOrder(formData.get("sort_order")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    const message = error.code === "23505" ? "同じ大カテゴリー内に同名の小カテゴリーがあります。" : `小カテゴリーを更新できませんでした。${error.message}`;
    showError(message);
  }

  refreshSettings("小カテゴリーを更新しました。");
}

export async function archiveBlockSubcategoryAction(id: string, formData?: FormData) {
  void formData;
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("block_subcategories")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) showError(`小カテゴリーをアーカイブできませんでした。${error.message}`);
  refreshSettings("小カテゴリーをアーカイブしました。");
}

export async function deleteBlockSubcategoryAction(id: string, formData?: FormData) {
  void formData;
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("block_subcategories").delete().eq("id", id).eq("user_id", userId);

  if (error) showError(`小カテゴリーを削除できませんでした。使用中の場合はアーカイブしてください。${error.message}`);
  refreshSettings("小カテゴリーを削除しました。");
}
