export const SUPPORT_EMAIL = "hello@livsafehomesafety.com";

export const HOME_NAV: {
  label: string;
  to?: string;
  href?: string;
  className: string;
}[] = [
  { label: "Assessment", to: "/assessments", className: "bg-teal-soft" },
  { label: "Reports", to: "/reports", className: "bg-wellness-light" },
  { label: "Profile", to: "/profile", className: "bg-sage-soft" },
  { label: "Refer", to: "/refer", className: "bg-info-bg" },
  { label: "Support", href: `mailto:${SUPPORT_EMAIL}`, className: "bg-amber-soft" },
];
