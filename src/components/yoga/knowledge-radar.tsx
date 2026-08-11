"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Check,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  FileSearch,
  FlaskConical,
  Heart,
  Info,
  LoaderCircle,
  MoreHorizontal,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useFormStatus } from "react-dom";
import {
  refreshRadarAction,
  replenishRadarAction,
  submitRadarFeedbackAction,
} from "@/app/dashboard/actions";
import type { DashboardData, RadarItem, RadarItemType, RadarStatus } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

type RadarFilter = "all" | "trusted" | "expert" | "video" | "social" | "read_later" | "helpful";

const filterOptions: Array<{ key: RadarFilter; label: string }> = [
  { key: "all", label: "すべて" },
  { key: "trusted", label: "公的・研究／医療・安全" },
  { key: "expert", label: "ヨガ団体・専門家" },
  { key: "video", label: "動画" },
  { key: "social", label: "SNSの話題" },
  { key: "read_later", label: "あとで読む" },
  { key: "helpful", label: "役に立った" },
];

const typeVisuals: Record<RadarItemType, {
  icon: typeof BookOpenText;
  card: string;
  badge: string;
  iconBox: string;
}> = {
  public_research: {
    icon: FlaskConical,
    card: "border-[#cbded7] bg-[linear-gradient(145deg,#f5fbf8_0%,#ffffff_58%,#edf6f2_100%)]",
    badge: "border-[#c8ddd5] bg-[#eaf5f0] text-[#35685a]",
    iconBox: "bg-[#dcefe8] text-[#376f60]",
  },
  medical_health: {
    icon: Stethoscope,
    card: "border-[#d2ddeb] bg-[linear-gradient(145deg,#f6f9fd_0%,#ffffff_58%,#eef3f9_100%)]",
    badge: "border-[#cdd9e7] bg-[#edf3fa] text-[#43647d]",
    iconBox: "bg-[#e0ebf6] text-[#486d87]",
  },
  yoga_organization: {
    icon: UsersRound,
    card: "border-[#d9dec7] bg-[linear-gradient(145deg,#fafbf4_0%,#ffffff_58%,#f2f5e8_100%)]",
    badge: "border-[#d8dfc7] bg-[#f0f4e4] text-[#62713c]",
    iconBox: "bg-[#e7edcf] text-[#657645]",
  },
  yoga_expert: {
    icon: ShieldCheck,
    card: "border-[#e2d8c8] bg-[linear-gradient(145deg,#fdfaf4_0%,#ffffff_58%,#f8f0e4_100%)]",
    badge: "border-[#e3d7c3] bg-[#f8efe0] text-[#7c603c]",
    iconBox: "bg-[#f3e5d0] text-[#85643c]",
  },
  general_article: {
    icon: BookOpenText,
    card: "border-[#dedbd3] bg-[linear-gradient(145deg,#fbfaf7_0%,#ffffff_58%,#f4f2ed_100%)]",
    badge: "border-[#dedbd2] bg-[#f5f3ee] text-[#67645e]",
    iconBox: "bg-[#ece9e2] text-[#69665f]",
  },
  video: {
    icon: PlayCircle,
    card: "border-[#dfd3e5] bg-[linear-gradient(145deg,#fbf7fd_0%,#ffffff_58%,#f5eef8_100%)]",
    badge: "border-[#ded0e5] bg-[#f5ecf8] text-[#765887]",
    iconBox: "bg-[#ebdcf1] text-[#7b588c]",
  },
  social_signal: {
    icon: Sparkles,
    card: "border-[#ead4cf] bg-[linear-gradient(145deg,#fff8f6_0%,#ffffff_58%,#fbeeea_100%)]",
    badge: "border-[#e8d1ca] bg-[#faece8] text-[#8c594d]",
    iconBox: "bg-[#f6dfd9] text-[#925c50]",
  },
};

export function KnowledgeRadar({ radar }: { radar: DashboardData["radar"] }) {
  const featuredItems = radar.items.slice(0, 12);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, startScrollLeft: 0, active: false, moved: false });
  const suppressClickUntilRef = useRef(0);
  const selectedItem = radar.items.find((item) => item.id === selectedItemId) ?? null;

  const updateCurrentIndex = useCallback(() => {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const track = trackRef.current;
      if (!track) return;
      const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-radar-card]"));
      if (!cards.length) return;
      const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      if (track.scrollLeft >= maximumScroll - 2) {
        setCurrentIndex(cards.length - 1);
        return;
      }
      const firstCardOffset = cards[0].offsetLeft;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const snapPosition = Math.min(maximumScroll, Math.max(0, card.offsetLeft - firstCardOffset));
        const distance = Math.abs(snapPosition - track.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setCurrentIndex(closestIndex);
    });
  }, []);

  const scrollToIndex = useCallback((requestedIndex: number) => {
    const track = trackRef.current;
    if (!track || !featuredItems.length) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-radar-card]"));
    const nextIndex = Math.max(0, Math.min(requestedIndex, cards.length - 1));
    const card = cards[nextIndex];
    if (!card) return;
    const firstCardOffset = cards[0]?.offsetLeft ?? 0;
    track.scrollLeft = Math.max(0, card.offsetLeft - firstCardOffset);
    setCurrentIndex(nextIndex);
  }, [featuredItems.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handleWheel = (event: WheelEvent) => {
      if (track.scrollWidth <= track.clientWidth) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      const atStart = track.scrollLeft <= 1;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;
      event.preventDefault();
      track.scrollLeft += delta;
    };
    track.addEventListener("wheel", handleWheel, { passive: false });
    return () => track.removeEventListener("wheel", handleWheel);
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-no-drag]")) return;
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      active: true,
      moved: false,
    };
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag.active || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4 && !drag.moved) {
      drag.moved = true;
      track.setPointerCapture(event.pointerId);
    }
    if (!drag.moved) return;
    event.preventDefault();
    track.scrollLeft = drag.startScrollLeft - distance;
  }, []);

  const endPointerDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag.active || drag.pointerId !== event.pointerId) return;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (drag.moved) suppressClickUntilRef.current = performance.now() + 300;
    dragRef.current = { pointerId: -1, startX: 0, startScrollLeft: 0, active: false, moved: false };
    updateCurrentIndex();
  }, [updateCurrentIndex]);

  const handleTrackKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollToIndex(currentIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex]);

  return (
    <section className="min-w-0 overflow-hidden rounded-[24px] border border-[#d8ddd2] bg-[radial-gradient(circle_at_8%_0%,rgba(209,231,214,0.72),transparent_28%),linear-gradient(135deg,#fbfcf8_0%,#ffffff_54%,#faf6ef_100%)] shadow-[0_16px_50px_rgba(54,72,58,0.08)]">
      <div className="flex flex-col gap-3 border-b border-[#e2e5de] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dfece0] text-[#4b7654]">
              <FileSearch className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 className="text-[20px] font-black tracking-[-0.025em] text-[#2f4034]">ヨガナレッジレーダー</h2>
                <span className="text-[13px] font-bold text-[#6b756d]">{radar.items.length}件</span>
              </div>
              <p className="mt-0.5 text-[12px] font-semibold text-[#778078]">
                <RadarStatusDot status={radar.status} /> 最終更新 {radar.lastUpdatedLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2" data-no-drag>
          <RadarDiagnostics radar={radar} />
          <button
            type="button"
            onClick={() => setAllOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d4d9d0] bg-white px-3.5 text-[13px] font-black text-[#526057] shadow-sm transition hover:border-[#aebdac] hover:bg-[#f7faf5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]"
          >
            <BookOpenText className="h-4 w-4" aria-hidden="true" />すべて見る
          </button>
          <form action={refreshRadarAction}>
            <RefreshButton disabled={radar.status === "disabled" || radar.status === "budget"} />
          </form>
        </div>
      </div>

      {featuredItems.length ? (
        <div className="relative py-4 sm:py-5">
          <div className="mb-3 flex items-center justify-between gap-3 px-4 sm:px-5">
            <p className="text-[13px] font-semibold text-[#69736b]">気になるカードを選ぶと、詳しい要約と関連テーマを確認できます。</p>
            <div className="flex shrink-0 items-center gap-2" data-no-drag>
              <span className="min-w-12 text-center text-[13px] font-black tabular-nums text-[#53645a]" aria-live="polite">
                {currentIndex + 1} / {featuredItems.length}
              </span>
              <CarouselArrow label="前の情報" icon={ArrowLeft} disabled={currentIndex === 0} onClick={() => scrollToIndex(currentIndex - 1)} />
              <CarouselArrow label="次の情報" icon={ArrowRight} disabled={currentIndex >= featuredItems.length - 1} onClick={() => scrollToIndex(currentIndex + 1)} />
            </div>
          </div>

          <div
            ref={trackRef}
            tabIndex={0}
            role="region"
            aria-label="外部ナレッジカード。左右キーでも移動できます"
            onScroll={updateCurrentIndex}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointerDrag}
            onPointerCancel={endPointerDrag}
            onKeyDown={handleTrackKeyDown}
            onClickCapture={(event) => {
              if (performance.now() < suppressClickUntilRef.current) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            className="flex min-w-0 cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth px-4 pb-2 pt-1 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7ba183] active:cursor-grabbing sm:px-5 [&::-webkit-scrollbar]:hidden"
          >
            {featuredItems.map((item) => (
              <RadarCard key={item.id} item={item} onOpen={() => setSelectedItemId(item.id)} />
            ))}
            <div className="w-1 shrink-0 sm:w-2" aria-hidden="true" />
          </div>
        </div>
      ) : (
        <RadarEmpty status={radar.status} />
      )}

      <RadarDetailDialog item={selectedItem} topics={radar.topics} onClose={() => setSelectedItemId(null)} />
      <RadarLibraryDialog
        open={allOpen}
        radar={radar}
        onClose={() => setAllOpen(false)}
        onOpenItem={(item) => setSelectedItemId(item.id)}
      />
    </section>
  );
}

function RadarCard({ item, onOpen }: { item: RadarItem; onOpen: () => void }) {
  const visual = typeVisuals[item.itemType];
  const Icon = visual.icon;
  const helpful = item.feedback.includes("helpful");
  const saved = item.feedback.includes("read_later");
  const points = summaryPoints(item.summary);

  return (
    <article
      data-radar-card
      className={cn(
        "flex h-[430px] w-[84vw] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] border shadow-[0_12px_34px_rgba(54,65,57,0.09)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(54,65,57,0.13)] md:w-[clamp(430px,53vw,480px)] xl:w-[clamp(360px,31vw,410px)]",
        visual.card,
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-0 flex-1 flex-col p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#71977a]"
        aria-label={`${item.title}の詳細を開く`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", visual.iconBox)}>
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[12px] font-black", visual.badge)}>{item.itemTypeLabel}</span>
              <p className="mt-1 truncate text-[12px] font-bold text-[#747a74]">{item.trustLabel}</p>
            </div>
          </div>
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 -rotate-90 text-[#7f877f]" aria-hidden="true" />
        </div>

        <p className="mt-4 truncate text-[12px] font-bold text-[#767c76]">{item.sourceName}・{item.publishedLabel}</p>
        <h3 className="mt-2 line-clamp-3 text-[17px] font-black leading-[1.45] tracking-[-0.018em] text-[#303b33]">{item.title}</h3>

        <div className="mt-4 min-h-0 flex-1">
          <p className="text-[12px] font-black tracking-[0.06em] text-[#617068]">30秒で読む要点</p>
          <ul className="mt-2 space-y-1.5 text-[13px] font-medium leading-[1.55] text-[#59635c]">
            {points.map((point, index) => (
              <li key={`${item.id}-${index}`} className="flex gap-2">
                <span className="mt-[0.52em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6f9276]" aria-hidden="true" />
                <span className="line-clamp-2">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 rounded-xl border border-white/80 bg-white/62 px-3.5 py-3 backdrop-blur-sm">
          <p className="text-[12px] font-black text-[#58705e]">なぜ今</p>
          <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-5 text-[#58655c]">{item.relevanceReason}</p>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1.5 border-t border-black/[0.055] bg-white/74 px-3 py-3 backdrop-blur-sm" data-no-drag>
        <Link
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#536e59] px-3 text-[12px] font-black text-white transition hover:bg-[#45604c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]"
        >
          元情報<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <FeedbackForm itemId={item.id} action="helpful" label="役に立った" icon={helpful ? Check : Heart} active={helpful} compact />
        <FeedbackForm itemId={item.id} action="read_later" label="あとで読む" icon={saved ? Check : BookOpenText} active={saved} compact />
        <details className="relative ml-auto">
          <summary className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-[#dedfd9] bg-white text-[#68716a] transition hover:bg-[#f4f6f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]" aria-label="その他の操作">
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </summary>
          <div className="absolute bottom-11 right-0 z-20 w-56 rounded-xl border border-[#dedfd8] bg-white p-2 shadow-[0_18px_45px_rgba(40,48,42,0.18)]">
            <FeedbackForm itemId={item.id} action="not_now" label="今は不要" icon={X} menu />
            <FeedbackForm itemId={item.id} action="block_source" label="この情報源を表示しない" icon={CircleAlert} danger menu />
          </div>
        </details>
      </div>
    </article>
  );
}

function RadarDetailDialog({ item, topics, onClose }: {
  item: RadarItem | null;
  topics: DashboardData["radar"]["topics"];
  onClose: () => void;
}) {
  const visual = item ? typeVisuals[item.itemType] : typeVisuals.general_article;
  const Icon = visual.icon;
  const relatedTopics = item ? topics.filter((topic) => item.topicKeys.includes(topic.key)) : [];

  return (
    <Dialog.Root open={Boolean(item)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[110] bg-[#202820]/48 backdrop-blur-[3px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[111] flex justify-end overflow-hidden p-0 sm:p-3 sm:pl-[12vw]">
          <Dialog.Popup className="flex h-full w-full max-w-[640px] flex-col overflow-hidden border-l border-[#d9ddd4] bg-[#fbfaf7] shadow-[-24px_0_70px_rgba(27,38,30,0.24)] outline-none transition-[transform,opacity] data-ending-style:translate-x-6 data-ending-style:opacity-0 data-starting-style:translate-x-6 data-starting-style:opacity-0 sm:rounded-[22px] sm:border">
            {item ? (
              <>
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e1e3dd] bg-white/88 px-5 py-4 backdrop-blur sm:px-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", visual.iconBox)}><Icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
                      <span className={cn("rounded-full border px-2.5 py-1 text-[12px] font-black", visual.badge)}>{item.itemTypeLabel}</span>
                    </div>
                    <Dialog.Title className="mt-3 text-[22px] font-black leading-[1.4] tracking-[-0.025em] text-[#2f3932]">{item.title}</Dialog.Title>
                    <Dialog.Description className="mt-2 text-[13px] font-semibold leading-5 text-[#707871]">
                      {item.sourceName}・{item.author}・{item.publishedLabel}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dcdfd8] bg-white text-[#5f6861] transition hover:bg-[#f2f4f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]" aria-label="詳細を閉じる">
                    <X className="h-5 w-5" aria-hidden="true" />
                  </Dialog.Close>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                  <DetailSection title="30秒要約">
                    <p className="text-[14px] font-medium leading-7 text-[#525d55]">{item.summary}</p>
                    {item.isAiSummary ? (
                      <p className="mt-3 flex items-start gap-2 rounded-xl border border-[#e2ddd2] bg-[#f8f5ef] p-3 text-[12px] font-semibold leading-5 text-[#756d62]">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#8a7457]" aria-hidden="true" />
                        AIによる要約です。医療・安全上の判断は、必ず元情報を確認してください。
                      </p>
                    ) : null}
                  </DetailSection>

                  <DetailSection title="なぜ今の自分に関係するか">
                    <p className="rounded-xl border border-[#d9e5d7] bg-[#f1f7ef] p-4 text-[14px] font-semibold leading-6 text-[#506457]">{item.relevanceReason}</p>
                  </DetailSection>

                  <DetailSection title="関連する追跡テーマ">
                    <div className="flex flex-wrap gap-2">
                      {relatedTopics.length ? relatedTopics.map((topic) => (
                        <span key={topic.key} className="rounded-full border border-[#d6dfd3] bg-white px-3 py-1.5 text-[13px] font-bold text-[#566b5a]">{topic.labelJa}</span>
                      )) : <span className="text-[13px] font-semibold text-[#7a817a]">関連テーマを整理中です</span>}
                    </div>
                  </DetailSection>

                  <DetailSection title="情報の性質">
                    <div className="grid gap-2 text-[13px] sm:grid-cols-2">
                      <MetaTile label="情報種別" value={item.itemTypeLabel} />
                      <MetaTile label="信頼性の性質" value={item.trustLabel} />
                      <MetaTile label="情報源" value={item.sourceName} />
                      <MetaTile label="著者" value={item.author} />
                    </div>
                  </DetailSection>
                </div>

                <footer className="shrink-0 border-t border-[#dfe2db] bg-white px-4 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#4f7057] px-4 text-[13px] font-black text-white transition hover:bg-[#426248]">
                      元情報を開く<ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <FeedbackForm itemId={item.id} action="helpful" label="役に立った" icon={item.feedback.includes("helpful") ? Check : Heart} active={item.feedback.includes("helpful")} />
                    <FeedbackForm itemId={item.id} action="not_now" label="今は不要" icon={X} />
                    <FeedbackForm itemId={item.id} action="read_later" label="あとで読む" icon={item.feedback.includes("read_later") ? Check : BookOpenText} active={item.feedback.includes("read_later")} />
                    <FeedbackForm itemId={item.id} action="block_source" label="情報源を非表示" icon={CircleAlert} danger />
                  </div>
                </footer>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RadarLibraryDialog({ open, radar, onClose, onOpenItem }: {
  open: boolean;
  radar: DashboardData["radar"];
  onClose: () => void;
  onOpenItem: (item: RadarItem) => void;
}) {
  const [filter, setFilter] = useState<RadarFilter>("all");
  const [topicKey, setTopicKey] = useState("all");
  const filteredItems = useMemo(
    () => radar.items.filter((item) => matchesFilter(item, filter) && (topicKey === "all" || item.topicKeys.includes(topicKey))),
    [filter, radar.items, topicKey],
  );

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-[#1f281f]/50 backdrop-blur-[3px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[101] flex items-center justify-center overflow-hidden p-2 sm:p-4">
          <Dialog.Popup className="flex h-[calc(100dvh-1rem)] w-full max-w-[1380px] flex-col overflow-hidden rounded-[22px] border border-[#d8ddd3] bg-[#f8f8f4] shadow-[0_34px_100px_rgba(24,36,27,0.3)] outline-none transition-[transform,opacity] data-ending-style:translate-y-3 data-ending-style:opacity-0 data-starting-style:translate-y-3 data-starting-style:opacity-0 sm:h-[calc(100dvh-2rem)]">
            <header className="shrink-0 border-b border-[#dde1d9] bg-white/92 px-4 py-4 backdrop-blur sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="text-[22px] font-black tracking-[-0.025em] text-[#2d3b31]">ナレッジレーダーの全件表示</Dialog.Title>
                  <Dialog.Description className="mt-1 text-[13px] font-semibold text-[#707970]">
                    取得済み{radar.items.length}件から、情報の性質と追跡テーマで絞り込めます。
                  </Dialog.Description>
                </div>
                <Dialog.Close className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#daddd6] bg-white text-[#5d675f] hover:bg-[#f1f4ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]" aria-label="全件表示を閉じる">
                  <X className="h-5 w-5" aria-hidden="true" />
                </Dialog.Close>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="情報種別フィルター">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilter(option.key)}
                    aria-pressed={filter === option.key}
                    className={cn(
                      "h-9 shrink-0 rounded-full border px-3 text-[13px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]",
                      filter === option.key ? "border-[#64856a] bg-[#64856a] text-white" : "border-[#d9ded6] bg-white text-[#616b63] hover:border-[#afbfad]",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {radar.topics.length ? (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="追跡テーマフィルター">
                  <button type="button" onClick={() => setTopicKey("all")} aria-pressed={topicKey === "all"} className={topicFilterClass(topicKey === "all")}>全テーマ</button>
                  {radar.topics.map((topic) => (
                    <button key={topic.key} type="button" onClick={() => setTopicKey(topic.key)} aria-pressed={topicKey === topic.key} className={topicFilterClass(topicKey === topic.key)}>{topic.labelJa}</button>
                  ))}
                </div>
              ) : null}
            </header>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <p className="text-[13px] font-black text-[#59675e]">{filteredItems.length}件を表示</p>
                <RadarDiagnostics radar={radar} align="right" />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 sm:px-6">
                {filteredItems.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredItems.map((item) => <LibraryItem key={item.id} item={item} onOpen={() => onOpenItem(item)} />)}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#d7ddd4] bg-white p-10 text-center">
                    <BookOpenText className="mx-auto h-7 w-7 text-[#78877b]" aria-hidden="true" />
                    <p className="mt-3 text-[14px] font-black text-[#526057]">この条件に一致する情報はありません</p>
                    <p className="mt-1 text-[13px] font-semibold text-[#7b837c]">フィルターまたは追跡テーマを変更してください。</p>
                  </div>
                )}
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LibraryItem({ item, onOpen }: { item: RadarItem; onOpen: () => void }) {
  const visual = typeVisuals[item.itemType];
  const Icon = visual.icon;
  return (
    <article className={cn("flex min-h-[250px] flex-col rounded-2xl border p-4 shadow-sm", visual.card)}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-black", visual.badge)}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{item.itemTypeLabel}</span>
        <span className="text-[12px] font-bold text-[#7a807a]">{item.publishedLabel}</span>
      </div>
      <button type="button" onClick={onOpen} className="mt-3 flex flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]">
        <p className="truncate text-[12px] font-bold text-[#737b74]">{item.sourceName}</p>
        <h3 className="mt-1 line-clamp-3 text-[16px] font-black leading-6 text-[#303c34]">{item.title}</h3>
        <p className="mt-3 line-clamp-3 text-[13px] font-medium leading-5 text-[#5e6861]">{item.summary}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-black text-[#56715d]">詳細を見る<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
      </button>
    </article>
  );
}

function RadarDiagnostics({ radar, align = "left" }: { radar: DashboardData["radar"]; align?: "left" | "right" }) {
  return (
    <details className="relative">
      <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-[#d9ddd6] bg-white px-2.5 text-[12px] font-bold text-[#687169] hover:bg-[#f5f7f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]" aria-label="レーダーの診断情報">
        <Info className="h-3.5 w-3.5" aria-hidden="true" />状態
      </summary>
      <div className={cn("absolute z-30 mt-2 w-72 rounded-xl border border-[#daddd6] bg-white p-3 shadow-[0_18px_45px_rgba(38,49,41,0.18)]", align === "right" ? "right-0" : "left-0")}>
        <p className="text-[13px] font-black text-[#4e5c53]">{radar.message}</p>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-[#737b74]">今月の概算費用 ${radar.monthlyEstimatedCostUsd.toFixed(4)}</p>
        {radar.items.length < 8 ? (
          <form action={replenishRadarAction} className="mt-3 border-t border-[#e4e6e1] pt-3">
            <ReplenishButton />
          </form>
        ) : null}
      </div>
    </details>
  );
}

function RadarStatusDot({ status }: { status: RadarStatus }) {
  const label = status === "ready" ? "更新済み" : status === "failed" || status === "budget" ? "前回情報を表示中" : "更新準備中";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", status === "ready" ? "bg-[#55a36b]" : status === "failed" ? "bg-[#c98a76]" : "bg-[#c5a664]")} aria-hidden="true" />
      {label}
    </span>
  );
}

function CarouselArrow({ label, icon: Icon, disabled, onClick }: { label: string; icon: typeof ArrowLeft; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d4dad1] bg-white text-[#526159] shadow-sm transition hover:border-[#9fb3a0] hover:bg-[#f5f8f3] disabled:cursor-default disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function FeedbackForm({ itemId, action, label, icon: Icon, active = false, danger = false, compact = false, menu = false }: {
  itemId: string;
  action: "helpful" | "not_now" | "read_later" | "block_source";
  label: string;
  icon: typeof Heart;
  active?: boolean;
  danger?: boolean;
  compact?: boolean;
  menu?: boolean;
}) {
  return (
    <form action={submitRadarFeedbackAction} className={menu ? "w-full" : undefined}>
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="action" value={action} />
      <FeedbackButton label={label} icon={Icon} active={active} danger={danger} compact={compact} menu={menu} />
    </form>
  );
}

function FeedbackButton({ label, icon: Icon, active, danger, compact, menu }: {
  label: string;
  icon: typeof Heart;
  active: boolean;
  danger: boolean;
  compact: boolean;
  menu: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || active}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-[12px] font-black transition disabled:cursor-default",
        active ? "border-[#bcd3bd] bg-[#e7f0e5] text-[#507058]" : "border-[#dcded8] bg-white text-[#656d67] hover:border-[#b7c4b4] hover:bg-[#f6f8f4]",
        compact && "h-9 px-2.5",
        menu && "h-9 w-full justify-start border-transparent px-2.5",
        danger && "text-[#a05f53] hover:border-[#edcfc7] hover:bg-[#fff6f3]",
      )}
    >
      {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}{label}
    </button>
  );
}

function RefreshButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#516f57] px-3.5 text-[13px] font-black text-white shadow-sm transition hover:bg-[#426048] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76] focus-visible:ring-offset-2">
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
      {pending ? "更新中" : "手動更新"}
    </button>
  );
}

function ReplenishButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#5e7d64] px-3 text-[12px] font-black text-white transition hover:bg-[#4d6c54] disabled:opacity-60">
      {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
      {pending ? "初回情報を補充中" : "初回情報を補充"}
    </button>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 text-[13px] font-black tracking-[0.04em] text-[#536058]">{title}</h3>
      {children}
    </section>
  );
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e0e3dc] bg-white p-3">
      <p className="text-[12px] font-bold text-[#858b85]">{label}</p>
      <p className="mt-1 font-black leading-5 text-[#4f5b53]">{value}</p>
    </div>
  );
}

function RadarEmpty({ status }: { status: RadarStatus }) {
  return (
    <div className="m-4 rounded-2xl border border-dashed border-[#d7ddd4] bg-white/72 p-8 text-center sm:m-5">
      <BookOpenText className="mx-auto h-7 w-7 text-[#718176]" aria-hidden="true" />
      <p className="mt-3 text-[14px] font-black text-[#526057]">{status === "setting_up" ? "関連する外部情報を準備しています" : "表示できる外部情報はまだありません"}</p>
      <p className="mt-1 text-[13px] font-semibold text-[#788078]">今日のブリーフと自分の発見は通常どおり利用できます。</p>
    </div>
  );
}

function matchesFilter(item: RadarItem, filter: RadarFilter): boolean {
  if (filter === "all") return true;
  if (filter === "trusted") return item.itemType === "public_research" || item.itemType === "medical_health";
  if (filter === "expert") return item.itemType === "yoga_organization" || item.itemType === "yoga_expert";
  if (filter === "video") return item.itemType === "video";
  if (filter === "social") return item.itemType === "social_signal";
  return item.feedback.includes(filter);
}

function topicFilterClass(active: boolean): string {
  return cn(
    "h-8 shrink-0 rounded-full border px-3 text-[12px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]",
    active ? "border-[#a4b9a5] bg-[#eaf1e8] text-[#47634d]" : "border-[#e0e2dc] bg-white text-[#6d756e] hover:border-[#bdc9bb]",
  );
}

function summaryPoints(summary: string): string[] {
  const sentences = summary
    .split(/(?:\r?\n|[。！？]+|[・•]\s*)/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (sentences.length >= 2) return sentences.slice(0, 3);

  const clauses = summary
    .split(/[、；;：:]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (clauses.length >= 2) {
    const midpoint = Math.ceil(clauses.length / 2);
    return [clauses.slice(0, midpoint).join("、"), clauses.slice(midpoint).join("、")].filter(Boolean).slice(0, 3);
  }
  const normalized = summary.trim();
  if (!normalized) return [];
  const splitAt = Math.max(1, Math.ceil(normalized.length / 2));
  const boundaryCandidates = [normalized.lastIndexOf(" ", splitAt), normalized.lastIndexOf("、", splitAt)]
    .filter((position) => position >= Math.floor(normalized.length * 0.3));
  const boundary = boundaryCandidates.length ? Math.max(...boundaryCandidates) : splitAt;
  return [normalized.slice(0, boundary).trim(), normalized.slice(boundary).replace(/^[\s、]+/, "").trim()].filter(Boolean);
}
