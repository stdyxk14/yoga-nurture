import Link from "next/link";
import { AlertCircle, Edit3, Plus, Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import type { StudentRecord } from "@/components/yoga/records";
import { getStudents } from "@/lib/students";

const filterItems = ["すべて", "最近受講", "要フォロー", "注意点あり"];

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await getStudents();
  const cautionCount = students.filter((student) => student.caution).length;

  return (
    <>
      <div className="md:hidden">
        <MobileStudents students={students} />
      </div>

      <div className="hidden md:block">
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

          {students.length ? (
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
          ) : (
            <EmptyStudents />
          )}
        </SoftCard>

        <section className="mt-4 grid grid-cols-3 gap-4">
          <SoftCard className="p-3.5">
            <SectionTitle icon={UserRound} title="登録生徒" />
            <p className="text-[34px] font-extrabold leading-none text-[#4f875a]">{students.length}<span className="ml-1 text-sm">名</span></p>
            <p className="mt-2 text-[12px] font-semibold text-[#697467]">年代・性別を属性分析に使う想定</p>
          </SoftCard>
          <SoftCard className="p-3.5">
            <SectionTitle icon={AlertCircle} title="要フォロー" />
            <p className="text-[34px] font-extrabold leading-none text-[#ec6f5d]">{cautionCount}<span className="ml-1 text-sm">名</span></p>
            <p className="mt-2 text-[12px] font-semibold text-[#697467]">レッスン後コメントから確認</p>
          </SoftCard>
          <SoftCard className="p-3.5">
            <SectionTitle icon={AlertCircle} title="注意点あり" />
            <p className="text-[34px] font-extrabold leading-none text-[#7a6cc4]">{cautionCount}<span className="ml-1 text-sm">名</span></p>
            <p className="mt-2 text-[12px] font-semibold text-[#697467]">レッスン前に注意点を確認</p>
          </SoftCard>
        </section>
      </div>
    </>
  );
}

function EmptyStudents() {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#5d956d]">
        <UserRound className="h-6 w-6" />
      </div>
      <p className="mt-3 text-[15px] font-extrabold">まだ生徒が登録されていません</p>
      <p className="mt-1 text-[12px] font-semibold text-[#6b7468]">最初の生徒カルテを登録すると、ここに一覧表示されます。</p>
      <Link href="/students/new" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white">
        <Plus className="h-4 w-4" />
        生徒を登録
      </Link>
    </div>
  );
}

function MobileStudents({ students }: { students: StudentRecord[] }) {
  return (
    <div className="mx-auto max-w-[430px] space-y-4 overflow-x-hidden">
      <div className="rounded-[24px] border border-[#eee4d8] bg-white/82 p-4 shadow-[0_12px_26px_rgba(122,104,80,0.08)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-normal">生徒カルテ</h1>
            <p className="mt-1 text-[12px] font-semibold text-[#6d7469]">状態・注意点・レッスン後メモを確認</p>
          </div>
          <Link href="/students/new" className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-[#5d956d] px-3 text-[12px] font-bold text-white">
            <Plus className="h-4 w-4" />
            登録
          </Link>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-[#e7dfd4] bg-[#fffdf8] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[#6b7468]" />
          <Input placeholder="名前・年代・注意点で検索" className="h-8 min-w-0 border-0 bg-transparent px-0 text-[13px] shadow-none focus-visible:ring-0" />
        </div>
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {filterItems.map((item, index) => (
            <button key={item} className={`h-8 shrink-0 rounded-full px-3 text-[12px] font-bold ${index === 0 ? "bg-[#7fa06f] text-white" : "border border-[#e7dfd4] bg-white/80 text-[#5f665c]"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {students.length ? students.map((student) => (
          <article key={student.id} className="rounded-[22px] border border-[#eee4d8] bg-white/86 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.07)]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf4ea] text-[#4f875a]">
                <UserRound className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-[16px] font-extrabold">{student.name}</h2>
                    <p className="text-[11px] font-semibold text-[#798176]">{student.kana}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#f1f6ee] px-2.5 py-1 text-[11px] font-bold text-[#4f875a]">{student.ageGroup}・{student.gender}</span>
                </div>
                <div className="mt-3 grid gap-2 text-[12px] font-semibold leading-5 text-[#5f665c]">
                  <p className="line-clamp-2"><span className="text-[#3f5f45]">経験：</span>{student.experience}</p>
                  <p className="line-clamp-2"><span className="text-[#c75d52]">注意：</span>{student.caution}</p>
                  <p className="line-clamp-2"><span className="text-[#6b5ba7]">メモ：</span>{student.memo}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#faf7ef] px-3 py-2 text-[11px] font-bold text-[#667061]">
              <span>最終受講 {student.lastLessonDate}</span>
              <span>{student.linkedLessonCount}件のレッスン</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href={`/students/${student.id}`} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#cfe1ca] bg-[#f8fcf6] text-[13px] font-bold text-[#5d956d]">
                詳細を見る
              </Link>
              <Link href={`/students/${student.id}/edit`} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#e7dfd4] bg-white text-[13px] font-bold text-[#6b7468]">
                編集
              </Link>
            </div>
          </article>
        )) : <EmptyStudents />}
      </div>
    </div>
  );
}
