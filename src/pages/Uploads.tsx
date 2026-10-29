import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CloudUpload,
  Film,
  ImagePlus,
  Info,
  Loader2,
  Trash2,
} from "lucide-react";
import { api, mediaUrl } from "../api";
import { Alert, Button, Card, Field, PageLoader, ProgressBar, TextArea } from "../components/ui";
import { intakePath } from "../lib/intake";
import { roomsForAssessment } from "../lib/rooms";
import type { Assessment, RoomConfig, Upload } from "../types";

export function UploadsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allRooms, setAllRooms] = useState<RoomConfig[]>([]);
  const [intro, setIntro] = useState("");
  const [videoCopy, setVideoCopy] = useState("");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [index, setIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(0);
  const [dragging, setDragging] = useState(false);

  async function load() {
    const [cfg, a] = await Promise.all([
      api<{ rooms: RoomConfig[]; intro: string; optionalVideo: string }>("/api/config/rooms"),
      api<{ assessment: Assessment }>(`/api/assessments/${id}`),
    ]);
    setAllRooms(cfg.rooms);
    setIntro(cfg.intro);
    setVideoCopy(cfg.optionalVideo);
    setAssessment(a.assessment);
  }

  useEffect(() => {
    void load();
  }, [id]);

  const rooms = useMemo(() => {
    if (!assessment || !assessment.requiresIntake) return [];
    return roomsForAssessment(assessment, allRooms);
  }, [allRooms, assessment]);

  useEffect(() => {
    if (index >= rooms.length) setIndex(0);
  }, [rooms.length, index]);

  const room = rooms[index];
  const files = useMemo(
    () => assessment?.uploads.filter((u) => u.roomCategory === room?.id) ?? [],
    [assessment, room],
  );
  const countByRoom = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of assessment?.uploads ?? []) map.set(u.roomCategory, (map.get(u.roomCategory) ?? 0) + 1);
    return map;
  }, [assessment]);
  const completeRooms = rooms.filter((r) => (countByRoom.get(r.id) ?? 0) > 0).length;

  async function uploadFile(file: File, fileType: "photo" | "video") {
    if (!id || !room) return;
    setBusy((n) => n + 1);
    try {
      const presign = await api<{
        url: string;
        method: "PUT" | "POST";
        key: string;
        headers?: Record<string, string>;
      }>("/api/uploads/presign", {
        method: "POST",
        body: JSON.stringify({
          assessmentId: id,
          roomCategory: room.id,
          fileType,
          contentType: file.type || "application/octet-stream",
          fileName: file.name,
        }),
      });
      if (presign.method === "POST") {
        const form = new FormData();
        form.append("file", file);
        form.append("key", presign.key);
        form.append("assessmentId", id);
        form.append("roomCategory", room.id);
        form.append("fileType", fileType);
        if (caption) form.append("captionNote", caption);
        await api("/api/uploads/local", { method: "POST", body: form });
      } else {
        await fetch(presign.url, { method: "PUT", body: file, headers: presign.headers });
        await api("/api/uploads/complete", {
          method: "POST",
          body: JSON.stringify({
            assessmentId: id,
            roomCategory: room.id,
            fileType,
            key: presign.key,
            contentType: file.type,
            fileName: file.name,
            captionNote: caption || undefined,
          }),
        });
      }
      await load();
    } finally {
      setBusy((n) => Math.max(0, n - 1));
    }
  }

  function addFiles(list: File[]) {
    void Promise.all(
      list.map((f) => uploadFile(f, f.type.startsWith("video/") ? "video" : "photo")),
    );
  }

  function onDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files ?? []));
  }

  async function remove(upload: Upload) {
    await api(`/api/uploads/${upload.id}`, { method: "DELETE" });
    await load();
  }

  function goToRoom(next: number) {
    setIndex(next);
    setCaption("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!assessment) return <PageLoader label="Loading photo areas" />;
  if (!assessment.requiresIntake) return <Navigate to="/reports" replace />;
  if (assessment.intakeFormId && !assessment.intakeComplete) return <Navigate to={intakePath(assessment)} replace />;
  if (assessment.submittedAt) return <Navigate to={`/assessment/${id}/submitted`} replace />;
  if (!rooms.length) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {assessment.photoAreas ? (
          <Alert tone="amber" title="No photo areas on this assessment">
            This form does not ask for photos. You can continue when the rest of the assessment is ready.
          </Alert>
        ) : (
          <Alert tone="amber" title="Choose areas to review first">
            Photos and videos are only collected for the areas you selected in intake.{" "}
            <Link to={`/assessment/${id}/intake`}>Go back and choose which areas LivSafe should review</Link>.
          </Alert>
        )}
      </div>
    );
  }
  if (!room) return <PageLoader label="Loading photo areas" />;

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)] xl:items-start">
      <nav aria-label="Home areas" className="min-w-0 xl:sticky xl:top-24">
        <Card className="p-3 sm:p-4">
          <p className="mb-3 hidden items-center gap-2 px-1 text-base font-semibold xl:flex">
            <Camera className="size-5 text-teal" aria-hidden="true" />
            Areas
          </p>
          <ol className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] xl:max-h-[55vh] xl:flex-col xl:space-y-1 xl:overflow-auto xl:pr-1 xl:pb-0 [&::-webkit-scrollbar]:hidden">
            {rooms.map((r, i) => {
              const count = countByRoom.get(r.id) ?? 0;
              const active = i === index;
              return (
                <li key={r.id} className="shrink-0 xl:w-full xl:shrink">
                  <button
                    type="button"
                    onClick={() => goToRoom(i)}
                    className={`flex min-h-11 w-auto items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-base transition-colors xl:w-full ${
                      active ? "bg-teal-soft font-medium text-ink" : "text-muted hover:bg-linen"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-full text-sm ${
                          count || active ? "bg-teal text-white" : "border border-line-strong"
                        }`}
                        aria-hidden="true"
                      >
                        {count ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="whitespace-nowrap leading-snug xl:truncate xl:whitespace-normal">{r.label}</span>
                    </span>
                    {count ? <span className="shrink-0 text-sm tabular-nums text-muted">{count}</span> : null}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 border-t border-line/70 px-1 pt-3 text-sm text-muted xl:block">
            {completeRooms} of {rooms.length} areas have photos
          </p>
        </Card>
      </nav>

      <div className="mx-auto w-full min-w-0 max-w-2xl space-y-5">
        <Card className="px-6 py-5">
          <ProgressBar
            value={completeRooms}
            max={rooms.length}
            label={`${completeRooms} of ${rooms.length} areas have photos`}
            tone="teal"
          />
        </Card>

        <Alert tone="teal" title="You do not need to spot the hazards">
          {intro}
        </Alert>

        <Card className="p-5 sm:p-8">
          <h1 className="text-[1.75rem] font-semibold leading-tight sm:text-3xl">{room.label}</h1>
          <p className="mt-1 text-base text-muted">
            Area {index + 1} of {rooms.length} · {files.length} file{files.length === 1 ? "" : "s"} added
          </p>

          <div className="mt-6 rounded-xl border border-line bg-linen/50 p-5">
            <p className="mb-3 flex items-center gap-2 font-semibold">
              <Info className="size-5 text-teal" aria-hidden="true" />
              Photos to take here
            </p>
            <ol className="space-y-2">
              {room.prompts.map((p, i) => (
                <li key={p} className="flex gap-3 leading-relaxed">
                  <span
                    className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-paper text-sm font-medium text-teal-dark shadow-card"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </div>

          {room.allowCaption ? (
            <div className="mt-6">
              <Field label={room.captionLabel || "Note"} hint="Added to the photos you upload next.">
                <TextArea value={caption} onChange={(e) => setCaption(e.target.value)} />
              </Field>
            </div>
          ) : null}

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`mt-6 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-colors ${
              dragging ? "border-teal bg-teal-soft" : "border-line-strong bg-linen/40 hover:bg-cream"
            }`}
          >
            <span className="grid size-12 place-items-center rounded-xl bg-teal text-white shadow-card">
              <CloudUpload className="size-6" aria-hidden="true" />
            </span>
            <span className="mt-1 text-lg font-medium">Add photos of this area</span>
            <span className="text-base text-muted">
              Tap to choose from your phone or camera, or drag files here
            </span>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2 text-base font-medium shadow-card transition-colors hover:bg-cream">
              <Film className="size-5 text-teal" aria-hidden="true" />
              Upload a short video instead
              <input
                className="sr-only"
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadFile(file, "video");
                  e.target.value = "";
                }}
              />
            </label>
            {busy > 0 ? (
              <span className="inline-flex items-center gap-2 text-base text-teal-dark" role="status">
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                Uploading {busy} file{busy === 1 ? "" : "s"}…
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-base leading-relaxed text-muted">{videoCopy}</p>

          {files.length ? (
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="group relative overflow-hidden rounded-xl border border-line bg-linen"
                >
                  {file.fileType === "video" ? (
                    <video className="aspect-square w-full object-cover" controls src={mediaUrl(file.url)} />
                  ) : (
                    <img
                      className="aspect-square w-full object-cover"
                      src={mediaUrl(file.url)}
                      alt={file.originalName || room.label}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => void remove(file)}
                    aria-label={`Remove ${file.originalName || "file"}`}
                    className="absolute right-2 top-2 grid size-10 place-items-center rounded-xl bg-paper/95 text-terracotta shadow-card transition-colors hover:bg-terracotta hover:text-white"
                  >
                    <Trash2 className="size-5" aria-hidden="true" />
                  </button>
                  {file.captionNote ? (
                    <p className="bg-paper px-2 py-1.5 text-sm leading-snug text-muted">{file.captionNote}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 flex items-center gap-2 rounded-xl bg-linen/60 px-4 py-3 text-base text-muted">
              <ImagePlus className="size-5" aria-hidden="true" />
              No files here yet. Add photos or a short video of this area.
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 border-t border-line/70 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
            {index > 0 ? (
              <Button variant="secondary" icon={ArrowLeft} className="w-full sm:w-auto" onClick={() => goToRoom(index - 1)}>
                Previous area
              </Button>
            ) : (
              <Link to={`/assessment/${id}/intake`} className="text-base">
                Back to intake
              </Link>
            )}
            {index < rooms.length - 1 ? (
              <Button icon={ArrowRight} className="w-full sm:w-auto" onClick={() => goToRoom(index + 1)}>
                {files.length ? "Next area" : "Skip this area"}
              </Button>
            ) : (
              <Button icon={ArrowRight} className="w-full sm:w-auto" onClick={() => navigate(`/assessment/${id}/review`)}>
                Review and submit
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
