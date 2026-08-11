"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  FileText,
  Layers3,
  LoaderCircle,
  Plus,
  Search,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  isGlobalSearchQueryReady,
  type GlobalSearchItem,
  type GlobalSearchResponse,
} from "@/lib/global-search-types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SearchPhase = "idle" | "debouncing" | "loading" | "ready" | "error";

type PaletteEntry = {
  key: string;
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  meta?: string[];
  status?: string;
  flags?: string[];
  matchContext?: string;
  seeAll?: boolean;
};

type PaletteGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  entries: PaletteEntry[];
};

type IndexedPaletteEntry = PaletteEntry & { index: number };
type IndexedPaletteGroup = Omit<PaletteGroup, "entries"> & { entries: IndexedPaletteEntry[] };

const quickGroups: PaletteGroup[] = [
  {
    key: "create",
    label: "よく使う作成",
    icon: Plus,
    entries: [
      { key: "create-schedule", href: "/schedules/new", title: "予定を登録", description: "日時・場所・参加者を設定", icon: CalendarDays },
      { key: "create-plan", href: "/lessons/new", title: "レッスンプランを作成", description: "ブロックからレッスンを構成", icon: ClipboardList },
      { key: "create-block", href: "/blocks/new", title: "ブロックを登録", description: "教材をブロックライブラリへ追加", icon: Layers3 },
      { key: "create-student", href: "/students/new", title: "生徒を登録", description: "生徒カルテへプロフィールを追加", icon: UserRound },
    ],
  },
  {
    key: "navigate",
    label: "主要画面へ移動",
    icon: ArrowRight,
    entries: [
      { key: "open-students", href: "/students", title: "生徒カルテ", description: "生徒・注意点・フォローを確認", icon: UserRound },
      { key: "open-lessons", href: "/lessons", title: "レッスンカルテ", description: "予定・プラン・ブロック・記録を確認", icon: CalendarDays },
      { key: "open-pending", href: "/lessons?status=record_pending", title: "未記録のレッスン", description: "実施後記録が必要な予定を表示", icon: FileCheck2 },
      { key: "open-reports", href: "/reports", title: "レポート", description: "実施状況と傾向を分析", icon: BarChart3 },
    ],
  },
];

const resultGroupDefinitions = [
  { key: "students", label: "生徒", icon: UserRound, seeAllLabel: "生徒カルテですべて見る" },
  { key: "schedules", label: "予定", icon: CalendarDays, seeAllLabel: "レッスンカルテですべて見る" },
  { key: "lessonPlans", label: "レッスンプラン", icon: ClipboardList, seeAllLabel: "レッスンプランをすべて見る" },
  { key: "blocks", label: "ブロック", icon: Layers3, seeAllLabel: "ブロックをすべて見る" },
  { key: "lessonRecords", label: "実施後記録", icon: FileText, seeAllLabel: "実施後記録をすべて見る" },
] as const;

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const closePalette = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    requestIdRef.current += 1;
    setQuery("");
    setResults(null);
    setPhase("idle");
    setErrorMessage("");
    setSelectedIndex(0);
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      if (open) {
        inputRef.current?.focus();
        inputRef.current?.select();
      } else {
        onOpenChange(true);
      }
    };
    const handleExternalOpen = () => {
      if (open) {
        inputRef.current?.focus();
        inputRef.current?.select();
      } else {
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    window.addEventListener("yoga:open-command-palette", handleExternalOpen);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
      window.removeEventListener("yoga:open-command-palette", handleExternalOpen);
    };
  }, [onOpenChange, open]);

  const performSearch = useCallback(async (nextQuery: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setPhase("loading");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/global-search?q=${encodeURIComponent(nextQuery)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = (await response.json()) as GlobalSearchResponse | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "検索結果を取得できませんでした。");
      }
      if (requestId !== requestIdRef.current) return;
      setResults(payload as GlobalSearchResponse);
      setSelectedIndex(0);
      setPhase("ready");
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setResults(null);
      setSelectedIndex(0);
      setErrorMessage(error instanceof Error ? error.message : "検索結果を取得できませんでした。");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (!open || !isGlobalSearchQueryReady(query)) return;
    const nextQuery = query.trim();
    const timer = window.setTimeout(() => {
      void performSearch(nextQuery);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, performSearch, query]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const trimmedQuery = query.trim();
  const queryReady = isGlobalSearchQueryReady(query);
  const paletteGroups = trimmedQuery ? buildResultGroups(results) : quickGroups;
  let nextIndex = 0;
  const indexedGroups: IndexedPaletteGroup[] = paletteGroups.map((group) => ({
    ...group,
    entries: group.entries.map((entry) => ({ ...entry, index: nextIndex++ })),
  }));
  const entries = indexedGroups.flatMap((group) => group.entries);
  const selectedEntry = entries[selectedIndex] ?? entries[0];
  const isSearching = phase === "debouncing" || phase === "loading";

  function handleQueryChange(value: string) {
    abortRef.current?.abort();
    abortRef.current = null;
    requestIdRef.current += 1;
    setQuery(value);
    setResults(null);
    setErrorMessage("");
    setSelectedIndex(0);
    setPhase(isGlobalSearchQueryReady(value) ? "debouncing" : "idle");
  }

  function navigate(entry: PaletteEntry) {
    closePalette();
    router.push(entry.href);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" && entries.length) {
      event.preventDefault();
      setSelectedIndex((current) => {
        const next = (current + 1) % entries.length;
        window.requestAnimationFrame(() => rowRefs.current[next]?.scrollIntoView({ block: "nearest" }));
        return next;
      });
      return;
    }
    if (event.key === "ArrowUp" && entries.length) {
      event.preventDefault();
      setSelectedIndex((current) => {
        const next = (current - 1 + entries.length) % entries.length;
        window.requestAnimationFrame(() => rowRefs.current[next]?.scrollIntoView({ block: "nearest" }));
        return next;
      });
      return;
    }
    if (event.key === "Enter" && event.target === inputRef.current && selectedEntry) {
      event.preventDefault();
      navigate(selectedEntry);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) onOpenChange(true);
        else closePalette();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-[#1d251f]/52 backdrop-blur-[3px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[91] flex items-start justify-center overflow-hidden p-3 pt-[7vh] md:p-6 md:pt-[10vh]">
          <Dialog.Popup
            aria-label="全体検索とコマンド"
            initialFocus={inputRef}
            onKeyDown={handleKeyDown}
            className="flex max-h-[min(780px,82dvh)] w-full min-w-0 max-w-[820px] flex-col overflow-hidden rounded-2xl border border-[#d8ddd3] bg-[#fbfaf6] shadow-[0_34px_100px_rgba(23,36,28,0.34)] outline-none transition-[transform,opacity] data-ending-style:-translate-y-2 data-ending-style:opacity-0 data-starting-style:-translate-y-2 data-starting-style:opacity-0"
          >
            <header className="shrink-0 border-b border-[#e3e2d9] bg-[#f8f7f2]">
              <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4 md:px-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[#4c8056]">
                    <Search className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[12px] font-semibold tracking-[0.12em]">GLOBAL COMMAND</span>
                  </div>
                  <Dialog.Title className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#273129] md:text-[22px]">
                    検索・移動・クイック作成
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-[13px] leading-5 text-[#687168]">
                    生徒、予定、プラン、ブロック、実施後記録を横断します。
                  </Dialog.Description>
                </div>
                <button
                  type="button"
                  onClick={closePalette}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#dedbd2] bg-white text-[#596258] transition hover:bg-[#f0f3ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76] focus-visible:ring-offset-2"
                  aria-label="コマンドパレットを閉じる"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="px-4 pb-4 md:px-5">
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#cfd8ca] bg-white px-4 shadow-[0_4px_16px_rgba(63,83,66,0.07)] focus-within:border-[#85a989] focus-within:ring-2 focus-within:ring-[#8eb799]/24">
                  <Search className="h-5 w-5 shrink-0 text-[#5d8f68]" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    autoFocus
                    value={query}
                    onChange={(event) => handleQueryChange(event.target.value)}
                    role="combobox"
                    aria-label="全体検索"
                    aria-expanded={open}
                    aria-controls="global-command-palette-list"
                    aria-activedescendant={selectedEntry ? `palette-entry-${selectedEntry.index}` : undefined}
                    aria-autocomplete="list"
                    placeholder="名前、レッスン、プラン、場所、タグ、メモを検索"
                    className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-[#273129] outline-none placeholder:text-[#92978f]"
                  />
                  {isSearching ? (
                    <span className="flex shrink-0 items-center gap-2 text-[12px] font-medium text-[#5d765f]" aria-live="polite">
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />検索中
                    </span>
                  ) : trimmedQuery ? (
                    <button
                      type="button"
                      onClick={() => handleQueryChange("")}
                      className="shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold text-[#6f766d] hover:bg-[#eef2eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]"
                    >
                      クリア
                    </button>
                  ) : (
                    <kbd className="hidden shrink-0 rounded-md border border-[#dedbd2] bg-[#f7f5f0] px-2 py-1 text-[11px] font-semibold text-[#6b7269] sm:inline">⌘ / Ctrl K</kbd>
                  )}
                </div>
              </div>
            </header>

            <div id="global-command-palette-list" role="listbox" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-3 md:px-3">
              {results?.unavailableGroups.length ? (
                <div className="mx-2 mb-3 flex items-start gap-2 rounded-lg border border-[#ead9bc] bg-[#fff8e9] px-3 py-2.5 text-[13px] leading-5 text-[#765f3f]" role="status">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  一部の種類を取得できませんでした。表示中の結果はそのまま利用できます。
                </div>
              ) : null}

              {phase === "error" ? (
                <SearchError message={errorMessage} onRetry={() => void performSearch(trimmedQuery)} />
              ) : trimmedQuery && !queryReady ? (
                <PaletteNotice
                  icon={Search}
                  title="もう1文字入力してください"
                  description="検索は2文字以上、日本語は1文字から利用できます。"
                />
              ) : isSearching ? (
                <PaletteNotice
                  icon={LoaderCircle}
                  title="検索しています"
                  description="5種類のカルテを安全に横断しています。"
                  loading
                />
              ) : trimmedQuery && phase === "ready" && !entries.length ? (
                <PaletteNotice
                  icon={Search}
                  title={`「${trimmedQuery}」に一致する項目はありません`}
                  description="表記を変えるか、別のキーワードを入力してください。"
                />
              ) : (
                indexedGroups.map((group) => (
                  <PaletteResultGroup
                    key={group.key}
                    group={group}
                    query={trimmedQuery}
                    selectedIndex={selectedIndex}
                    rowRefs={rowRefs}
                    onSelect={setSelectedIndex}
                    onOpen={navigate}
                  />
                ))
              )}
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#e3e2d9] bg-[#f6f5f0] px-4 py-2.5 text-[11px] font-medium text-[#70776f] md:px-5">
              <span>検索結果はログイン中の所有データのみ</span>
              <span className="flex items-center gap-3" aria-label="キーボード操作">
                <span><kbd className="rounded border border-[#d9d6ce] bg-white px-1.5 py-0.5">↑↓</kbd> 選択</span>
                <span><kbd className="rounded border border-[#d9d6ce] bg-white px-1.5 py-0.5">Enter</kbd> 開く</span>
                <span><kbd className="rounded border border-[#d9d6ce] bg-white px-1.5 py-0.5">Esc</kbd> 閉じる</span>
              </span>
            </footer>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function buildResultGroups(results: GlobalSearchResponse | null): PaletteGroup[] {
  if (!results) return [];
  return resultGroupDefinitions
    .map((definition): PaletteGroup => {
      const result = results.groups[definition.key];
      const entries = result.items.map((item) => resultItemToEntry(item, definition.icon));
      if (result.hasMore) {
        entries.push({
          key: `see-all-${definition.key}`,
          href: result.seeAllHref,
          title: definition.seeAllLabel,
          description: "既存の一覧で検索条件を引き継ぎます",
          icon: ArrowRight,
          seeAll: true,
        });
      }
      return { key: definition.key, label: definition.label, icon: definition.icon, entries };
    })
    .filter((group) => group.entries.length > 0);
}

function resultItemToEntry(item: GlobalSearchItem, icon: LucideIcon): PaletteEntry {
  return {
    key: `${item.kind}-${item.id}`,
    href: item.href,
    title: item.title,
    description: item.description,
    icon,
    meta: item.meta,
    status: item.status,
    flags: item.flags,
    matchContext: item.matchContext,
  };
}

function PaletteResultGroup({
  group,
  query,
  selectedIndex,
  rowRefs,
  onSelect,
  onOpen,
}: {
  group: IndexedPaletteGroup;
  query: string;
  selectedIndex: number;
  rowRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
  onSelect: (index: number) => void;
  onOpen: (entry: PaletteEntry) => void;
}) {
  const GroupIcon = group.icon;
  return (
    <section className="mb-3 last:mb-0" role="group" aria-labelledby={`palette-group-${group.key}`}>
      <div id={`palette-group-${group.key}`} className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold tracking-[0.04em] text-[#657064]">
        <GroupIcon className="h-4 w-4 text-[#5d8f68]" aria-hidden="true" />
        {group.label}
        <span className="font-normal text-[#90958e]">{group.entries.filter((entry) => !entry.seeAll).length}件</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#e5e2da] bg-white/76 divide-y divide-[#ece9e2]">
        {group.entries.map((entry) => {
          const Icon = entry.icon;
          const selected = entry.index === selectedIndex;
          return (
            <button
              key={entry.key}
              id={`palette-entry-${entry.index}`}
              ref={(element) => { rowRefs.current[entry.index] = element; }}
              type="button"
              role="option"
              aria-selected={selected}
              onMouseEnter={() => onSelect(entry.index)}
              onFocus={() => onSelect(entry.index)}
              onClick={() => onOpen(entry)}
              className={cn(
                "group/row flex w-full min-w-0 items-start gap-3 px-3 py-3 text-left transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6f9a76] md:px-4",
                selected ? "bg-[#eaf1e6]" : "bg-transparent hover:bg-[#f3f6f0]",
              )}
            >
              <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", entry.seeAll ? "border-[#ded7e8] bg-[#f4f1f8] text-[#7465a0]" : "border-[#d8e2d3] bg-[#f5f8f2] text-[#4e8059]")}>
                <Icon className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0 truncate text-[15px] font-semibold text-[#2f3931]">
                    <HighlightText text={entry.title} query={query} />
                  </span>
                  {entry.status ? <span className="rounded-full border border-[#d8ded3] bg-[#f8f9f6] px-2 py-0.5 text-[11px] font-semibold text-[#5d685d]">{entry.status}</span> : null}
                  {entry.flags?.map((flag) => (
                    <span key={flag} className={flag === "要フォロー" || flag === "注意点あり" ? "rounded-full border border-[#efd1ca] bg-[#fff1ed] px-2 py-0.5 text-[11px] font-semibold text-[#a65348]" : "rounded-full border border-[#ddd8e8] bg-[#f7f4fb] px-2 py-0.5 text-[11px] font-semibold text-[#6e6295]"}>{flag}</span>
                  ))}
                </span>
                <span className="mt-0.5 block truncate text-[13px] leading-5 text-[#697169]">
                  <HighlightText text={entry.description} query={query} />
                </span>
                {entry.matchContext ? (
                  <span className="mt-1 block line-clamp-1 text-[12px] leading-5 text-[#667363]">
                    <HighlightText text={entry.matchContext} query={query} />
                  </span>
                ) : null}
              </span>
              <span className="hidden max-w-[220px] shrink-0 flex-col items-end gap-1 pt-0.5 text-[12px] text-[#6d756c] sm:flex">
                {entry.meta?.map((value) => <span key={value} className="max-w-full truncate">{value}</span>)}
              </span>
              <ArrowRight className={cn("mt-2 h-4 w-4 shrink-0 transition", selected ? "translate-x-0 text-[#4f8058]" : "-translate-x-1 text-[#a0a59d] group-hover/row:translate-x-0 group-hover/row:text-[#4f8058]")} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PaletteNotice({ icon: Icon, title, description, loading = false }: { icon: LucideIcon; title: string; description: string; loading?: boolean }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center" role="status">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d8e2d3] bg-[#f2f7ef] text-[#4f8058]">
        <Icon className={cn("h-5 w-5", loading && "animate-spin")} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-[16px] font-semibold text-[#344038]">{title}</h3>
      <p className="mt-1 max-w-md text-[13px] leading-6 text-[#70776f]">{description}</p>
    </div>
  );
}

function SearchError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="m-2 flex min-h-52 flex-col items-center justify-center rounded-xl border border-[#efd1ca] bg-[#fff4f0] px-6 py-10 text-center" role="alert">
      <AlertCircle className="h-7 w-7 text-[#b55c50]" aria-hidden="true" />
      <h3 className="mt-3 text-[16px] font-semibold text-[#75483f]">検索を完了できませんでした</h3>
      <p className="mt-1 max-w-md text-[13px] leading-6 text-[#8a5d54]">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex h-9 items-center rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76] focus-visible:ring-offset-2">
        もう一度検索
      </button>
    </div>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const search = query.trim();
  if (!search) return text;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  const normalizedSearch = search.normalize("NFKC").toLocaleLowerCase("ja");
  return parts.map((part, index) =>
    part.normalize("NFKC").toLocaleLowerCase("ja") === normalizedSearch ? (
      <mark key={`${part}-${index}`} className="rounded-sm bg-[#dfead9] px-0.5 text-inherit">{part}</mark>
    ) : (
      part
    ),
  );
}
