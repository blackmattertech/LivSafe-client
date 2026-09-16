import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { PublicLayout, RequireClient } from "./layouts";
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignupPage } from "./pages/AuthPages";
import { CheckoutCancelPage, CheckoutSuccessPage } from "./pages/Checkout";
import { DashboardPage } from "./pages/Dashboard";
import { GetStartedPage } from "./pages/GetStarted";
import { IntakePage } from "./pages/Intake";
import { ReportPage, SubmittedPage } from "./pages/AssessmentView";
import { NotificationsPage, ReviewPage } from "./pages/Review";
import { UploadsPage } from "./pages/Uploads";
import { ProfilePage } from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Navigate to="/get-started" replace />} />
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
          </Route>
          <Route element={<RequireClient />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/assessment/:id" element={<SubmittedPage />} />
            <Route path="/assessment/:id/intake" element={<IntakePage />} />
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
