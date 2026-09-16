import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Check, CheckCircle2, Info, Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: LucideIcon;
  loading?: boolean;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-teal text-white shadow-card hover:bg-teal-dark hover:shadow-lift active:translate-y-px",
    secondary:
      "bg-paper text-ink border border-line shadow-card hover:border-line-strong hover:bg-cream active:translate-y-px",
    ghost: "bg-transparent text-teal-dark hover:bg-teal-soft",
    danger: "bg-terracotta-soft text-terracotta hover:bg-terracotta hover:text-white",
  };
  const sizes = {
    sm: "min-h-11 px-4 py-2 text-base",
    md: "min-h-13 px-6 py-3 text-lg",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${styles[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="size-5" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  return (
    <Tag
      className={`rounded-2xl border border-line bg-paper/90 shadow-card backdrop-blur-sm ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  tone = "teal",
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/70 px-6 py-5">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className={`grid size-11 place-items-center rounded-xl ${TONES[tone].soft}`}>
            <Icon className="size-6" aria-hidden="true" />
          </span>
        ) : null}
        <div>
          <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
          {subtitle ? <p className="mt-1 text-base text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

type Tone = "teal" | "amber" | "sage" | "terracotta" | "neutral";

const TONES: Record<Tone, { soft: string; solid: string; text: string }> = {
  teal: { soft: "bg-teal-soft text-teal-dark", solid: "bg-teal", text: "text-teal-dark" },
  amber: { soft: "bg-amber-soft text-amber", solid: "bg-amber", text: "text-amber" },
  sage: { soft: "bg-sage-soft text-sage", solid: "bg-sage", text: "text-sage" },
  terracotta: {
    soft: "bg-terracotta-soft text-terracotta",
    solid: "bg-terracotta",
    text: "text-terracotta",
  },
  neutral: { soft: "bg-linen text-muted", solid: "bg-line-strong", text: "text-muted" },
};

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "teal",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper/90 p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-xl ${TONES[tone].soft}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <p className="text-base text-muted">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-base text-muted">{hint}</p> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
  as: Tag = "label",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  as?: "label" | "fieldset";
}) {
  const heading = (
    <>
      <span className="block text-lg font-medium leading-snug">
        {label}
        {required ? (
          <span className="ml-1 text-terracotta" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {hint ? <span className="mt-1 block text-base text-muted">{hint}</span> : null}
    </>
  );
  if (Tag === "fieldset") {
    return (
      <fieldset className="block space-y-3 border-0 p-0">
        <legend className="mb-2 p-0">{heading}</legend>
        {children}
      </fieldset>
    );
  }
  return (
    <label className="block space-y-2">
      {heading}
      {children}
    </label>
  );
}

const inputClass =
  "w-full min-h-13 rounded-xl border border-line bg-paper px-4 py-3 text-ink shadow-inner transition-colors placeholder:text-muted/70 hover:border-line-strong focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/15";

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} min-h-32 leading-relaxed ${className}`} {...props} />;
}

export function ChoiceCard({
  type,
  name,
  checked,
  onChange,
  label,
  required,
}: {
  type: "radio" | "checkbox";
  name?: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  required?: boolean;
}) {
  return (
    <label
      className={`flex min-h-13 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150 ${
        checked
          ? "border-teal bg-teal-soft shadow-card"
          : "border-line bg-paper hover:border-line-strong hover:bg-cream"
      }`}
    >
      <input
        type={type}
        name={name}
        required={required}
        checked={checked}
        onChange={onChange}
        className="shrink-0"
      />
      <span className="leading-snug">{label}</span>
    </label>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  purchased: "teal",
  intake_started: "teal",
  awaiting_uploads: "teal",
  submitted: "amber",
  under_review: "amber",
  report_in_progress: "amber",
  completed: "sage",
};

export function StatusChip({
  status,
  label,
  size = "md",
}: {
  status: string;
  label: string;
  size?: "sm" | "md";
}) {
  const tone = TONES[STATUS_TONE[status] ?? "neutral"];
  const compact = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${tone.soft} ${
        compact ? "px-2 py-0.5 text-xs" : "gap-2 px-3.5 py-1.5 text-base"
      }`}
    >
      <span className={`rounded-full ${tone.solid} ${compact ? "size-1.5" : "size-2"}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${TONES[tone].soft}`}
    >
      {children}
    </span>
  );
}

export function Alert({
  tone = "teal",
  title,
  children,
}: {
  tone?: "teal" | "amber" | "terracotta" | "sage";
  title?: string;
  children: ReactNode;
}) {
  const Icon =
    tone === "amber" ? AlertTriangle : tone === "terracotta" ? AlertTriangle : tone === "sage" ? CheckCircle2 : Info;
  const box = {
    teal: "border-teal/25 bg-teal-soft/70 text-ink",
    amber: "border-amber/30 bg-amber-soft text-ink",
    terracotta: "border-terracotta/30 bg-terracotta-soft text-ink",
    sage: "border-sage/30 bg-sage-soft text-ink",
  }[tone];
  return (
    <div className={`flex gap-3 rounded-2xl border px-5 py-4 ${box}`} role="status">
      <Icon className={`mt-0.5 size-6 shrink-0 ${TONES[tone].text}`} aria-hidden="true" />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-base leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      className="flex items-start gap-3 rounded-xl border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-terracotta"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function ProgressBar({
  value,
  max,
  label,
  tone = "teal",
}: {
  value: number;
  max: number;
  label: string;
  tone?: Tone;
}) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-between gap-4 text-base">
        <span className="font-medium">{label}</span>
        <span className="text-muted tabular-nums">{pct}%</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${TONES[tone].solid}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current ? "w-6 bg-teal" : i === current ? "w-8 bg-teal-dark" : "w-3 bg-line-strong"
          }`}
        />
      ))}
    </div>
  );
}

export function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-3">
          <span
            className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
              item.done ? "bg-sage text-white" : "border border-line-strong bg-paper"
            }`}
            aria-hidden="true"
          >
            {item.done ? <Check className="size-4" strokeWidth={3} /> : null}
          </span>
          <span className={item.done ? "text-ink" : "text-muted"}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <Card className="px-6 py-14 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal-soft text-teal-dark">
        <Icon className="size-8" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-2xl font-semibold">{title}</h2>
      {children ? <div className="mx-auto mt-2 max-w-md text-muted">{children}</div> : null}
    </Card>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-line/70 ${className}`} />;
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="flex items-center gap-2 text-base font-medium uppercase tracking-wide text-teal">
            {Icon ? <Icon className="size-5" aria-hidden="true" /> : null}
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-4xl font-semibold leading-tight">{title}</h1>
        {description ? <p className="mt-3 text-lg leading-relaxed text-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
