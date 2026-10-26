import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Handshake,
  Headset,
  Heart,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  Shield,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import { Alert, Button, Card, ErrorText, Field, TextInput } from "../components/ui";
import { VoiceChrome } from "../components/VoiceInput";

const REMEMBER_KEY = "livsafe-client-remember-email";
const BRAND_LOGO =
  "https://res.cloudinary.com/hoevqlxx/image/upload/v1791102373/ktmc_text_back_pdf.pdf.png";
const LOGIN_BG =
  "https://res.cloudinary.com/hoevqlxx/image/upload/v1791645170/c3538082-6ea6-48e0-80a2-9e9aa9ca581d.webp";
const SUPPORT_EMAIL = "hello@livsafehomesafety.com";
const SITE_ORIGIN = "https://livsafehome.com";

const DESKTOP_FEATURES = [
  {
    icon: Shield,
    title: "Safer",
    body: "Spot fall risks before they become a problem",
  },
  {
    icon: Heart,
    title: "Healthier",
    body: "Support independence in the home that matters",
  },
  {
    icon: Handshake,
    title: "Together",
    body: "Built for the person living there — and family nearby or far away",
  },
] as const;

function AuthCard({
  icon: Icon,
  title,
  description,
  children,
  footer,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="p-5 sm:p-8">
        <span className="grid size-12 place-items-center rounded-lg bg-teal text-white shadow-card">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-[1.75rem] font-semibold leading-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 leading-relaxed text-muted">{description}</p> : null}
        <div className="mt-6">{children}</div>
        {footer ? (
          <div className="mt-6 space-y-2 border-t border-line/70 pt-5 text-base">{footer}</div>
        ) : null}
      </Card>
    </div>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
        <Loader2 className="size-8 animate-spin text-teal" aria-hidden="true" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }
  if (user && user.role !== "admin") return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* ignore */
      }
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  const formFields = (
    <>
      <VoiceChrome>
        {(bind) => (
          <>
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-placeholder"
              aria-hidden="true"
            />
            <input
              ref={bind.ref}
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              aria-label="Email address"
              aria-describedby={bind.describedBy}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-12 rounded-lg border border-line-strong bg-paper py-3 pr-14 pl-11 text-ink transition-colors placeholder:text-placeholder hover:border-muted focus:border-wellness focus:outline-none focus:ring-4 focus:ring-wellness/15"
            />
          </>
        )}
      </VoiceChrome>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-placeholder"
          aria-hidden="true"
        />
        <input
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full min-h-12 rounded-lg border border-line-strong bg-paper py-3 pr-12 pl-11 text-ink transition-colors placeholder:text-placeholder hover:border-muted focus:border-wellness focus:outline-none focus:ring-4 focus:ring-wellness/15"
        />
        <button
          type="button"
          className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </>
  );

  return (
    <>
    <div className="login-screen relative flex min-h-dvh flex-col lg:hidden">
      <img src={LOGIN_BG} alt="" className="login-photo" width={941} height={1672} />
      <div className="relative z-10 mx-auto flex w-full max-w-[28rem] flex-1 flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-[30rem] sm:px-6 md:justify-center md:py-10">
        <div className="flex flex-col items-center pt-2 text-center">
          <img src={BRAND_LOGO} alt="LivSafe" width={2172} height={724} className="client-login-logo" />
          <p className="mt-2 text-xs font-semibold tracking-[0.16em] text-[#4b6470] uppercase sm:text-sm">
            Safer spaces · Healthier lives
          </p>
        </div>

        <div className="h-44 shrink-0 md:hidden" aria-hidden="true" />

        <div className="relative z-10 -mt-8 w-full rounded-[1.75rem] bg-white px-5 py-6 shadow-[0_16px_40px_rgba(20,70,90,0.14)] md:mt-8 sm:px-7 sm:py-8">
          <div className="flex flex-col items-center text-center">
            <img src={BRAND_LOGO} alt="" width={2172} height={724} className="client-login-logo client-login-logo--card" />
            <h1 className="mt-3 text-[1.75rem] font-bold tracking-tight text-ink">Welcome Back</h1>
            <p className="mt-1 text-base text-muted">Sign in to access your LivSafe account</p>
          </div>

          <form className="mt-5 space-y-3" onSubmit={onSubmit}>
            {formFields}
            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex min-h-11 items-center gap-2.5 text-base text-muted">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-line-strong accent-[#14a3c0]"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-base font-semibold text-[#0e8eaa] no-underline hover:underline">
                Forgot password?
              </Link>
            </div>
            <ErrorText>{error}</ErrorText>
            <button
              type="submit"
              disabled={busy}
              className="login-sign-in inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
              Sign In
              {!busy ? <ArrowRight className="size-5" aria-hidden="true" /> : null}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="text-sm font-medium tracking-wide text-muted uppercase">Or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="login-support inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold no-underline transition-colors"
          >
            <Headset className="size-5" aria-hidden="true" />
            Contact Support
          </a>
        </div>
      </div>
    </div>

    <div className="login-desktop-bg hidden min-h-dvh lg:grid lg:grid-cols-2">
      <aside className="flex min-h-dvh min-w-0 flex-col px-8 py-6 xl:px-12 xl:py-8">
        <div>
          <img src={BRAND_LOGO} alt="LivSafe" width={2172} height={724} className="client-login-logo" />
          <p className="mt-3 text-sm font-medium tracking-[0.18em] text-[#4b6470] uppercase">
            Safer spaces · Healthier lives
          </p>
        </div>
        <div className="max-w-xl pt-8 xl:pt-10">
          <h2 className="text-pretty text-[clamp(1.875rem,2.6vw,2.75rem)] font-bold leading-tight tracking-tight text-ink">
            Creating <span className="text-wellness">safer spaces</span> for a{" "}
            <span className="text-[#2563EB]">healthier tomorrow</span>.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted xl:text-lg">
            LivSafe is a remote home safety assessment. Complete a questionnaire, upload photos, and receive
            prioritized recommendations — no one visits the home.
          </p>
          <ul className="mt-5 space-y-3">
            {DESKTOP_FEATURES.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-wellness text-white">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-base font-semibold text-ink">{item.title}</span>
                  <span className="mt-0.5 block text-base leading-snug text-muted">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-auto pt-6 text-sm font-medium tracking-[0.18em] text-[#4b6470] uppercase">
          A safer tomorrow together
        </p>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <div className="flex shrink-0 items-center justify-end gap-3 px-6 py-3 xl:px-8">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-base font-medium text-muted no-underline hover:text-ink">
            Need help?
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="login-support inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-base font-semibold no-underline transition-colors"
          >
            <Headset className="size-4" aria-hidden="true" />
            Contact Support
          </a>
        </div>

        <div className="flex w-full flex-1 flex-col px-6 py-6">
          <div className="m-auto w-full max-w-md rounded-[1.75rem] bg-white px-7 py-8 shadow-[0_16px_40px_rgba(20,70,90,0.14)]">
            <div className="flex flex-col items-center text-center">
              <img src={BRAND_LOGO} alt="" width={2172} height={724} className="client-login-logo client-login-logo--card" />
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink">Welcome Back</h1>
              <p className="mt-2 text-base text-muted xl:text-lg">Sign in to access your LivSafe account</p>
            </div>

            <form className="mt-5 space-y-3" onSubmit={onSubmit}>
              {formFields}
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex min-h-11 items-center gap-2.5 text-base text-muted">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border-line-strong accent-[#14a3c0]"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-base font-semibold text-[#0e8eaa] no-underline hover:underline">
                  Forgot password?
                </Link>
              </div>
              <ErrorText>{error}</ErrorText>
              <button
                type="submit"
                disabled={busy}
                className="login-sign-in inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
                Login
                {!busy ? <ArrowRight className="size-5" aria-hidden="true" /> : null}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-line" />
              <span className="text-sm font-medium tracking-wide text-muted uppercase">Or</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="login-support inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold no-underline transition-colors"
            >
              <Headset className="size-5" aria-hidden="true" />
              Contact Support
            </a>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1 px-6 py-3 text-center">
          <p className="text-base text-muted">
            <a href={`${SITE_ORIGIN}/privacy/`} className="no-underline hover:underline">
              Privacy Policy
            </a>
            <span className="mx-2 text-line-strong" aria-hidden="true">
              |
            </span>
            <a href={`${SITE_ORIGIN}/terms/`} className="no-underline hover:underline">
              Terms of Service
            </a>
          </p>
          <p className="text-sm text-text-muted">© {new Date().getFullYear()} LivSafe. All rights reserved.</p>
        </div>
      </div>
    </div>
    </>
  );
}


export function SignupPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
        <Loader2 className="size-8 animate-spin text-teal" aria-hidden="true" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }
  if (user && user.role !== "admin") return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password, name }) });
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      icon={UserPlus}
      title="Create an account"
      description="Your portal keeps intake answers and photos in one private place."
      footer={
        <p className="text-muted">
          Already registered? <Link to="/login">Sign in instead</Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Email" required>
          <TextInput
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" required hint="At least 8 characters.">
          <TextInput
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" loading={busy} className="w-full">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      icon={KeyRound}
      title="Reset your password"
      description={done ? undefined : "We will email you a link to choose a new password."}
      footer={
        <p className="text-muted">
          <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      {done ? (
        <Alert tone="sage" title="Check your email">
          If that address is on file, a reset link is on its way. The link works for one hour.
        </Alert>
      ) : (
        <form className="space-y-5" onSubmit={onSubmit}>
          <Field label="Email" required>
            <TextInput
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" icon={MailCheck} loading={busy} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: params.get("email"),
          token: params.get("token"),
          password,
        }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthCard icon={CheckCircle2} title="Password updated">
        <Alert tone="sage">You can now sign in with your new password.</Alert>
        <Link
          to="/login"
          className="mt-5 inline-flex min-h-13 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-lg font-medium text-white no-underline shadow-card transition-colors hover:bg-primary-hover"
        >
          Sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={ShieldCheck}
      title="Choose a new password"
      description="Pick something you will remember — at least 8 characters."
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <Field label="New password" required>
          <TextInput
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" loading={busy} className="w-full">
          Save password
        </Button>
      </form>
    </AuthCard>
  );
}
