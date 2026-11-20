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
  FileText,
  FolderOpen,
  Headset,
  Images,
  LoaderCircle,
  Play,
  Plus,
  Send,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, mediaUrl, websiteUrl } from "../api";
import { DownloadLink } from "../components/DownloadLink";
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

const HOUSE_ART =
  "https://res.cloudinary.com/kkrsynmx/image/upload/f_png,q_auto,w_640/v1790697550/81acbbf9-e8fe-4eec-bd5a-dc1d9c5c0bd6.png";
const SUPPORT_ART =
  "https://res.cloudinary.com/kkrsynmx/image/upload/e_trim/w_480,f_png,q_auto/v1790697639/cdf59613-6f2a-47bf-bb12-fcf8e6e747e2.png";
const CONTACT_SUPPORT = `${websiteUrl}/contact/`;
const CTA = "bg-[#0D9488] text-white hover:bg-[#087F7B] active:bg-[#087F7B]";

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
    return { href: "/reports", label: "View report" };
  }
  if (a.hasReport) return { href: `/assessment/${a.id}/report`, label: "View report" };
  if (a.submittedAt) return { href: `/assessment/${a.id}/submitted`, label: "Open" };
  if (!a.intakeComplete) return { href: intakePath(a), label: "Continue intake" };
  if (a.roomsWithUploads === 0) return { href: `/assessment/${a.id}/uploads`, label: "Add photos" };
  return { href: `/assessment/${a.id}/review`, label: "Review & submit" };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function assessmentTitle(a: Assessment) {
  const name = a.intakeFormTitle?.trim() || "Home safety assessment";
  return `${name} ${formatDate(a.paidAt ?? a.createdAt)}`;
}

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
    iconWrap: "bg-[#CCFBF1] text-[#0D9488]",
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
    <section aria-roledescription="carousel" aria-label="Banners" className="w-full min-w-0">
      <div
        className="relative aspect-[4/1] w-full overflow-hidden rounded-[1.25rem] border border-line bg-linen"
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
            width={1280}
            height={320}
            className={`absolute inset-0 h-full w-full object-cover object-right transition-opacity duration-500 ${
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
    </section>
  );
}

function HeroBanner({ startHref }: { startHref: string }) {
  return (
    <section className="relative overflow-hidden rounded-[1.25rem] bg-[#E6FAF8] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
      <div className="relative z-10 grid items-center gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#0D9488] uppercase">Home safety assessment</p>
          <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-balance text-ink sm:text-4xl">
            Start Your Assessment
          </h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-pretty text-text-secondary">
            Answer a few questions about yourself and your home, then upload photos or a short video of the areas
            you’d like us to review.
          </p>
          <div className="mt-5">
            <Link
              to={startHref}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold no-underline shadow-card transition-colors ${CTA}`}
            >
              Start Assessment
              <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-md items-end justify-center lg:max-w-none lg:justify-end">
          <img
            src={HOUSE_ART}
            alt=""
            width={640}
            height={427}
            className="w-[70%] max-w-72 object-contain drop-shadow-sm sm:w-[60%] sm:max-w-80"
          />
        </div>
      </div>
    </section>
  );
}

function StatsStrip({
  total,
  inProgress,
  reports,
  photos,
}: {
  total: number;
  inProgress: number;
  reports: number;
  photos: number;
}) {
  const items = [
    {
      label: "Assessments",
      value: total,
      hint: total === 1 ? "Total submitted" : "Total assessments",
      icon: ClipboardList,
      iconClass: "bg-primary-light text-primary",
    },
    {
      label: "In Progress",
      value: inProgress,
      hint: inProgress === 1 ? "Needs your action" : "Need your action",
      icon: LoaderCircle,
      iconClass: "bg-[#CCFBF1] text-[#0D9488]",
    },
    {
      label: "Reports",
      value: reports,
      hint: reports === 1 ? "Ready to view" : "Ready to view",
      icon: FileText,
      iconClass: "bg-info-bg text-info",
    },
    {
      label: "Photos",
      value: photos,
      hint: "Total uploaded",
      icon: Images,
      iconClass: "bg-warning-bg text-warning",
    },
  ];

  return (
    <Card className="grid grid-cols-2 gap-px overflow-hidden bg-line/80 p-0 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 items-center gap-3 bg-paper px-3 py-4 sm:px-4">
          <span className={`grid size-11 shrink-0 place-items-center rounded-full ${item.iconClass}`}>
            <item.icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted">{item.label}</p>
            <p className="text-xl font-semibold tabular-nums text-ink">{item.value}</p>
            <p className="truncate text-xs text-muted">{item.hint}</p>
          </div>
        </div>
      ))}
    </Card>
  );
}

function QuickAccessSidebar() {
  return (
    <div className="space-y-4">
      <section aria-labelledby="quick-access-heading" className="space-y-3">
        <h2 id="quick-access-heading" className="text-lg font-bold tracking-tight text-ink">
          Quick Access
        </h2>
        <ul className="space-y-3">
          {QUICK_ACCESS.map((item) => {
            const className = `flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-line/80 p-3 no-underline transition-colors hover:brightness-[0.99] ${item.card}`;
            const body = (
              <>
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.iconWrap}`}>
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 font-semibold text-ink">
                    <span className="truncate">{item.title}</span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-text-secondary">{item.body}</span>
                </span>
              </>
            );
            return (
              <li key={item.title}>
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

      <section className="overflow-hidden rounded-[1.25rem] border border-line bg-paper p-4 shadow-card">
        <img
          src={SUPPORT_ART}
          alt=""
          width={320}
          height={239}
          className="mx-auto h-28 w-auto object-contain"
          loading="lazy"
        />
        <p className="mt-3 text-xs font-semibold tracking-[0.12em] text-[#0D9488] uppercase">Need help?</p>
        <h2 className="mt-1 text-base font-bold leading-snug tracking-tight text-ink">
          Our team is here to support you.
        </h2>
        <a
          href={CONTACT_SUPPORT}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#0D9488] bg-paper px-3 text-sm font-semibold text-[#0D9488] no-underline transition-colors hover:bg-[#F0FDFA]"
        >
          Contact Support
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </a>
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
  const startHref = openAssessment ? nextAction(openAssessment).href : "/get-started";

  useEffect(() => {
    void api<{ banners: { id: string; url: string }[] }>("/api/banners")
      .then((d) => setBanners(d.banners))
      .catch(() => setBanners([]));
  }, []);

  const totalPhotos = assessments?.reduce((sum, a) => sum + a.uploads.length, 0) ?? 0;
  const reportsReady = assessments?.filter((a) => a.hasReport || a.hasPackageFile).length ?? 0;
  const inProgress = assessments?.filter((a) => a.requiresIntake && !a.submittedAt && !a.hasReport).length ?? 0;
  const total = assessments?.length ?? 0;

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_18.5rem]">
      <div className="min-w-0 space-y-5">
        {banners.length > 0 ? <BannerSlideshow banners={banners} /> : null}
        <HeroBanner startHref={startHref} />
        <StatsStrip total={total} inProgress={inProgress} reports={reportsReady} photos={totalPhotos} />
        {assessments ? (
          <AssessmentsBoard assessments={assessments} embedded />
        ) : (
          <PageLoader label="Loading your assessments" />
        )}
      </div>
      <aside className="min-w-0 lg:pt-1">
        <QuickAccessSidebar />
      </aside>
    </div>
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
        href={`${websiteUrl}/`}
        className="mt-4 inline-flex min-h-11 items-center text-base font-medium text-[#0D9488]"
      >
        {websiteUrl.replace(/^https?:\/\//, "")}
      </a>
    </div>
  );
}

function AssessmentsBoard({
  assessments,
  title = "Your Assessments",
  description = "Track progress and open a report when it is ready.",
  showNew = true,
  emptyTitle = "No assessments yet",
  emptyBody,
  embedded = false,
}: {
  assessments: Assessment[];
  title?: string;
  description?: string;
  showNew?: boolean;
  emptyTitle?: string;
  emptyBody?: ReactNode;
  embedded?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className={`font-bold tracking-tight text-ink ${embedded ? "text-xl sm:text-2xl" : "text-xl sm:text-2xl"}`}>
            {embedded ? title : <span className="font-semibold">{title}</span>}
          </h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        {showNew ? (
          <Link
            to="/get-started"
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#0D9488]/35 bg-paper px-3 text-sm font-semibold text-[#0D9488] no-underline transition-colors hover:bg-[#F0FDFA] sm:w-auto"
          >
            <Plus className="size-4" aria-hidden="true" />
            New Assessment
          </Link>
        ) : null}
      </div>

      {assessments.length === 0 ? (
        <Card className="px-5 py-10 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-[#CCFBF1] text-[#0D9488]">
            <FolderOpen className="size-5" aria-hidden="true" />
          </span>
          <h3 className="mt-3 text-base font-semibold">{emptyTitle}</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {emptyBody ?? (
              <>
                <Link to="/get-started">Start a home safety assessment</Link> and it will show up here.
              </>
            )}
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {assessments.map((a) => (
            <AssessmentCard key={a.id} assessment={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AssessmentCard({ assessment: a }: { assessment: Assessment }) {
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
    <Card as="li" className="overflow-hidden">
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
          aria-label="Open assessment"
        >
          {thumbs.length ? (
            thumbs.map((file, i) => (
              <span key={file.id} className="relative min-h-0 overflow-hidden bg-linen">
                {file.fileType === "video" ? (
                  <>
                    <video className="absolute inset-0 h-full w-full object-cover" src={mediaUrl(file.url)} muted playsInline />
                    <span className="absolute inset-0 grid place-items-center bg-ink/25">
                      <Play className="size-3.5 text-white" aria-hidden="true" />
                    </span>
                  </>
                ) : (
                  <img
                    src={mediaUrl(file.url)}
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
              </div>
              <h3 className="mt-1.5 text-base font-semibold text-ink">{assessmentTitle(a)}</h3>
              {a.requiresIntake ? (
                <p className="mt-1 text-sm text-muted">
                  {doneCount} of {STEPS.length} steps
                  {a.submittedAt ? ` · Submitted ${formatDate(a.submittedAt)}` : null}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">Started {formatDate(a.paidAt ?? a.createdAt)}</p>
              )}
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {a.requiresIntake ? (
                <>
                  {a.hasPackageFile ? (
                    <DownloadLink
                      path={`/api/assessments/${a.id}/package-file`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-sm font-medium text-[#0D9488] no-underline transition-colors hover:bg-cream sm:h-9 sm:flex-none"
                      label={a.packageFileName ? `Download ${a.packageFileName}` : "Download package file"}
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      Download
                    </DownloadLink>
                  ) : null}
                  {a.hasReport ? (
                    <DownloadLink
                      path={`/api/assessments/${a.id}/report`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-sm font-medium text-[#0D9488] no-underline transition-colors hover:bg-cream sm:h-9 sm:flex-none"
                      label="Download report"
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      PDF
                    </DownloadLink>
                  ) : null}
                  <Link
                    to={action.href}
                    className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold no-underline shadow-card transition-colors sm:h-9 sm:flex-none ${CTA}`}
                  >
                    {action.label}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </>
              ) : a.hasReport || a.hasPackageFile ? (
                <>
                  {a.hasPackageFile ? (
                    <DownloadLink
                      path={`/api/assessments/${a.id}/package-file`}
                      className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold no-underline shadow-card transition-colors sm:h-9 sm:flex-none ${CTA}`}
                      label={a.packageFileName ? `Download ${a.packageFileName}` : "Download report"}
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      Download report
                    </DownloadLink>
                  ) : null}
                  {a.hasReport ? (
                    <DownloadLink
                      path={`/api/assessments/${a.id}/report`}
                      className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold no-underline sm:h-9 sm:flex-none ${
                        a.hasPackageFile
                          ? "border border-line bg-paper text-[#0D9488] hover:bg-cream"
                          : `${CTA} shadow-card`
                      }`}
                      label="Download report"
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      Download report
                    </DownloadLink>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted">
                  {a.submittedAt ? "Your report should be ready in 3 business days." : "Your report is not ready yet."}
                </p>
              )}
            </div>
          </div>

          {a.requiresIntake ? (
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
                          ? "bg-[#CCFBF1] text-[#0D9488]"
                          : "bg-linen/80 text-muted"
                    }`}
                  >
                    <step.icon className="size-3 shrink-0" aria-hidden="true" />
                    <span className="hidden truncate text-[11px] font-medium sm:inline">{step.label}</span>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
