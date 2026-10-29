import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Images, Play, X } from "lucide-react";
import { mediaUrl } from "../api";
import type { RoomConfig, Upload } from "../types";

function roomLabel(rooms: RoomConfig[], id: string) {
  return rooms.find((r) => r.id === id)?.label ?? id.replaceAll("_", " ");
}

function formatFileDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PhotoMosaic({
  files,
  rooms,
  onOpen,
  className = "rounded-[1.35rem]",
}: {
  files: Upload[];
  rooms: RoomConfig[];
  onOpen: (index: number) => void;
  className?: string;
}) {
  const photos = files.filter((f) => f.fileType === "photo");
  const featured = (photos.length ? photos : files).slice(0, 5);
  if (!featured.length) return null;

  const extra = files.length - featured.length;

  return (
    <div
      className={`grid overflow-hidden ${className} ${
        featured.length === 1
          ? "grid-cols-1"
          : featured.length === 2
            ? "grid-cols-2"
            : featured.length === 3
              ? "grid-cols-2 sm:grid-cols-3"
              : "grid-cols-2 sm:grid-cols-4"
      } max-h-[28rem] gap-px bg-line sm:max-h-[32rem]`}
    >
      {featured.map((file, i) => {
        const tall = featured.length >= 4 && i === 0;
        const last = i === featured.length - 1 && extra > 0;
        return (
          <button
            key={file.id}
            type="button"
            onClick={() => onOpen(files.findIndex((f) => f.id === file.id))}
            className={`group relative h-full min-h-36 overflow-hidden bg-linen text-left ${
              featured.length === 1 ? "min-h-72 sm:min-h-[22rem]" : ""
            } ${featured.length === 3 && i === 0 ? "col-span-2 sm:col-span-1" : ""} ${
              tall ? "sm:col-span-2 sm:row-span-2 sm:min-h-[20rem]" : featured.length === 1 ? "" : "min-h-32 sm:min-h-40"
            }`}
            aria-label={`Open ${roomLabel(rooms, file.roomCategory)} ${file.fileType}`}
          >
            {file.fileType === "video" ? (
              <>
                <video className="absolute inset-0 h-full w-full object-cover" src={mediaUrl(file.url)} muted playsInline />
                <span className="absolute inset-0 grid place-items-center bg-ink/25">
                  <span className="grid size-12 place-items-center rounded-full bg-paper/95 text-teal shadow-lift">
                    <Play className="size-6 fill-current" aria-hidden="true" />
                  </span>
                </span>
              </>
            ) : (
              <img
                src={mediaUrl(file.url)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
            )}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent px-3 pb-3 pt-10 text-sm font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              {roomLabel(rooms, file.roomCategory)}
            </span>
            {last ? (
              <span className="absolute inset-0 grid place-items-center bg-ink/55 text-white">
                <span className="flex items-center gap-2 rounded-full bg-paper/15 px-4 py-2 text-lg font-semibold backdrop-blur-sm">
                  <Images className="size-5" aria-hidden="true" />
                  +{extra} more
                </span>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function MediaGrid({
  files,
  rooms,
  onOpen,
  compact = false,
}: {
  files: Upload[];
  rooms: RoomConfig[];
  onOpen: (index: number) => void;
  compact?: boolean;
}) {
  if (!files.length) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong bg-linen/40 px-4 py-8 text-center text-sm text-muted">
        No photos in this area.
      </p>
    );
  }

  return (
    <ul
      className={
        compact
          ? "grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5"
          : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      }
    >
      {files.map((file, index) => (
        <li key={file.id}>
          <button
            type="button"
            onClick={() => onOpen(index)}
            className={`group w-full overflow-hidden border border-line bg-linen text-left transition-all duration-200 hover:shadow-lift ${
              compact ? "rounded-lg" : "rounded-2xl shadow-card hover:-translate-y-0.5"
            }`}
          >
            <span className="relative block aspect-square overflow-hidden">
              {file.fileType === "video" ? (
                <>
                  <video className="h-full w-full object-cover" src={mediaUrl(file.url)} muted playsInline />
                  <span className="absolute inset-0 grid place-items-center bg-ink/20">
                    <span
                      className={`grid place-items-center rounded-full bg-paper/95 text-teal shadow-card ${
                        compact ? "size-8" : "size-11"
                      }`}
                    >
                      <Play className={compact ? "size-3.5 fill-current" : "size-5 fill-current"} aria-hidden="true" />
                    </span>
                  </span>
                </>
              ) : (
                <img
                  src={mediaUrl(file.url)}
                  alt={file.originalName || roomLabel(rooms, file.roomCategory)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              )}
              {compact ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-2 pb-1.5 pt-6 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {roomLabel(rooms, file.roomCategory)}
                </span>
              ) : null}
            </span>
            {compact ? null : (
              <span className="block space-y-0.5 px-3 py-2.5">
                <span className="block truncate text-sm font-medium">
                  {roomLabel(rooms, file.roomCategory)}
                </span>
                {file.captionNote ? (
                  <span className="line-clamp-2 text-sm leading-snug text-muted">{file.captionNote}</span>
                ) : (
                  <span className="block text-sm text-muted">
                    {file.fileType === "video" ? "Video" : "Photo"}
                  </span>
                )}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function MediaLightbox({
  files,
  rooms,
  index,
  onClose,
  onIndex,
}: {
  files: Upload[];
  rooms: RoomConfig[];
  index: number;
  onClose: () => void;
  onIndex: (next: number) => void;
}) {
  const file = files[index];
  const room = file ? roomLabel(rooms, file.roomCategory) : "";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex(Math.min(files.length - 1, index + 1));
      if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [files.length, index, onClose, onIndex]);

  const groupedHint = useMemo(() => {
    if (!file) return "";
    return `${index + 1} of ${files.length}`;
  }, [file, files.length, index]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade flex-col bg-ink/92 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`${room} ${file.fileType}`}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-3 text-white/85"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-white">{room}</p>
          <p className="truncate text-sm text-white/70">
            {groupedHint}
            {file.originalName ? ` · ${file.originalName}` : ""}
          </p>
        </div>
        <button
          type="button"
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-white transition-colors hover:bg-white/20"
          onClick={onClose}
          aria-label="Close preview"
        >
          <X className="size-6" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center gap-2 sm:gap-4" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 disabled:opacity-25"
          onClick={() => onIndex(index - 1)}
          disabled={index === 0}
          aria-label="Previous file"
        >
          <ChevronLeft className="size-7" />
        </button>
        <div className="grid min-h-0 flex-1 place-items-center">
          {file.fileType === "video" ? (
            <video className="max-h-[min(72vh,52rem)] max-w-full rounded-2xl shadow-lift" controls src={mediaUrl(file.url)} />
          ) : (
            <img
              className="max-h-[min(72vh,52rem)] max-w-full rounded-2xl object-contain shadow-lift"
              src={mediaUrl(file.url)}
              alt={file.originalName || room}
            />
          )}
        </div>
        <button
          type="button"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 disabled:opacity-25"
          onClick={() => onIndex(index + 1)}
          disabled={index === files.length - 1}
          aria-label="Next file"
        >
          <ChevronRight className="size-7" />
        </button>
      </div>

      <div className="mx-auto mt-3 max-w-2xl text-center text-white/80" onClick={(e) => e.stopPropagation()}>
        {file.captionNote ? <p className="text-base leading-relaxed">{file.captionNote}</p> : null}
        <p className="mt-1 text-sm text-white/55">Added {formatFileDate(file.uploadedAt)}</p>
      </div>

      {files.length > 1 ? (
        <div
          className="mt-4 flex justify-center gap-1.5 overflow-x-auto pb-1"
          onClick={(e) => e.stopPropagation()}
        >
          {files.map((thumb, i) => (
            <button
              key={thumb.id}
              type="button"
              onClick={() => onIndex(i)}
              aria-label={`Show file ${i + 1}`}
              aria-current={i === index}
              className={`relative size-14 shrink-0 overflow-hidden rounded-xl transition-all ${
                i === index ? "ring-2 ring-white ring-offset-2 ring-offset-ink" : "opacity-55 hover:opacity-100"
              }`}
            >
              {thumb.fileType === "video" ? (
                <video className="h-full w-full object-cover" src={mediaUrl(thumb.url)} muted playsInline />
              ) : (
                <img className="h-full w-full object-cover" src={mediaUrl(thumb.url)} alt="" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
