import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../auth";
import { HOME_NAV } from "../lib/homeNav";
import { Bell } from "./Bell";

const padX =
  "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]";

function MenuIcon({ className = "" }: { className?: string }) {
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
        d="M20.75 7C20.75 7.41421 20.4142 7.75 20 7.75L4 7.75C3.58579 7.75 3.25 7.41421 3.25 7C3.25 6.58579 3.58579 6.25 4 6.25L20 6.25C20.4142 6.25 20.75 6.58579 20.75 7Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.75 12C20.75 12.4142 20.4142 12.75 20 12.75L4 12.75C3.58579 12.75 3.25 12.4142 3.25 12C3.25 11.5858 3.58579 11.25 4 11.25L20 11.25C20.4142 11.25 20.75 11.5858 20.75 12Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.75 17C20.75 17.4142 20.4142 17.75 20 17.75L4 17.75C3.58579 17.75 3.25 17.4142 3.25 17C3.25 16.5858 3.58579 16.25 4 16.25L20 16.25C20.4142 16.25 20.75 16.5858 20.75 17Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative md:hidden" ref={wrapRef}>
      <button
        type="button"
        className="grid size-12 place-items-center rounded-xl text-[#1A73E8] transition-colors hover:bg-teal-soft"
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <MenuIcon className="size-6" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-52 animate-fade overflow-hidden rounded-xl border border-line bg-paper shadow-lift"
        >
          {HOME_NAV.map((item) =>
            item.href ? (
              <a
                key={item.label}
                role="menuitem"
                href={item.href}
                className="flex min-h-11 items-center px-4 text-base font-medium text-ink no-underline transition-colors hover:bg-teal-soft"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                role="menuitem"
                to={item.to!}
                className="flex min-h-11 items-center px-4 text-base font-medium text-ink no-underline transition-colors hover:bg-teal-soft"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  if (!user) return null;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="grid size-12 place-items-center rounded-full transition-colors hover:bg-teal-soft"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {user.avatarUrl ? (
          <span className="block size-11 shrink-0 overflow-hidden rounded-full">
            <img
              src={`${user.avatarUrl}?v=${encodeURIComponent(user.updatedAt)}`}
              alt=""
              width={44}
              height={44}
              className="size-full object-cover"
            />
          </span>
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-teal-soft text-teal">
            <UserRound className="size-6" aria-hidden="true" />
          </span>
        )}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-44 animate-fade overflow-hidden rounded-xl border border-line bg-paper shadow-lift"
        >
          <Link
            role="menuitem"
            to="/profile"
            className="flex min-h-11 items-center gap-2 px-3 text-base font-medium text-teal no-underline transition-colors hover:bg-teal-soft"
            onClick={() => setOpen(false)}
          >
            <UserRound className="size-5 shrink-0" aria-hidden="true" />
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-base font-medium text-teal transition-colors hover:bg-teal-soft"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            <LogOut className="size-5 shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const onDashboard = pathname === "/dashboard";
  const onAuthHome = pathname === "/" || pathname === "/login";
  const wide = /\/assessment\/[^/]+(\/(submitted|report))?$/.test(pathname);
  const bareLogin = onAuthHome;

  return (
    <div className={`flex min-h-dvh flex-col overflow-x-clip ${onDashboard ? "bg-paper lg:bg-background" : ""}`}>
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-paper focus:px-4 focus:py-3 focus:shadow-lift"
        href="#main"
      >
        Skip to content
      </a>

      <header
        className={`sticky top-0 z-30 bg-paper pt-[env(safe-area-inset-top)] ${
          onDashboard ? "lg:border-b lg:border-line" : "border-b border-line"
        } ${bareLogin ? "hidden" : ""}`}
      >
        <div className={`mx-auto flex max-w-5xl items-center justify-between gap-2 py-3 sm:gap-3 sm:py-3.5 ${padX}`}>
          <Link
            to={user ? "/dashboard" : "/"}
            className="group flex min-w-0 items-center no-underline"
            aria-label="LivSafe home"
          >
            <img
              src="https://res.cloudinary.com/hoevqlxx/image/upload/v1791102373/ktmc_text_back_pdf.pdf.png"
              alt="LivSafe"
              width={2172}
              height={724}
              className="livsafe-logo"
            />
          </Link>

          {user ? (
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              {!onDashboard ? (
                <Link
                  to="/dashboard"
                  className="hidden items-center gap-2 rounded-lg px-3.5 py-2.5 text-base font-medium text-teal no-underline transition-colors hover:bg-teal-soft md:inline-flex"
                >
                  <LayoutDashboard className="size-5" aria-hidden="true" />
                  Dashboard
                </Link>
              ) : null}
              <ProfileMenu />
              <Bell />
              <MobileNav />
            </div>
          ) : onAuthHome ? null : (
            <Link
              to="/"
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-line-strong bg-paper px-4 py-2 text-base font-medium text-ink no-underline transition-colors hover:bg-linen"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main
        id="main"
        className={
          bareLogin
            ? "min-h-dvh w-full"
            : `mx-auto w-full min-w-0 flex-1 animate-rise pb-[max(1.5rem,env(safe-area-inset-bottom))] ${padX} ${
                wide ? "max-w-6xl py-5 sm:py-6" : onDashboard ? "max-w-5xl py-4 sm:py-6" : "max-w-5xl py-6 sm:py-10"
              }`
        }
      >
        {children}
      </main>
    </div>
  );
}
