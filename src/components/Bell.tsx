import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell as BellIcon, Inbox } from "lucide-react";
import { api } from "../api";
import type { NotificationItem } from "../types";

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
        className="relative grid size-12 place-items-center rounded-xl text-teal-dark transition-colors hover:bg-teal-soft"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon className="size-6" aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-sm font-semibold text-white shadow-card">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] animate-fade overflow-hidden rounded-2xl border border-line bg-paper shadow-lift">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <span className="flex items-center gap-2 font-semibold">
              <Inbox className="size-5 text-teal" aria-hidden="true" />
              Updates
            </span>
            <Link className="text-base" to="/notifications" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          <ul className="max-h-80 divide-y divide-line/60 overflow-auto">
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
                    <span className="block font-medium leading-snug">{item.title}</span>
                    <span className="mt-0.5 block text-base leading-snug text-muted">{item.body}</span>
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
