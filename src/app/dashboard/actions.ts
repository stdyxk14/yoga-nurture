"use server";

import { revalidatePath } from "next/cache";
import { refreshRadarForUser } from "@/lib/radar/server";
import { createMutationContext } from "@/lib/supabase/server";

const feedbackActions = new Set(["helpful", "not_now", "read_later", "block_source"]);

export async function refreshRadarAction(): Promise<void> {
  const { userId } = await createMutationContext();
  await refreshRadarForUser({ userId, triggerType: "manual" });
  revalidatePath("/dashboard");
}

export async function replenishRadarAction(): Promise<void> {
  const { userId } = await createMutationContext();
  await refreshRadarForUser({ userId, triggerType: "replenish" });
  revalidatePath("/dashboard");
}

export async function submitRadarFeedbackAction(formData: FormData): Promise<void> {
  const itemId = String(formData.get("item_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  if (!isUuid(itemId) || !feedbackActions.has(action)) return;

  const { supabase } = await createMutationContext();
  const { error } = await supabase.rpc("apply_radar_feedback", {
    p_item_id: itemId,
    p_action: action,
  });
  if (error) throw new Error(`レーダーのフィードバックを保存できませんでした: ${error.message}`);
  revalidatePath("/dashboard");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
