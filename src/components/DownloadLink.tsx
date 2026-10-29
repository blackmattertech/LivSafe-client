import type { ReactNode } from "react";
import { mediaUrl, openDownload } from "../api";

/** Report files live on the API host. A root-relative /api link is served by Netlify and 404s. */
export function DownloadLink({
  path,
  className,
  children,
  label,
}: {
  path: string;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  return (
    <a
      href={mediaUrl(path)}
      className={className}
      aria-label={label}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        void openDownload(path);
      }}
    >
      {children}
    </a>
  );
}
