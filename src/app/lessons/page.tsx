import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Edit3, MapPin, Plus, Search, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader, Pill, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import { lessons } from "@/components/yoga/records";

const filterItems = ["すべて", "今日", "今週", "今月", "タグで絞り込み"];

export default function LessonsPage() {
  return (
    <>
      <PageHeader title="レッスンカルテ" subtitle="各レッスンの内容・気づき・改善点を記録" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e7dfd4] bg-white/80 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[#6b7468]" />
          <Input placeholder="レッスン名、テーマ、タグで検索" className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
        </div>
        <Link
          href="/lessons/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(64,113,77,0.2)]"
        >
          <Plus className="h-4 w-4" />
          レッスンを登録
        </Link>
      </div>

      <SoftCard className="p-3.5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {filterItems.map((item, index) => (
            <Pill key={item} active={index === 0}>{item}</Pill>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {lessons.map((lesson) => (
            <article key={lesson.id} className="min-w-0 rounded-xl border border-[#eee4d8] bg-white/72 p-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[16px] font-extrabold">{lesson.title}</h2>
                  <p className="mt-1 line-clamp-1 text-[12px] font-semibold text-[#5f665c]">{lesson.theme}</p>
                </div>
                <span className="rounded-full bg-[#edf4ea] px-2.5 py-1 text-[12px] font-bold text-[#4f875a]">
                  {lesson.participants}名
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-y border-[#eee8dd] py-2 text-[12px] font-semibold">
                <Meta icon={CalendarDays} label={`${lesson.date} ${lesson.startTime}-${lesson.endTime}`} className="col-span-2" />
                <Meta icon={MapPin} label={lesson.place} />
                <Meta icon={UsersRound} label={lesson.format} />
                <Meta icon={CalendarDays} label={lesson.duration} />
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {lesson.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#dbe4d6] bg-[#f4f8f1] px-2 py-0.5 text-[11px] font-bold text-[#4f7b58]">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <Link
                  href={`/lessons/${lesson.id}`}
                  className="inline-flex h-8 items-center rounded-lg border border-[#cfe1ca] bg-[#f8fcf6] px-3 text-[12px] font-bold text-[#5d956d]"
                >
                  詳細を見る
                </Link>
                <Link
                  href={`/lessons/${lesson.id}/edit`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e7dfd4] bg-white text-[#6b7468]"
                  aria-label={`${lesson.title}を編集`}
                >
                  <Edit3 className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </SoftCard>

      <section className="mt-4 grid grid-cols-3 gap-4">
        <SoftCard className="p-3.5">
          <SectionTitle icon={CalendarDays} title="今月の記録" />
          <p className="text-[34px] font-extrabold leading-none text-[#4f875a]">32<span className="ml-1 text-sm">件</span></p>
          <p className="mt-2 text-[12px] font-semibold text-[#697467]">60分単位のレッスンを中心に記録</p>
        </SoftCard>
        <SoftCard className="p-3.5">
          <SectionTitle icon={UsersRound} title="延べ参加人数" />
          <p className="text-[34px] font-extrabold leading-none text-[#6b61b8]">256<span className="ml-1 text-sm">名</span></p>
          <p className="mt-2 text-[12px] font-semibold text-[#697467]">参加生徒の紐づきから集計</p>
        </SoftCard>
        <SoftCard className="p-3.5">
          <SectionTitle icon={Search} title="よく使うタグ" />
          <div className="mt-2 flex flex-wrap gap-2">
            {["#呼吸", "#肩こり改善", "#体幹強化", "#リラックス"].map((tag) => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>
        </SoftCard>
      </section>
    </>
  );
}

function Meta({ icon: Icon, label, className = "" }: { icon: LucideIcon; label: string; className?: string }) {
  return (
    <p className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#687266]" />
      <span className="truncate">{label}</span>
    </p>
  );
}
