import Link from "next/link";
import { FilePenLine } from "lucide-react";
import { AiSuggestionCard } from "@/components/yoga/ai-suggestion-card";
import { BlockAiButton } from "@/components/yoga/block-ai-button";
import type { StudentAiSuggestionState } from "@/lib/ai-suggestions";
import type { DbBlockTemplate } from "@/lib/blocks";

type Props = {
  block?: DbBlockTemplate;
  blockId?: string;
  aiSuggestionState?: StudentAiSuggestionState;
  context?: "detail" | "edit" | "script";
};

export function BlockAiSuggestionPanel({ block, blockId, aiSuggestionState, context = "detail" }: Props) {
  if (aiSuggestionState?.featureEnabled === false) return null;

  const resolvedBlockId = block?.id ?? blockId;
  const latest = aiSuggestionState?.history[0];

  return (
    <AiSuggestionCard
      title="このブロックのAI改善提案"
      description="誘導セリフ・注意点・過去メモをもとに、より伝わりやすい声かけを提案します。"
      emptyText="AIに相談すると、初心者向けの言い換えや安全面の補足が表示されます。"
      latest={latest}
      history={aiSuggestionState?.history ?? []}
      isConfigured={aiSuggestionState?.isConfigured ?? false}
      storageReady={aiSuggestionState?.storageReady ?? true}
      storageError={aiSuggestionState?.storageError}
      note={context === "edit" ? "保存済みの原稿をもとに提案します。未保存の変更は保存後に反映されます。" : undefined}
      generateLabel="セリフ改善案を生成"
      modalTitle="このブロックについて相談"
      renderAction={(mentorType, label) => <BlockAiButton blockId={resolvedBlockId} mentorType={mentorType} label={label} />}
      extraActions={
        block ? (
          <Link
            href={`/blocks/${block.id}/edit`}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58] transition hover:bg-[#f8fcf6]"
          >
            <FilePenLine className="h-4 w-4" />
            編集画面で反映
          </Link>
        ) : null
      }
    />
  );
}
