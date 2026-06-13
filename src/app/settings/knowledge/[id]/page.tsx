import { Archive, ArrowLeft, CheckCircle2, FileText, Pencil, UploadCloud } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import {
  activateKnowledgeCardAction,
  archiveKnowledgeDocumentAction,
  createKnowledgeCardDraftAction,
} from "@/app/settings/knowledge/actions";
import {
  formatDateTime,
  formatFileSize,
  getKnowledgeDocumentById,
  knowledgeSourceTypeLabels,
  knowledgeStatusLabels,
  mentorTypeLabels,
} from "@/lib/knowledge";

export const dynamic = "force-dynamic";

type SearchParams = {
  message?: string;
  error?: string;
};

export default async function KnowledgeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { document, cards, signedUrl, error } = await getKnowledgeDocumentById(id);

  if (!document) {
    return (
      <div className="space-y-4">
        <PageHeader title="学習メモが見つかりません" />
        <SoftCard className="p-6">学習メモを取得できませんでした。</SoftCard>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-full space-y-4 overflow-x-hidden pb-24 md:pb-4">
      <PageHeader title={document.title} subtitle="AIメンター学習メモの詳細" />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <LinkButton href="/settings/knowledge">
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </LinkButton>
        <LinkButton href={`/settings/knowledge/${document.id}/review`} primary>
          <Pencil className="h-4 w-4" />
          OCR結果を確認
        </LinkButton>
      </div>

      <Notice message={query.message} error={query.error ?? error ?? undefined} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SoftCard className="p-4">
          <SectionTitle icon={UploadCloud} title="元ファイル" />
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className="rounded-full bg-[#e6f0e3] text-[#4f835d] shadow-none">{knowledgeStatusLabels[document.status] ?? document.status}</Badge>
            <Badge className="rounded-full bg-[#f4efe7] text-[#806848] shadow-none">{knowledgeSourceTypeLabels[document.source_type] ?? document.source_type}</Badge>
          </div>
          {signedUrl && document.file_mime_type?.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedUrl} alt={document.title} className="max-h-[480px] w-full rounded-2xl border border-[#eee4d8] object-contain" />
          ) : signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] text-[14px] font-bold text-[#4f835d]"
            >
              PDF / ファイルを別タブで開く
            </a>
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] text-[13px] font-bold text-[#6d7469]">
              ファイルなしのテキストメモです。
            </div>
          )}
          <dl className="mt-4 grid gap-2 text-[13px] font-semibold text-[#626960] sm:grid-cols-2">
            <Info label="ファイル名" value={document.file_name ?? "なし"} />
            <Info label="サイズ" value={formatFileSize(document.file_size)} />
            <Info label="更新日" value={formatDateTime(document.updated_at)} />
            <Info label="登録日" value={formatDateTime(document.created_at)} />
          </dl>
        </SoftCard>

        <SoftCard className="p-4">
          <SectionTitle icon={FileText} title="読み取り結果" />
          <div className="grid gap-3">
            <TextBox title="説明" value={document.description} empty="説明は未入力です。" />
            <TextBox title="OCR読み取り結果" value={document.raw_ocr_text} empty="OCR結果はまだ保存されていません。確認画面で入力・修正できます。" />
            <TextBox title="確認済みテキスト" value={document.cleaned_text} empty="確認済みテキストはまだありません。" />
            <TextBox title="要約" value={document.summary} empty="要約はまだありません。" />
            <div className="flex flex-wrap gap-1.5">
              {(document.tags ?? []).map((tag) => (
                <span key={tag} className="rounded-full border border-[#dde8d8] bg-[#f8fcf6] px-2 py-0.5 text-[11px] font-bold text-[#557f5b]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </SoftCard>
      </section>

      <SoftCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle icon={CheckCircle2} title="知識カード候補" subtitle="AIメンターが将来参照する整理済み知識です" />
          <form action={createKnowledgeCardDraftAction.bind(null, document.id)}>
            <Button type="submit" className="h-10 rounded-xl bg-[#5d956d] text-white hover:bg-[#4f835d]">
              下書きを作成
            </Button>
          </form>
        </div>
        {cards.length ? (
          <div className="mt-3 grid gap-3">
            {cards.map((card) => (
              <article key={card.id} className="rounded-2xl border border-[#eee4d8] bg-white/76 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-[#e6f0e3] text-[#4f835d] shadow-none">{card.status === "active" ? "有効" : "下書き"}</Badge>
                      <Badge className="rounded-full bg-[#f4efe7] text-[#806848] shadow-none">{mentorTypeLabels[card.mentor_type] ?? card.mentor_type}</Badge>
                    </div>
                    <h3 className="mt-2 text-[15px] font-extrabold">{card.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap break-words text-[13px] font-semibold leading-6 text-[#5f685e]">{card.content}</p>
                  </div>
                  {card.status !== "active" ? (
                    <form action={activateKnowledgeCardAction.bind(null, document.id, card.id)}>
                      <Button type="submit" variant="outline" className="h-9 rounded-xl border-[#cfe1ca] text-[#4f835d]">
                        有効化
                      </Button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-4 text-[13px] font-semibold leading-6 text-[#667063]">
            確認済みテキストを保存すると、知識カード下書きを作成できます。今回はAI自動整理の前段階として、人間確認済みの内容を下書き化します。
          </p>
        )}
      </SoftCard>

      <SoftCard className="p-4">
        <form action={archiveKnowledgeDocumentAction.bind(null, document.id)}>
          <Button type="submit" variant="outline" className="h-10 rounded-xl border-[#ead4c9] text-[#a45b49]">
            <Archive className="mr-2 h-4 w-4" />
            この学習メモをアーカイブ
          </Button>
        </form>
      </SoftCard>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eee4d8] bg-white/72 p-3">
      <dt className="text-[11px] font-bold text-[#7b8578]">{label}</dt>
      <dd className="mt-1 break-words text-[13px] font-bold text-[#353b33]">{value}</dd>
    </div>
  );
}

function TextBox({ title, value, empty }: { title: string; value: string | null; empty: string }) {
  return (
    <div className="rounded-2xl border border-[#eee4d8] bg-white/72 p-3">
      <h3 className="text-[13px] font-extrabold">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-[13px] font-semibold leading-6 text-[#5f685e]">{value || empty}</p>
    </div>
  );
}

function Notice({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return (
    <div className={error ? "rounded-2xl border border-[#f3b8aa] bg-[#fff5f2] p-3 text-[13px] font-bold text-[#bb4e3d]" : "rounded-2xl border border-[#cfe1ca] bg-[#f4faf2] p-3 text-[13px] font-bold text-[#4f835d]"}>
      {error ?? message}
    </div>
  );
}

function LinkButton({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white hover:bg-[#4f835d]"
          : "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe7d9] bg-white/85 px-4 text-[13px] font-bold text-[#4f835d]"
      }
    >
      {children}
    </Link>
  );
}
