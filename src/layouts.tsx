import { Navigate, Outlet } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "./auth";
import { Shell } from "./components/Shell";
import { Card } from "./components/ui";

function FullPageLoader() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-muted">
        <Loader2 className="size-8 animate-spin text-teal" aria-hidden="true" />
        <p>Loading your portal…</p>
      </div>
    </div>
  );
}

export function RequireClient() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") {
    return (
      <Shell>
        <Card className="mx-auto max-w-xl p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-amber-soft text-amber">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold">This is the client portal</h1>
          <p className="mt-3 leading-relaxed text-muted">
            Staff accounts review assessments in the LivSafe admin app instead.
          </p>
        </Card>
      </Shell>
    );
  }
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export function PublicLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}
