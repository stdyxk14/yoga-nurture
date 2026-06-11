"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Home,
  Leaf,
  Settings,
  Sprout,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MentorPanel } from "@/components/yoga/mentor-panel";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: Home },
  { href: "/students", label: "生徒カルテ", icon: UserRound },
  { href: "/lessons", label: "レッスンカルテ", icon: CalendarDays },
  { href: "/reports", label: "レポート", icon: BarChart3 },
  { href: "/settings", label: "設定", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen min-w-[1180px] bg-[var(--yoga-bg)] text-[#20231e]">
      <div className="grid min-h-screen grid-cols-[190px_minmax(0,1fr)_290px] xl:grid-cols-[196px_minmax(0,1fr)_300px]">
        <aside className="sticky top-0 flex h-screen flex-col overflow-hidden border-r border-[#e7dfd4] bg-[#fbfaf6] px-3 py-4 shadow-[8px_0_30px_rgba(111,92,71,0.06)]">
          <div className="mx-auto mb-5 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#4f8b62] bg-[#f5faf3] text-[#3f8156] shadow-inner">
              <Sprout className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <div className="mt-2 text-center font-serif text-[16px] leading-5 tracking-[0.14em] text-[#3e764e]">
              YOGA
              <br />
              NURTURE
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                (item.href === "/lessons" && (pathname.startsWith("/schedules") || pathname.startsWith("/templates")));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold text-[#4c514b] transition",
                    active
                      ? "bg-[#5d956d] text-white shadow-[0_10px_22px_rgba(64,113,77,0.24)]"
                      : "hover:bg-[#eef4eb] hover:text-[#386f4a]",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pointer-events-none absolute -bottom-6 -left-7 h-80 w-64 opacity-20">
            <Leaf className="absolute bottom-4 left-10 h-28 w-28 rotate-[-32deg] text-[#83946f]" strokeWidth={1} />
            <Leaf className="absolute bottom-28 left-20 h-24 w-24 rotate-[22deg] text-[#83946f]" strokeWidth={1} />
            <Leaf className="absolute bottom-44 left-2 h-20 w-20 rotate-[-12deg] text-[#83946f]" strokeWidth={1} />
            <div className="absolute bottom-1 left-20 h-72 w-px -rotate-[24deg] bg-[#83946f]" />
          </div>
        </aside>

        <main className="min-w-0 px-3 py-3 xl:px-4">
          <div className="w-full min-w-0">{children}</div>
        </main>

        <MentorPanel />
      </div>
    </div>
  );
}
