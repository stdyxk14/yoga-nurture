import type { ReactNode } from "react";

type Props = {
  text?: string | null;
  emptyText?: string;
  className?: string;
};

export function RichScriptText({ text, emptyText = "未入力です。", className }: Props) {
  const source = text?.trim() ? text : emptyText;

  return (
    <div className={className ?? "whitespace-pre-wrap break-words"}>
      {renderBoldMarkdown(source)}
    </div>
  );
}

function renderBoldMarkdown(source: string) {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }
    nodes.push(
      <strong key={`${match.index}-${match[1]}`} className="font-extrabold">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return nodes.length ? nodes : source;
}
