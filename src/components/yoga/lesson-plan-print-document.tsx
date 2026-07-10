import { RichScriptText } from "@/components/yoga/rich-script-text";
import type { DbLessonPlan } from "@/lib/lesson-plans";
import type { DbSchedule } from "@/lib/schedules";

type Props = {
  plan: DbLessonPlan;
  schedule?: DbSchedule;
};

export function LessonPlanPrintDocument({ plan, schedule }: Props) {
  const participantItems =
    schedule?.participants.map((student) => ({
      id: student.id,
      name: student.name,
      lessonCount: student.linkedLessonCount ?? 0,
      experience: student.experience?.trim() || "未登録",
      memo: student.memo?.trim() || "未登録",
      caution: student.caution?.trim() || "",
      followUps: student.pendingFollowUps ?? [],
    })) ?? [];
  const hasScheduleMemo = Boolean(schedule?.scheduleCaution || schedule?.scheduleMemo || participantItems.length);

  return (
    <div className="script-print-wrap mx-auto max-w-[920px] bg-[#f6f2ea] px-4 py-6 text-[#20231e] print:max-w-none print:bg-white print:p-0">
      <PrintStyles />

      <article className="script-print-document mx-auto bg-white px-10 py-10 shadow-[0_18px_50px_rgba(66,55,38,0.12)] print:m-0 print:w-auto print:p-0 print:shadow-none">
        <section className="print-cover">
          <div className="flex items-start justify-between gap-6 border-b border-[#293225] pb-5">
            <div>
              <p className="text-[12px] font-extrabold tracking-[0.28em] text-[#5d956d]">YOGA NURTURE</p>
              <h1 className="mt-4 text-[34px] font-black leading-tight tracking-normal text-[#20231e] print:text-[26pt]">
                レッスン原稿
              </h1>
              <h2 className="mt-2 max-w-[680px] text-[24px] font-extrabold leading-snug text-[#30362f] print:text-[19pt]">
                {plan.name}
              </h2>
            </div>
            <div className="min-w-[130px] rounded-none border-l-4 border-[#5d956d] pl-4 text-right">
              <p className="text-[11px] font-bold text-[#6b7468]">合計時間</p>
              <p className="text-[28px] font-black text-[#20231e]">{plan.totalMinutes}分</p>
            </div>
          </div>

          <section className="mt-6 grid gap-3 border-b border-[#ddd5ca] pb-5 text-[12.5px] font-semibold leading-6 print:grid-cols-2">
            <PrintInfo label="テーマ" value={plan.theme || "未設定"} />
            <PrintInfo label="形式" value={plan.formatLabel} />
            <PrintInfo label="更新日" value={formatDate(plan.updatedAt)} />
            <PrintInfo label="ブロック数" value={`${plan.blockCount}個`} />
            {plan.tags.length ? <PrintInfo label="タグ" value={plan.tags.join(" / ")} wide /> : null}
          </section>

          {schedule ? (
            <section className="mt-6">
              <PrintSectionTitle title="スケジュール情報" />
              <div className="mt-3 grid gap-2 text-[12.5px] font-semibold leading-6 print:grid-cols-2">
                <PrintInfo label="日付" value={schedule.dateLabel} />
                <PrintInfo label="時間" value={`${schedule.startTimeLabel}〜${schedule.endTimeLabel}`} />
                <PrintInfo label="場所" value={schedule.place || "未設定"} />
                <PrintInfo label="形式" value={schedule.formatLabel} />
                <PrintInfo label="参加予定人数" value={`${schedule.participantCount}名`} />
              </div>
            </section>
          ) : null}

          {schedule && hasScheduleMemo ? (
            <section className="mt-6 rounded-none border border-[#cfc7ba] p-4">
              <PrintSectionTitle title="この予定の確認メモ" />
              <div className="mt-3 space-y-3 text-[12.5px] leading-6">
                {schedule.scheduleCaution ? <MemoBlock title="注意事項" tone="caution" text={schedule.scheduleCaution} /> : null}
                {schedule.scheduleMemo ? <MemoBlock title="メモ" text={schedule.scheduleMemo} /> : null}
                {participantItems.length ? (
                  <div>
                    <p className="text-[12px] font-extrabold text-[#374431]">参加生徒の確認情報</p>
                    <div className="mt-2 grid gap-2">
                      {participantItems.map((student) => (
                        <section key={student.id} className="participant-print-card break-inside-avoid border border-[#ddd5ca] p-3">
                          <div className="flex items-baseline justify-between gap-3 border-b border-[#ece4d8] pb-1.5">
                            <p className="font-black text-[#20231e]">{student.name}</p>
                            <p className="shrink-0 text-[11px] font-extrabold text-[#5d956d]">受講 {student.lessonCount}回</p>
                          </div>
                          <dl className="mt-2 grid gap-1.5 text-[11.5px] leading-5">
                            <PrintDefinition label="ヨガ他経験" value={student.experience} />
                            {student.caution ? <PrintDefinition label="ケガなどの注意点" value={student.caution} /> : null}
                            <PrintDefinition label="その他メモ" value={student.memo} />
                            {student.followUps.length ? (
                              <div className="mt-1 rounded-none border-l-4 border-[#b35d3f] pl-2">
                                <dt className="font-black text-[#9b4d33]">次回フォロー</dt>
                                <dd className="mt-1 space-y-1 font-semibold text-[#20231e]">
                                  {student.followUps.map((followUp) => (
                                    <div key={`${student.id}-${followUp.date}-${followUp.text}`}>
                                      <p>{followUp.text}</p>
                                      {followUp.personalMemo ? <p className="text-[#606a5e]">個別メモ：{followUp.personalMemo}</p> : null}
                                      <p className="text-[10.5px] text-[#6b7468]">{followUp.date} / {followUp.lessonName}</p>
                                    </div>
                                  ))}
                                </dd>
                              </div>
                            ) : null}
                          </dl>
                        </section>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </section>

        <section className="print-toc">
          <div className="mb-5 flex items-end justify-between gap-6 border-b border-[#293225] pb-4">
            <div>
              <p className="text-[12px] font-extrabold tracking-[0.22em] text-[#5d956d]">YOGA NURTURE</p>
              <h2 className="mt-2 text-[25px] font-black leading-tight text-[#20231e] print:text-[20pt]">目次 / ブロック一覧</h2>
              <p className="mt-1 max-w-[680px] text-[12.5px] font-semibold leading-5 text-[#606a5e]">{plan.name}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-bold text-[#6b7468]">合計時間</p>
              <p className="text-[22px] font-black text-[#20231e]">{plan.totalMinutes}分</p>
            </div>
          </div>
          <div className="print-toc-list divide-y divide-[#ddd5ca] border-y border-[#bcb4a8]">
            {plan.blocks.map((block, index) => (
              <div key={block.planBlockId} className="toc-row grid grid-cols-[34px_minmax(0,1fr)_58px] gap-3 py-1.5 text-[12.5px] leading-5">
                <span className="font-black text-[#5d956d]">{index + 1}</span>
                <div className="min-w-0">
                  <p className="font-extrabold text-[#20231e]">{block.name}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#606a5e]">{block.majorCategory} / {block.minorCategory}</p>
                </div>
                <span className="text-right font-extrabold">{block.plannedDurationMinutes}分</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-right text-[13px] font-black">合計：{plan.totalMinutes}分</p>
        </section>

        <section className="script-body">
          <div className="mb-5 border-b border-[#293225] pb-3">
            <p className="text-[12px] font-extrabold tracking-[0.18em] text-[#5d956d]">FULL SCRIPT</p>
            <h2 className="mt-1 text-[24px] font-black text-[#20231e] print:text-[18pt]">誘導セリフ全文</h2>
          </div>
          <div className="space-y-8">
            {plan.blocks.map((block, index) => (
              <section key={block.planBlockId} className="script-block">
                <header className="script-block-header border-b border-[#cfc7ba] pb-2">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#5d956d] text-[12px] font-black text-[#5d956d]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[18px] font-black leading-snug text-[#20231e] print:text-[15pt]">{block.name}</h3>
                      <p className="mt-1 text-[11.5px] font-bold text-[#5d956d]">
                        {block.majorCategory} / {block.minorCategory} / {block.plannedDurationMinutes}分
                      </p>
                      {block.tags.length ? <p className="mt-1 text-[10.5px] font-semibold text-[#6b7468]">{block.tags.join(" / ")}</p> : null}
                    </div>
                  </div>
                </header>

                <div className="mt-3 grid gap-2 text-[12px] leading-6">
                  {block.purpose ? <PrintInfo label="目的" value={block.purpose} /> : null}
                  {block.cautionsOverride || block.cautions ? <PrintInfo label="注意点" value={block.cautionsOverride || block.cautions} /> : null}
                  {block.memo ? <PrintInfo label="改善メモ" value={block.memo} /> : null}
                </div>

                <RichScriptText
                  text={block.scriptOverride || block.script}
                  emptyText="誘導セリフは未入力です。"
                  className="script-text mt-4 whitespace-pre-wrap break-words text-[13px] font-medium leading-7 text-[#252a23] print:text-[9.8pt] print:leading-[1.6]"
                />
              </section>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}

function PrintSectionTitle({ title }: { title: string }) {
  return <h3 className="inline-flex border-b-2 border-[#5d956d] pb-1 text-[15px] font-black tracking-normal text-[#20231e] print:text-[13pt]">{title}</h3>;
}

function PrintInfo({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <p className={wide ? "print:col-span-2" : ""}>
      <span className="mr-2 font-black text-[#4d584a]">{label}：</span>
      <span className="break-words text-[#20231e]">{value}</span>
    </p>
  );
}

function PrintDefinition({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
      <dt className="font-black text-[#4d584a]">{label}</dt>
      <dd className="whitespace-pre-wrap font-semibold text-[#20231e]">{value}</dd>
    </div>
  );
}

function MemoBlock({ title, text, tone = "normal" }: { title: string; text: string; tone?: "normal" | "caution" }) {
  return (
    <div className={tone === "caution" ? "border-l-4 border-[#b35d3f] pl-3" : "border-l-4 border-[#5d956d] pl-3"}>
      <p className={tone === "caution" ? "text-[12px] font-extrabold text-[#9b4d33]" : "text-[12px] font-extrabold text-[#374431]"}>{title}</p>
      <p className="mt-1 whitespace-pre-wrap font-semibold">{text}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function PrintStyles() {
  return (
    <style>{`
      @page {
        size: A4 portrait;
        margin: 15mm 14mm 16mm;
      }

      @media print {
        html, body {
          background: #fff !important;
          color: #20231e !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body {
          margin: 0 !important;
        }

        .script-print-wrap {
          background: #fff !important;
          padding: 0 !important;
          width: 100% !important;
        }

        .script-print-document {
          box-shadow: none !important;
          border: 0 !important;
          width: auto !important;
          max-width: none !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .print-cover {
          break-after: page;
          page-break-after: always;
          min-height: auto;
        }

        .print-toc {
          break-after: page;
          page-break-after: always;
        }

        .print-toc-list {
          break-inside: auto;
          page-break-inside: auto;
        }

        .toc-row {
          break-inside: avoid;
          page-break-inside: avoid;
          font-size: 9.2pt !important;
          line-height: 1.22 !important;
          padding-top: 1.8mm !important;
          padding-bottom: 1.8mm !important;
        }

        .toc-row p {
          margin-top: 0 !important;
        }

        .script-body {
          break-before: auto;
          page-break-before: auto;
        }

        .script-block {
          break-inside: auto;
          page-break-inside: auto;
          padding: 0 0 7mm;
          margin: 0 0 7mm;
          border-bottom: 1px solid #d9d1c6;
        }

        .script-block-header {
          break-after: avoid;
          page-break-after: avoid;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .participant-print-card {
          font-size: 9.4pt !important;
          line-height: 1.45 !important;
        }

        .script-text {
          orphans: 3;
          widows: 3;
        }

        a {
          color: inherit;
          text-decoration: none;
        }
      }
    `}</style>
  );
}
