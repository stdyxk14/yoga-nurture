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
  ["YN_CLOSURE_COMPLETED_RECORD", "完了済みの実施後記録がある予定はクローズできません。"],
  ["YN_CLOSURE_DRAFT_CONFIRM_REQUIRED", "下書きの実施後記録があります。保持される内容を確認し、警告に同意してからクローズしてください。"],
  ["YN_CLOSURE_NOT_FOUND", "有効なクローズ記録が見つかりません。画面を更新してください。"],
  ["YN_CLOSURE_INVALID", "クローズ理由と決定日時を確認してください。"],
  ["YN_RECORD_SCHEDULE_CLOSED", "クローズ済みです。実施後記録を作成・更新するには、先にクローズを解除してください。"],
  ["YN_RECORD_NOT_FOUND", "対象の実施後記録が見つかりません。"],
  ["YN_RECORD_SCHEDULE_NOT_FOUND", "対象の予定が見つかりません。"],
  ["YN_RECORD_PLAN_ITEM_FORBIDDEN", "予定ブロックの一部を確認できません。画面を更新してください。"],
  ["YN_RECORD_BLOCK_FORBIDDEN", "実施ブロックの一部を確認できません。画面を更新してください。"],
  ["YN_RECORD_STUDENT_FORBIDDEN", "参加生徒の一部を確認できません。画面を更新してください。"],
  ["YN_RECORD_UNCONFIRMED_ITEMS", "未確認の予定項目が残っています。STEP 1で実施状態を確定してください。"],
  ["YN_RECORD_PLAN_ITEM_MISSING", "予定項目は削除できません。スキップまたは置き換えを選んでください。"],
  ["YN_RECORD_PLAN_ITEM_DUPLICATE", "同じ予定項目が重複しています。画面を更新してください。"],
  ["YN_RECORD_REPLACEMENT_INVALID", "置き換え元と実施項目の関係を確認できません。置き換えをやり直してください。"],
  ["YN_RECORD_REPLACEMENT_MISSING", "置き換え後の実施項目が見つかりません。置き換えをやり直してください。"],
  ["YN_RECORD_LIBRARY_BLOCK_INVALID", "追加したライブラリブロックを確認できません。ブロックを選び直してください。"],
  ["YN_RECORD_IMPROVISED_NAME_REQUIRED", "即興内容の名前を入力してください。"],
  ["YN_TEMPLATE_RECORD_ITEM_UNAVAILABLE", "この即興項目は既にテンプレート化されたか、利用できません。画面を更新してください。"],
  ["YN_TEMPLATE_CATEGORY_FORBIDDEN", "選択した大カテゴリーを確認できません。"],
  ["YN_TEMPLATE_SUBCATEGORY_FORBIDDEN", "選択した小カテゴリーを確認できません。"],
];

export function formatRpcError(error: RpcErrorLike | null | undefined, fallback: string) {
  const source = [error?.message, error?.details, error?.hint].filter(Boolean).join(" ");
  const known = knownMessages.find(([code]) => source.includes(code));
  if (known) return known[1];
  return source ? `${fallback}: ${source}` : fallback;
}
