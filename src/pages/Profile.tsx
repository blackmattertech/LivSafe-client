import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, CheckCircle2, MapPin, Trash2, UserRound } from "lucide-react";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import { Alert, Button, Card, CardHeader, ErrorText, Field, PageHeading, TextInput } from "../components/ui";
import type { User } from "../types";

function initials(user: User) {
  const source = user.name?.trim() || user.email;
  return source.slice(0, 1).toUpperCase();
}

function avatarSrc(user: User) {
  return user.avatarUrl ? `${user.avatarUrl}?v=${encodeURIComponent(user.updatedAt)}` : null;
}

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [addressLine1, setAddressLine1] = useState(user?.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(user?.addressLine2 ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [state, setState] = useState(user?.state ?? "");
  const [postalCode, setPostalCode] = useState(user?.postalCode ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setAddressLine1(user.addressLine1 ?? "");
    setAddressLine2(user.addressLine2 ?? "");
    setCity(user.city ?? "");
    setState(user.state ?? "");
    setPostalCode(user.postalCode ?? "");
    setCountry(user.country ?? "");
  }, [user]);

  if (!user) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    try {
      await api<{ user: User }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
        }),
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your profile");
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setError("");
    setSaved(false);
    setPhotoBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api<{ user: User }>("/api/auth/me/avatar", { method: "POST", body: form });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload that photo");
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto() {
    setError("");
    setSaved(false);
    setPhotoBusy(true);
    try {
      await api<{ user: User }>("/api/auth/me/avatar", { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove that photo");
    } finally {
      setPhotoBusy(false);
    }
  }

  const photo = avatarSrc(user);

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Account"
        icon={UserRound}
        title="Your profile"
        description="Keep your contact details and photo up to date so we can reach you about assessments and reports."
      />

      <Card>
        <CardHeader icon={Camera} title="Profile photo" subtitle="A clear headshot helps our reviewers recognise you." />
        <div className="flex flex-wrap items-center gap-5 px-6 py-6">
          <div className="grid size-24 place-items-center overflow-hidden rounded-2xl bg-teal-soft text-3xl font-semibold text-teal-dark">
            {photo ? (
              <img src={photo} alt="" className="size-full object-cover" />
            ) : (
              <span aria-hidden="true">{initials(user)}</span>
            )}
          </div>
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => void onPhoto(e.target.files?.[0])}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" loading={photoBusy} icon={Camera} onClick={() => fileRef.current?.click()}>
                {user.avatarUrl ? "Change photo" : "Add photo"}
              </Button>
              {user.avatarUrl ? (
                <Button type="button" size="sm" variant="ghost" icon={Trash2} disabled={photoBusy} onClick={() => void removePhoto()}>
                  Remove
                </Button>
              ) : null}
            </div>
            <p className="text-base text-muted">JPEG, PNG, WebP, or GIF. Up to 5 MB.</p>
          </div>
        </div>
      </Card>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader icon={UserRound} title="Contact details" subtitle="Your email stays the same. You can update everything else." />
          <div className="space-y-5 px-6 py-6">
            <Field label="Email">
              <TextInput value={user.email} readOnly disabled />
            </Field>
            <Field label="Name">
              <TextInput value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Phone">
              <TextInput
                type="tel"
                value={phone}
                autoComplete="tel"
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card className="mt-6">
          <CardHeader icon={MapPin} title="Address" subtitle="Where we should associate your account, if you would like it on file." />
          <div className="space-y-5 px-6 py-6">
            <Field label="Street address">
              <TextInput
                value={addressLine1}
                autoComplete="address-line1"
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </Field>
            <Field label="Apartment, suite, or unit">
              <TextInput
                value={addressLine2}
                autoComplete="address-line2"
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="City">
                <TextInput value={city} autoComplete="address-level2" onChange={(e) => setCity(e.target.value)} />
              </Field>
              <Field label="State / region">
                <TextInput value={state} autoComplete="address-level1" onChange={(e) => setState(e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Postal code">
                <TextInput
                  value={postalCode}
                  autoComplete="postal-code"
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </Field>
              <Field label="Country">
                <TextInput value={country} autoComplete="country-name" onChange={(e) => setCountry(e.target.value)} />
              </Field>
            </div>
            <ErrorText>{error}</ErrorText>
            {saved ? (
              <Alert tone="sage" title="Saved">
                Your profile is up to date.
              </Alert>
            ) : null}
            <Button type="submit" loading={busy} icon={CheckCircle2}>
              Save profile
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
