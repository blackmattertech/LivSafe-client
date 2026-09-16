import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { HeartHandshake, LayoutDashboard, LifeBuoy, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../auth";
import { Bell } from "./Bell";
import { Button } from "./ui";

export function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const onDashboard = pathname === "/dashboard";
  const wide = /\/assessment\/[^/]+(\/(submitted|report))?$/.test(pathname);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-paper focus:px-4 focus:py-3 focus:shadow-lift"
        href="#main"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5">
          <Link
            to={user ? "/dashboard" : "/get-started"}
            className="group flex items-center gap-2.5 no-underline"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-teal text-white shadow-card transition-transform duration-200 group-hover:scale-105">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-xl font-semibold tracking-tight text-ink">LivSafe</span>
              <span className="mt-0.5 text-sm text-muted">Home Safety</span>
            </span>
          </Link>

          {user ? (
            <div className="flex items-center gap-1.5">
              {!onDashboard ? (
                <Link
                  to="/dashboard"
                  className="hidden items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-medium text-teal-dark no-underline transition-colors hover:bg-teal-soft sm:inline-flex"
                >
                  <LayoutDashboard className="size-5" aria-hidden="true" />
                  Dashboard
                </Link>
              ) : null}
              <Bell />
              <Link
                to="/profile"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 py-1.5 text-base font-medium text-teal-dark no-underline transition-colors hover:bg-teal-soft"
                aria-label="Your profile"
              >
                {user.avatarUrl ? (
                  <img
                    src={`${user.avatarUrl}?v=${encodeURIComponent(user.updatedAt)}`}
                    alt=""
                    className="size-9 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid size-9 place-items-center rounded-xl bg-teal-soft">
                    <UserRound className="size-5" aria-hidden="true" />
                  </span>
                )}
                <span className="hidden max-w-36 truncate sm:inline">{user.name || "Profile"}</span>
              </Link>
              <Button variant="ghost" size="sm" icon={LogOut} onClick={() => void logout()}>
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center rounded-xl border border-line bg-paper px-4 py-2 text-base font-medium text-teal-dark no-underline shadow-card transition-colors hover:bg-cream"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main
        id="main"
        className={`mx-auto w-full flex-1 animate-rise px-4 ${
          wide ? "max-w-6xl py-5 sm:py-6" : onDashboard ? "max-w-5xl py-5 sm:py-6" : "max-w-5xl py-8 sm:py-10"
        }`}
      >
        {children}
      </main>

      <footer className="border-t border-line/80 bg-paper/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-base text-muted">
          <p className="flex items-center gap-2">
            <HeartHandshake className="size-5 text-teal" aria-hidden="true" />
            Reviewed by licensed professionals. No sales, no pressure.
          </p>
          <p className="flex items-center gap-2">
            <LifeBuoy className="size-5 text-teal" aria-hidden="true" />
            Need a hand? <a href="mailto:support@livsafe.example">support@livsafe.example</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
