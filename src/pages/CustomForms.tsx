import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Paperclip, Save } from "lucide-react";
import { ApiError, api } from "../api";
import { Button, Card, ChoiceCard, Field, PageLoader, TextArea, TextInput } from "../components/ui";

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "time"
  | "datetime"
  | "boolean"
  | "radio"
  | "dropdown"
  | "multi"
  | "image"
  | "file";

export type FormField = {
  id: string;
  label: string;
  help: string | null;
  placeholder: string | null;
  type: FieldType;
  required: boolean;
  options: { value: string; label: string }[];
};

export type FormSection = {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
};

export type FileAnswer = { uploadId: string; name: string; url?: string; mimeType?: string | null };

export type ClientForm = {
  id: string;
  title: string;
  description: string | null;
  sections: FormSection[];
  answers: Record<string, Record<string, unknown>>;
};

const inputClass =
  "w-full min-h-14 rounded-xl border border-line-strong bg-paper px-4 py-3.5 text-lg text-ink placeholder:text-placeholder hover:border-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

function isFileAnswer(value: unknown): value is FileAnswer {
  return Boolean(value && typeof value === "object" && "uploadId" in value);
}

function fileList(value: unknown): FileAnswer[] {
  if (Array.isArray(value)) return value.filter(isFileAnswer);
  return isFileAnswer(value) ? [value] : [];
}

function isBlank(field: FormField, value: unknown) {
  if (!field.required) return false;
  if (field.type === "multi") return !Array.isArray(value) || value.length === 0;
  if (field.type === "file") return fileList(value).length === 0;
  if (field.type === "image") return !isFileAnswer(value);
  if (field.type === "boolean") return value !== "yes" && value !== "no";
  if (field.type === "number") return value === "" || value == null || Number.isNaN(Number(value));
  return String(value ?? "").trim() === "";
}

export function FormsListPage() {
  const { id } = useParams();
  const [forms, setForms] = useState<ClientForm[] | null>(null);
  const [editable, setEditable] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void api<{ forms: ClientForm[]; editable: boolean }>(`/api/assessments/${id}/forms`)
      .then((data) => {
        setForms(data.forms);
        setEditable(data.editable);
      })
      .catch((err: unknown) => {
        setForms([]);
        setError(err instanceof ApiError ? err.message : "Could not load forms");
      });
  }, [id]);

  if (!forms) return <PageLoader label="Loading forms" />;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div>
        <p className="text-base font-semibold text-teal">Assessment</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Forms</h1>
        <p className="mt-2 text-lg leading-relaxed text-muted">
          These questionnaires are part of your home safety assessment. You can save each section and come back later.
        </p>
      </div>
      {error ? (
        <p className="rounded-xl border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-base text-terracotta" role="alert">
          {error}
        </p>
      ) : null}
      {forms.length === 0 ? (
        <Card className="p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-teal-soft text-teal">
            <ClipboardList className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-semibold">Nothing here yet</h2>
          <p className="mt-2 text-muted">When a form is ready, it will show up on this assessment.</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {forms.map((form) => {
            const saved = form.sections.filter((section) => form.answers[section.id]).length;
            const done = form.sections.length > 0 && saved === form.sections.length;
            return (
              <Card as="li" key={form.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{form.title}</h2>
                    {form.description ? <p className="mt-1 text-muted">{form.description}</p> : null}
                    <p className="mt-2 text-sm text-muted">
                      {saved} of {form.sections.length} section{form.sections.length === 1 ? "" : "s"} saved
                    </p>
                  </div>
                  <Link
                    to={`/assessment/${id}/forms/${form.id}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 text-base font-medium text-white no-underline hover:bg-primary-hover"
                  >
                    {done ? "Review" : saved ? "Continue" : editable ? "Start" : "View"}
                  </Link>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
      <p className="text-center text-base text-muted">
        <Link to="/dashboard">Back to dashboard</Link>
      </p>
    </div>
  );
}

export function FormFillPage() {
  const { id, formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<ClientForm | null>(null);
  const [ready, setReady] = useState(false);
  const [editable, setEditable] = useState(true);
  const [index, setIndex] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setReady(false);
    void api<{ forms: ClientForm[]; editable: boolean }>(`/api/assessments/${id}/forms`)
      .then((payload) => {
        const match = payload.forms.find((item) => item.id === formId) ?? null;
        setForm(match);
        setEditable(payload.editable);
        if (!match) return;
        const firstIncomplete = match.sections.findIndex((section) => !match.answers[section.id]);
        const start = firstIncomplete === -1 ? 0 : firstIncomplete;
        setIndex(start);
        setData(match.answers[match.sections[start]?.id] ?? {});
      })
      .catch(() => setForm(null))
      .finally(() => setReady(true));
  }, [id, formId]);

  const section = form?.sections[index];
  const isLast = form ? index === form.sections.length - 1 : false;
  const savedCount = useMemo(
    () => (form ? form.sections.filter((item) => form.answers[item.id]).length : 0),
    [form],
  );

  function setField(fieldId: string, value: unknown) {
    setData((current) => ({ ...current, [fieldId]: value }));
  }

  async function uploadFile(field: FormField, file: File | undefined) {
    if (!file || !form) return;
    setUploading(field.id);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("fieldId", field.id);
      const result = await api<{ file: FileAnswer }>(`/api/assessments/${id}/forms/${form.id}/uploads`, {
        method: "POST",
        body,
      });
      if (field.type === "image") {
        setData((current) => ({ ...current, [field.id]: result.file }));
      } else {
        setData((current) => ({
          ...current,
          [field.id]: [...fileList(current[field.id]), result.file],
        }));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload that file");
    } finally {
      setUploading(null);
    }
  }

  async function save(nextIndex: number) {
    if (!form || !section || !id) return;
    if (editable && nextIndex > index) {
      const missing = section.fields.find((field) => isBlank(field, data[field.id]));
      if (missing) {
        setError(`Please answer “${missing.label}”.`);
        return;
      }
    }
    if (!editable) {
      if (nextIndex >= form.sections.length) {
        navigate(`/assessment/${id}/forms`);
        return;
      }
      setIndex(nextIndex);
      setData(form.answers[form.sections[nextIndex]?.id] ?? {});
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await api<{ forms: ClientForm[] }>(
        `/api/assessments/${id}/forms/${form.id}/sections/${section.id}`,
        { method: "PUT", body: JSON.stringify({ data }) },
      );
      const next = updated.forms.find((item) => item.id === form.id);
      if (!next) return;
      setForm(next);
      if (nextIndex >= next.sections.length) {
        navigate(`/assessment/${id}/uploads`);
        return;
      }
      setIndex(nextIndex);
      setData(next.answers[next.sections[nextIndex]?.id] ?? {});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this section");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <PageLoader label="Loading form" />;
  if (!form || !section) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-semibold">This form is not available</h1>
        <p className="mt-2 text-muted">It may be hidden, or it is not part of this assessment.</p>
        <p className="mt-4">
          <Link to={`/assessment/${id}/forms`}>Back to forms</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link to={`/assessment/${id}/forms`} className="inline-flex min-h-11 items-center gap-1 text-base font-medium">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All forms
        </Link>
        <p className="text-base text-muted">
          Section {index + 1} of {form.sections.length}
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-paper p-4 shadow-card sm:p-8">
        <p className="text-base font-semibold text-teal">{form.title}</p>
        <h1 className="mt-1 text-pretty text-[1.75rem] font-semibold leading-tight">{section.title}</h1>
        {section.description ? <p className="mt-3 text-lg leading-relaxed text-muted">{section.description}</p> : null}
        {index === 0 && form.description ? (
          <p className="mt-3 text-lg leading-relaxed text-muted">{form.description}</p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-base text-terracotta" role="alert">
            {error}
          </p>
        ) : null}
        <form
          className="mt-6 space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            void save(index + 1);
          }}
        >
          {section.fields.map((field) => (
            <Question
              key={field.id}
              field={field}
              value={data[field.id]}
              disabled={!editable || uploading === field.id}
              uploading={uploading === field.id}
              onChange={(value) => setField(field.id, value)}
              onFile={(file) => void uploadFile(field, file)}
            />
          ))}
          <div className="flex flex-wrap items-center gap-3 border-t border-line/70 pt-6">
            {index > 0 ? (
              <Button type="button" variant="secondary" icon={ArrowLeft} disabled={saving} onClick={() => void save(index - 1)}>
                Back
              </Button>
            ) : null}
            <Button type="submit" loading={saving} icon={isLast ? Check : ArrowRight}>
              {editable ? (isLast ? "Save form" : "Save and continue") : isLast ? "Done" : "Continue"}
            </Button>
            {editable ? (
              <span className="flex items-center gap-1.5 text-base text-muted">
                <Save className="size-4" aria-hidden="true" />
                {savedCount} of {form.sections.length} sections saved
              </span>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

function Question({
  field,
  value,
  disabled,
  uploading,
  onChange,
  onFile,
}: {
  field: FormField;
  value: unknown;
  disabled: boolean;
  uploading: boolean;
  onChange: (value: unknown) => void;
  onFile: (file: File | undefined) => void;
}) {
  const group = field.type === "radio" || field.type === "multi" || field.type === "boolean";
  return (
    <Field label={field.label} hint={field.help ?? undefined} required={field.required} as={group ? "fieldset" : "label"} density="comfortable">
      {field.type === "textarea" ? (
        <TextArea
          density="comfortable"
          required={field.required}
          disabled={disabled}
          placeholder={field.placeholder ?? undefined}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "boolean" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(["yes", "no"] as const).map((choice) => (
            <ChoiceCard
              key={choice}
              density="comfortable"
              type="radio"
              name={field.id}
              checked={value === choice}
              disabled={disabled}
              onChange={() => onChange(choice)}
              label={choice === "yes" ? "Yes" : "No"}
            />
          ))}
        </div>
      ) : field.type === "radio" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {field.options.map((option) => (
            <ChoiceCard
              key={option.value}
              density="comfortable"
              type="radio"
              name={field.id}
              checked={value === option.value}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              label={option.label}
            />
          ))}
        </div>
      ) : field.type === "multi" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {field.options.map((option) => {
            const selected = Array.isArray(value) ? value.map(String) : [];
            const on = selected.includes(option.value);
            return (
              <ChoiceCard
                key={option.value}
                density="comfortable"
                type="checkbox"
                checked={on}
                disabled={disabled}
                onChange={() =>
                  onChange(on ? selected.filter((item) => item !== option.value) : [...selected, option.value])
                }
                label={option.label}
              />
            );
          })}
        </div>
      ) : field.type === "dropdown" ? (
        <select
          className={inputClass}
          required={field.required}
          disabled={disabled}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose one</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "image" || field.type === "file" ? (
        <FileField field={field} value={value} disabled={disabled} uploading={uploading} onChange={onChange} onFile={onFile} />
      ) : (
        <TextInput
          density="comfortable"
          type={field.type === "datetime" ? "datetime-local" : field.type === "number" ? "number" : field.type}
          required={field.required}
          disabled={disabled}
          placeholder={field.placeholder ?? undefined}
          value={value == null ? "" : String(value)}
          onChange={(event) => onChange(field.type === "number" ? event.target.value : event.target.value)}
        />
      )}
    </Field>
  );
}

function FileField({
  field,
  value,
  disabled,
  uploading,
  onChange,
  onFile,
}: {
  field: FormField;
  value: unknown;
  disabled: boolean;
  uploading: boolean;
  onChange: (value: unknown) => void;
  onFile: (file: File | undefined) => void;
}) {
  const files = field.type === "image" ? (isFileAnswer(value) ? [value] : []) : fileList(value);
  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div key={file.uploadId} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-linen/50 px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            {field.type === "image" && file.url ? (
              <img src={file.url} alt="" className="size-14 rounded-lg object-cover" />
            ) : (
              <Paperclip className="size-5 shrink-0 text-teal" aria-hidden="true" />
            )}
            <a href={file.url} className="truncate text-base font-medium" target="_blank" rel="noreferrer">
              {file.name}
            </a>
          </div>
          {disabled ? null : (
            <button
              type="button"
              className="min-h-11 shrink-0 px-2 text-sm font-medium text-terracotta"
              onClick={() =>
                onChange(
                  field.type === "image" ? null : files.filter((item) => item.uploadId !== file.uploadId),
                )
              }
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {disabled ? null : (
        <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line-strong px-4 text-base font-medium text-ink hover:bg-linen">
          <Paperclip className="size-4" aria-hidden="true" />
          {uploading ? "Uploading…" : field.type === "image" ? "Choose an image" : "Choose a file"}
          <input
            type="file"
            className="sr-only"
            accept={field.type === "image" ? "image/jpeg,image/png,image/webp,image/gif" : undefined}
            disabled={uploading}
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
