import Link from "next/link";
import { Edit3, Plus, Search } from "lucide-react";
import { restoreStudentAction } from "@/app/students/actions";
import { Input } from "@/components/ui/input";
import { CompactEmptyState, SegmentedMetricBar, type MetricSegment } from "@/components/yoga/data-visuals";
import { StudentWorkspaceList } from "@/components/yoga/student-workspace-list";
import {
  WorkspaceAction,
  WorkspaceEmptyState,
  WorkspacePageHeader,
  WorkspaceStatus,
  WorkspaceSummaryCard,
  WorkspaceToolbar,
} from "@/components/yoga/workspace-kit";
import { getStudentWorkspace, normalizeStudentFilter, type StudentFilterKey, type StudentPortfolio, type StudentWorkspaceRow } from "@/lib/students";

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
  const workspace = await getStudentWorkspace({ search: query, filter });
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

      <StudentPortfolioOverview portfolio={workspace.portfolio} />

      {params.error ? <div className="rounded-xl border border-[#f0d0ca] bg-[#fff1ed] px-4 py-3 text-[13px] font-medium text-[#a65348]">{params.error}</div> : null}

      <WorkspaceToolbar>
        <form key={JSON.stringify([query, filter])} action="/students" className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_auto_auto] md:items-end">
          <input type="hidden" name="filter" value={filter} />
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[12px] font-semibold text-[#656c63]">生徒を検索</span>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-[#dcd6cc] bg-white px-3">
              <Search className="h-4 w-4 text-[#777e74]" />
              <Input name="q" defaultValue={query} placeholder="名前・ふりがな・年代・注意点" className="h-8 border-0 px-0 text-[14px] shadow-none focus-visible:ring-0" />
            </div>
          </label>
          <button className="h-10 rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white">検索</button>
          <Link href={buildStudentHref({}, { filter })} className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#626a60]">検索をクリア</Link>
        </form>
        <nav aria-label="生徒フィルター" className="mt-3 flex flex-wrap gap-2 border-t border-[#ece5db] pt-3">
          {filters.map((item) => (
            <Link
              key={item.key}
              href={buildStudentHref(params, { filter: item.key })}
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
        <div className="min-w-0">
          <div className="hidden md:block"><StudentWorkspaceList rows={listRows} /></div>
          <MobileStudentCards rows={workspace.students} />
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

function StudentPortfolioOverview({ portfolio }: { portfolio: StudentPortfolio }) {
  const activityColors = ["#5d8f68", "#83a985", "#b39262", "#a7aaa3"];
  const attendanceColors = ["#c2c5bf", "#9bb69a", "#6f9875", "#4f795a"];
  const activity = portfolio.activity.map((item, index): MetricSegment => ({
    label: item.label,
    value: item.count,
    color: activityColors[index],
    description: item.key === "scheduled"
      ? "未来の参加予定がある生徒"
      : item.key === "recent"
        ? "次回予定はなく、直近30日以内に受講した生徒"
        : item.key === "returning"
          ? "過去に受講があり、31日以上空いている生徒"
          : "受講記録も次回予定もない生徒",
  }));
  const attendance = portfolio.attendance.map((item, index): MetricSegment => ({
    label: item.label,
    value: item.count,
    color: attendanceColors[index],
    description: `過去受講回数 ${item.label}`,
  }));

  return (
    <section aria-labelledby="student-portfolio-title" className="min-w-0 space-y-3">
      <div>
        <h2 id="student-portfolio-title" className="text-[17px] font-semibold text-[#30372f]">生徒の状況</h2>
        <p className="mt-0.5 text-[13px] leading-5 text-[#70776e]">アクティブな登録生徒 {portfolio.activeStudents}名を、現在の動き・受講回数・フォロー観点で整理しています。</p>
      </div>
      <div className="grid min-w-0 auto-rows-fr gap-4 lg:grid-cols-2 min-[1360px]:grid-cols-3">
        <PortfolioPanel title="現在の活動状況" description="次回予定を最優先に、重複なしで分類">
          <SegmentedMetricBar segments={activity} totalLabel={`分類合計 ${portfolio.activeStudents}名`} emptyLabel="登録生徒なし" unit="名" />
        </PortfolioPanel>

        <PortfolioPanel title="過去受講回数の分布" description="実参加として記録された回数">
          <SegmentedMetricBar segments={attendance} totalLabel={`分類合計 ${portfolio.activeStudents}名`} emptyLabel="登録生徒なし" unit="名" />
        </PortfolioPanel>

        <PortfolioPanel title="フォロー・安全面" description="要フォローと注意点ありは重複します">
          <StudentSafetyOverview portfolio={portfolio} />
        </PortfolioPanel>
      </div>
    </section>
  );
}

function PortfolioPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-[#e6ded3] bg-white/82 p-4">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-[#384338]">{title}</h3>
        <p className="mt-1 text-[12px] leading-5 text-[#747b72]">{description}</p>
      </div>
      <div className="mt-auto min-w-0">{children}</div>
    </article>
  );
}

function StudentSafetyOverview({ portfolio }: { portfolio: StudentPortfolio }) {
  const total = portfolio.activeStudents;
  if (!total) return <CompactEmptyState label="登録生徒なし" />;

  const metrics = [
    { label: "要フォロー", value: portfolio.safety.followUp, href: "/students?filter=followup", color: "#bd5d50" },
    { label: "注意点あり", value: portfolio.safety.caution, href: "/students?filter=caution", color: "#7568a7" },
  ];

  return (
    <div className="min-w-0 space-y-3">
      {metrics.map((metric) => {
        const percent = Math.round((metric.value / total) * 100);
        return (
          <Link key={metric.label} href={metric.href} className="block rounded-lg px-1 py-1 hover:bg-[#f6f7f2]" title={`${metric.label}: ${metric.value}名（${percent}%）`}>
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="font-semibold text-[#4a534a]">{metric.label}</span>
              <span className="shrink-0 font-semibold text-[#5d655c]">{metric.value}名・{percent}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eceae4]">
              <span className="block h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: metric.color }} />
            </div>
          </Link>
        );
      })}
      <div className="grid grid-cols-2 gap-2 border-t border-[#ece5db] pt-3">
        <SafetyCount label="両方該当" value={portfolio.safety.both} total={total} />
        <SafetyCount label="どちらもなし" value={portfolio.safety.neither} total={total} />
      </div>
    </div>
  );
}

function SafetyCount({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = Math.round((value / total) * 100);
  return (
    <div className="rounded-lg bg-[#f7f5f0] px-3 py-2" title={`${label}: ${value}名（${percent}%）`}>
      <p className="text-[11px] font-medium text-[#70776e]">{label}</p>
      <p className="mt-0.5 text-[16px] font-semibold text-[#465047]">{value}名 <span className="text-[11px] font-medium text-[#777e74]">{percent}%</span></p>
    </div>
  );
}

function MobileStudentCards({ rows }: { rows: StudentWorkspaceRow[] }) {
  return <div className="grid gap-3 md:hidden">{rows.map((student) => <article key={student.id} className="rounded-xl border border-[#e6ded3] bg-white/84 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-[16px] font-semibold">{student.name}</h2><p className="mt-1 text-[12px] text-[#727970]">{student.kana || "ふりがな未登録"}</p></div>{student.pendingFollowUpCount ? <WorkspaceStatus tone="coral">要フォロー</WorkspaceStatus> : null}</div><p className="mt-3 line-clamp-2 text-[13px] leading-5 text-[#a65348]">注意：{student.caution || "登録なし"}</p><div className="mt-3 grid grid-cols-3 gap-2 text-[12px]"><span>受講 {student.attendedCount}回</span><span>最終 {student.lastLessonDate}</span><span>次回 {student.nextLessonDate}</span></div><div className="mt-4 flex gap-2">{student.archived ? <form action={restoreStudentAction.bind(null, student.id)}><button className="inline-flex h-9 items-center rounded-lg bg-[#5d8f68] px-3 text-[12px] font-semibold text-white">復元</button></form> : <><Link href={`/students/${student.id}`} className="inline-flex h-8 items-center rounded-lg bg-[#5d8f68] px-3 text-[12px] font-semibold text-white">詳細</Link><Link href={`/students/${student.id}/edit`} className="secondary-row-action"><Edit3 className="h-3.5 w-3.5" />編集</Link></>}</div></article>)}</div>;
}

function buildStudentHref(current: StudentSearchParams, patch: { filter?: StudentFilterKey }) {
  const query = new URLSearchParams();
  const q = current.q?.trim();
  if (q) query.set("q", q);
  const filter = patch.filter ?? normalizeStudentFilter(current.filter);
  if (filter !== "all") query.set("filter", filter);
  const value = query.toString();
  return value ? `/students?${value}` : "/students";
}
