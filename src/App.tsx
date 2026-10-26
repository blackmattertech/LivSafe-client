import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { websiteUrl } from "./api";
import { AuthProvider } from "./auth";
import { PublicLayout, RequireClient } from "./layouts";
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignupPage } from "./pages/AuthPages";
import { CheckoutCancelPage } from "./pages/Checkout";
import { DashboardPage, AssessmentsPage, ReferPage, ReportsPage } from "./pages/Dashboard";
import { GetStartedPage } from "./pages/GetStarted";
import { IntakePage } from "./pages/Intake";
import { FormFillPage, FormsListPage } from "./pages/CustomForms";
import { ReportPage, SubmittedPage } from "./pages/AssessmentView";
import { NotificationsPage, ReviewPage } from "./pages/Review";
import { UploadsPage } from "./pages/Uploads";
import { ProfilePage } from "./pages/Profile";

function CheckoutSuccessRedirect() {
  const [params] = useSearchParams();
  useEffect(() => {
    const sessionId = params.get("session_id");
    const url = new URL("/checkout/success/", `${websiteUrl}/`);
    if (sessionId) url.searchParams.set("session_id", sessionId);
    window.location.replace(url.toString());
  }, [params]);
  return (
    <p className="p-6 text-center text-lg" role="status">
      Taking you back to the LivSafe website…
    </p>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/checkout/success" element={<CheckoutSuccessRedirect />} />
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
          </Route>
          <Route element={<RequireClient />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/refer" element={<ReferPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/assessment/:id" element={<SubmittedPage />} />
            <Route path="/assessment/:id/intake" element={<IntakePage />} />
            <Route path="/assessment/:id/forms" element={<FormsListPage />} />
            <Route path="/assessment/:id/forms/:formId" element={<FormFillPage />} />
            <Route path="/assessment/:id/uploads" element={<UploadsPage />} />
            <Route path="/assessment/:id/review" element={<ReviewPage />} />
            <Route path="/assessment/:id/submitted" element={<SubmittedPage />} />
            <Route path="/assessment/:id/report" element={<ReportPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
