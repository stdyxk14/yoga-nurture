"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, CalendarDays, Home, Leaf, Menu, Search, Settings, Sprout, UserRound, X } from "lucide-react";
import { CommandPalette } from "@/components/yoga/command-palette";
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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const current = navItems.find((item) => isActivePath(pathname, item.href));
  const isPrintRoute = pathname?.endsWith("/script/print");
  const isProtectedScriptRoute = pathname?.endsWith("/script");

  const handleCommandPaletteOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setCommandPaletteOpen(true);
      return;
    }
    setCommandPaletteOpen(false);
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, []);

  if (pathname === "/login" || isPrintRoute) {
    return <>{children}</>;
  }

  return (
    <div className="yn-app min-h-screen max-w-full overflow-x-clip bg-[var(--yoga-bg)] text-[#20231e]">
      <MobileTopBar title={current?.label ?? "YOGA NURTURE"} onMenuClick={() => setMobileMenuOpen(true)} />
      <MobileMenu open={mobileMenuOpen} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />
      <div
        className={cn(
          "min-h-screen min-w-0 md:grid md:grid-cols-[var(--app-sidebar-width)_minmax(0,1fr)]",
          isProtectedScriptRoute
            ? "md:[--app-sidebar-width:176px] xl:[--app-sidebar-width:196px]"
            : "md:[--app-sidebar-width:80px] xl:[--app-sidebar-width:196px]",
        )}
      >
        <DesktopSidebar pathname={pathname} compact={!isProtectedScriptRoute} onSearch={() => handleCommandPaletteOpenChange(true)} />

        <main
          className={cn(
            "min-w-0 max-w-full overflow-x-clip pb-28 pt-3 print:px-0 print:py-0 md:pb-4",
            isProtectedScriptRoute
              ? "px-3 md:px-3 md:py-3 xl:px-4"
              : "px-3 md:px-4 md:py-4 xl:px-5 min-[1400px]:px-6",
          )}
        >
          <div className={cn("w-full min-w-0 max-w-full", !isProtectedScriptRoute && "mx-auto max-w-[1480px]")}>{children}</div>
        </main>
      </div>
      <MobileBottomNav pathname={pathname} />
      <CommandPalette open={commandPaletteOpen} onOpenChange={handleCommandPaletteOpenChange} />
    </div>
  );
}

function DesktopSidebar({ pathname, compact, onSearch }: { pathname: string; compact: boolean; onSearch: () => void }) {
  return (
    <aside
      className={cn(
        "app-sidebar sticky top-0 hidden h-screen min-w-0 flex-col overflow-hidden border-r border-[#e5ded3] bg-[#fbfaf6] py-4 shadow-[6px_0_24px_rgba(111,92,71,0.045)] print:hidden md:flex",
        compact ? "px-2 xl:px-3" : "px-3",
      )}
    >
      <div className={cn("mb-5 flex flex-col items-center", compact && "xl:mb-5")}>
        <div className={cn("flex items-center justify-center rounded-full border border-[#8eb799] bg-[#f5faf3] text-[#3f8156]", compact ? "h-11 w-11 xl:h-14 xl:w-14 xl:border-2" : "h-14 w-14 border-2")}>
          <Sprout className={cn("h-6 w-6", compact ? "xl:h-8 xl:w-8" : "h-8 w-8")} strokeWidth={1.5} />
        </div>
        <div className={cn("mt-2 text-center font-serif leading-5 tracking-[0.12em] text-[#3e764e]", compact ? "hidden text-[16px] xl:block" : "text-[16px]")}>YOGA<br />NURTURE</div>
      </div>

      <button
        type="button"
        onClick={onSearch}
        title="全体検索（Ctrl / Cmd + K）"
        className={cn(
          "mb-4 flex w-full rounded-xl border border-[#dedbd2] bg-white/78 font-semibold text-[#59645a] transition hover:border-[#c9d8c5] hover:bg-[#eef4eb] hover:text-[#386f4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76] focus-visible:ring-offset-2",
          compact
            ? "min-h-12 flex-col items-center justify-center gap-1 px-1 text-[12px] xl:h-10 xl:min-h-0 xl:flex-row xl:justify-start xl:gap-2.5 xl:px-3 xl:text-[13px]"
            : "h-10 items-center gap-2.5 px-3 text-[13px]",
        )}
        aria-label="全体検索を開く"
      >
        <Search className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        <span>検索</span>
        <kbd className={cn("ml-auto rounded border border-[#ddd9d0] bg-[#f7f5f0] px-1.5 py-0.5 text-[9px] font-semibold text-[#777d75]", compact && "hidden xl:inline")}>⌘ / Ctrl K</kbd>
      </button>

      <nav className="space-y-2" aria-label="メインナビゲーション">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={compact ? item.label : undefined}
              className={cn(
                "flex rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76] focus-visible:ring-offset-2",
                compact
                  ? "min-h-14 flex-col items-center justify-center gap-1 px-1 text-[12px] xl:min-h-11 xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-[14px]"
                  : "h-11 items-center gap-3 px-3 text-[14px] whitespace-nowrap",
                active ? "bg-[#5d8f68] text-white shadow-[0_5px_14px_rgba(64,113,77,0.16)]" : "text-[#4c514b] hover:bg-[#eef4eb] hover:text-[#386f4a]",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.7} aria-hidden="true" />
              {compact ? (
                <>
                  <span className="xl:hidden">{item.shortLabel}</span>
                  <span className="hidden xl:inline">{item.label}</span>
                </>
              ) : (
                <span>{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("pointer-events-none absolute -bottom-6 -left-7 h-80 w-64 opacity-[0.14]", compact && "hidden xl:block")} aria-hidden="true">
        <Leaf className="absolute bottom-4 left-10 h-28 w-28 rotate-[-32deg] text-[#83946f]" strokeWidth={1} />
        <Leaf className="absolute bottom-28 left-20 h-24 w-24 rotate-[22deg] text-[#83946f]" strokeWidth={1} />
        <Leaf className="absolute bottom-44 left-2 h-20 w-20 rotate-[-12deg] text-[#83946f]" strokeWidth={1} />
        <div className="absolute bottom-1 left-20 h-72 w-px -rotate-[24deg] bg-[#83946f]" />
      </div>
    </aside>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/lessons" && (pathname.startsWith("/schedules") || pathname.startsWith("/templates") || pathname.startsWith("/blocks")));
}

function MobileTopBar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#e7dfd4] bg-[#fbfaf6]/96 px-4 backdrop-blur print:hidden md:hidden">
      <button type="button" onClick={onMenuClick} className="flex h-10 w-10 items-center justify-center rounded-lg text-[#5d6b58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]" aria-label="メニューを開く">
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0 text-center">
        <div className="mx-auto flex items-center justify-center gap-1.5 text-[#4f875a]">
          <Sprout className="h-4 w-4" strokeWidth={1.7} />
          <span className="font-serif text-[13px] tracking-[0.08em]">YOGA NURTURE</span>
        </div>
        <p className="truncate text-[12px] font-semibold text-[#31372f]">{title}</p>
      </div>
      <span className="h-10 w-10" aria-hidden="true" />
    </header>
  );
}

function MobileMenu({ open, pathname, onClose }: { open: boolean; pathname: string; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-[60] print:hidden md:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <button type="button" aria-label="メニューを閉じる" onClick={onClose} tabIndex={open ? 0 : -1} className={cn("absolute inset-0 bg-[#1e241c]/28 transition-opacity", open ? "opacity-100" : "opacity-0")} />
      <aside className={cn("absolute inset-y-0 left-0 w-[286px] max-w-[82vw] border-r border-[#e7dfd4] bg-[#fbfaf6] p-4 shadow-[16px_0_34px_rgba(70,58,42,0.18)] transition-transform duration-200", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#4f875a]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#b7d7b6] bg-[#f4faf2]"><Sprout className="h-5 w-5" /></span>
            <div><p className="font-serif text-[14px] tracking-[0.1em]">YOGA NURTURE</p><p className="text-[12px] font-semibold text-[#6b7468]">メニュー</p></div>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e4dbcf] bg-white text-[#5d6b58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]" aria-label="閉じる"><X className="h-5 w-5" /></button>
        </div>
        <nav className="grid gap-2" aria-label="モバイルメニュー">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose} tabIndex={open ? 0 : -1} aria-current={active ? "page" : undefined} className={cn("flex h-12 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]", active ? "bg-[#5d8f68] text-white" : "border border-[#eee4d8] bg-white/74 text-[#4c514b]")}>
                <Icon className="h-5 w-5" aria-hidden="true" />{item.label}
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e7dfd4] bg-[#fbfaf6]/96 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(91,76,53,0.08)] backdrop-blur print:hidden md:hidden" aria-label="下部ナビゲーション">
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center justify-center gap-1 rounded-xl text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]", active ? "text-[#5d8f68]" : "text-[#787d75]")}>
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", active ? "bg-[#e3efdf]" : "bg-transparent")}><Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" /></span>
              {item.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
