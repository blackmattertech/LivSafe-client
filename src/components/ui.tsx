import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  Ref,
  TextareaHTMLAttributes,
} from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Check, CheckCircle2, Info, Loader2 } from "lucide-react";
import { canUseVoice, VoiceChrome } from "./VoiceInput";

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
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  loading?: boolean;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-primary text-white shadow-card hover:bg-primary-hover active:bg-primary-pressed disabled:bg-primary-disabled disabled:text-white",
    secondary: "bg-paper text-ink border border-line-strong hover:bg-linen",
    ghost: "bg-transparent text-teal hover:bg-teal-soft",
    danger: "bg-terracotta text-white hover:bg-error-hover",
  };
  const sizes = {
    sm: "min-h-11 px-4 py-2 text-sm",
    md: "min-h-12 px-5 py-3 text-base",
    lg: "min-h-14 px-5 py-3.5 text-lg",
  };
  return (
    <button
      className={`inline-flex max-w-full items-center justify-center gap-2 rounded-lg text-center font-medium whitespace-normal text-pretty transition-colors duration-150 disabled:cursor-not-allowed disabled:shadow-none ${styles[variant]} ${sizes[size]} ${className}`}
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
      className={`rounded-xl border border-line bg-paper shadow-card ${className}`}
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
    <div className="flex flex-col gap-4 border-b border-line/70 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-6 sm:py-5">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className={`grid size-11 place-items-center rounded-lg ${TONES[tone].soft}`}>
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
    <div className="rounded-xl border border-line bg-paper p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-lg ${TONES[tone].soft}`}>
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
  density = "default",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  as?: "label" | "fieldset";
  density?: "default" | "comfortable";
}) {
  const large = density === "comfortable";
  const heading = (
    <>
      <span
        className={`block text-pretty font-semibold leading-snug text-ink ${
          large ? "text-lg" : "text-sm"
        }`}
      >
        {label}
        {required ? (
          <span className={`ml-1.5 font-medium text-terracotta ${large ? "text-base" : "text-sm"}`}>
            (required)
          </span>
        ) : null}
      </span>
      {hint ? (
        <span
          className={`mt-1.5 block text-pretty leading-relaxed text-muted ${
            large ? "text-base" : "text-[13px]"
          }`}
        >
          {hint}
        </span>
      ) : null}
    </>
  );
  if (Tag === "fieldset") {
    return (
      <fieldset className={`block border-0 p-0 ${large ? "space-y-3.5" : "space-y-3"}`}>
        <legend className="mb-2.5 p-0">{heading}</legend>
        {children}
      </fieldset>
    );
  }
  return (
    <label className={`block ${large ? "space-y-2.5" : "space-y-2"}`}>
      {heading}
      {children}
    </label>
  );
}

const inputClass =
  "w-full min-h-12 rounded-lg border border-line-strong bg-paper px-4 py-3 text-base text-ink transition-colors placeholder:text-placeholder hover:border-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

const inputComfortableClass =
  "w-full min-h-14 rounded-xl border border-line-strong bg-paper px-4 py-3.5 text-lg leading-normal text-ink transition-colors placeholder:text-placeholder hover:border-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

export function TextInput({
  className = "",
  density = "default",
  voice,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  density?: "default" | "comfortable";
  voice?: boolean;
  ref?: Ref<HTMLInputElement>;
}) {
  const fieldClass = `${density === "comfortable" ? inputComfortableClass : inputClass} ${className}`;
  if (!canUseVoice({ type: props.type, disabled: props.disabled, readOnly: props.readOnly, voice })) {
    return <input ref={ref} className={fieldClass} {...props} />;
  }
  return (
    <VoiceChrome fieldRef={ref} align="center">
      {(bind) => (
        <input
          {...props}
          ref={bind.ref}
          className={`${fieldClass} pr-14`}
          aria-describedby={[props["aria-describedby"], bind.describedBy].filter(Boolean).join(" ") || undefined}
        />
      )}
    </VoiceChrome>
  );
}

export function TextArea({
  className = "",
  density = "default",
  voice,
  ref,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  density?: "default" | "comfortable";
  voice?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}) {
  const fieldClass = `${density === "comfortable" ? inputComfortableClass : inputClass} min-h-36 leading-relaxed ${className}`;
  if (!canUseVoice({ disabled: props.disabled, readOnly: props.readOnly, voice })) {
    return <textarea ref={ref} className={fieldClass} {...props} />;
  }
  return (
    <VoiceChrome fieldRef={ref} align="top">
      {(bind) => (
        <textarea
          {...props}
          ref={bind.ref}
          className={`${fieldClass} pr-14`}
          aria-describedby={[props["aria-describedby"], bind.describedBy].filter(Boolean).join(" ") || undefined}
        />
      )}
    </VoiceChrome>
  );
}

const PHONE_COUNTRY_CODES = [
  { code: "+1", label: "+1 USA" },
  { code: "+1-CA", dial: "+1", label: "+1 Canada" },
  { code: "+44", label: "+44 UK" },
  { code: "+91", label: "+91 India" },
  { code: "+61", label: "+61 Australia" },
  { code: "+353", label: "+353 Ireland" },
  { code: "+52", label: "+52 Mexico" },
  { code: "+49", label: "+49 Germany" },
  { code: "+33", label: "+33 France" },
] as const;

export function PhoneInput({
  countryCode = "+1",
  number = "",
  onCountryChange,
  onNumberChange,
  required,
  density = "default",
  id,
  voice,
}: {
  countryCode?: string;
  number?: string;
  onCountryChange: (code: string) => void;
  onNumberChange: (value: string) => void;
  required?: boolean;
  density?: "default" | "comfortable";
  id?: string;
  voice?: boolean;
}) {
  const large = density === "comfortable";
  const control = large ? inputComfortableClass : inputClass;
  const selected = PHONE_COUNTRY_CODES.some((c) => c.code === countryCode) ? countryCode : "+1";
  const enableVoice = canUseVoice({ type: "tel", voice });

  const numberField = (
    extraClass = "",
    bind?: { ref: (node: HTMLInputElement | null) => void; describedBy?: string },
  ) => (
    <input
      ref={bind?.ref}
      id={id}
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      required={required}
      placeholder="Phone number"
      value={number}
      aria-describedby={bind?.describedBy}
      onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s()-]/g, ""))}
      className={`${control} min-w-0 flex-1 ${extraClass}`}
    />
  );

  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor={id ? `${id}-country` : undefined}>
        Country code
      </label>
      <select
        id={id ? `${id}-country` : undefined}
        aria-label="Country code"
        value={selected}
        onChange={(e) => onCountryChange(e.target.value)}
        className={`${control} w-[7.5rem] shrink-0 appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9 sm:w-[8.5rem] ${
          large ? "text-base" : "text-sm"
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        }}
      >
        {PHONE_COUNTRY_CODES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      {enableVoice ? (
        <div className="min-w-0 flex-1">
          <VoiceChrome>
            {(bind) => numberField("pr-14 w-full", bind)}
          </VoiceChrome>
        </div>
      ) : (
        numberField()
      )}
    </div>
  );
}

export function phoneDialCode(countryCode: string) {
  const match = PHONE_COUNTRY_CODES.find((c) => c.code === countryCode);
  if (!match) return "+1";
  return "dial" in match && match.dial ? match.dial : match.code;
}

export function ChoiceCard({
  type,
  name,
  checked,
  onChange,
  label,
  required,
  disabled,
  density = "default",
}: {
  type: "radio" | "checkbox";
  name?: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
  density?: "default" | "comfortable";
}) {
  const large = density === "comfortable";
  const markSize = large ? "size-6" : "size-5";
  return (
    <label
      className={`flex cursor-pointer items-center rounded-xl border transition-colors duration-150 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-teal/25 ${
        disabled ? "cursor-not-allowed opacity-70" : ""
      } ${
        large ? "min-h-14 gap-3.5 px-4 py-4" : "min-h-12 gap-3 rounded-lg px-4 py-3"
      } ${
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
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={`pointer-events-none grid shrink-0 place-items-center ${markSize} ${
          type === "radio" ? "rounded-full" : "rounded-md"
        } ${
          checked
            ? "bg-teal text-white"
            : "border-2 border-line-strong bg-paper"
        }`}
        aria-hidden="true"
      >
        {checked ? (
          type === "radio" ? (
            <span className="size-2 rounded-full bg-white" />
          ) : (
            <Check className={large ? "size-4" : "size-3.5"} strokeWidth={3} />
          )
        ) : null}
      </span>
      <span className={`leading-snug text-pretty ${large ? "text-lg" : "text-base"}`}>{label}</span>
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
    <div className={`flex gap-3 rounded-xl border px-5 py-4 ${box}`} role="status">
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
      className="flex items-start gap-3 rounded-lg border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-terracotta"
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
    <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5" aria-hidden="true">
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
        <span className="mx-auto grid size-16 place-items-center rounded-xl bg-teal-soft text-teal-dark">
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
          <p className="flex items-center gap-2 text-sm font-semibold text-teal">
            {Icon ? <Icon className="size-5" aria-hidden="true" /> : null}
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight sm:text-3xl md:text-4xl">{title}</h1>
        {description ? <p className="mt-3 text-lg leading-relaxed text-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
