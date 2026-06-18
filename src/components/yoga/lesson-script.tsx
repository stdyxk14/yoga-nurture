import Link from "next/link";
import { Copy, Download, Printer } from "lucide-react";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { RichScriptText } from "@/components/yoga/rich-script-text";
import { getLessonBlocks, getStudent } from "@/components/yoga/records";
import type { LessonRecord } from "@/components/yoga/records";

export function LessonScript({ lesson }: { lesson: LessonRecord }) {
  const blocks = getLessonBlocks(lesson);
  const plannedStudents = lesson.plannedStudentIds.map(getStudent);

  return (
    <>
      <PageHeader title="レッスン原稿" subtitle="印刷してスタジオに持っていくための原稿ビュー" />

      <div className="mb-3 flex justify-end gap-2 print:hidden">
        <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#5d956d] px-4 text-[13px] font-bold text-white">
          <Printer className="h-4 w-4" />印刷する
        </button>
        <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-4 text-[13px] font-bold text-[#5d956d]">
          <Download className="h-4 w-4" />PDF出力
        </button>
        <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#cfe1ca] bg-white px-4 text-[13px] font-bold text-[#5d956d]">
          <Copy className="h-4 w-4" />コピーする
        </button>
        <Link href={`/lessons/${lesson.id}/edit`} className="inline-flex h-9 items-center rounded-lg border border-[#d8e3d4] bg-white px-4 text-[13px] font-bold text-[#4f7b58]">
          編集に戻る
        </Link>
      </div>

      <SoftCard className="script-page p-6 print:border-0 print:bg-white print:shadow-none">
        <div className="mb-5 border-b border-[#e7dfd4] pb-4">
          <h1 className="text-[28px] font-extrabold print:text-2xl">{lesson.title}</h1>
          <div className="mt-2 grid grid-cols-4 gap-3 text-[13px] font-semibold">
            <p>日付：{lesson.date}</p>
            <p>時間：{lesson.startTime}-{lesson.endTime}</p>
            <p>合計：{lesson.duration}</p>
            <p>場所：{lesson.place}</p>
          </div>
          <p className="mt-2 text-[13px] font-medium">参加予定：{plannedStudents.map((student) => student.name).join("、")}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 print:hidden">
            {lesson.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}
          </div>
        </div>

        <SectionTitle title="レッスン原稿" subtitle="大カテゴリー / 小カテゴリー / 誘導セリフ" />
        <div className="grid gap-4">
          {blocks.map((block, index) => (
            <article key={block.id} className="break-inside-avoid rounded-xl border border-[#eee4d8] bg-white/80 p-4 print:border-[#ddd] print:bg-white">
              <div className="mb-3 flex items-start justify-between gap-3 border-b border-[#eee8dd] pb-2">
                <div>
                  <p className="text-[12px] font-bold text-[#5d956d]">
                    {index + 1}. {block.majorCategory}
                  </p>
                  <h2 className="text-[18px] font-extrabold">{block.minorCategory}：{block.name}</h2>
                </div>
                <span className="rounded-full bg-[#edf5ef] px-3 py-1 text-[12px] font-bold text-[#4f875a]">{block.duration}</span>
              </div>
              <RichScriptText text={block.script} className="whitespace-pre-line text-[13px] font-medium leading-7 text-[#30362f] print:text-[12px] print:leading-6" />
              <div className="mt-3 rounded-lg bg-[#fff7e8] px-3 py-2 text-[12px] font-bold leading-5 text-[#8b704c]">
                注意点：{block.cautions}
              </div>
            </article>
          ))}
        </div>
      </SoftCard>
    </>
  );
}
