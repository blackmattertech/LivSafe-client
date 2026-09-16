export type Role = "client" | "admin";

export type User = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: Role;
  passwordSetAt: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  avatarUrl: string | null;
  updatedAt: string;
};

export type Assessment = {
  id: string;
  status: string;
  statusLabel: string;
  paidAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  hasReport: boolean;
  intakeComplete: boolean;
  roomsWithUploads: number;
  totalRooms: number;
  requestedRooms: string[];
  intake: Record<string, Record<string, unknown>>;
  uploads: Upload[];
  user?: User;
  adminNotes?: string | null;
};

export type Upload = {
  id: string;
  roomCategory: string;
  fileType: "photo" | "video";
  captionNote: string | null;
  uploadedAt: string;
  originalName: string | null;
  mimeType: string | null;
  url: string;
};

export type IntakeField = {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "single" | "multi";
  required?: boolean;
  options?: { value: string; label: string }[];
  showIf?: { field: string; oneOf: string[] };
  placeholder?: string;
  help?: string;
};

export type IntakeSection = {
  id: string;
  title: string;
  description?: string;
  fields: IntakeField[];
};

export type RoomConfig = {
  id: string;
  label: string;
  prompts: string[];
  allowCaption?: boolean;
  captionLabel?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
  type: string;
};
