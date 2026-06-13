"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Bell, CalendarDays, Home, Leaf, Menu, Settings, Sprout, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", shortLabel: "ホーム", icon: Home },
  { href: "/students", label: "生徒カルテ", shortLabel: "生徒", icon: UserRound },
  { href: "/lessons", label: "レッスンカルテ", shortLabel: "レッスン", icon: CalendarDays },
  { href: "/reports", label: "レポート", shortLabel: "レポート", icon: BarChart3 },
  { href: "/settings", label: "設定", shortLabel: "設定", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const current = navItems.find((item) => isActivePath(pathname, item.href));

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--yoga-bg)] text-[#20231e] md:min-w-[1040px]">
      <MobileTopBar title={current?.label ?? "YOGA NURTURE"} onMenuClick={() => setMobileMenuOpen(true)} />
      <MobileMenu open={mobileMenuOpen} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />
      <div className="min-h-screen md:grid md:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[196px_minmax(0,1fr)]">
        <aside className="app-sidebar sticky top-0 hidden h-screen flex-col overflow-hidden border-r border-[#e7dfd4] bg-[#fbfaf6] px-3 py-4 shadow-[8px_0_30px_rgba(111,92,71,0.06)] print:hidden md:flex">
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
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold text-[#4c514b] transition",
                    active ? "bg-[#5d956d] text-white shadow-[0_10px_22px_rgba(64,113,77,0.24)]" : "hover:bg-[#eef4eb] hover:text-[#386f4a]",
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

        <main className="min-w-0 overflow-x-hidden px-3 pb-28 pt-3 md:px-3 md:py-3 xl:px-4 print:px-0 print:py-0">
          <div className="w-full min-w-0 max-w-full overflow-x-hidden md:overflow-visible">{children}</div>
        </main>
      </div>
      <MobileBottomNav pathname={pathname} />
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/lessons" && (pathname.startsWith("/schedules") || pathname.startsWith("/templates") || pathname.startsWith("/blocks")));
}

function MobileTopBar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#e7dfd4] bg-[#fbfaf6]/95 px-4 backdrop-blur md:hidden">
      <button type="button" onClick={onMenuClick} className="flex h-9 w-9 items-center justify-center rounded-full text-[#5d6b58]" aria-label="メニューを開く">
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0 text-center">
        <div className="mx-auto flex items-center justify-center gap-1.5 text-[#4f875a]">
          <Sprout className="h-4 w-4" strokeWidth={1.7} />
          <span className="font-serif text-[13px] tracking-[0.08em]">YOGA NURTURE</span>
        </div>
        <p className="truncate text-[11px] font-bold text-[#31372f]">{title}</p>
      </div>
      <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#5d6b58]" aria-label="通知">
        <Bell className="h-5 w-5" />
      </button>
    </header>
  );
}

function MobileMenu({ open, pathname, onClose }: { open: boolean; pathname: string; onClose: () => void }) {
  return (
    <div className={cn("fixed inset-0 z-[60] md:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
      <button
        type="button"
        aria-label="メニューを閉じる"
        onClick={onClose}
        className={cn("absolute inset-0 bg-[#1e241c]/28 transition-opacity", open ? "opacity-100" : "opacity-0")}
      />
      <aside className={cn("absolute inset-y-0 left-0 w-[286px] max-w-[82vw] border-r border-[#e7dfd4] bg-[#fbfaf6] p-4 shadow-[16px_0_34px_rgba(70,58,42,0.18)] transition-transform duration-200", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#4f875a]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#b7d7b6] bg-[#f4faf2]">
              <Sprout className="h-5 w-5" />
            </span>
            <div>
              <p className="font-serif text-[14px] tracking-[0.1em]">YOGA NURTURE</p>
              <p className="text-[11px] font-bold text-[#6b7468]">メニュー</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4dbcf] bg-white text-[#5d6b58]" aria-label="閉じる">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="grid gap-2">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-2xl px-3 text-[14px] font-bold",
                  active ? "bg-[#5d956d] text-white shadow-[0_10px_22px_rgba(64,113,77,0.18)]" : "border border-[#eee4d8] bg-white/74 text-[#4c514b]",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e7dfd4] bg-[#fbfaf6]/96 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(91,76,53,0.08)] backdrop-blur md:hidden">
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold", active ? "text-[#5d956d]" : "text-[#8a8d86]")}>
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", active ? "bg-[#e3efdf]" : "bg-transparent")}>
                <Icon className="h-5 w-5" strokeWidth={1.7} />
              </span>
              {item.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
