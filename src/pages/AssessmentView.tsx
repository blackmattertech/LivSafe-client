import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Download,
  FileText,
  Hourglass,
  Mail,
} from "lucide-react";
import { api } from "../api";
import { MediaGrid, MediaLightbox } from "../components/Media";
import { Badge, Card, PageLoader, StatusChip } from "../components/ui";
import { intakePath } from "../lib/intake";
import type { Assessment, IntakeField, IntakeSection, RoomConfig, Upload } from "../types";
import type { ClientForm, FileAnswer } from "./CustomForms";

function isFileAnswer(value: unknown): value is FileAnswer {
  return Boolean(value && typeof value === "object" && "uploadId" in value);
}

function fileAnswers(value: unknown): FileAnswer[] {
  if (Array.isArray(value)) return value.filter(isFileAnswer);
  return isFileAnswer(value) ? [value] : [];
}

type Tab = "photos" | "answers";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatValue(value: unknown, options?: { value: string; label: string }[]) {
  if (Array.isArray(value)) {
    const labels = value.map((v) => options?.find((o) => o.value === String(v))?.label ?? String(v));
    return labels.filter(Boolean).join(", ") || null;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && value.trim()) {
    return options?.find((o) => o.value === value)?.label ?? value;
  }
  if (value == null || value === "") return null;
  return String(value);
}

function visibleField(field: IntakeField, data: Record<string, unknown>) {
  if (!field.showIf) return true;
  return field.showIf.oneOf.includes(String(data[field.showIf.field] ?? ""));
}

function nextIncompleteHref(a: Assessment) {
  if (!a.requiresIntake) return "/reports";
  if (!a.intakeComplete) return intakePath(a);
  if (a.roomsWithUploads === 0) return `/assessment/${a.id}/uploads`;
  return `/assessment/${a.id}/review`;
}

function timeline(a: Assessment) {
  const reviewing = ["under_review", "report_in_progress", "completed"].includes(a.status);
  const writing = ["report_in_progress", "completed"].includes(a.status) || a.hasReport;
  const ready = a.hasReport || a.status === "completed";
  return [
    { icon: CheckCircle2, label: "Received", done: Boolean(a.submittedAt) },
    { icon: Hourglass, label: "In review", done: reviewing || ready },
    { icon: FileText, label: "Report", done: writing },
    { icon: Mail, label: "Ready", done: ready },
  ];
}

export function AssessmentViewPage({ focus = "photos" }: { focus?: Tab | "report" }) {
  const { id } = useParams();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [sections, setSections] = useState<IntakeSection[]>([]);
  const [customForms, setCustomForms] = useState<ClientForm[]>([]);
  const [tab, setTab] = useState<Tab>(focus === "answers" ? "answers" : "photos");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    void Promise.all([
      api<{ assessment: Assessment }>(`/api/assessments/${id}`),
      api<{ rooms: RoomConfig[] }>("/api/config/rooms"),
      api<{ sections: IntakeSection[] }>("/api/config/intake"),
      api<{ forms: ClientForm[] }>(`/api/assessments/${id}/forms`).catch(() => ({ forms: [] })),
    ]).then(([a, r, s, forms]) => {
      setAssessment(a.assessment);
      setRooms(r.rooms);
      setSections(s.sections);
      setCustomForms(forms.forms);
    });
  }, [id]);

  const grouped = useMemo(
    () =>
      rooms
        .map((room) => ({
          room,
          files: assessment?.uploads.filter((u) => u.roomCategory === room.id) ?? [],
        }))
        .filter((g) => g.files.length > 0),
    [assessment, rooms],
  );

  const visibleFiles = useMemo(() => {
    const all = assessment?.uploads ?? [];
    if (roomFilter === "all") return all;
    return all.filter((u) => u.roomCategory === roomFilter);
  }, [assessment, roomFilter]);

  if (!assessment) return <PageLoader label="Loading your submission" />;
  if (!assessment.submittedAt) return <Navigate to={nextIncompleteHref(assessment)} replace />;

  const photos = assessment.uploads.filter((u) => u.fileType === "photo").length;
  const videos = assessment.uploads.filter((u) => u.fileType === "video").length;
  const savedSections = sections.filter((s) => assessment.intake[s.id]).length;
  const steps = timeline(assessment);
  const resident =
    (assessment.intake.client_info?.resident_name as string | undefined) ||
    assessment.user?.name ||
    "Your home";

  function openFile(file: Upload) {
    const idx = visibleFiles.findIndex((f) => f.id === file.id);
    setLightbox(idx === -1 ? 0 : idx);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted no-underline hover:text-teal-dark"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Dashboard
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{resident}</h1>
            <StatusChip size="sm" status={assessment.status} label={assessment.statusLabel} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Submitted {formatDate(assessment.submittedAt)} · Ref {assessment.id.slice(0, 8)}
          </p>
        </div>
        {assessment.hasReport || assessment.hasPackageFile ? (
          <div className="flex flex-wrap gap-2">
            {assessment.hasPackageFile ? (
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-paper px-4 text-sm font-medium text-teal-dark no-underline transition-colors hover:bg-cream"
                href={`/api/assessments/${assessment.id}/package-file`}
                aria-label={
                  assessment.packageFileName ? `Download ${assessment.packageFileName}` : "Download package file"
                }
              >
                <Download className="size-4" aria-hidden="true" />
                Download
              </a>
            ) : null}
            {assessment.hasReport ? (
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white no-underline shadow-card transition-colors hover:bg-primary-hover"
                href={`/api/assessments/${assessment.id}/report`}
              >
                <Download className="size-4" aria-hidden="true" />
                Download PDF
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="p-4 lg:col-span-8">
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-0">
            {steps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-2.5 sm:px-2">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                    step.done ? "bg-sage text-white" : "bg-linen text-muted"
                  }`}
                  aria-hidden="true"
                >
                  <step.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-tight">{step.label}</span>
                  <span className="block text-xs text-muted">{step.done ? "Done" : "Waiting"}</span>
                </span>
                {i < steps.length - 1 ? (
                  <span className="mx-1 hidden h-px flex-1 bg-line sm:block" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>
        </Card>

        <Card className="grid grid-cols-3 divide-x divide-line/80 lg:col-span-4">
          <Metric label="Photos" value={photos} hint={videos ? `${videos} video${videos === 1 ? "" : "s"}` : "files"} />
          <Metric label="Areas" value={assessment.roomsWithUploads} hint={`of ${assessment.totalRooms}`} />
          <Metric label="Intake" value={`${savedSections}/${sections.length}`} hint="sections" />
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-1 border-b border-line/80 px-2 pt-2">
          {(
            [
              { key: "photos" as const, label: "Photos", icon: Camera, count: assessment.uploads.length },
              { key: "answers" as const, label: "Answers", icon: ClipboardList, count: savedSections },
            ] as const
          ).map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-t-lg px-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-paper text-ink shadow-[inset_0_-2px_0_0_var(--color-teal)]"
                    : "text-muted hover:bg-linen/70 hover:text-ink"
                }`}
                aria-pressed={active}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
                <span className="tabular-nums text-xs text-muted">{item.count}</span>
              </button>
            );
          })}
        </div>

        {tab === "photos" ? (
          <div className="grid lg:grid-cols-[13.5rem_1fr]">
            <nav className="border-b border-line/80 p-2 lg:border-b-0 lg:border-r" aria-label="Areas">
              <div className="flex gap-1 overflow-x-auto lg:block lg:space-y-0.5 lg:overflow-visible">
                <RoomNav
                  active={roomFilter === "all"}
                  onClick={() => setRoomFilter("all")}
                  label="All areas"
                  count={assessment.uploads.length}
                />
                {grouped.map(({ room, files }) => (
                  <RoomNav
                    key={room.id}
                    active={roomFilter === room.id}
                    onClick={() => setRoomFilter(room.id)}
                    label={room.label}
                    count={files.length}
                  />
                ))}
              </div>
            </nav>

            <div className="p-3 sm:p-4">
              {visibleFiles.length ? (
                <MediaGrid
                  compact
                  files={visibleFiles}
                  rooms={rooms}
                  onOpen={(i) => {
                    const file = visibleFiles[i];
                    if (file) openFile(file);
                  }}
                />
              ) : (
                <p className="rounded-xl border border-dashed border-line-strong bg-linen/40 px-4 py-10 text-center text-sm text-muted">
                  No photos in this area.
                </p>
              )}

              {rooms.length > grouped.length ? (
                <details className="mt-4 text-sm text-muted">
                  <summary className="cursor-pointer">
                    Areas without photos ({rooms.length - grouped.length})
                  </summary>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {rooms
                      .filter((room) => !grouped.some((g) => g.room.id === room.id))
                      .map((room) => (
                        <li key={room.id}>
                          <Badge>{room.label}</Badge>
                        </li>
                      ))}
                  </ul>
                </details>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
            {sections.map((section) => {
              const data = (assessment.intake[section.id] ?? {}) as Record<string, unknown>;
              const fields = section.fields.filter((f) => visibleField(f, data));
              const answered = fields.filter((f) => formatValue(data[f.id], f.options) !== null).length;
              return (
                <section key={section.id} className="rounded-xl border border-line/80 bg-linen/30 p-3.5">
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <h2 className="text-sm font-semibold leading-snug">{section.title}</h2>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      {answered}/{fields.length}
                    </span>
                  </div>
                  <dl className="space-y-2">
                    {fields.map((field) => {
                      const value = formatValue(data[field.id], field.options);
                      return (
                        <div key={field.id}>
                          <dt className="text-xs leading-snug text-muted">{field.label}</dt>
                          <dd className={`mt-0.5 text-sm leading-snug ${value ? "" : "italic text-muted"}`}>
                            {value ?? "Not answered"}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </section>
              );
            })}
            {customForms.map((form) =>
              form.sections.map((section) => {
                const data = form.answers[section.id] ?? {};
                return (
                  <section key={section.id} className="rounded-xl border border-line/80 bg-linen/30 p-3.5">
                    <div className="mb-2.5">
                      <p className="text-xs font-medium text-muted">{form.title}</p>
                      <h2 className="text-sm font-semibold leading-snug">{section.title}</h2>
                    </div>
                    <dl className="space-y-2">
                      {section.fields.map((field) => {
                        const files = field.type === "image" || field.type === "file" ? fileAnswers(data[field.id]) : [];
                        const value =
                          field.type === "boolean"
                            ? data[field.id] === "yes"
                              ? "Yes"
                              : data[field.id] === "no"
                                ? "No"
                                : null
                            : files.length
                              ? null
                              : formatValue(data[field.id], field.options);
                        return (
                          <div key={field.id}>
                            <dt className="text-xs leading-snug text-muted">{field.label}</dt>
                            <dd className={`mt-0.5 text-sm leading-snug ${value || files.length ? "" : "italic text-muted"}`}>
                              {files.length
                                ? files.map((file) => (
                                    <a key={file.uploadId} href={file.url} className="block font-medium">
                                      {file.name}
                                    </a>
                                  ))
                                : (value ?? "Not answered")}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </section>
                );
              }),
            )}
          </div>
        )}
      </Card>

      {lightbox !== null ? (
        <MediaLightbox
          files={visibleFiles}
          rooms={rooms}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={setLightbox}
        />
      ) : null}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function RoomNav({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 shrink-0 items-center justify-between gap-2 rounded-md px-2.5 text-left text-sm transition-colors lg:w-full ${
        active ? "bg-teal-soft font-medium text-ink" : "text-muted hover:bg-linen hover:text-ink"
      }`}
      aria-pressed={active}
    >
      <span className="truncate">{label}</span>
      <span className="tabular-nums text-xs text-muted">{count}</span>
    </button>
  );
}

export function SubmittedPage() {
  return <AssessmentViewPage />;
}

export function ReportPage() {
  return <AssessmentViewPage focus="photos" />;
}
