import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CircleSlash, Loader2, PartyPopper, ShieldCheck } from "lucide-react";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import { Alert, Button, Card, Checklist, ErrorText, Field, TextInput } from "../components/ui";
import type { Assessment, User } from "../types";

export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { refresh } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    async function poll() {
      for (let i = 0; i < 20; i++) {
        try {
          const data = await api<{ ready: boolean; assessment?: Assessment; user?: User }>(
            `/api/checkout/session/${sessionId}`,
          );
          if (cancelled) return;
          if (data.ready && data.assessment && data.user) {
            setAssessment(data.assessment);
            setUser(data.user);
            setReady(true);
            await refresh();
            return;
          }
        } catch (err) {
          if (cancelled) return;
          if (i === 19) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Payment is still processing. Refresh this page in a moment.",
            );
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 800));
      }
      if (!cancelled) setError("Payment is still processing. Refresh this page in a moment.");
    }
    void poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, refresh]);

  async function setPass(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/set-password", { method: "POST", body: JSON.stringify({ password }) });
      await refresh();
      const next = await api<{ user: User }>("/api/auth/me");
      setUser(next.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save password");
    } finally {
      setBusy(false);
    }
  }

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-xl">
        <Alert tone="terracotta" title="Missing checkout session">
          Head back to <Link to="/get-started">get started</Link> and try again.
        </Alert>
      </div>
    );
  }

  if (!ready) {
    return (
      <Card className="mx-auto max-w-xl px-6 py-14 text-center">
        <Loader2 className="mx-auto size-10 animate-spin text-teal" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold">Confirming your payment…</h1>
        <p className="mt-2 text-muted">This usually takes a few seconds.</p>
        {error ? (
          <div className="mt-5 text-left">
            <ErrorText>{error}</ErrorText>
          </div>
        ) : null}
      </Card>
    );
  }

  const needsPassword = user && !user.passwordSetAt;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card className="p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-xl bg-sage text-white shadow-card">
          <PartyPopper className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-4xl font-semibold leading-tight">Payment received</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">
          Your private portal is open. Next you will answer a short intake, then add photos of the home.
        </p>

        <div className="mt-6 rounded-xl border border-line bg-linen/60 p-5">
          <p className="mb-3 font-semibold">What happens next</p>
          <Checklist
            items={[
              { label: "Payment complete", done: true },
              { label: "Answer the intake questions", done: false },
              { label: "Add photos, area by area", done: false },
              { label: "LivSafe reviews and sends your report", done: false },
            ]}
          />
        </div>

        {needsPassword ? (
          <form className="mt-6 space-y-5 border-t border-line/70 pt-6" onSubmit={setPass}>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-6 shrink-0 text-teal" aria-hidden="true" />
              <p className="leading-relaxed">
                Choose a password so you can sign back in and finish later.
              </p>
            </div>
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
              Save password and continue
            </Button>
          </form>
        ) : (
          <Link
            className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-teal px-6 py-3 text-lg font-medium text-white no-underline shadow-card transition-all hover:bg-teal-dark hover:shadow-lift"
            to={assessment ? `/assessment/${assessment.id}/intake` : "/dashboard"}
          >
            Continue to intake
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        )}
      </Card>
    </div>
  );
}

export function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card className="p-6 text-center sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-amber-soft text-amber">
          <CircleSlash className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">Payment cancelled</h1>
        <p className="mt-3 leading-relaxed text-muted">
          You have not been charged. Nothing is lost — start again whenever you are ready.
        </p>
        <Link
          to="/get-started"
          className="mt-6 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-teal px-6 py-3 text-lg font-medium text-white no-underline shadow-card transition-colors hover:bg-teal-dark"
        >
          Back to get started
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </Card>
    </div>
  );
}
