import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, KeyRound, LogIn, MailCheck, ShieldCheck, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import { Alert, Button, Card, ErrorText, Field, TextInput } from "../components/ui";

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
    <div className="mx-auto max-w-md">
      <Card className="p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-xl bg-teal text-white shadow-card">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold leading-tight">{title}</h1>
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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      icon={LogIn}
      title="Welcome back"
      description="Sign in to continue your assessment or download your report."
      footer={
        <>
          <p>
            <Link to="/forgot-password">Forgot your password?</Link>
          </p>
          <p className="text-muted">
            New here? <Link to="/get-started">Get started</Link> or{" "}
            <Link to="/signup">create an account</Link>
          </p>
        </>
      }
    >
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
        <Field label="Password" required>
          <TextInput
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" loading={busy} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

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
          className="mt-5 inline-flex min-h-13 w-full items-center justify-center rounded-xl bg-teal px-6 py-3 text-lg font-medium text-white no-underline shadow-card transition-colors hover:bg-teal-dark"
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
