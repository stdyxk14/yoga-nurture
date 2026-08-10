type RpcErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
};

const knownMessages: Array<[string, string]> = [
  ["YN_AUTH_REQUIRED", "ログイン状態を確認できませんでした。再ログインしてからお試しください。"],
  ["YN_PLAN_NOT_FOUND", "対象のレッスンプランが見つかりません。"],
  ["YN_PLAN_BLOCK_FORBIDDEN", "選択したブロックの一部を確認できません。ブロック一覧を更新してください。"],
  ["YN_SCHEDULE_NOT_FOUND", "対象の予定が見つかりません。"],
  ["YN_SCHEDULE_PLAN_NOT_FOUND", "使用するレッスンプランが見つかりません。"],
  ["YN_SCHEDULE_PLAN_LOCKED", "実施後記録があるため、使用プランは変更できません。日時・場所・参加生徒は編集できます。"],
  ["YN_SCHEDULE_STUDENT_FORBIDDEN", "参加生徒の一部を確認できません。生徒一覧を更新してください。"],
  ["YN_RECORD_NOT_FOUND", "対象の実施後記録が見つかりません。"],
  ["YN_RECORD_SCHEDULE_NOT_FOUND", "対象の予定が見つかりません。"],
  ["YN_RECORD_PLAN_ITEM_FORBIDDEN", "予定ブロックの一部を確認できません。画面を更新してください。"],
  ["YN_RECORD_BLOCK_FORBIDDEN", "実施ブロックの一部を確認できません。画面を更新してください。"],
  ["YN_RECORD_STUDENT_FORBIDDEN", "参加生徒の一部を確認できません。画面を更新してください。"],
];

export function formatRpcError(error: RpcErrorLike | null | undefined, fallback: string) {
  const source = [error?.message, error?.details, error?.hint].filter(Boolean).join(" ");
  const known = knownMessages.find(([code]) => source.includes(code));
  if (known) return known[1];
  return source ? `${fallback}: ${source}` : fallback;
}
