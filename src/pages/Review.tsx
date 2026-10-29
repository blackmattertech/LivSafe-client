import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  Bell,
  Camera,
  Check,
  ClipboardList,
  Images,
  Inbox,
  Lock,
  Send,
  ShieldCheck,
} from "lucide-react";
import { api, ApiError } from "../api";
import { MediaGrid, MediaLightbox } from "../components/Media";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorText,
  PageHeading,
  PageLoader,
  StatTile,
} from "../components/ui";
import { intakePath } from "../lib/intake";
import { roomsForAssessment } from "../lib/rooms";
import type { Assessment, IntakeSection, NotificationItem, RoomConfig } from "../types";

export function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [allRooms, setAllRooms] = useState<RoomConfig[]>([]);
  const [sections, setSections] = useState<IntakeSection[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    void Promise.all([
      api<{ assessment: Assessment }>(`/api/assessments/${id}`),
      api<{ rooms: RoomConfig[] }>("/api/config/rooms"),
      api<{ sections: IntakeSection[] }>("/api/config/intake"),
    ]).then(([a, r, s]) => {
      setAssessment(a.assessment);
      setAllRooms(r.rooms);
      setSections(s.sections);
    });
  }, [id]);

  if (!assessment) return <PageLoader label="Loading your summary" />;
  if (!assessment.requiresIntake) return <Navigate to="/reports" replace />;
  if (!assessment.intakeComplete) return <Navigate to={intakePath(assessment)} replace />;
  if (assessment.submittedAt) return <Navigate to={`/assessment/${id}/submitted`} replace />;

  const rooms = roomsForAssessment(assessment, allRooms);
  const uploaded = new Set(assessment.uploads.map((u) => u.roomCategory));
  const photographed = rooms.filter((room) => uploaded.has(room.id)).length;
  const missing = rooms.filter((room) => !uploaded.has(room.id));
  const savedSections = sections.filter((s) => assessment.intake[s.id]).length;
  const photos = assessment.uploads.filter((u) => u.fileType === "photo").length;
  const videos = assessment.uploads.length - photos;

  async function submit() {
    setError("");
    setBusy(true);
    try {
      await api(`/api/assessments/${id}/submit`, { method: "POST" });
      navigate(`/assessment/${id}/submitted`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Final check"
        icon={ShieldCheck}
        title="Review before submitting"
        description="Take a last look. Once you submit, your intake and photos are locked while a reviewer works on your report."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={ClipboardList}
          label="Intake sections"
          value={`${savedSections}/${sections.length}`}
          hint={savedSections === sections.length ? "all saved" : "some still empty"}
          tone={savedSections === sections.length ? "sage" : "amber"}
        />
        <StatTile
          icon={Camera}
          label="Areas photographed"
          value={`${photographed}/${rooms.length}`}
          hint="requested areas with at least one file"
          tone={photographed ? "sage" : "amber"}
        />
        <StatTile
          icon={Images}
          label="Files added"
          value={assessment.uploads.length}
          hint={`${photos} photo${photos === 1 ? "" : "s"} · ${videos} video${videos === 1 ? "" : "s"}`}
          tone="teal"
        />
      </div>

      <Card>
        <CardHeader
          icon={ClipboardList}
          title="Intake answers"
          subtitle={`${savedSections} of ${sections.length} sections saved`}
          action={
            <Link to={`/assessment/${id}/intake`} className="text-base">
              Edit intake
            </Link>
          }
        />
        <ul className="grid gap-2 px-6 py-5 sm:grid-cols-2">
          {sections.map((s) => {
            const done = Boolean(assessment.intake[s.id]);
            return (
              <li key={s.id} className="flex items-center gap-2.5 text-base">
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full ${
                    done ? "bg-sage text-white" : "border border-line-strong"
                  }`}
                  aria-hidden="true"
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : null}
                </span>
                <span className={done ? "" : "text-muted"}>{s.title}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader
          icon={Camera}
          title="Your photos"
          subtitle={
            assessment.uploads.length
              ? "Tap a photo to see it larger before you submit"
              : "Add photos of the areas you asked LivSafe to review"
          }
          action={
            <Link to={`/assessment/${id}/uploads`} className="text-base">
              Edit photos
            </Link>
          }
        />
        <div className="space-y-5 px-6 py-5">
          {assessment.uploads.length ? (
            <MediaGrid
              files={assessment.uploads}
              rooms={allRooms}
              onOpen={(i) => setLightbox(i)}
            />
          ) : (
            <p className="rounded-xl bg-linen/60 px-4 py-3 text-base text-muted">
              No photos yet. Add at least one of the areas you asked LivSafe to review.
            </p>
          )}
          <ul className="grid gap-2 sm:grid-cols-2">
            {rooms.map((room) => {
              const count = assessment.uploads.filter((u) => u.roomCategory === room.id).length;
              return (
                <li
                  key={room.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-linen/50 px-3 py-2.5 text-base"
                >
                  <span className={count ? "" : "text-muted"}>{room.label}</span>
                  {count ? (
                    <Badge tone="sage">
                      {count} file{count === 1 ? "" : "s"}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted">none</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Card>

      {missing.length ? (
        <Alert tone="amber" title="A few requested areas have no photos yet">
          You asked LivSafe to review{" "}
          <strong>{missing.map((room) => room.label).join(", ")}</strong>. You can still submit, or{" "}
          <Link to={`/assessment/${id}/uploads`}>add photos first</Link>.
        </Alert>
      ) : null}

      <Card className="p-6 sm:p-7">
        <p className="flex items-start gap-3 leading-relaxed">
          <Lock className="mt-1 size-5 shrink-0 text-teal" aria-hidden="true" />
          Submitting locks your answers and photos so the reviewer sees a stable set of materials. We will email
          you as soon as the report is ready.
        </p>
        <div className="mt-5">
          <ErrorText>{error}</ErrorText>
        </div>
        <Button className="mt-5 w-full sm:w-auto" icon={Send} loading={busy} onClick={() => void submit()}>
          Submit for review
        </Button>
      </Card>

      {lightbox !== null ? (
        <MediaLightbox
          files={assessment.uploads}
          rooms={allRooms}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={setLightbox}
        />
      ) : null}
    </div>
  );
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  useEffect(() => {
    void api<{ notifications: NotificationItem[] }>("/api/notifications").then((d) =>
      setItems(d.notifications),
    );
  }, []);

  if (!items) return <PageLoader label="Loading notifications" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading
        eyebrow="Inbox"
        icon={Bell}
        title="Notifications"
        description="Reminders and updates about your assessment, newest first."
      />
      {items.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing here yet">
          <p>Updates about your assessment will show up in this list.</p>
        </EmptyState>
      ) : (
        <Card className="divide-y divide-line/60">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="flex gap-3 px-6 py-5 no-underline transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-cream"
            >
              <span
                className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                  item.readAt ? "bg-line-strong" : "bg-terracotta"
                }`}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block font-semibold leading-snug text-ink">{item.title}</span>
                <span className="mt-1 block leading-relaxed text-muted">{item.body}</span>
                <span className="mt-2 block text-sm text-muted">
                  {new Date(item.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
