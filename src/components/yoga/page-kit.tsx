import type { LucideIcon } from "lucide-react";
import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <header className="mb-3 flex items-start justify-between">
      <div>
        {greeting ? <p className="mb-1 text-[14px] font-bold">{greeting}</p> : null}
        <div className="flex items-end gap-4">
          <h1 className="text-[23px] font-extrabold leading-tight tracking-normal">{title}</h1>
          {subtitle ? <p className="pb-1 text-[14px] font-semibold text-[#5d5d58]">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex h-9 items-center gap-2 rounded-xl bg-white/70 px-3 text-[13px] font-semibold text-[#30362f]">
        <CalendarDays className="h-4 w-4" />
        2025年5月20日（火）
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
      className={cn("rounded-2xl border-[#e7dfd4] bg-white/78 p-3.5 shadow-[0_10px_24px_rgba(91,76,53,0.06)]", className)}
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
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-[18px] w-[18px] text-[#4b845a]" strokeWidth={1.8} /> : null}
        <h2 className="text-[16px] font-bold">{title}</h2>
        {subtitle ? <span className="text-[12px] font-semibold text-[#879080]">{subtitle}</span> : null}
      </div>
      {action ? (
        <Link href="#" className="flex items-center text-[12px] font-bold text-[#5b8f66]">
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
          <p className="text-[14px] font-bold">{label}</p>
          <div className="mt-1.5 flex items-end gap-2">
            <span className={cn("text-[40px] font-extrabold leading-none", toneMap[tone].split(" ")[0])}>{value}</span>
            <span className="pb-1.5 text-[13px] font-bold">{unit}</span>
          </div>
        </div>
      </div>
      {detail ? <p className="mt-1.5 text-[12px] font-semibold text-[#677064]">{detail}</p> : null}
    </SoftCard>
  );
}

export function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <Badge
      className={cn(
        "rounded-full border px-3 py-1 text-[12px] font-bold shadow-none",
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
    <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#dfe9d7] text-sm font-bold text-[#486f49]", className)}>
      {children}
    </span>
  );
}
