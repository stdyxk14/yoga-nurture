import { Archive, Eye, FileText, Filter, Search, UploadCloud } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import {
  formatDateTime,
  formatFileSize,
  getKnowledgeDocuments,
  getKnowledgeStats,
  knowledgeSourceTypeLabels,
  knowledgeStatusLabels,
  mentorTypeLabels,
} from "@/lib/knowledge";
import { archiveKnowledgeDocumentAction } from "@/app/settings/knowledge/actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  sourceType?: string;
  mentorType?: string;
  message?: string;
  error?: string;
};

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const [{ documents, error }, stats] = await Promise.all([
    getKnowledgeDocuments(params),
    getKnowledgeStats(),
  ]);

  return (
    <div className="mx-auto w-full max-w-full space-y-4 overflow-x-hidden pb-24 md:pb-4">
      <PageHeader title="AIメンター学習メモ" subtitle="手書きメモや指導ノートを知識として整理します" />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <LinkButton href="/settings/knowledge/upload" primary>
          <UploadCloud className="h-4 w-4" />
          手書きメモをアップロード
        </LinkButton>
        <LinkButton href="/settings">設定に戻る</LinkButton>
      </div>

      <Notice message={params.message} error={params.error ?? error ?? undefined} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="アップロード済み" value={`${stats.documents}件`} />
        <StatCard label="確認待ち" value={`${stats.reviewNeeded}件`} tone="beige" />
        <StatCard label="有効化済み知識カード" value={`${stats.activeCards}件`} tone="green" />
        <StatCard label="エラー" value={`${stats.errors}件`} tone="red" />
      </section>

      <SoftCard className="p-4">
        <SectionTitle icon={Filter} title="検索・絞り込み" />
        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8a79]" />
            <Input name="q" defaultValue={params.q ?? ""} placeholder="タイトル、OCRテキスト、タグで検索" className="h-10 rounded-xl bg-white/90 pl-9" />
          </div>
          <select name="status" defaultValue={params.status ?? ""} className="h-10 rounded-xl border border-input bg-white/90 px-3 text-[13px]">
            <option value="">すべてのステータス</option>
            {Object.entries(knowledgeStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select name="sourceType" defaultValue={params.sourceType ?? ""} className="h-10 rounded-xl border border-input bg-white/90 px-3 text-[13px]">
            <option value="">すべての種類</option>
            {Object.entries(knowledgeSourceTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select name="mentorType" defaultValue={params.mentorType ?? ""} className="h-10 rounded-xl border border-input bg-white/90 px-3 text-[13px]">
            <option value="">関連メンターすべて</option>
            {Object.entries(mentorTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="h-10 rounded-xl border-[#cfe1ca] text-[#4f835d]">
            絞り込み
          </Button>
        </form>
      </SoftCard>

      {documents.length ? (
        <section className="grid gap-3">
          {documents.map((document) => (
            <SoftCard key={document.id} className="p-4">
              <article className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-[#e6f0e3] text-[#4f835d] shadow-none">{knowledgeStatusLabels[document.status] ?? document.status}</Badge>
                    <Badge className="rounded-full bg-[#f4efe7] text-[#806848] shadow-none">{knowledgeSourceTypeLabels[document.source_type] ?? document.source_type}</Badge>
                    <span className="text-[12px] font-semibold text-[#768070]">{formatDateTime(document.updated_at)}</span>
                  </div>
                  <h2 className="truncate text-[17px] font-extrabold">{document.title}</h2>
                  <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-6 text-[#5f685e]">
                    {document.description || document.cleaned_text || document.raw_ocr_text || "OCR結果を確認すると、読み取り内容がここに表示されます。"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(document.tags ?? []).map((tag) => (
                      <span key={tag} className="rounded-full border border-[#dde8d8] bg-[#f8fcf6] px-2 py-0.5 text-[11px] font-bold text-[#557f5b]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2 text-[12px] font-semibold text-[#626960]">
                  <div className="rounded-2xl border border-[#eee4d8] bg-white/70 p-3">
                    <p>ファイル: {document.file_name ?? "なし"}</p>
                    <p>サイズ: {formatFileSize(document.file_size)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <LinkButton href={`/settings/knowledge/${document.id}`}>
                      <Eye className="h-4 w-4" />
                      詳細
                    </LinkButton>
                    <LinkButton href={`/settings/knowledge/${document.id}/review`}>
                      <FileText className="h-4 w-4" />
                      確認
                    </LinkButton>
                    <form action={archiveKnowledgeDocumentAction.bind(null, document.id)} className="contents">
                      <Button type="submit" variant="outline" className="h-9 rounded-xl border-[#ead4c9] text-[#a45b49]">
                        <Archive className="mr-1.5 h-4 w-4" />
                        アーカイブ
                      </Button>
                    </form>
                  </div>
                </div>
              </article>
            </SoftCard>
          ))}
        </section>
      ) : (
        <SoftCard className="p-6 text-center">
          <UploadCloud className="mx-auto mb-3 h-9 w-9 text-[#7aa179]" />
          <h2 className="text-[18px] font-extrabold">まだAIメンター学習メモは登録されていません</h2>
          <p className="mx-auto mt-2 max-w-xl text-[13px] font-semibold leading-6 text-[#667063]">
            手書きメモをアップロードして、AIメンターの参考知識を増やしましょう。
          </p>
          <div className="mt-4 flex justify-center">
            <LinkButton href="/settings/knowledge/upload" primary>
              <UploadCloud className="h-4 w-4" />
              手書きメモをアップロード
            </LinkButton>
          </div>
        </SoftCard>
      )}
    </div>
  );
}

function StatCard({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "beige" | "red" }) {
  const valueClass =
    tone === "red"
      ? "mt-1 text-[28px] font-extrabold text-[#d85f4d]"
      : tone === "green"
        ? "mt-1 text-[28px] font-extrabold text-[#4f835d]"
        : "mt-1 text-[28px] font-extrabold text-[#8b704c]";

  return (
    <SoftCard className="p-4">
      <p className="text-[12px] font-bold text-[#687266]">{label}</p>
      <p className={valueClass}>{value}</p>
    </SoftCard>
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
