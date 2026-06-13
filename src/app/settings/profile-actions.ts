"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAiSettings } from "@/lib/ai-settings";
import { requireUserId } from "@/lib/students";

function settingsRedirect(params: { profileMessage?: string; profileError?: string; aiMessage?: string; aiError?: string }): never {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  revalidatePath("/settings");
  redirect(`/settings${query.size ? `?${query.toString()}` : ""}`);
}

export async function updateProfileAction(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const { supabase, userId, user } = await requireUserId();
  const email = user.email ?? "";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      display_name: displayName || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    settingsRedirect({ profileError: `表示名を保存できませんでした。${error.message}` });
  }

  settingsRedirect({ profileMessage: "表示名を保存しました。" });
}

export async function updateAiSettingsAction(formData: FormData) {
  const { supabase, user } = await requireUserId();
  const current = getAiSettings(user.user_metadata?.ai_settings);
  const settings = {
    enabled: formData.get("ai_enabled") === "on",
    student: formData.get("ai_student") === "on",
    lessonPlan: formData.get("ai_lesson_plan") === "on",
    block: formData.get("ai_block") === "on",
    lessonRecord: formData.get("ai_lesson_record") === "on",
  };

  const next = {
    ...current,
    ...settings,
  };
  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      ai_settings: next,
    },
  });

  if (error) {
    settingsRedirect({ aiError: `AIメンター設定を保存できませんでした。${error.message}` });
  }

  settingsRedirect({ aiMessage: "AIメンター設定を保存しました。" });
}
