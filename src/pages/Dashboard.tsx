import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  ClipboardList,
  CreditCard,
  Download,
  FileCheck2,
  FolderOpen,
  Images,
  Play,
  Plus,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "../api";
import { Card, PageLoader, StatusChip } from "../components/ui";
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
  if (a.hasReport) return { href: `/assessment/${a.id}/submitted`, label: "View" };
  if (a.submittedAt) return { href: `/assessment/${a.id}/submitted`, label: "Open" };
  if (!a.intakeComplete) return { href: `/assessment/${a.id}/intake`, label: "Continue intake" };
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

export function DashboardPage() {
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);

  useEffect(() => {
    void api<{ assessments: Assessment[] }>("/api/assessments").then((d) => setAssessments(d.assessments));
  }, []);

  if (!assessments) return <PageLoader label="Loading your assessments" />;

  const totalPhotos = assessments.reduce((sum, a) => sum + a.uploads.length, 0);
  const reportsReady = assessments.filter((a) => a.hasReport).length;
  const inProgress = assessments.filter((a) => !a.submittedAt && !a.hasReport).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Your assessments</h1>
          <p className="mt-1 text-sm text-muted">Open a submission, or pick up where you left off.</p>
        </div>
        <Link
          to="/get-started"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-sm font-medium text-teal-dark no-underline shadow-card transition-colors hover:bg-cream"
        >
          <Plus className="size-4" aria-hidden="true" />
          New assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <Card className="px-5 py-10 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-xl bg-teal-soft text-teal-dark">
            <FolderOpen className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-base font-semibold">No assessments yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            <Link to="/get-started">Start a home safety assessment</Link> and it will show up here.
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
              const detailHref = a.submittedAt
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
                        <div className="flex items-center gap-2">
                          {a.hasReport ? (
                            <a
                              href={`/api/assessments/${a.id}/report`}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-sm font-medium text-teal-dark no-underline transition-colors hover:bg-cream"
                            >
                              <Download className="size-3.5" aria-hidden="true" />
                              PDF
                            </a>
                          ) : null}
                          <Link
                            to={action.href}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-3 text-sm font-medium text-white no-underline shadow-card transition-colors hover:bg-teal-dark"
                          >
                            {action.label}
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>

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
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
