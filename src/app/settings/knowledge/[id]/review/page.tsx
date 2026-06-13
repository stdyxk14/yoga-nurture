import { ArrowLeft, FileCheck2, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { updateKnowledgeReviewAction } from "@/app/settings/knowledge/actions";
import { getKnowledgeDocumentById } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
};

export default async function KnowledgeReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { document, signedUrl, error } = await getKnowledgeDocumentById(id);

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
      <PageHeader title="OCR結果を確認" subtitle={document.title} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <LinkButton href={`/settings/knowledge/${document.id}`}>
          <ArrowLeft className="h-4 w-4" />
          詳細に戻る
        </LinkButton>
      </div>

      {query.error || error ? (
        <div className="rounded-2xl border border-[#f3b8aa] bg-[#fff5f2] p-3 text-[13px] font-bold text-[#bb4e3d]">{query.error ?? error}</div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SoftCard className="p-4">
          <SectionTitle icon={FileCheck2} title="元ファイルプレビュー" />
          {signedUrl && document.file_mime_type?.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedUrl} alt={document.title} className="max-h-[560px] w-full rounded-2xl border border-[#eee4d8] object-contain" />
          ) : signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] text-[14px] font-bold text-[#4f835d]"
            >
              PDF / ファイルを別タブで開いて確認
            </a>
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] text-[13px] font-bold text-[#6d7469]">
              ファイルなしのテキストメモです。
            </div>
          )}
          <p className="mt-3 rounded-2xl border border-[#eee4d8] bg-white/72 p-3 text-[12px] font-semibold leading-5 text-[#657064]">
            このフェーズでは、OCR結果の自動確定はしません。手書きOCRは誤認識があるため、必ず確認済みテキストを保存してから知識カード化します。
          </p>
        </SoftCard>

        <SoftCard className="p-4">
          <SectionTitle icon={Save} title="読み取り結果の確認・修正" />
          <form action={updateKnowledgeReviewAction.bind(null, document.id)} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-[13px] font-bold">OCR読み取り結果</label>
              <Textarea
                name="raw_ocr_text"
                defaultValue={document.raw_ocr_text ?? ""}
                rows={9}
                placeholder="OCR結果、または手入力で読み取った内容を貼り付けてください。"
                className="rounded-2xl bg-white/90 text-[14px] leading-7"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-[13px] font-bold">確認済みテキスト</label>
              <Textarea
                name="cleaned_text"
                defaultValue={document.cleaned_text ?? document.raw_ocr_text ?? ""}
                rows={12}
                placeholder="AIメンターが将来参照できるように、誤字や抜けを修正した内容を保存します。"
                className="rounded-2xl bg-white/90 text-[14px] leading-7"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-[13px] font-bold">要約</label>
              <Textarea
                name="summary"
                defaultValue={document.summary ?? ""}
                rows={4}
                placeholder="このメモの要点を短くまとめます。"
                className="rounded-2xl bg-white/90 text-[14px] leading-7"
              />
            </div>
            <Button type="submit" className="h-11 rounded-xl bg-[#5d956d] text-white hover:bg-[#4f835d] sm:w-fit sm:px-6">
              <Save className="mr-2 h-4 w-4" />
              確認済みとして保存
            </Button>
          </form>
        </SoftCard>
      </section>
    </div>
  );
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe7d9] bg-white/85 px-4 text-[13px] font-bold text-[#4f835d]">
      {children}
    </Link>
  );
}
