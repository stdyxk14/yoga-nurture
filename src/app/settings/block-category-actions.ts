"use server";

import { revalidatePath } from "next/cache";
import { defaultBlockCategories, defaultSubcategories } from "@/lib/blocks";
import { requireUserId } from "@/lib/students";

function paths() {
  revalidatePath("/settings");
  revalidatePath("/blocks/new");
  revalidatePath("/lessons");
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
          color: ["#8fbf9a", "#d9b98f", "#7fb18a", "#92a7d8", "#e0aa8f", "#c99b6a", "#90b47b", "#a6a0d3", "#dd8d78", "#96b8bb", "#b8a68c", "#b7b7ae"][index],
          icon: "folder",
          sort_order: index,
          archived: false,
        },
        { onConflict: "user_id,name" },
      )
      .select("id,name")
      .single();

    if (error || !category) continue;

    for (const [subIndex, subName] of (defaultSubcategories[name] ?? []).entries()) {
      await supabase.from("block_subcategories").upsert(
        {
          user_id: userId,
          category_id: category.id,
          name: subName,
          sort_order: subIndex,
          archived: false,
        },
        { onConflict: "category_id,name" },
      );
    }
  }

  paths();
}

export async function createBlockCategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const { supabase, userId } = await requireUserId();
  await supabase.from("block_categories").insert({
    user_id: userId,
    name,
    color: String(formData.get("color") ?? "#8fbf9a"),
    icon: String(formData.get("icon") ?? "folder"),
    sort_order: Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0,
  });
  paths();
}

export async function updateBlockCategoryAction(id: string, formData: FormData) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("block_categories")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      color: String(formData.get("color") ?? "#8fbf9a"),
      icon: String(formData.get("icon") ?? "folder"),
      sort_order: Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);
  paths();
}

export async function archiveBlockCategoryAction(id: string, formData?: FormData) {
  void formData;
  const { supabase, userId } = await requireUserId();
  await supabase.from("block_categories").update({ archived: true, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  paths();
}

export async function deleteBlockCategoryAction(id: string, formData?: FormData) {
  void formData;
  const { supabase, userId } = await requireUserId();
  await supabase.from("block_categories").delete().eq("id", id).eq("user_id", userId);
  paths();
}

export async function createBlockSubcategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  if (!name || !categoryId) return;
  const { supabase, userId } = await requireUserId();
  await supabase.from("block_subcategories").insert({
    user_id: userId,
    category_id: categoryId,
    name,
    sort_order: Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0,
  });
  paths();
}

export async function updateBlockSubcategoryAction(id: string, formData: FormData) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("block_subcategories")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      category_id: String(formData.get("category_id") ?? ""),
      sort_order: Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);
  paths();
}

export async function archiveBlockSubcategoryAction(id: string, formData?: FormData) {
  void formData;
  const { supabase, userId } = await requireUserId();
  await supabase.from("block_subcategories").update({ archived: true, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  paths();
}

export async function deleteBlockSubcategoryAction(id: string, formData?: FormData) {
  void formData;
  const { supabase, userId } = await requireUserId();
  await supabase.from("block_subcategories").delete().eq("id", id).eq("user_id", userId);
  paths();
}
