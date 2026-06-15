"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { replaceBlockTags } from "@/lib/blocks";
import { requireUserId } from "@/lib/students";

export async function importStarterBlockAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const durationMinutes = Number.parseInt(String(formData.get("duration_minutes") ?? "5"), 10);
  const purpose = String(formData.get("purpose") ?? "").trim();
  const cautions = String(formData.get("cautions") ?? "").trim();
  const script = String(formData.get("script") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const tags = formData.getAll("tags").map((tag) => String(tag)).filter(Boolean);

  if (!name || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    redirect("/dashboard?starter_error=invalid");
  }

  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("block_templates")
    .insert({
      user_id: userId,
      name,
      duration_minutes: durationMinutes,
      purpose,
      level: "全レベル",
      cautions,
      script,
      memo,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/dashboard?starter_error=save");
  }

  try {
    await replaceBlockTags(data.id, tags);
  } catch {
    redirect(`/blocks/${data.id}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/lessons");
  revalidatePath("/blocks");
  redirect(`/blocks/${data.id}`);
}
