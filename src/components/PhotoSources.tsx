import { Camera, ImagePlus } from "lucide-react";

function SourceControl({
  label,
  icon: Icon,
  accept,
  capture,
  multiple,
  disabled,
  onPick,
}: {
  label: string;
  icon: typeof Camera;
  accept: string;
  capture?: "environment";
  multiple?: boolean;
  disabled?: boolean;
  onPick: (files: File[]) => void;
}) {
  return (
    <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line-strong bg-paper px-4 text-base font-medium text-ink shadow-card hover:bg-linen sm:w-auto">
      <Icon className="size-5 text-teal" aria-hidden="true" />
      {label}
      <input
        className="sr-only"
        type="file"
        accept={accept}
        capture={capture}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) onPick(files);
        }}
      />
    </label>
  );
}

/** Gallery leaves the camera closed. Capture opens the phone camera. */
export function PhotoSources({
  accept = "image/*",
  multiple = false,
  disabled = false,
  onPick,
  galleryLabel = "Choose from gallery",
  cameraLabel = "Take a photo",
}: {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onPick: (files: File[]) => void;
  galleryLabel?: string;
  cameraLabel?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
      <SourceControl
        label={galleryLabel}
        icon={ImagePlus}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onPick={onPick}
      />
      <SourceControl
        label={cameraLabel}
        icon={Camera}
        accept={accept}
        capture="environment"
        disabled={disabled}
        onPick={onPick}
      />
    </div>
  );
}
