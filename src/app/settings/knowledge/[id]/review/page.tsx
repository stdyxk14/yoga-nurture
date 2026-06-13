import { ArrowLeft, CheckCircle2, FileCheck2, Save, ScanText, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import {
  activateKnowledgeCardAction,
  createKnowledgeCardDraftAction,
  generateKnowledgeCardDraftWithAiAction,
  runKnowledgeImageOcrAction,
  updateKnowledgeCardAction,
  updateKnowledgeReviewAction,
} from "@/app/settings/knowledge/actions";
import { getKnowledgeDocumentById, mentorTypeLabels } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
  message?: string;
};

export default async function KnowledgeReviewPage({
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
      <PageHeader title="OCR結果を確認" subtitle={document.title} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <LinkButton href={`/settings/knowledge/${document.id}`}>
          <ArrowLeft className="h-4 w-4" />
          詳細に戻る
        </LinkButton>
        {document.file_mime_type?.startsWith("image/") ? (
          <form action={runKnowledgeImageOcrAction.bind(null, document.id)} className="contents">
            <Button type="submit" variant="outline" className="h-10 rounded-xl border-[#cfe1ca] bg-white/85 px-4 text-[13px] font-bold text-[#4f835d]">
              <ScanText className="mr-2 h-4 w-4" />
              AIで読み取る
            </Button>
          </form>
        ) : null}
      </div>

      <Notice message={query.message} error={query.error ?? error ?? undefined} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SoftCard className="p-4">
          <SectionTitle icon={FileCheck2} title="元ファイルプレビュー" />
          {signedUrl && document.file_mime_type?.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedUrl} alt={document.title} className="max-h-[560px] w-full rounded-2xl border border-[#eee4d8] object-contain" />
          ) : signedUrl ? (
            <div className="grid gap-3">
              <a
                href={signedUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] text-[14px] font-bold text-[#4f835d]"
              >
                PDF / ファイルを別タブで開いて確認
              </a>
              {document.file_mime_type === "application/pdf" ? (
                <p className="rounded-2xl border border-[#eee4d8] bg-white/72 p-3 text-[12px] font-semibold leading-5 text-[#657064]">
                  PDF自動OCRは準備中です。別タブで確認し、必要な本文を右側の読み取り結果に貼り付けてください。
                </p>
              ) : null}
            </div>
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

      <SoftCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <SectionTitle icon={Sparkles} title="AI知識カード化" subtitle="確認済みテキストから、AIメンターが参照しやすい下書きを作ります" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <form action={generateKnowledgeCardDraftWithAiAction.bind(null, document.id)}>
              <Button type="submit" className="h-10 w-full rounded-xl bg-[#5d956d] text-white hover:bg-[#4f835d] sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" />
                AIで知識カード候補を作成
              </Button>
            </form>
            <form action={createKnowledgeCardDraftAction.bind(null, document.id)}>
              <Button type="submit" variant="outline" className="h-10 w-full rounded-xl border-[#cfe1ca] text-[#4f835d] sm:w-auto">
                手動で下書き作成
              </Button>
            </form>
          </div>
        </div>

        {cards.length ? (
          <div className="mt-4 grid gap-4">
            {cards.map((card) => (
              <article key={card.id} className="rounded-2xl border border-[#eee4d8] bg-white/76 p-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-[#e6f0e3] text-[#4f835d] shadow-none">{card.status === "active" ? "有効" : "下書き"}</Badge>
                  <Badge className="rounded-full bg-[#f4efe7] text-[#806848] shadow-none">{mentorTypeLabels[card.mentor_type] ?? card.mentor_type}</Badge>
                </div>
                <form id={`knowledge-card-${card.id}`} action={updateKnowledgeCardAction.bind(null, document.id, card.id)} className="grid gap-3">
                  <Field label="タイトル">
                    <input name="title" defaultValue={card.title} className="h-10 rounded-xl border border-input bg-white/90 px-3 text-[13px] font-semibold" />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="分類">
                      <input name="category" defaultValue={card.category ?? ""} className="h-10 rounded-xl border border-input bg-white/90 px-3 text-[13px] font-semibold" />
                    </Field>
                    <Field label="関連メンター">
                      <select name="mentor_type" defaultValue={card.mentor_type} className="h-10 rounded-xl border border-input bg-white/90 px-3 text-[13px] font-semibold">
                        {Object.entries(mentorTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label="本文">
                    <Textarea name="content" defaultValue={card.content} rows={7} className="rounded-2xl bg-white/90 text-[14px] leading-7" />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="やること">
                      <Textarea name="do_points" defaultValue={(card.do_points ?? []).join("\n")} rows={5} className="rounded-2xl bg-white/90 text-[13px] leading-6" />
                    </Field>
                    <Field label="避けること">
                      <Textarea name="dont_points" defaultValue={(card.dont_points ?? []).join("\n")} rows={5} className="rounded-2xl bg-white/90 text-[13px] leading-6" />
                    </Field>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="声かけ例">
                      <Textarea name="example_phrases" defaultValue={(card.example_phrases ?? []).join("\n")} rows={5} className="rounded-2xl bg-white/90 text-[13px] leading-6" />
                    </Field>
                    <Field label="関連タグ">
                      <Textarea name="related_tags" defaultValue={(card.related_tags ?? []).join(" ")} rows={5} className="rounded-2xl bg-white/90 text-[13px] leading-6" />
                    </Field>
                  </div>
                </form>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="submit" form={`knowledge-card-${card.id}`} variant="outline" className="h-10 rounded-xl border-[#cfe1ca] text-[#4f835d]">
                    <Save className="mr-2 h-4 w-4" />
                    候補を保存
                  </Button>
                  {card.status !== "active" ? (
                    <form action={activateKnowledgeCardAction.bind(null, document.id, card.id)}>
                      <Button type="submit" className="h-10 w-full rounded-xl bg-[#5d956d] text-white hover:bg-[#4f835d] sm:w-auto">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
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
            確認済みテキストを保存すると、AIで知識カード候補を作成できます。作成後は内容を確認・修正してから有効化します。
          </p>
        )}
      </SoftCard>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] font-bold text-[#5f665c]">{label}</span>
      {children}
    </label>
  );
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe7d9] bg-white/85 px-4 text-[13px] font-bold text-[#4f835d]">
      {children}
    </Link>
  );
}
