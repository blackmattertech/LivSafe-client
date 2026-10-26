import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Inbox } from "lucide-react";
import { api } from "../api";
import type { NotificationItem } from "../types";

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1.25C7.71983 1.25 4.25004 4.71979 4.25004 9V9.7041C4.25004 10.401 4.04375 11.0824 3.65717 11.6622L2.50856 13.3851C1.17547 15.3848 2.19318 18.1028 4.51177 18.7351C5.26738 18.9412 6.02937 19.1155 6.79578 19.2581L6.79768 19.2632C7.56667 21.3151 9.62198 22.75 12 22.75C14.378 22.75 16.4333 21.3151 17.2023 19.2632L17.2042 19.2581C17.9706 19.1155 18.7327 18.9412 19.4883 18.7351C21.8069 18.1028 22.8246 15.3848 21.4915 13.3851L20.3429 11.6622C19.9563 11.0824 19.75 10.401 19.75 9.7041V9C19.75 4.71979 16.2802 1.25 12 1.25ZM15.3764 19.537C13.1335 19.805 10.8664 19.8049 8.62349 19.5369C9.33444 20.5585 10.571 21.25 12 21.25C13.4289 21.25 14.6655 20.5585 15.3764 19.537ZM5.75004 9C5.75004 5.54822 8.54826 2.75 12 2.75C15.4518 2.75 18.25 5.54822 18.25 9V9.7041C18.25 10.6972 18.544 11.668 19.0948 12.4943L20.2434 14.2172C21.0086 15.3649 20.4245 16.925 19.0936 17.288C14.4494 18.5546 9.5507 18.5546 4.90644 17.288C3.57561 16.925 2.99147 15.3649 3.75664 14.2172L4.90524 12.4943C5.45609 11.668 5.75004 10.6972 5.75004 9.7041V9Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Bell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  async function load() {
    const data = await api<{ notifications: NotificationItem[]; unreadCount: number }>(
      "/api/notifications",
    );
    setItems(data.notifications);
    setUnread(data.unreadCount);
  }

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function openItem(item: NotificationItem) {
    await api(`/api/notifications/${item.id}/read`, { method: "PATCH" });
    setOpen(false);
    navigate(item.link);
    void load();
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        className="relative grid size-12 place-items-center rounded-xl text-[#1A73E8] transition-colors hover:bg-teal-soft"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon className="size-6" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-sm font-semibold text-white shadow-card">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.25rem)] z-40 mx-auto w-auto max-w-md animate-fade overflow-hidden rounded-2xl border border-line bg-paper shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[min(24rem,calc(100vw-2rem))]">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <span className="flex items-center gap-2 font-semibold">
              <Inbox className="size-5 text-teal" aria-hidden="true" />
              Updates
            </span>
            <Link className="text-base" to="/notifications" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          <ul className="max-h-[min(20rem,50dvh)] divide-y divide-line/60 overflow-auto">
            {items.slice(0, 6).map((item) => (
              <li key={item.id}>
                <button
                  className="flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-cream"
                  onClick={() => void openItem(item)}
                >
                  <span
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                      item.readAt ? "bg-line-strong" : "bg-terracotta"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-pretty font-medium leading-snug">{item.title}</span>
                    <span className="mt-0.5 block text-pretty text-base leading-snug text-muted">{item.body}</span>
                  </span>
                </button>
              </li>
            ))}
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-muted">Nothing new right now.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
