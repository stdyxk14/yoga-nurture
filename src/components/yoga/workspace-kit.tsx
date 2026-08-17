import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkspacePageHeader({
  title,
  description,
  eyebrow,
  backLink,
  meta,
  actions,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  backLink?: { href: string; label: string };
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="rounded-2xl border border-[var(--yn-border)] bg-[var(--yn-surface)] px-4 py-4 shadow-[var(--yn-shadow-soft)] lg:px-5 lg:py-5">
      {backLink ? (
        <Link
          href={backLink.href}
          className="mb-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-[var(--yn-text-muted)] transition hover:bg-[var(--yn-surface-muted)] hover:text-[var(--yn-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)] focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLink.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1 text-[13px] font-medium tracking-[0.06em] text-[#6f8e70]">{eyebrow}</p> : null}
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.025em] text-[var(--yn-text)]">{title}</h1>
          {description ? <p className="mt-1.5 max-w-[780px] text-[14px] leading-6 text-[var(--yn-text-muted)]">{description}</p> : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[var(--yn-text-muted)]">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-4 border-t border-[var(--yn-border-subtle)] pt-4">{children}</div> : null}
    </header>
  );
}

type WorkspaceActionVariant = "primary" | "secondary" | "ghost" | "danger";

type WorkspaceActionCommon = {
  children: ReactNode;
  icon?: LucideIcon;
  primary?: boolean;
  variant?: WorkspaceActionVariant;
  className?: string;
};

type WorkspaceActionProps =
  | (WorkspaceActionCommon & { href: string })
  | (WorkspaceActionCommon & { href?: never } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">);

export function WorkspaceAction(props: WorkspaceActionProps) {
  const { children, icon: Icon, primary = false, variant = primary ? "primary" : "secondary", className } = props;
  const actionClassName = cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55",
    variant === "primary" && "bg-[var(--yn-primary)] text-white shadow-[0_5px_14px_rgba(64,113,77,0.16)] hover:bg-[var(--yn-primary-strong)]",
    variant === "secondary" && "border border-[#d4ddd0] bg-white text-[#456d4c] hover:border-[#b9cbb5] hover:bg-[#f3f8f1]",
    variant === "ghost" && "text-[var(--yn-text-muted)] hover:bg-[var(--yn-surface-muted)] hover:text-[var(--yn-text)]",
    variant === "danger" && "border border-[#efc9c0] bg-[#fff5f1] text-[#bd5d50] hover:border-[#e9aa9c] hover:bg-[#ffede7]",
    className,
  );
  const content = (
    <>
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </>
  );

  if ("href" in props && props.href) {
    return <Link href={props.href} className={actionClassName}>{content}</Link>;
  }

  const { href: _href, icon: _icon, primary: _primary, variant: _variant, className: _className, children: _children, ...buttonProps } = props;
  void _href;
  void _icon;
  void _primary;
  void _variant;
  void _className;
  void _children;
  return <button className={actionClassName} {...buttonProps}>{content}</button>;
}

export function WorkspaceActionBar({
  children,
  danger,
  sticky = true,
  className,
}: {
  children: ReactNode;
  danger?: ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "z-30 flex min-w-0 flex-col gap-2 rounded-xl border border-[var(--yn-border)] bg-[#fffdf9]/96 p-2.5 shadow-[var(--yn-shadow-raised)] backdrop-blur md:flex-row md:items-center md:justify-between",
        sticky && "sticky top-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      {danger ? <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--yn-border-subtle)] pt-2 md:border-l md:border-t-0 md:pl-2 md:pt-0">{danger}</div> : null}
    </div>
  );
}

export function WorkspacePanel({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Tag className={cn("min-w-0 rounded-xl border border-[var(--yn-border)] bg-[var(--yn-surface)] p-4", className)}>{children}</Tag>;
}

export function WorkspaceFormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <WorkspacePanel className={cn("space-y-4", className)}>
      <div className="border-b border-[var(--yn-border-subtle)] pb-3">
        <h2 className="text-[17px] font-semibold text-[var(--yn-text)]">{title}</h2>
        {description ? <p className="mt-1 text-[13px] leading-5 text-[var(--yn-text-muted)]">{description}</p> : null}
      </div>
      {children}
    </WorkspacePanel>
  );
}

export function WorkspaceField({
  label,
  required = false,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid min-w-0 gap-1.5", className)}>
      <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-[#4f584e]">
        {label}
        {required ? <span className="rounded bg-[#fff0ea] px-1.5 py-0.5 text-[11px] font-semibold text-[#bd5d50]">必須</span> : null}
      </span>
      {children}
      {error ? <span className="text-[13px] leading-5 text-[#bd5d50]">{error}</span> : hint ? <span className="text-[13px] leading-5 text-[var(--yn-text-muted)]">{hint}</span> : null}
    </label>
  );
}

export function WorkspaceFeedback({
  tone,
  children,
  className,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertTriangle : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] font-medium leading-5",
        tone === "success" && "border-[#c9dcc6] bg-[#f2f8f0] text-[#477b52]",
        tone === "error" && "border-[#efc9c0] bg-[#fff3ef] text-[#b95542]",
        tone === "info" && "border-[#d9d4e9] bg-[#f6f3fb] text-[#6f6497]",
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export type WorkspaceTabGroup<T extends string> = {
  label: string;
  items: Array<{ id: T; label: string; href: string; icon?: LucideIcon; prefetch?: boolean }>;
};

export function WorkspaceTabs<T extends string>({ groups, active }: { groups: WorkspaceTabGroup<T>[]; active: T }) {
  return (
    <nav aria-label="画面セクション" className="flex min-w-0 flex-wrap gap-x-4 gap-y-3">
      {groups.map((group) => (
        <div key={group.label} className="min-w-0">
          <p className="mb-1.5 text-[12px] font-medium tracking-[0.06em] text-[#7d837a]">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const selected = active === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={item.prefetch}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-[13px] font-semibold shadow-[0_1px_3px_rgba(76,88,74,0.05)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)] focus-visible:ring-offset-2",
                    selected
                      ? "border-[#8faf8c] bg-[#e4efe1] text-[#2f623c] shadow-[0_4px_12px_rgba(61,105,70,0.12)] ring-1 ring-[#b8ceb3]"
                      : "border-[#d7ddd2] bg-white/90 text-[#4d5c50] hover:border-[#adc3aa] hover:bg-[#f1f7ef] hover:text-[#2f4e37] hover:shadow-[0_3px_9px_rgba(76,88,74,0.09)]",
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
    <div className={cn("rounded-xl border border-[var(--yn-border)] bg-white/78 p-3 shadow-[0_2px_9px_rgba(91,76,53,0.03)]", className)}>
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
  active = false,
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  tone?: "green" | "purple" | "coral" | "sand";
  active?: boolean;
}) {
  const toneClass = {
    green: "text-[#477b52]",
    purple: "text-[#7568a7]",
    coral: "text-[#bd5d50]",
    sand: "text-[#8b704c]",
  }[tone];
  const content = (
    <>
      <p className={cn("text-[13px] font-medium", active ? "text-[#315f3c]" : "text-[#6b7268]")}>{label}</p>
      <p className={cn("mt-1 text-[25px] font-semibold tracking-[-0.02em]", active ? "text-[#2f6740]" : toneClass)}>{value}</p>
      {detail ? <p className={cn("mt-1 text-[13px] leading-5", active ? "text-[#526653]" : "text-[#737a70]")}>{detail}</p> : null}
    </>
  );
  const className = cn(
    "min-w-0 rounded-xl border border-[var(--yn-border)] bg-white/78 px-3.5 py-3 text-left",
    href && "transition hover:border-[#adc3aa] hover:bg-[#f3f8f1] hover:shadow-[0_4px_12px_rgba(76,88,74,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yn-focus)] focus-visible:ring-offset-2",
    active && "border-[#88aa84] bg-[#e6f1e3] shadow-[0_6px_18px_rgba(70,111,77,0.14)] ring-1 ring-[#aec8a9] hover:border-[#789e75] hover:bg-[#e1eedf]",
  );
  return href ? <Link href={href} aria-current={active ? "page" : undefined} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

export function WorkspaceTableContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-xl border border-[var(--yn-border)] bg-white/82", className)}>
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
  return <span className={cn("inline-flex min-h-7 items-center rounded-full border px-2.5 text-[13px] font-medium", className)}>{children}</span>;
}
