import Link from "next/link";
import { RichScriptText } from "@/components/yoga/rich-script-text";
import type { DbLessonPlan } from "@/lib/lesson-plans";
import type { DbSchedule, ScheduleParticipantObservation } from "@/lib/schedules";

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
      observations: student.pastObservations,
    })) ?? [];
  const hasScheduleMemo = Boolean(schedule?.scheduleCaution || schedule?.scheduleMemo);

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
              </div>
            </section>
          ) : null}
        </section>

        {schedule ? (
          <section className="print-participants mt-10 border-t-[10px] border-[#eee8dc] pt-10 print:mt-0 print:border-t-0 print:pt-0">
            <div className="participant-section-heading mb-4 border-b border-[#293225] pb-3">
              <p className="participant-section-kicker text-[10.5px] font-extrabold tracking-[0.22em] text-[#5d956d]">PARTICIPANTS</p>
              <h2 className="participant-section-title mt-1.5 text-[21px] font-black leading-tight text-[#20231e] print:text-[14pt]">参加生徒情報・過去の観察記録</h2>
              <p className="participant-section-description mt-1 max-w-[720px] text-[11.5px] font-semibold leading-[1.5] text-[#606a5e]">
                対象予定より前に完了したレッスンのうち、実際に参加した生徒の保存済み記録です。
              </p>
            </div>

            {participantItems.length ? (
              <div className="participant-student-list">
                {participantItems.map((student) => (
                  <section key={student.id} className="participant-student-section mt-7 border-t border-[#cfc7ba] pt-5 first:mt-0 first:border-t-0 first:pt-0">
                    <div className="participant-overview bg-[#f7f5ef] px-3.5 py-3">
                      <header className="participant-overview-heading flex flex-wrap items-baseline justify-between gap-2 border-b border-[#d8d1c6] pb-2">
                        <h3 className="participant-overview-name text-[16px] font-black text-[#20231e]">{student.name}</h3>
                        <p className="participant-overview-count shrink-0 text-[11px] font-extrabold text-[#5d956d]">過去受講回数 {student.lessonCount}回</p>
                      </header>

                      <dl className="participant-profile mt-2.5 grid gap-1.5 text-[11px] leading-[1.55]">
                        <PrintDefinition label="ヨガ・その他経験" value={student.experience} />
                        <PrintDefinition label="ケガなどの注意点" value={student.caution || "未登録"} />
                        <PrintDefinition label="その他メモ" value={student.memo} />
                        <div className="participant-follow-ups grid grid-cols-[116px_minmax(0,1fr)] gap-2 border-t border-[#e0d8cd] pt-2">
                          <dt className="font-black text-[#9b4d33]">未完了の次回フォロー</dt>
                          <dd className="min-w-0">
                            {student.followUps.length ? (
                              <div className="space-y-1.5">
                                {student.followUps.map((followUp) => (
                                  <div key={`${student.id}-${followUp.date}-${followUp.text}`}>
                                    <p className="whitespace-pre-wrap break-words font-semibold text-[#20231e]">{followUp.text}</p>
                                    {followUp.personalMemo ? <p className="mt-0.5 whitespace-pre-wrap break-words text-[#606a5e]">個別メモ：{followUp.personalMemo}</p> : null}
                                    <p className="mt-0.5 text-[10px] text-[#6b7468]">{followUp.date} / {followUp.lessonName}</p>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="font-semibold text-[#6b7468]">なし</p>}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {student.observations.length ? (
                      <table className="participant-history-table mt-3 w-full table-fixed border-collapse text-left">
                        <colgroup>
                          <col className="w-[30%]" />
                          <col />
                        </colgroup>
                        <thead>
                          <tr className="participant-history-identity border-y border-[#bfc9ba] bg-[#edf2e9]">
                            <th colSpan={2} className="px-3 py-2 font-normal">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                <span className="participant-history-name font-black text-[#20231e]">{student.name}</span>
                                <span className="participant-history-caption font-extrabold text-[#4f7355]">過去受講回数 {student.lessonCount}回 ・ 過去の観察記録</span>
                              </div>
                            </th>
                          </tr>
                          <tr className="participant-history-columns border-b border-[#cfc7ba] bg-[#f8f7f2] text-[#4d584a]">
                            <th scope="col" className="px-3 py-1.5 font-black">日付・レッスン名</th>
                            <th scope="col" className="px-3 py-1.5 font-black">観察内容</th>
                          </tr>
                        </thead>
                        <tbody>
                          {student.observations.map((observation) => (
                            <ParticipantObservationRow key={observation.lessonRecordId} observation={observation} />
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="participant-empty-history mt-3 border-y border-[#ddd5ca] bg-[#fbfaf7] px-3 py-2.5 text-[11px] font-semibold text-[#6b7468]">過去の観察メモはありません</p>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <p className="border border-dashed border-[#d7d0c5] p-4 text-[12.5px] font-semibold text-[#6b7468]">参加予定生徒はいません。</p>
            )}
          </section>
        ) : null}

        <section className={schedule ? "print-toc print-toc-after-participants mt-10 border-t-[10px] border-[#eee8dc] pt-10 print:mt-0 print:border-t-0 print:pt-0" : "print-toc"}>
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

function ParticipantObservationRow({ observation }: { observation: ScheduleParticipantObservation }) {
  return (
    <tr className="participant-observation-row border-b border-[#ddd5ca] align-top text-[11px] leading-[1.55]">
      <td className="participant-observation-meta px-3 py-2.5 align-top">
        <p className="font-black text-[#20231e]">{observation.dateLabel}</p>
        <p className="mt-0.5 whitespace-pre-wrap break-words font-semibold text-[#566052]">{observation.lessonName}</p>
        {observation.scheduleId ? (
          <Link href={`/lessons/${observation.scheduleId}/record`} className="mt-1.5 inline-block text-[10px] font-extrabold text-[#4f7b58] underline underline-offset-2 print:hidden">
            実施後記録を見る
          </Link>
        ) : null}
      </td>
      <td className="px-3 py-2.5 align-top">
        <dl className="participant-observation-fields grid gap-1.5">
          {observation.condition ? <ObservationField label="今日の様子" value={observation.condition} /> : null}
          {observation.memo ? <ObservationField label="個別メモ" value={observation.memo} /> : null}
          {observation.nextFollow ? <ObservationField label="次回フォロー" value={observation.nextFollow} /> : null}
          {observation.followUpStatus ? <ObservationField label="フォロー状態" value={getFollowUpStatusLabel(observation.followUpStatus)} /> : null}
        </dl>
      </td>
    </tr>
  );
}

function ObservationField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
      <dt className="font-black text-[#4d584a]">{label}</dt>
      <dd className="whitespace-pre-wrap break-words font-semibold text-[#20231e] [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function getFollowUpStatusLabel(status: NonNullable<ScheduleParticipantObservation["followUpStatus"]>) {
  if (status === "pending") return "未完了";
  if (status === "completed") return "確認済み";
  if (status === "dismissed") return "見送り";
  return "フォローなし";
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

        .print-toc-after-participants {
          break-before: page;
          page-break-before: always;
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

        .participant-section-kicker {
          font-size: 8.5pt !important;
        }

        .participant-section-title {
          font-size: 14pt !important;
        }

        .participant-section-description {
          font-size: 8.8pt !important;
          line-height: 1.45 !important;
        }

        .participant-student-list {
          display: block;
        }

        .participant-student-section {
          break-inside: auto;
          page-break-inside: auto;
        }

        .participant-student-section + .participant-student-section {
          margin-top: 8mm;
          padding-top: 5mm;
        }

        .participant-overview {
          break-inside: avoid;
          page-break-inside: avoid;
          break-after: avoid-page;
          page-break-after: avoid;
        }

        .participant-overview-name,
        .participant-history-name {
          font-size: 12pt !important;
        }

        .participant-overview-count,
        .participant-history-caption {
          font-size: 8.8pt !important;
        }

        .participant-profile {
          font-size: 9.2pt !important;
          line-height: 1.48 !important;
        }

        .participant-profile dt,
        .participant-observation-fields dt {
          font-size: 8.7pt !important;
        }

        .participant-profile dd,
        .participant-observation-fields dd {
          font-size: 9.2pt !important;
        }

        .participant-history-table {
          width: 100%;
          border-collapse: collapse;
          break-before: avoid-page;
          page-break-before: avoid;
          break-inside: auto;
          page-break-inside: auto;
        }

        .participant-history-table thead {
          display: table-header-group !important;
          break-inside: avoid;
          page-break-inside: avoid;
          break-after: avoid;
          page-break-after: avoid;
        }

        .participant-history-columns th {
          font-size: 8.7pt !important;
          line-height: 1.35 !important;
        }

        .participant-observation-row {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .participant-observation-row td {
          font-size: 9.2pt !important;
          line-height: 1.5 !important;
        }

        .participant-observation-meta {
          font-size: 8.8pt !important;
        }

        .participant-empty-history {
          break-inside: avoid;
          page-break-inside: avoid;
          font-size: 9.2pt !important;
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
