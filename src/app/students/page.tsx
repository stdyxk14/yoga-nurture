import Link from "next/link";
import { AlertCircle, Edit3, Plus, Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { students } from "@/components/yoga/records";

const filterItems = ["すべて", "最近受講", "要フォロー", "注意点あり"];

export default function StudentsPage() {
  return (
    <>
      <PageHeader title="生徒カルテ" subtitle="生徒一人ひとりの状態・記録を管理" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e7dfd4] bg-white/80 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[#6b7468]" />
          <Input placeholder="生徒名、年代、経験、注意点で検索" className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
        </div>
        <Link href="/students/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
          <Plus className="h-4 w-4" />
          生徒を登録
        </Link>
      </div>

      <SoftCard className="p-3.5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {filterItems.map((item, index) => <Pill key={item} active={index === 0}>{item}</Pill>)}
        </div>

        <div className="grid gap-2">
          {students.map((student) => (
            <div key={student.id} className="grid min-w-0 grid-cols-[170px_74px_70px_minmax(90px,0.9fr)_minmax(92px,1fr)_minmax(90px,1fr)_70px_42px_118px] items-center gap-2 rounded-xl border border-[#eee4d8] bg-white/70 px-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf4ea] text-[#4f875a]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-extrabold">{student.name}</p>
                  <p className="truncate text-[11px] font-semibold text-[#798176]">{student.kana}</p>
                </div>
              </div>
              <p className="text-[13px] font-bold">{student.ageGroup}</p>
              <p className="text-[13px] font-bold">{student.gender}</p>
              <p className="line-clamp-2 text-[12px] font-medium leading-5">{student.experience}</p>
              <p className="line-clamp-2 text-[12px] font-medium leading-5">{student.caution}</p>
              <p className="line-clamp-2 text-[12px] font-medium leading-5 text-[#5f665c]">{student.memo}</p>
              <p className="text-[12px] font-bold">{student.lastLessonDate}</p>
              <p className="text-[12px] font-bold text-[#4f875a]">{student.linkedLessonCount}件</p>
              <div className="flex justify-end gap-1.5">
                <Link href={`/students/${student.id}`} className="inline-flex h-8 items-center whitespace-nowrap rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-2.5 text-[12px] font-bold text-[#5d956d]">
                  詳細を見る
                </Link>
                <Link href={`/students/${student.id}/edit`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e7dfd4] bg-white text-[#6b7468]" aria-label={`${student.name}を編集`}>
                  <Edit3 className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </SoftCard>

      <section className="mt-4 grid grid-cols-3 gap-4">
        <SoftCard className="p-3.5">
          <SectionTitle icon={UserRound} title="登録生徒" />
          <p className="text-[34px] font-extrabold leading-none text-[#4f875a]">{students.length}<span className="ml-1 text-sm">名</span></p>
          <p className="mt-2 text-[12px] font-semibold text-[#697467]">年代・性別を属性分析に使う想定</p>
        </SoftCard>
        <SoftCard className="p-3.5">
          <SectionTitle icon={AlertCircle} title="要フォロー" />
          <p className="text-[34px] font-extrabold leading-none text-[#ec6f5d]">2<span className="ml-1 text-sm">名</span></p>
          <p className="mt-2 text-[12px] font-semibold text-[#697467]">レッスン後コメントから確認</p>
        </SoftCard>
        <SoftCard className="p-3.5">
          <SectionTitle icon={AlertCircle} title="注意点あり" />
          <p className="text-[34px] font-extrabold leading-none text-[#7a6cc4]">5<span className="ml-1 text-sm">名</span></p>
          <p className="mt-2 text-[12px] font-semibold text-[#697467]">レッスン前に注意点を確認</p>
        </SoftCard>
      </section>
    </>
  );
}
