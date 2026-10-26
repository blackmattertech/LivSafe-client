import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
} from "lucide-react";
import { api, ApiError, track, websiteUrl } from "../api";
import { Button, Card, ErrorText, Field, TextInput } from "../components/ui";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Answer a short intake",
    body: "Seven plain-language sections about mobility, falls, and the home. Save and return any time.",
  },
  {
    icon: Camera,
    title: "Take a few photos",
    body: "We tell you exactly which photos to take, area by area. Phone photos are perfectly fine.",
  },
  {
    icon: FileText,
    title: "Receive your written report",
    body: "A licensed reviewer studies everything and sends a clear PDF of findings and recommendations.",
  },
];

const PROMISES = [
  { icon: Stethoscope, label: "Reviewed by licensed professionals" },
  { icon: Lock, label: "Private portal, photos never shared" },
  { icon: Timer, label: "No appointment, no one visits your home" },
  { icon: CheckCircle2, label: "One-time payment, no subscription" },
];

export function GetStartedPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cfg, setCfg] = useState({ stripeEnabled: false, devPayments: true });
  const [params] = useSearchParams();
  const rawService = params.get("service");
  const service = rawService?.trim() || undefined;

  useEffect(() => {
    void api<{ stripeEnabled: boolean; devPayments: boolean }>("/api/config/public").then(setCfg);
  }, []);

  useEffect(() => {
    track("checkout_start", service);
  }, [service]);

  async function succeed() {
    setBusy(true);
    setError("");
    try {
      const data = await api<{ sessionId: string }>("/api/dev/payments/succeed", {
        method: "POST",
        body: JSON.stringify({ email, name }),
      });
      window.location.assign(
        `${websiteUrl}/checkout/success/?session_id=${encodeURIComponent(data.sessionId)}`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payment could not be simulated");
    } finally {
      setBusy(false);
    }
  }

  async function fail() {
    setBusy(true);
    setError("");
    try {
      await api("/api/dev/payments/fail", { method: "POST" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payment was not completed");
    } finally {
      setBusy(false);
    }
  }

  async function stripe(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api<{ url: string }>("/api/checkout/session", {
        method: "POST",
        body: JSON.stringify({ email, name, service }),
      });
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout could not start");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-12">
      <section className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal-soft px-4 py-1.5 text-base font-medium text-teal-dark">
            <Sparkles className="size-5" aria-hidden="true" />
            Home safety assessment
          </span>
          <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            A safer home,
            <br />
            reviewed by <span className="text-teal">real experts</span>.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            A one-time payment opens a private portal. Answer a short intake, upload photos of the home, and
            LivSafe prepares a written report of what to change and why — no visit required.
          </p>

          <ul className="grid gap-3 sm:grid-cols-2">
            {PROMISES.map((item) => (
              <li key={item.label} className="flex items-start gap-3 text-base">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-paper text-teal shadow-card">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="pt-1.5 leading-snug">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <Card className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal text-white">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold leading-tight">Begin when you are ready</h2>
              <p className="text-base text-muted">Takes about two minutes to start.</p>
            </div>
          </div>

          <form
            className="mt-6 space-y-5"
            onSubmit={cfg.stripeEnabled ? stripe : (e) => e.preventDefault()}
          >
            <Field label="Your name">
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Email address" required hint="We send your report and updates here.">
              <TextInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="jane@example.com"
              />
            </Field>
            <ErrorText>{error}</ErrorText>

            {cfg.stripeEnabled ? (
              <Button type="submit" icon={CreditCard} loading={busy} className="w-full">
                Continue to payment
              </Button>
            ) : null}

            {cfg.devPayments ? (
              <div className="space-y-3 rounded-xl border border-dashed border-line-strong bg-linen/60 p-4">
                <p className="text-base font-medium text-muted">
                  Development payments — no Stripe keys required.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    icon={CheckCircle2}
                    disabled={busy || !email}
                    onClick={() => void succeed()}
                  >
                    Simulate payment success
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void fail()}
                  >
                    Simulate payment failure
                  </Button>
                </div>
              </div>
            ) : null}

            <p className="flex items-center gap-2 text-base text-muted">
              <Lock className="size-4" aria-hidden="true" />
              Secure checkout. Cancel any time before paying.
            </p>
          </form>

          <p className="mt-5 border-t border-line/70 pt-5 text-base">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </Card>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold sm:text-3xl">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card as="li" key={step.title} className="p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-teal-soft text-teal-dark">
                  <step.icon className="size-6" aria-hidden="true" />
                </span>
                <span className="text-base font-semibold text-muted">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold leading-snug">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
            </Card>
          ))}
        </ol>
        <p className="flex items-center gap-2 text-base text-muted">
          <ArrowRight className="size-5 text-teal" aria-hidden="true" />
          You never have to identify hazards yourself — that is our job.
        </p>
      </section>
    </div>
  );
}
