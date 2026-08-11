import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WorkspacePageHeader({
  title,
  description,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="rounded-2xl border border-[#e8e0d5] bg-[#fffdf9]/92 px-4 py-4 shadow-[0_5px_18px_rgba(91,76,53,0.045)] lg:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1 text-[12px] font-semibold tracking-[0.08em] text-[#6f8e70]">{eyebrow}</p> : null}
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#283027]">{title}</h1>
          <p className="mt-1 max-w-[760px] text-[14px] leading-6 text-[#626a60]">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-4 border-t border-[#eee7dd] pt-4">{children}</div> : null}
    </header>
  );
}

export function WorkspaceAction({
  href,
  children,
  icon: Icon,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  icon?: LucideIcon;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76] focus-visible:ring-offset-2",
        primary
          ? "bg-[#5d8f68] text-white shadow-[0_5px_14px_rgba(64,113,77,0.16)] hover:bg-[#4e805a]"
          : "border border-[#d9dfd3] bg-white text-[#456d4c] hover:border-[#b9cbb5] hover:bg-[#f3f8f1]",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </Link>
  );
}

export type WorkspaceTabGroup<T extends string> = {
  label: string;
  items: Array<{ id: T; label: string; href: string; icon?: LucideIcon }>;
};

export function WorkspaceTabs<T extends string>({ groups, active }: { groups: WorkspaceTabGroup<T>[]; active: T }) {
  return (
    <nav aria-label="画面セクション" className="flex min-w-0 flex-wrap gap-x-5 gap-y-3">
      {groups.map((group) => (
        <div key={group.label} className="min-w-0">
          <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-[#8a8f85]">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const selected = active === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]",
                    selected ? "bg-[#e6f0e3] text-[#386b46]" : "text-[#5f665c] hover:bg-[#f4f1eb] hover:text-[#34423a]",
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function WorkspaceToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-[#e8e0d5] bg-white/76 p-3 shadow-[0_3px_12px_rgba(91,76,53,0.035)]", className)}>
      {children}
    </div>
  );
}

export function WorkspaceSummaryCard({
  label,
  value,
  detail,
  href,
  tone = "green",
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  tone?: "green" | "purple" | "coral" | "sand";
}) {
  const toneClass = {
    green: "text-[#477b52]",
    purple: "text-[#7568a7]",
    coral: "text-[#c96354]",
    sand: "text-[#8b704c]",
  }[tone];
  const content = (
    <>
      <p className="text-[13px] font-medium text-[#6b7268]">{label}</p>
      <p className={cn("mt-1 text-[25px] font-semibold tracking-[-0.02em]", toneClass)}>{value}</p>
      {detail ? <p className="mt-1 text-[12px] leading-5 text-[#7a8077]">{detail}</p> : null}
    </>
  );
  const className = cn(
    "min-w-0 rounded-xl border border-[#e8e0d5] bg-white/78 px-3.5 py-3 text-left",
    href && "transition hover:border-[#bdcfb9] hover:bg-[#f7faf5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]",
  );
  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

export function WorkspaceTableContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#e5ddd2] bg-white/82", className)}>
      <div className="max-w-full overflow-x-auto">{children}</div>
    </div>
  );
}

export function WorkspaceSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-[#30372f]">{title}</h2>
          {description ? <p className="mt-0.5 text-[13px] leading-5 text-[#70776e]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function WorkspaceEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[#cfd9ca] bg-[#f7faf5] px-5 py-8 text-center">
      <p className="text-[15px] font-semibold text-[#384338]">{title}</p>
      <p className="mx-auto mt-1 max-w-[620px] text-[13px] leading-6 text-[#6c756a]">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function WorkspaceStatus({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "purple" | "coral" | "sand" | "neutral" }) {
  const className = {
    green: "border-[#c9dcc6] bg-[#edf5eb] text-[#477b52]",
    purple: "border-[#ddd5ee] bg-[#f3effb] text-[#7568a7]",
    coral: "border-[#f0d0ca] bg-[#fff1ed] text-[#bd5d50]",
    sand: "border-[#ead9bc] bg-[#fff8e9] text-[#8b704c]",
    neutral: "border-[#dedbd4] bg-[#f6f4ef] text-[#666b63]",
  }[tone];
  return <span className={cn("inline-flex min-h-7 items-center rounded-full border px-2.5 text-[12px] font-semibold", className)}>{children}</span>;
}
