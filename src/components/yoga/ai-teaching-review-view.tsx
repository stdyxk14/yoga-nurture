import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Sparkles, UserRound } from "lucide-react";
import { AiReviewControls } from "@/components/yoga/ai-review-controls";
import { WorkspaceEmptyState, WorkspaceFeedback, WorkspaceSection } from "@/components/yoga/workspace-kit";
import type { TeachingReviewState } from "@/lib/ai-review/queries";
import type {
  AiReviewFinding,
  AiReviewReference,
  AiReviewReferenceIndex,
  AiReviewSection,
  AiStudentReview,
} from "@/lib/ai-review/types";

export function AiTeachingReviewView({ state }: { state: TeachingReviewState }) {
  const snapshot = state.snapshot;
  const singleLesson = snapshot?.review.review_kind === "lesson" ? snapshot.review.single_lesson : null;
  return (
    <div className="space-y-5">
      <AiReviewControls state={state} />

      {state.latestRun?.status === "running" ? <WorkspaceFeedback tone="info">新しいレビューを分析中です。完了まで保存済みの結果を表示します。</WorkspaceFeedback> : null}
      {state.latestRun?.status === "failed" && snapshot ? <WorkspaceFeedback tone="error">最新の分析は完了しませんでした。保存済みのレビューはそのまま残しています。</WorkspaceFeedback> : null}

      {!snapshot ? (
        <WorkspaceEmptyState
          title={state.scope.targetRecordIds.length ? "この範囲のAI指導レビューはまだありません" : "対象となる完了レッスンがありません"}
          description={state.scope.targetRecordIds.length ? "分析範囲を確認して「分析する」を押すと、レッスン内容・誘導・生徒対応・接客を具体的に読み解きます。" : "完了済みの実施後記録が作成されると、1レッスンまたは期間で分析できます。"}
        />
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-[#d5e1d1] bg-[radial-gradient(circle_at_top_right,rgba(205,227,199,0.52),transparent_34%),linear-gradient(135deg,#f6faf3_0%,#fffaf5_78%)] p-5 shadow-[0_12px_34px_rgba(70,91,68,0.08)] lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#4f8058]"><Sparkles className="h-5 w-5" /><p className="text-[13px] font-semibold tracking-[0.05em]">総評</p></div>
              <p className="text-[13px] text-[#6f786f]">{snapshot.scopeLabel}・{snapshot.targetRecordIds.length}回を確認・{formatDate(snapshot.generatedAt)}更新</p>
            </div>
            <p className="mt-4 max-w-[1160px] text-[18px] font-medium leading-8 text-[#344038]">{snapshot.review.overall_assessment}</p>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <PriorityFinding title="特に良かった点" finding={snapshot.review.key_strength} section={singleLesson?.good_points} references={snapshot.references} tone="strength" />
            <PriorityFinding title="改善したい点" finding={snapshot.review.priority_improvement} section={singleLesson?.improvement_points} references={snapshot.references} tone="improvement" />
          </div>

          {snapshot.review.review_kind === "lesson" && snapshot.review.single_lesson ? (
            <SingleLessonSections review={snapshot.review.single_lesson} references={snapshot.references} />
          ) : null}
          {snapshot.review.review_kind === "period" && snapshot.review.period_review ? (
            <PeriodSections review={snapshot.review.period_review} references={snapshot.references} />
          ) : null}

          <WorkspaceSection title="次に行う具体的なこと" description="次回の指導や接客で試せる順にまとめています。">
            <ol className="grid gap-3 lg:grid-cols-2">
              {snapshot.review.next_actions.map((action, index) => (
                <li key={`${action.title}-${index}`} className="rounded-xl border border-[#e1ddd4] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f1e5] text-[12px] font-semibold text-[#4f8058]">{index + 1}</span>
                    <div><h3 className="text-[15px] font-semibold">{action.title}</h3><p className="mt-1 text-[14px] leading-6 text-[#5f685f]">{action.detail}</p></div>
                  </div>
                  <ReferenceLinks references={action.references} index={snapshot.references} />
                </li>
              ))}
            </ol>
          </WorkspaceSection>

          {snapshot.review.contradictions.length ? (
            <WorkspaceSection title="判断を保留した点" description="記録どうしが一致しないため、断定せず次回確認へ回した内容です。">
              <div className="space-y-2">{snapshot.review.contradictions.map((item, index) => <div key={index} className="rounded-xl border border-[#ead9bc] bg-[#fff9ea] p-4"><p className="flex gap-2 text-[14px] leading-6 text-[#725f3f]"><AlertTriangle className="mt-1 h-4 w-4 shrink-0" />{item.description}</p><ReferenceLinks references={item.references} index={snapshot.references} /></div>)}</div>
            </WorkspaceSection>
          ) : null}

          {snapshot.review.data_notes.length ? (
            <details className="rounded-xl border border-[#e4e1da] bg-[#faf9f5] px-4 py-3">
              <summary className="cursor-pointer text-[13px] font-semibold text-[#657067]">今回のレビューで留意したこと</summary>
              <ul className="mt-3 space-y-1.5">{snapshot.review.data_notes.map((note, index) => <li key={index} className="text-[13px] leading-6 text-[#697169]">・{note}</li>)}</ul>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}

function SingleLessonSections({ review, references }: { review: NonNullable<TeachingReviewState["snapshot"]>["review"]["single_lesson"] extends infer T ? NonNullable<T> : never; references: AiReviewReferenceIndex }) {
  const sections: Array<[string, AiReviewSection]> = [
    ["レッスン構成と流れ", review.lesson_structure_and_flow],
    ["ブロック／ポーズの選択", review.block_pose_selection],
    ["順番とつながり", review.sequence_connections],
    ["強度の上げ下げ", review.intensity_flow],
    ["時間配分", review.time_allocation],
    ["誘導セリフと声かけ", review.cueing_and_voice],
    ["当日の現場対応", review.field_adaptation],
  ];
  return (
    <>
      {sections.map(([title, section]) => <ReviewSection key={title} title={title} section={section} references={references} />)}
      <StudentReviews title="生徒一人ひとりへの対応" students={review.student_reviews} references={references} />
      <ReviewSection title="接客・コミュニケーション" section={review.customer_communication} references={references} />
      <ReviewSection title="次回の具体的な改善案" section={review.next_improvements} references={references} accent />
      <ReviewSection title="新しく試せるレッスン・ブロック・声かけ" section={review.new_experiments} references={references} accent />
    </>
  );
}

function PeriodSections({ review, references }: { review: NonNullable<TeachingReviewState["snapshot"]>["review"]["period_review"] extends infer T ? NonNullable<T> : never; references: AiReviewReferenceIndex }) {
  const sections: Array<[string, AiReviewSection]> = [
    ["レッスン構成の安定している部分", review.stable_structure],
    ["毎回変わりやすい部分", review.variable_structure],
    ["最近改善している部分", review.recent_improvements],
    ["同じ問題が繰り返されている部分", review.repeated_challenges],
    ["よく使うブロックと使い方", review.frequently_used_blocks],
    ["使われなくなった内容", review.retired_content],
    ["時間配分の傾向", review.timing_trends],
    ["誘導セリフや改善メモの変化", review.cueing_changes],
    ["生徒ごとの反応と対応の変化", review.student_response_changes],
    ["同じ生徒に繰り返し必要な配慮", review.repeated_student_care],
  ];
  return (
    <>
      {sections.map(([title, section]) => <ReviewSection key={title} title={title} section={section} references={references} />)}
      <StudentReviews title="生徒ごとの変化と次回対応" students={review.student_reviews} references={references} />
      <ReviewSection title="接客・フォローの良い点" section={review.customer_followup_strengths} references={references} />
      <ReviewSection title="継続して通いたくなる体験づくり" section={review.retention_experience} references={references} />
      <ReviewSection title="次の数回で試すと良いこと" section={review.next_few_lessons} references={references} accent />
    </>
  );
}

function PriorityFinding({ title, finding, section, references, tone }: { title: string; finding: AiReviewFinding; section?: AiReviewSection; references: AiReviewReferenceIndex; tone: "strength" | "improvement" }) {
  return (
    <section className={`rounded-xl border p-5 ${tone === "strength" ? "border-[#cfe0cb] bg-[#f6faf3]" : "border-[#ead9bc] bg-[#fff9ea]"}`}>
      <div className="flex items-center gap-2">{tone === "strength" ? <CheckCircle2 className="h-5 w-5 text-[#4f8058]" /> : <AlertTriangle className="h-5 w-5 text-[#a57238]" />}<h2 className="text-[16px] font-semibold">{title}</h2></div>
      <h3 className="mt-4 text-[17px] font-semibold">{finding.title}</h3>
      <p className="mt-2 text-[14px] leading-7 text-[#525b53]">{finding.detail}</p>
      <p className="mt-3 text-[13px] leading-6 text-[#6c746b]">{finding.reason}</p>
      {section ? <div className="mt-3 border-t border-current/10 pt-3"><p className="text-[14px] font-medium leading-6 text-[#4d594f]">{section.summary}</p>{section.details.length ? <ul className="mt-2 space-y-1.5">{section.details.map((detail, index) => <li key={index} className="flex gap-2 text-[13px] leading-6 text-[#657066]"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-current" /><span>{detail}</span></li>)}</ul> : null}<ReferenceLinks references={section.references} index={references} /></div> : null}
      <p className="mt-2 text-[13px] text-[#7a8178]">{naturalEvidenceNote(finding.evidence_count)}</p>
      <p className="mt-3 text-[13px] font-medium text-[#456d4c]">次に: {finding.next_action}</p>
      <ReferenceLinks references={finding.references} index={references} />
    </section>
  );
}

function ReviewSection({ title, section, references, accent = false }: { title: string; section: AiReviewSection; references: AiReviewReferenceIndex; accent?: boolean }) {
  return (
    <WorkspaceSection title={title}>
      <article className={`rounded-xl border p-4 sm:p-5 ${accent ? "border-[#d4e0cf] bg-[#f6faf3]" : "border-[#e5dfd5] bg-white"}`}>
        <p className="text-[15px] font-semibold leading-7 text-[#3e4940]">{section.summary}</p>
        {section.details.length ? <ul className="mt-3 space-y-2">{section.details.map((detail, index) => <li key={index} className="flex gap-2 text-[14px] leading-6 text-[#606960]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7b9b7e]" /><span>{detail}</span></li>)}</ul> : null}
        <ReferenceLinks references={section.references} index={references} />
      </article>
    </WorkspaceSection>
  );
}

function StudentReviews({ title, students, references }: { title: string; students: AiStudentReview[]; references: AiReviewReferenceIndex }) {
  return (
    <WorkspaceSection title={title} description="記録された状態と対応をもとに、次回の声かけ・配慮・フォローを生徒ごとに整理します。">
      {students.length ? <div className="grid gap-3 xl:grid-cols-2">{students.map((student) => (
        <article key={student.student_ref} className="rounded-xl border border-[#dfe5dc] bg-white p-4">
          <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f1e5] text-[#55775d]"><UserRound className="h-4 w-4" /></span><h3 className="text-[16px] font-semibold">{student.student_name}</h3></div>
          <div className="mt-4 grid gap-3 text-[13px] leading-6 text-[#5d675e]">
            <StudentLine label="当日の状態" value={student.at_the_time} />
            <StudentLine label="記録された反応" value={student.recorded_reaction} />
            <StudentLine label="講師が行った対応" value={student.instructor_response} />
            <StudentLine label="良かった対応" value={student.good_response} />
            <StudentLine label="気になった点" value={student.concerns} />
            <StudentLine label="次回の配慮" value={student.next_care} />
            <StudentLine label="声かけ案" value={student.cue_idea} />
            <StudentLine label="フォロー案" value={student.follow_up_idea} />
            <StudentLine label="継続体験の提案" value={student.experience_idea} />
          </div>
          <ReferenceLinks references={student.references} index={references} />
        </article>
      ))}</div> : <p className="rounded-xl border border-dashed border-[#dfe5dc] bg-[#fafbf8] p-4 text-[14px] text-[#6c746b]">この範囲では、生徒別に評価できる記録がありませんでした。</p>}
    </WorkspaceSection>
  );
}

function StudentLine({ label, value }: { label: string; value: string }) {
  return <div><p className="font-semibold text-[#405044]">{label}</p><p className="mt-0.5">{value || "今回は記録から確認できません"}</p></div>;
}

function ReferenceLinks({ references, index }: { references: AiReviewReference[]; index: AiReviewReferenceIndex }) {
  const items = references.map((reference) => index[reference.type]?.[reference.ref]).filter(Boolean);
  if (!items.length) return null;
  return <div className="mt-4 flex flex-wrap gap-2">{items.map((item) => <Link key={`${item.href}-${item.id}`} href={item.href} className="inline-flex items-center gap-1 rounded-lg border border-[#d4ddd0] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#456d4c] hover:bg-[#f3f8f1]">{item.label}<ArrowUpRight className="h-3 w-3" /></Link>)}</div>;
}

function naturalEvidenceNote(count: number) {
  if (count <= 0) return "今回は直接確認できる記録が少ないため、断定していません";
  if (count === 1) return "まだ1件だけの記録なので参考として確認してください";
  return `${count}件の記録で確認しています`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(value));
}
