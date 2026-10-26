import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CircleSlash } from "lucide-react";
import { track } from "../api";
import { Card } from "../components/ui";

export function CheckoutCancelPage() {
  useEffect(() => {
    track("checkout_cancel");
  }, []);

  return (
    <div className="mx-auto max-w-xl">
      <Card className="p-6 text-center sm:p-8">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-amber-soft text-amber">
          <CircleSlash className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">Payment cancelled</h1>
        <p className="mt-3 leading-relaxed text-muted">
          You have not been charged. Nothing is lost — start again whenever you are ready.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-lg font-medium text-white no-underline shadow-card transition-colors hover:bg-primary-hover sm:w-auto"
        >
          Back to sign in
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </Card>
    </div>
  );
}
