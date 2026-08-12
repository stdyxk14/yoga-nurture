import Link from "next/link";
import { ArchiveRestore, CalendarCheck, Edit3, Plus, Search, ShieldAlert, UserRound, UsersRound } from "lucide-react";
import { restoreStudentAction } from "@/app/students/actions";
import { Input } from "@/components/ui/input";
import { StudentWorkspaceList } from "@/components/yoga/student-workspace-list";
import {
  WorkspaceAction,
  WorkspaceEmptyState,
  WorkspacePageHeader,
  WorkspaceSection,
  WorkspaceStatus,
  WorkspaceSummaryCard,
  WorkspaceToolbar,
} from "@/components/yoga/workspace-kit";
import { getStudentWorkspace, normalizeStudentFilter, type StudentFilterKey, type StudentRecentEntry, type StudentWorkspaceRow } from "@/lib/students";

type StudentSearchParams = { q?: string; filter?: string; selected?: string; error?: string };

const filters: Array<{ key: StudentFilterKey; label: string }> = [
  { key: "all", label: "すべて" },
  { key: "recent", label: "最近受講" },
  { key: "followup", label: "要フォロー" },
  { key: "caution", label: "注意点あり" },
  { key: "scheduled", label: "次回予定あり" },
  { key: "no-attendance", label: "受講なし" },
  { key: "archived", label: "アーカイブ済み" },
];

export const dynamic = "force-dynamic";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<StudentSearchParams> }) {
  const params = await searchParams;
  const filter = normalizeStudentFilter(params.filter);
  const query = params.q ?? "";
  const workspace = await getStudentWorkspace({ search: query, filter, selectedId: params.selected });
  const selected = workspace.selected;
  const selectHrefs = Object.fromEntries(workspace.students.map((student) => [student.id, buildStudentHref(params, { selected: student.id, filter })]));
  const listRows = workspace.students.map(({ id, name, kana, caution, pendingFollowUpCount, attendedCount, lastLessonDate, nextLessonDate, archived }) => ({ id, name, kana, caution, pendingFollowUpCount, attendedCount, lastLessonDate, nextLessonDate: nextLessonDate ?? "未定", archived }));

  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-5">
      <WorkspacePageHeader
        eyebrow="STUDENT WORKSPACE"
        title="生徒カルテ"
        description="安全面と次回フォローを先に確認し、必要なときだけプロフィールや履歴へ進めます。"
        actions={<WorkspaceAction href="/students/new" icon={Plus} primary>生徒を登録</WorkspaceAction>}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <WorkspaceSummaryCard label="登録生徒" value={`${workspace.summary.activeStudents}名`} detail="アクティブな生徒" href="/students?filter=all" active={filter === "all"} />
        <WorkspaceSummaryCard label="要フォロー" value={`${workspace.summary.followUpStudents}名`} detail="未完了フォローあり" tone="coral" href="/students?filter=followup" active={filter === "followup"} />
        <WorkspaceSummaryCard label="注意点あり" value={`${workspace.summary.cautionStudents}名`} detail="安全面の注意あり" tone="purple" href="/students?filter=caution" active={filter === "caution"} />
        <WorkspaceSummaryCard label="30日以内に受講" value={`${workspace.summary.recentStudents}名`} detail="実参加のdistinct生徒" tone="green" href="/students?filter=recent" active={filter === "recent"} />
        <WorkspaceSummaryCard label="次回予定あり" value={`${workspace.summary.nextScheduledStudents}名`} detail="未来予定に参加登録あり" tone="sand" href="/students?filter=scheduled" active={filter === "scheduled"} />
      </section>

      {params.error ? <div className="rounded-xl border border-[#f0d0ca] bg-[#fff1ed] px-4 py-3 text-[13px] font-medium text-[#a65348]">{params.error}</div> : null}

      <WorkspaceToolbar>
        <form action="/students" className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_auto_auto] md:items-end">
          <input type="hidden" name="filter" value={filter} />
          {selected ? <input type="hidden" name="selected" value={selected.id} /> : null}
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[12px] font-semibold text-[#656c63]">生徒を検索</span>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-[#dcd6cc] bg-white px-3">
              <Search className="h-4 w-4 text-[#777e74]" />
              <Input name="q" defaultValue={query} placeholder="名前・ふりがな・年代・注意点" className="h-8 border-0 px-0 text-[14px] shadow-none focus-visible:ring-0" />
            </div>
          </label>
          <button className="h-10 rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white">検索</button>
          <Link href={buildStudentHref({}, { filter, selected: selected?.id })} className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60]">検索をクリア</Link>
        </form>
        <nav aria-label="生徒フィルター" className="mt-3 flex flex-wrap gap-2 border-t border-[#ece5db] pt-3">
          {filters.map((item) => (
            <Link
              key={item.key}
              href={buildStudentHref(params, { filter: item.key, selected: selected?.id })}
              aria-current={filter === item.key ? "page" : undefined}
              className={filter === item.key ? "inline-flex h-9 items-center rounded-lg bg-[#e6f0e3] px-3 text-[13px] font-semibold text-[#386b46]" : "inline-flex h-9 items-center rounded-lg border border-[#ddd6cc] bg-white px-3 text-[13px] font-semibold text-[#626a60] hover:bg-[#f7f4ef]"}
            >
              {item.label}
            </Link>
          ))}
          <span className="ml-auto self-center text-[13px] text-[#737a70]">検索結果 {workspace.resultCount}名</span>
        </nav>
      </WorkspaceToolbar>

      {workspace.students.length ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] xl:items-start">
          <div className="min-w-0">
            <div className="hidden md:block"><StudentWorkspaceList rows={listRows} selectedId={selected?.id} selectHrefs={selectHrefs} /></div>
            <MobileStudentCards rows={workspace.students} selectedId={selected?.id} params={params} filter={filter} />
          </div>
          {selected ? <StudentPreview student={selected} /> : null}
        </div>
      ) : (
        <WorkspaceEmptyState
          title={filter === "archived" ? "アーカイブ済みの生徒はいません" : "該当する生徒はいません"}
          description="検索条件またはフィルターを変更してください。新しい生徒は登録ボタンから追加できます。"
          action={<WorkspaceAction href="/students/new" icon={Plus} primary>生徒を登録</WorkspaceAction>}
        />
      )}
    </div>
  );
}

function StudentPreview({ student }: { student: StudentWorkspaceRow }) {
  const observations = student.recentEntries.filter((entry) => entry.condition.trim() || entry.memo.trim()).slice(0, 3);
  const histories = student.recentEntries.slice(0, 3);
  return (
    <aside className="min-w-0 rounded-xl border border-[#e5ddd2] bg-white/86 shadow-[0_5px_18px_rgba(91,76,53,0.045)] xl:sticky xl:top-4">
      <div className="border-b border-[#ece5db] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8f1e5] text-[#4f8058]"><UserRound className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1"><h2 className="truncate text-[19px] font-semibold">{student.name}</h2><p className="mt-1 text-[13px] text-[#70776e]">{student.ageGroup || "未登録"}・{student.gender || "未登録"}</p></div>
          {student.archived ? <WorkspaceStatus>アーカイブ済み</WorkspaceStatus> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {student.archived ? <form action={restoreStudentAction.bind(null, student.id)}><button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#5d8f68] px-3 text-[12px] font-semibold text-white"><ArchiveRestore className="h-4 w-4" />アーカイブ解除</button></form> : <><Link href={`/students/${student.id}/edit`} className="secondary-row-action"><Edit3 className="h-3.5 w-3.5" />編集</Link><Link href={`/students/${student.id}`} className="inline-flex h-8 items-center rounded-lg bg-[#5d8f68] px-3 text-[12px] font-semibold text-white">詳細を開く</Link></>}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <PreviewPriority icon={ShieldAlert} title="ケガ・安全上の注意" value={student.caution || "未登録"} tone="coral" />
        <PreviewPriority icon={CalendarCheck} title="未完了フォロー" value={student.pendingFollowUps.length ? student.pendingFollowUps.map((entry) => entry.nextFollow).join("／") : "なし"} tone="sand" />
        <div className="grid grid-cols-2 gap-2">
          <PreviewDatum label="前回の様子" value={student.lastObservation || "記録なし"} />
          <PreviewDatum label="次回予定" value={student.nextLessonDate || "未定"} />
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-[#535b52]">直近の参加状況</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">{histories.length ? histories.map((entry) => <AttendanceStatus key={`${entry.recordId}-${entry.dateIso}`} entry={entry} />) : <span className="text-[13px] text-[#777e74]">記録なし</span>}</div>
        </div>
      </div>

      <div className="border-t border-[#ece5db] p-4">
        <h3 className="text-[14px] font-semibold">補助情報</h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
          <PreviewDatum label="経験" value={student.experience || "未登録"} />
          <PreviewDatum label="通常メモ" value={student.memo || "未登録"} />
          <PreviewDatum label="受講回数" value={`${student.attendedCount}回`} />
          <PreviewDatum label="キャンセル" value={`${student.cancelCount}回`} />
          <PreviewDatum label="無断欠席" value={`${student.noShowCount}回`} />
          <PreviewDatum label="キャンセル率" value={student.recentEntries.length ? `${student.cancelRate}%` : "データなし"} />
        </dl>
      </div>

      <div className="grid gap-4 border-t border-[#ece5db] p-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <PreviewHistory title="最近の観察メモ" entries={observations} observation />
        <PreviewHistory title="最近のレッスン履歴" entries={histories} />
      </div>
    </aside>
  );
}

function PreviewPriority({ icon: Icon, title, value, tone }: { icon: typeof ShieldAlert; title: string; value: string; tone: "coral" | "sand" }) {
  return <section className={tone === "coral" ? "rounded-lg border border-[#f0d0ca] bg-[#fff4f0] p-3" : "rounded-lg border border-[#ead9bc] bg-[#fff9ec] p-3"}><div className="flex items-center gap-2"><Icon className={tone === "coral" ? "h-4 w-4 text-[#b65a4d]" : "h-4 w-4 text-[#8b704c]"} /><h3 className="text-[13px] font-semibold">{title}</h3></div><p className="mt-1.5 text-[13px] leading-6 text-[#4e554d]">{value}</p></section>;
}

function PreviewDatum({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[12px] font-medium text-[#7a8177]">{label}</p><p className="mt-0.5 break-words text-[13px] leading-5 text-[#3f463e]">{value}</p></div>;
}

function PreviewHistory({ title, entries, observation = false }: { title: string; entries: StudentRecentEntry[]; observation?: boolean }) {
  return <section><h3 className="text-[13px] font-semibold">{title}</h3>{entries.length ? <ol className="mt-2 space-y-2">{entries.map((entry) => <li key={`${title}-${entry.recordId}-${entry.dateIso}`} className="rounded-lg bg-[#f7f5f0] p-2.5"><p className="text-[12px] font-medium text-[#4f8058]">{entry.date}・{entry.lessonName}</p><p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#5f675d]">{observation ? entry.condition || entry.memo || "記録なし" : attendanceLabel(entry.attendanceStatus)}</p></li>)}</ol> : <p className="mt-2 text-[13px] text-[#777e74]">記録なし</p>}</section>;
}

function AttendanceStatus({ entry }: { entry: StudentRecentEntry }) {
  const tone = entry.attendanceStatus === "present" ? "green" : entry.attendanceStatus === "cancelled" ? "sand" : "coral";
  return <WorkspaceStatus tone={tone}>{entry.date.replace(/\d{4}年/, "")} {attendanceLabel(entry.attendanceStatus)}</WorkspaceStatus>;
}

function MobileStudentCards({ rows, selectedId, params, filter }: { rows: StudentWorkspaceRow[]; selectedId?: string; params: StudentSearchParams; filter: StudentFilterKey }) {
  return <div className="grid gap-3 md:hidden">{rows.map((student) => <article key={student.id} className={student.id === selectedId ? "rounded-xl border border-[#aecaab] bg-[#f2f7ef] p-4" : "rounded-xl border border-[#e6ded3] bg-white/84 p-4"}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-[16px] font-semibold">{student.name}</h2><p className="mt-1 text-[12px] text-[#727970]">{student.ageGroup}・{student.gender}</p></div>{student.pendingFollowUpCount ? <WorkspaceStatus tone="coral">要フォロー</WorkspaceStatus> : null}</div><p className="mt-3 line-clamp-2 text-[13px] leading-5 text-[#a65348]">注意：{student.caution || "登録なし"}</p><div className="mt-3 grid grid-cols-3 gap-2 text-[12px]"><span>受講 {student.attendedCount}回</span><span>最終 {student.lastLessonDate}</span><span>次回 {student.nextLessonDate}</span></div><div className="mt-4 flex gap-2">{student.archived ? <form action={restoreStudentAction.bind(null, student.id)}><button className="inline-flex h-9 items-center rounded-lg bg-[#5d8f68] px-3 text-[12px] font-semibold text-white">復元</button></form> : <><Link href={buildStudentHref(params, { filter, selected: student.id })} className="secondary-row-action">概要を選択</Link><Link href={`/students/${student.id}`} className="inline-flex h-8 items-center rounded-lg bg-[#5d8f68] px-3 text-[12px] font-semibold text-white">詳細</Link></>}</div></article>)}</div>;
}

function buildStudentHref(current: StudentSearchParams, patch: { filter?: StudentFilterKey; selected?: string }) {
  const query = new URLSearchParams();
  const q = current.q?.trim();
  if (q) query.set("q", q);
  const filter = patch.filter ?? normalizeStudentFilter(current.filter);
  if (filter !== "all") query.set("filter", filter);
  const selected = patch.selected ?? current.selected;
  if (selected) query.set("selected", selected);
  const value = query.toString();
  return value ? `/students?${value}` : "/students";
}

function attendanceLabel(status: StudentRecentEntry["attendanceStatus"]) { return status === "present" ? "参加" : status === "cancelled" ? "キャンセル" : "無断欠席"; }
