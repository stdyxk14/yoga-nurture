"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, CalendarDays, Flower2, Home, Menu, Search, Settings, Sparkles, UserRound, X } from "lucide-react";
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
    <div className={cn("yn-app min-h-screen max-w-full overflow-x-clip text-[#20231e]", !isProtectedScriptRoute && "liquid-workspace")}>
      <MobileTopBar title={current?.label ?? "YOGA NURTURE"} onMenuClick={() => setMobileMenuOpen(true)} />
      <MobileMenu open={mobileMenuOpen} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />
      <div
        className={cn(
          "min-h-screen min-w-0 md:grid md:grid-cols-[var(--app-sidebar-width)_minmax(0,1fr)]",
          isProtectedScriptRoute
            ? "md:[--app-sidebar-width:176px] xl:[--app-sidebar-width:196px]"
            : "md:[--app-sidebar-width:104px] xl:[--app-sidebar-width:232px]",
        )}
      >
        <DesktopSidebar pathname={pathname} compact={!isProtectedScriptRoute} onSearch={() => handleCommandPaletteOpenChange(true)} />

        <main
          className={cn(
            "relative z-10 min-w-0 max-w-full overflow-x-clip pb-28 pt-3 print:px-0 print:py-0 md:pb-5",
            isProtectedScriptRoute
              ? "px-3 md:px-3 md:py-3 xl:px-4"
              : "px-3 md:px-3 md:py-3 md:pl-0 xl:px-5 xl:pl-0 min-[1400px]:pr-6",
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
        "app-sidebar liquid-sidebar sticky top-3 z-20 m-3 mr-0 hidden h-[calc(100dvh-1.5rem)] min-w-0 flex-col overflow-hidden rounded-[26px] py-4 print:hidden md:flex",
        compact ? "px-2.5 xl:px-3.5" : "px-3",
      )}
    >
      <div className={cn("mb-5 flex flex-col items-center", compact && "xl:mb-6")}>
        <div className={cn("relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,.92),rgba(224,240,222,.68))] text-[#3f7650] shadow-[inset_0_1px_0_rgba(255,255,255,.96),0_10px_28px_rgba(80,116,89,.16)]", compact ? "h-12 w-12 xl:h-14 xl:w-14" : "h-14 w-14")}>
          <span className="absolute inset-1 rounded-xl border border-[#bdd7bd]/55" aria-hidden="true" />
          <Flower2 className={cn("relative h-6 w-6", compact ? "xl:h-7 xl:w-7" : "h-7 w-7")} strokeWidth={1.45} />
        </div>
        <div className={cn("mt-2.5 text-center text-[13px] font-black leading-4 tracking-[0.16em] text-[#3b6148]", compact ? "hidden xl:block" : "block")}>
          YOGA <span className="text-[#7b6d9d]">NURTURE</span>
        </div>
        <p className={cn("mt-1 text-[10px] font-bold tracking-[0.08em] text-[#7a817a]", compact && "hidden xl:block")}>TEACHING WORKSPACE</p>
      </div>

      <button
        type="button"
        onClick={onSearch}
        title="全体検索（Ctrl / Cmd + K）"
        className={cn(
          "liquid-control liquid-lift mb-4 flex w-full rounded-2xl font-semibold text-[#536159] hover:border-white hover:bg-white/75 hover:text-[#386f4a] focus-visible:outline-none",
          compact
            ? "min-h-12 flex-col items-center justify-center gap-1 px-1 text-[12px] xl:h-10 xl:min-h-0 xl:flex-row xl:justify-start xl:gap-2.5 xl:px-3 xl:text-[13px]"
            : "h-10 items-center gap-2.5 px-3 text-[13px]",
        )}
        aria-label="全体検索を開く"
      >
        <Search className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        <span>検索</span>
        <kbd className={cn("ml-auto rounded-lg border border-white/80 bg-white/56 px-1.5 py-0.5 text-[10px] font-semibold text-[#777d75] shadow-sm", compact && "hidden xl:inline")}>⌘ / Ctrl K</kbd>
      </button>

      <nav className="space-y-2.5" aria-label="メインナビゲーション">
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
                "liquid-lift flex rounded-2xl border font-semibold focus-visible:outline-none",
                compact
                  ? "min-h-14 flex-col items-center justify-center gap-1 px-1 text-[12px] xl:min-h-11 xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-[14px]"
                  : "h-11 items-center gap-3 px-3 text-[14px]",
                active
                  ? "border-white/80 bg-[linear-gradient(145deg,rgba(231,244,229,.98),rgba(255,255,255,.72))] text-[#315f42] shadow-[inset_0_1px_0_rgba(255,255,255,.98),inset_0_0_20px_rgba(185,222,192,.26),0_9px_24px_rgba(63,104,74,.13)]"
                  : "border-transparent text-[#4d5951] hover:border-white/70 hover:bg-white/44 hover:text-[#356946]",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.7} aria-hidden="true" />
              <span className={cn(compact && "xl:hidden")}>{item.shortLabel}</span>
              {compact ? <span className="hidden xl:inline">{item.label}</span> : <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("mt-auto rounded-2xl border border-white/58 bg-white/28 p-3 text-[#667168] shadow-[inset_0_1px_0_rgba(255,255,255,.78)]", compact && "hidden xl:block")}>
        <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.05em] text-[#53665a]"><Sparkles className="h-4 w-4 text-[#7a6d9e]" />MY PRACTICE</div>
        <p className="mt-1.5 text-[11px] font-medium leading-4.5">今日の記録が、次の指導の気づきになります。</p>
      </div>
    </aside>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/lessons" && (pathname.startsWith("/schedules") || pathname.startsWith("/templates") || pathname.startsWith("/blocks")));
}

function MobileTopBar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  return (
    <header className="liquid-glass sticky left-2 right-2 top-2 z-40 mx-2 mt-2 flex h-14 items-center justify-between rounded-2xl px-3 print:hidden md:hidden">
      <button type="button" onClick={onMenuClick} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/44 text-[#536159] focus-visible:outline-none" aria-label="メニューを開く">
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0 text-center">
        <div className="mx-auto flex items-center justify-center gap-1.5 text-[#4f875a]">
          <Flower2 className="h-4 w-4" strokeWidth={1.7} />
          <span className="text-[12px] font-black tracking-[0.12em]">YOGA NURTURE</span>
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
      <button type="button" aria-label="メニューを閉じる" onClick={onClose} tabIndex={open ? 0 : -1} className={cn("liquid-dialog-backdrop absolute inset-0 transition-opacity", open ? "opacity-100" : "opacity-0")} />
      <aside className={cn("liquid-sidebar absolute inset-y-3 left-3 w-[286px] max-w-[82vw] rounded-[26px] p-4 transition-transform duration-200", open ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]")}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#4f875a]">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/66"><Flower2 className="h-5 w-5" /></span>
            <div><p className="font-serif text-[14px] tracking-[0.1em]">YOGA NURTURE</p><p className="text-[12px] font-semibold text-[#6b7468]">メニュー</p></div>
          </div>
          <button type="button" onClick={onClose} className="liquid-control flex h-10 w-10 items-center justify-center rounded-xl text-[#5d6b58] focus-visible:outline-none" aria-label="閉じる"><X className="h-5 w-5" /></button>
        </div>
        <nav className="grid gap-2" aria-label="モバイルメニュー">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose} tabIndex={open ? 0 : -1} aria-current={active ? "page" : undefined} className={cn("flex h-12 items-center gap-3 rounded-2xl border px-3 text-[14px] font-semibold focus-visible:outline-none", active ? "border-white/80 bg-[linear-gradient(145deg,#e4f1e2,rgba(255,255,255,.72))] text-[#315f42] shadow-[0_8px_20px_rgba(65,106,76,.12)]" : "border-transparent bg-white/24 text-[#4c514b]")}>
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
    <nav className="liquid-glass fixed inset-x-2 bottom-2 z-50 rounded-2xl px-2 pb-[env(safe-area-inset-bottom)] print:hidden md:hidden" aria-label="下部ナビゲーション">
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center justify-center gap-1 rounded-xl text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]", active ? "text-[#5d8f68]" : "text-[#787d75]")}>
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", active ? "border border-white/80 bg-[#e3efdf] shadow-sm" : "bg-transparent")}><Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" /></span>
              {item.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
