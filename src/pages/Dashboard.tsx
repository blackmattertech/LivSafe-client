import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Download,
  FileCheck2,
  FolderOpen,
  Headset,
  Images,
  Play,
  Plus,
  Send,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "../api";
import { Card, PageLoader, StatusChip } from "../components/ui";
import { intakePath } from "../lib/intake";
import type { Assessment } from "../types";

type Step = { key: string; label: string; icon: LucideIcon };

const STEPS: Step[] = [
  { key: "paid", label: "Paid", icon: CreditCard },
  { key: "intake", label: "Intake", icon: ClipboardList },
  { key: "photos", label: "Photos", icon: Camera },
  { key: "submitted", label: "Submitted", icon: Send },
  { key: "report", label: "Report", icon: FileCheck2 },
];

function stepState(a: Assessment) {
  return [
    Boolean(a.paidAt),
    a.intakeComplete,
    a.roomsWithUploads > 0,
    Boolean(a.submittedAt),
    a.hasReport,
  ];
}

function nextAction(a: Assessment): { href: string; label: string } {
  if (!a.requiresIntake) {
    if (a.hasReport) return { href: `/api/assessments/${a.id}/report`, label: "Download report" };
    if (a.hasPackageFile) return { href: `/api/assessments/${a.id}/package-file`, label: "Download report" };
    return { href: "/reports", label: "View report" };
  }
  if (a.hasReport) return { href: `/assessment/${a.id}/submitted`, label: "View" };
  if (a.submittedAt) return { href: `/assessment/${a.id}/submitted`, label: "Open" };
  if (!a.intakeComplete) return { href: intakePath(a), label: "Continue intake" };
  if (a.roomsWithUploads === 0) return { href: `/assessment/${a.id}/uploads`, label: "Add photos" };
  return { href: `/assessment/${a.id}/review`, label: "Review & submit" };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const HOUSE_ART =
  "https://res.cloudinary.com/kkrsynmx/image/upload/f_png,q_auto,w_640/v1790697550/81acbbf9-e8fe-4eec-bd5a-dc1d9c5c0bd6.png";
const SUPPORT_ART =
  "https://res.cloudinary.com/kkrsynmx/image/upload/e_trim/w_480,f_png,q_auto/v1790697639/cdf59613-6f2a-47bf-bb12-fcf8e6e747e2.png";
const CONTACT_SUPPORT = "https://livsafehome.com/contact/";

const ASSESSMENT_POINTS: { key: string; icon: LucideIcon; label: ReactNode }[] = [
  { key: "sections", icon: ClipboardList, label: "7 short sections" },
  { key: "uploads", icon: Camera, label: "Upload photos or video" },
  {
    key: "recommendations",
    icon: UserRound,
    label: (
      <>
        Get personalized
        <br />
        recommendations
      </>
    ),
  },
];

const QUICK_ACCESS: {
  title: string;
  body: string;
  icon: LucideIcon;
  card: string;
  iconWrap: string;
  to?: string;
  href?: string;
}[] = [
  {
    title: "View Reports",
    body: "See your completed assessments and recommendations",
    icon: ChartColumn,
    card: "bg-primary-50",
    iconWrap: "bg-primary-light text-primary",
    to: "/reports",
  },
  {
    title: "My Profile",
    body: "View or update your personal information",
    icon: UserRound,
    card: "bg-[#F0FDFA]",
    iconWrap: "bg-wellness-light text-wellness",
    to: "/profile",
  },
  {
    title: "Get Support",
    body: "Have questions? We're here to help.",
    icon: Headset,
    card: "bg-warning-bg",
    iconWrap: "bg-[#FEF3C7] text-warning",
    href: CONTACT_SUPPORT,
  },
];

function BannerSlideshow({ banners }: { banners: { id: string; url: string }[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  function go(next: number) {
    setIndex((next + count) % count);
  }

  return (
    <section aria-roledescription="carousel" aria-label="Banners">
      <div
        className="relative aspect-[2/1] overflow-hidden rounded-xl border border-line bg-linen"
        onTouchStart={(event) => {
          startX.current = event.touches[0]?.clientX ?? null;
          setPaused(true);
        }}
        onTouchEnd={(event) => {
          const start = startX.current;
          startX.current = null;
          setPaused(false);
          if (start == null || count < 2) return;
          const dx = (event.changedTouches[0]?.clientX ?? start) - start;
          if (dx > 40) go(index - 1);
          else if (dx < -40) go(index + 1);
        }}
        onTouchCancel={() => setPaused(false)}
      >
        {banners.map((banner, i) => (
          <img
            key={banner.id}
            src={banner.url}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
        ))}
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              className="absolute top-1/2 left-0.5 grid size-11 -translate-y-1/2 place-items-center"
              onClick={() => go(index - 1)}
            >
              <span className="grid size-8 place-items-center rounded-full border border-line bg-paper/95 text-ink shadow-card">
                <ChevronLeft className="size-4" aria-hidden="true" />
              </span>
            </button>
            <button
              type="button"
              aria-label="Next banner"
              className="absolute top-1/2 right-0.5 grid size-11 -translate-y-1/2 place-items-center"
              onClick={() => go(index + 1)}
            >
              <span className="grid size-8 place-items-center rounded-full border border-line bg-paper/95 text-ink shadow-card">
                <ChevronRight className="size-4" aria-hidden="true" />
              </span>
            </button>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="mt-1 flex flex-wrap justify-center" role="tablist" aria-label="Choose a banner">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Banner ${i + 1} of ${count}`}
              className="grid size-11 place-items-center"
              onClick={() => go(i)}
            >
              <span className={`block h-2 rounded-full ${i === index ? "w-6 bg-teal" : "w-2 bg-line"}`} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function MobileHome({ startHref }: { startHref: string }) {
  return (
    <div className="w-full min-w-0 space-y-4 min-[400px]:space-y-5">
      <section className="overflow-hidden rounded-[1.25rem] bg-[#F0FDFA] px-3 pt-4 pb-3.5 min-[400px]:px-4 min-[400px]:pt-5 min-[400px]:pb-4">
        <p className="text-[clamp(0.625rem,2.5vw,0.6875rem)] font-semibold tracking-[0.12em] text-teal uppercase">
          Home safety assessment
        </p>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="min-w-0 flex-1 text-[clamp(1.35rem,6.2vw,1.75rem)] font-bold leading-[1.12] tracking-tight text-balance text-ink">
            Start Your Assessment
          </h1>
          <img
            src={HOUSE_ART}
            alt=""
            width={640}
            height={427}
            className="w-[44%] max-w-56 shrink-0 object-contain min-[400px]:w-[50%]"
          />
        </div>
        <p className="mt-3 text-[clamp(0.875rem,3.5vw,1rem)] leading-relaxed text-pretty text-text-secondary">
          Answer a few questions about yourself and your home, then upload photos or a short video of the areas
          you’d like us to review.
        </p>

        <ul className="mt-4 grid grid-cols-3 gap-1.5 min-[400px]:gap-2">
          {ASSESSMENT_POINTS.map((point) => (
            <li key={point.key} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-paper text-teal shadow-card min-[400px]:size-10">
                <point.icon className="size-4" aria-hidden="true" />
              </span>
              <span className="w-full min-w-0 text-[clamp(0.625rem,2.7vw,0.8125rem)] font-medium leading-tight text-balance text-ink">
                {point.label}
              </span>
            </li>
          ))}
        </ul>

        <Link
          to={startHref}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal px-4 text-[clamp(0.9375rem,3.8vw,1rem)] font-semibold text-white no-underline shadow-card transition-colors hover:bg-teal-dark"
        >
          Start Assessment
          <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
        </Link>
      </section>

      <section aria-labelledby="quick-access-heading">
        <h2 id="quick-access-heading" className="text-[clamp(1.125rem,4.5vw,1.25rem)] font-bold tracking-tight text-ink">
          Quick Access
        </h2>
        <ul className="mt-3 grid grid-cols-3 items-stretch gap-2 min-[400px]:gap-2.5">
          {QUICK_ACCESS.map((item) => {
            const className = `flex h-full min-w-0 flex-col rounded-2xl border border-line/80 p-1.5 no-underline min-[400px]:p-2.5 ${item.card}`;
            const body = (
              <>
                <span
                  className={`grid size-8 place-items-center rounded-full min-[400px]:size-10 ${item.iconWrap}`}
                >
                  <item.icon className="size-4 min-[400px]:size-5" aria-hidden="true" />
                </span>
                <span className="mt-2 flex min-w-0 items-start gap-0.5 text-[clamp(0.75rem,3vw,0.875rem)] font-semibold leading-tight text-ink min-[400px]:mt-3">
                  <span className="min-w-0">{item.title}</span>
                  <ArrowRight className="mt-0.5 size-3 shrink-0 text-muted min-[400px]:size-3.5" aria-hidden="true" />
                </span>
                <span className="mt-1 min-w-0 text-[9px] leading-snug text-text-secondary min-[360px]:text-[10px] min-[420px]:text-xs min-[520px]:text-[13px] [overflow-wrap:normal]">
                  {item.body}
                </span>
              </>
            );
            return (
              <li key={item.title} className="min-w-0">
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
                    {body}
                  </a>
                ) : (
                  <Link to={item.to!} className={className}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-2 overflow-hidden rounded-[1.25rem] border border-line bg-paper p-3 min-[400px]:grid-cols-[5.5rem_minmax(0,1fr)] min-[400px]:gap-3 min-[400px]:p-4">
        <img
          src={SUPPORT_ART}
          alt=""
          width={320}
          height={239}
          className="w-full object-contain"
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="text-[clamp(0.625rem,2.4vw,0.6875rem)] font-semibold tracking-[0.12em] text-teal uppercase">
            Need help?
          </p>
          <h2 className="mt-0.5 text-[clamp(0.875rem,3.6vw,1rem)] font-bold leading-snug tracking-tight text-balance text-ink">
            Our team is here to support you.
          </h2>
          <p className="mt-1 text-[clamp(0.75rem,3.1vw,0.875rem)] leading-snug text-pretty text-text-secondary">
            If you have any questions or need assistance, please contact us.
          </p>
          <a
            href={CONTACT_SUPPORT}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-11 max-w-full items-center gap-1 rounded-lg border border-teal bg-paper px-2.5 text-[clamp(0.75rem,3vw,0.875rem)] font-semibold text-teal no-underline min-[400px]:px-3"
          >
            Contact Support
            <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}

function useAssessments() {
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);
  useEffect(() => {
    void api<{ assessments: Assessment[] }>("/api/assessments").then((d) => setAssessments(d.assessments));
  }, []);
  return assessments;
}

export function DashboardPage() {
  const assessments = useAssessments();
  const [banners, setBanners] = useState<{ id: string; url: string }[]>([]);
  const openAssessment = assessments?.find((item) => item.requiresIntake && !item.submittedAt && !item.hasReport);

  useEffect(() => {
    void api<{ banners: { id: string; url: string }[] }>("/api/banners")
      .then((d) => setBanners(d.banners))
      .catch(() => setBanners([]));
  }, []);

  return (
    <>
      <div className="mx-auto w-full min-w-0 max-w-lg space-y-4 lg:hidden">
        {banners.length > 0 ? <BannerSlideshow banners={banners} /> : null}
        <MobileHome startHref={openAssessment ? nextAction(openAssessment).href : "/get-started"} />
      </div>
      <div className="hidden space-y-5 lg:block">
        {banners.length > 0 ? <BannerSlideshow banners={banners} /> : null}
        {assessments ? (
          <AssessmentsBoard assessments={assessments} />
        ) : (
          <PageLoader label="Loading your assessments" />
        )}
      </div>
    </>
  );
}

export function AssessmentsPage() {
  const assessments = useAssessments();
  if (!assessments) return <PageLoader label="Loading your assessments" />;
  return <AssessmentsBoard assessments={assessments} />;
}

export function ReportsPage() {
  const assessments = useAssessments();
  if (!assessments) return <PageLoader label="Loading your reports" />;
  return (
    <AssessmentsBoard
      assessments={assessments.filter((item) => item.hasReport || item.hasPackageFile)}
      title="Reports"
      description="Download the file that came with your package, or the written report when it is ready."
      showNew={false}
      emptyTitle="No reports yet"
      emptyBody="A file shows up here after you pay for a package that includes one, or after your assessment is reviewed."
    />
  );
}

export function ReferPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Refer</h1>
      <p className="mt-2 text-muted">Share LivSafe with someone who wants a safer home.</p>
      <a
        href="https://livsafehome.com"
        className="mt-4 inline-flex min-h-11 items-center text-base font-medium text-teal"
      >
        livsafehome.com
      </a>
    </div>
  );
}

function AssessmentsBoard({
  assessments,
  title = "Your assessments",
  description = "Open a submission, or pick up where you left off.",
  showNew = true,
  emptyTitle = "No assessments yet",
  emptyBody,
}: {
  assessments: Assessment[];
  title?: string;
  description?: string;
  showNew?: boolean;
  emptyTitle?: string;
  emptyBody?: ReactNode;
}) {
  const totalPhotos = assessments.reduce((sum, a) => sum + a.uploads.length, 0);
  const reportsReady = assessments.filter((a) => a.hasReport || a.hasPackageFile).length;
  const inProgress = assessments.filter((a) => a.requiresIntake && !a.submittedAt && !a.hasReport).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        {showNew ? (
          <Link
            to="/get-started"
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-sm font-medium text-teal-dark no-underline shadow-card transition-colors hover:bg-cream sm:h-9 sm:w-auto"
          >
            <Plus className="size-4" aria-hidden="true" />
            New assessment
          </Link>
        ) : null}
      </div>

      {assessments.length === 0 ? (
        <Card className="px-5 py-10 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-teal-soft text-teal-dark">
            <FolderOpen className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-base font-semibold">{emptyTitle}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {emptyBody ?? (
              <>
                <Link to="/get-started">Start a home safety assessment</Link> and it will show up here.
              </>
            )}
          </p>
        </Card>
      ) : (
        <>
          <Card className="grid grid-cols-3 divide-x divide-line/80">
            <Metric label="In progress" value={inProgress} hint={inProgress === 1 ? "needs you" : "need you"} />
            <Metric label="Photos" value={totalPhotos} hint="across all homes" />
            <Metric label="Reports" value={reportsReady} hint={reportsReady ? "ready to download" : "none yet"} />
          </Card>

          <ul className="space-y-3">
            {assessments.map((a) => {
              const states = stepState(a);
              const doneCount = states.filter(Boolean).length;
              const currentIndex = states.findIndex((s) => !s);
              const action = nextAction(a);
              const thumbs = a.uploads.slice(0, 4);
              const extra = a.uploads.length - thumbs.length;
              const detailHref = !a.requiresIntake
                ? "/reports"
                : a.submittedAt
                  ? `/assessment/${a.id}/submitted`
                  : a.roomsWithUploads
                    ? `/assessment/${a.id}/uploads`
                    : action.href;

              return (
                <Card as="li" key={a.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <Link
                      to={detailHref}
                      className={`grid h-28 w-full shrink-0 gap-px bg-line no-underline sm:h-auto sm:w-[9.75rem] sm:self-stretch ${
                        thumbs.length <= 1
                          ? "grid-cols-1"
                          : thumbs.length === 2
                            ? "grid-cols-2 sm:grid-cols-1 sm:grid-rows-2"
                            : "grid-cols-4 sm:grid-cols-2 sm:grid-rows-2"
                      }`}
                      aria-label={`Open assessment ${a.id.slice(0, 8)}`}
                    >
                      {thumbs.length ? (
                        thumbs.map((file, i) => (
                          <span key={file.id} className="relative min-h-0 overflow-hidden bg-linen">
                            {file.fileType === "video" ? (
                              <>
                                <video className="absolute inset-0 h-full w-full object-cover" src={file.url} muted playsInline />
                                <span className="absolute inset-0 grid place-items-center bg-ink/25">
                                  <Play className="size-3.5 text-white" aria-hidden="true" />
                                </span>
                              </>
                            ) : (
                              <img
                                src={file.url}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                                loading="lazy"
                              />
                            )}
                            {i === thumbs.length - 1 && extra > 0 ? (
                              <span className="absolute inset-0 grid place-items-center bg-ink/50 text-xs font-semibold text-white">
                                +{extra}
                              </span>
                            ) : null}
                          </span>
                        ))
                      ) : (
                        <span className="grid place-items-center bg-linen text-muted">
                          <Images className="size-6" aria-hidden="true" />
                        </span>
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3.5 sm:p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusChip size="sm" status={a.status} label={a.statusLabel} />
                            <span className="text-xs tabular-nums text-muted">#{a.id.slice(0, 8)}</span>
                          </div>
                          <p className="mt-1 text-sm text-muted">
                            Started {formatDate(a.paidAt ?? a.createdAt)}
                            {a.submittedAt ? ` · Submitted ${formatDate(a.submittedAt)}` : null}
                          </p>
                        </div>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                          {a.requiresIntake ? (
                            <>
                              {a.hasPackageFile ? (
                                <a
                                  href={`/api/assessments/${a.id}/package-file`}
                                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-sm font-medium text-teal-dark no-underline transition-colors hover:bg-cream sm:h-9 sm:flex-none"
                                  aria-label={a.packageFileName ? `Download ${a.packageFileName}` : "Download package file"}
                                >
                                  <Download className="size-3.5" aria-hidden="true" />
                                  Download
                                </a>
                              ) : null}
                              {a.hasReport ? (
                                <a
                                  href={`/api/assessments/${a.id}/report`}
                                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-sm font-medium text-teal-dark no-underline transition-colors hover:bg-cream sm:h-9 sm:flex-none"
                                >
                                  <Download className="size-3.5" aria-hidden="true" />
                                  PDF
                                </a>
                              ) : null}
                              <Link
                                to={action.href}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white no-underline shadow-card transition-colors hover:bg-primary-hover sm:h-9 sm:flex-none"
                              >
                                {action.label}
                                <ArrowRight className="size-3.5" aria-hidden="true" />
                              </Link>
                            </>
                          ) : a.hasReport || a.hasPackageFile ? (
                            <>
                              {a.hasPackageFile ? (
                                <a
                                  href={`/api/assessments/${a.id}/package-file`}
                                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white no-underline shadow-card transition-colors hover:bg-primary-hover sm:h-9 sm:flex-none"
                                  aria-label={
                                    a.packageFileName ? `Download ${a.packageFileName}` : "Download report"
                                  }
                                >
                                  <Download className="size-3.5" aria-hidden="true" />
                                  Download report
                                </a>
                              ) : null}
                              {a.hasReport ? (
                                <a
                                  href={`/api/assessments/${a.id}/report`}
                                  className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium no-underline sm:h-9 sm:flex-none ${
                                    a.hasPackageFile
                                      ? "border border-line bg-paper text-teal-dark hover:bg-cream"
                                      : "bg-primary text-white shadow-card hover:bg-primary-hover"
                                  }`}
                                >
                                  <Download className="size-3.5" aria-hidden="true" />
                                  Download PDF
                                </a>
                              ) : null}
                            </>
                          ) : (
                            <p className="text-sm text-muted">Your report is not ready yet.</p>
                          )}
                        </div>
                      </div>

                      {a.requiresIntake ? (
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted">
                          <span>
                            {doneCount} of {STEPS.length} steps
                          </span>
                          <span>
                            {a.roomsWithUploads}/{a.totalRooms} areas · {a.uploads.length} file
                            {a.uploads.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <ol className="grid grid-cols-5 gap-1">
                          {STEPS.map((step, i) => {
                            const done = states[i];
                            const active = i === currentIndex;
                            return (
                              <li
                                key={step.key}
                                className={`flex items-center gap-1 rounded-md px-1.5 py-1 ${
                                  done
                                    ? "bg-sage-soft text-sage"
                                    : active
                                      ? "bg-teal-soft text-teal-dark"
                                      : "bg-linen/80 text-muted"
                                }`}
                              >
                                <step.icon className="size-3 shrink-0" aria-hidden="true" />
                                <span className="hidden truncate text-[11px] font-medium sm:inline">
                                  {step.label}
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="px-3 py-3 text-center sm:px-4">
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
