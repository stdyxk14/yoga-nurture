import type { LucideIcon } from "lucide-react";
import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatJapaneseDate } from "@/lib/date-format";

export function PageHeader({
  title,
  subtitle,
  greeting,
}: {
  title: string;
  subtitle?: string;
  greeting?: string;
}) {
  return (
    <header className="mb-4 flex flex-col gap-3 rounded-2xl border border-[var(--yn-border)] bg-[var(--yn-surface)] px-4 py-4 shadow-[var(--yn-shadow-soft)] sm:flex-row sm:items-start sm:justify-between lg:px-5">
      <div className="min-w-0">
        {greeting ? <p className="mb-1 text-[13px] font-medium tracking-[0.04em] text-[#6f8e70]">{greeting}</p> : null}
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.025em] text-[var(--yn-text)]">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-[14px] leading-6 text-[var(--yn-text-muted)]">{subtitle}</p> : null}
      </div>
      <div suppressHydrationWarning className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[var(--yn-border-subtle)] bg-white/70 px-3 text-[13px] font-medium text-[#596159]">
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        {formatJapaneseDate()}
      </div>
    </header>
  );
}

export function SoftCard({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn("rounded-xl border-[var(--yn-border)] bg-[var(--yn-surface)] p-4 shadow-[var(--yn-shadow-soft)]", className)}
      {...props}
    >
      {children}
    </Card>
  );
}

export function SectionTitle({
  icon: Icon,
  title,
  action,
  subtitle,
}: {
  icon?: LucideIcon;
  title: string;
  action?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon ? <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#4b845a]" strokeWidth={1.8} aria-hidden="true" /> : null}
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold leading-6 text-[var(--yn-text)]">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[13px] font-normal leading-5 text-[var(--yn-text-muted)]">{subtitle}</p> : null}
        </div>
      </div>
      {action ? (
        <Link href="#" className="flex shrink-0 items-center rounded-lg px-2 py-1 text-[13px] font-semibold text-[#5b8f66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)]">
          {action}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "green",
  detail,
}: {
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  tone?: "green" | "blue" | "purple" | "beige";
  detail?: string;
}) {
  const toneMap = {
    green: "text-[#477e55] bg-[#eef6ec]",
    blue: "text-[#1f6eb9] bg-[#edf5ff]",
    purple: "text-[#6a55bb] bg-[#f3f0ff]",
    beige: "text-[#8b704c] bg-[#f7f1e6]",
  };

  return (
    <SoftCard className="min-h-[120px] p-3">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", toneMap[tone])}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[14px] font-semibold">{label}</p>
          <div className="mt-1.5 flex items-end gap-2">
            <span className={cn("text-[36px] font-semibold leading-none", toneMap[tone].split(" ")[0])}>{value}</span>
            <span className="pb-1.5 text-[13px] font-semibold">{unit}</span>
          </div>
        </div>
      </div>
      {detail ? <p className="mt-1.5 text-[13px] font-normal text-[#677064]">{detail}</p> : null}
    </SoftCard>
  );
}

export function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <Badge
      className={cn(
        "rounded-full border px-3 py-1 text-[13px] font-medium shadow-none",
        active
          ? "border-[#5d956d] bg-[#5d956d] text-white"
          : "border-[#dbe4d6] bg-[#f4f8f1] text-[#4f7b58]",
      )}
    >
      {children}
    </Badge>
  );
}

export function MiniBar({ value, tone = "green" }: { value: number; tone?: "green" | "purple" | "coral" }) {
  const color = tone === "purple" ? "bg-[#9b8ed0]" : tone === "coral" ? "bg-[#ec907d]" : "bg-[#629268]";
  return (
    <div className="h-2 w-full rounded-full bg-[#ecebe5]">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function CircleBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#dfe9d7] text-sm font-semibold text-[#486f49]", className)}>
      {children}
    </span>
  );
}
