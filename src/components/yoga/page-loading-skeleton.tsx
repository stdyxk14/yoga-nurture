type PageLoadingSkeletonProps = {
  variant?: "dashboard" | "list" | "detail" | "settings";
};

export function PageLoadingSkeleton({ variant = "list" }: PageLoadingSkeletonProps) {
  const detail = variant === "detail";
  const settings = variant === "settings";
  const dashboard = variant === "dashboard";
  const cardCount = dashboard ? 4 : settings ? 4 : detail ? 3 : 6;

  return (
    <div
      className="mx-auto w-full max-w-full space-y-4 pb-24 md:pb-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="読み込み中"
    >
      <span className="sr-only">ページを読み込んでいます</span>

      <div className="animate-pulse rounded-2xl border border-[var(--yn-border)] bg-[var(--yn-surface)] p-4 shadow-[var(--yn-shadow-soft)] motion-reduce:animate-none">
        <div className="h-6 w-40 rounded-full bg-[#dfeada]" />
        <div className="mt-3 h-3 w-full max-w-md rounded-full bg-[#eee7dc]" />
      </div>

      {dashboard ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonCard key={index} compact />
          ))}
        </div>
      ) : null}

      <div className={detail ? "grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"}>
        {Array.from({ length: cardCount }, (_, index) => (
          <SkeletonCard key={index} tall={detail && index === 0} />
        ))}
      </div>
    </div>
  );
}

function SkeletonCard({ compact = false, tall = false }: { compact?: boolean; tall?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-[var(--yn-border)] bg-white/76 p-4 motion-reduce:animate-none ${
        tall ? "min-h-72" : compact ? "min-h-28" : "min-h-40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-2xl bg-[#e4eee0]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded-full bg-[#dfeada]" />
          <div className="h-3 w-1/2 rounded-full bg-[#eee7dc]" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-3 w-full rounded-full bg-[#eee7dc]" />
        <div className="h-3 w-5/6 rounded-full bg-[#eee7dc]" />
        {compact ? null : <div className="h-9 w-full rounded-xl bg-[#edf4ea]" />}
      </div>
    </div>
  );
}
