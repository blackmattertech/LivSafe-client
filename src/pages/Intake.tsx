import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Camera, Check, ClipboardList, Save } from "lucide-react";
import { api } from "../api";
import {
  Button,
  Card,
  ChoiceCard,
  Field,
  PageLoader,
  ProgressBar,
  StepDots,
  TextArea,
  TextInput,
} from "../components/ui";
import type { Assessment, IntakeField, IntakeSection } from "../types";

function visible(field: IntakeField, data: Record<string, unknown>) {
  if (!field.showIf) return true;
  return field.showIf.oneOf.includes(String(data[field.showIf.field] ?? ""));
}

export function IntakePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState<IntakeSection[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [index, setIndex] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      api<{ sections: IntakeSection[] }>("/api/config/intake"),
      api<{ assessment: Assessment }>(`/api/assessments/${id}`),
    ]).then(([cfg, a]) => {
      setSections(cfg.sections);
      setAssessment(a.assessment);
      const firstIncomplete = cfg.sections.findIndex((s) => !a.assessment.intake[s.id]);
      const start = firstIncomplete === -1 ? 0 : firstIncomplete;
      setIndex(start);
      setData(a.assessment.intake[cfg.sections[start]?.id] ?? {});
    });
  }, [id]);

  const section = sections[index];
  const fields = useMemo(() => section?.fields.filter((f) => visible(f, data)) ?? [], [section, data]);
  const savedCount = useMemo(
    () => sections.filter((s) => assessment?.intake[s.id]).length,
    [sections, assessment],
  );

  function setField(fid: string, value: unknown) {
    setData((prev) => ({ ...prev, [fid]: value }));
  }

  async function save(nextIndex: number) {
    if (!section || !id) return;
    setSaving(true);
    try {
      const updated = await api<{ assessment: Assessment }>(`/api/assessments/${id}/intake/${section.id}`, {
        method: "PUT",
        body: JSON.stringify({ data }),
      });
      setAssessment(updated.assessment);
      if (nextIndex >= sections.length) {
        navigate(`/assessment/${id}/uploads`);
        return;
      }
      setIndex(nextIndex);
      setData(updated.assessment.intake[sections[nextIndex].id] ?? {});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  if (!section) return <PageLoader label="Loading intake" />;
  if (assessment?.submittedAt) return <Navigate to={`/assessment/${id}/submitted`} replace />;

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
      <nav aria-label="Intake sections" className="lg:sticky lg:top-24">
        <Card className="p-4">
          <p className="mb-3 flex items-center gap-2 px-1 text-base font-semibold">
            <ClipboardList className="size-5 text-teal" aria-hidden="true" />
            Intake
          </p>
          <ol className="space-y-1">
            {sections.map((s, i) => {
              const done = Boolean(assessment?.intake[s.id]);
              const active = i === index;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setIndex(i);
                      setData(assessment?.intake[s.id] ?? {});
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-base transition-colors ${
                      active ? "bg-teal-soft font-medium text-ink" : "text-muted hover:bg-linen"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded-full text-sm ${
                        done
                          ? "bg-sage text-white"
                          : active
                            ? "bg-teal text-white"
                            : "border border-line-strong"
                      }`}
                      aria-hidden="true"
                    >
                      {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="leading-snug">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 border-t border-line/70 px-1 pt-3 text-sm text-muted">
            {savedCount} of {sections.length} sections saved
          </p>
        </Card>
      </nav>

      <div className="mx-auto w-full max-w-2xl space-y-5">
        <Card className="px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-base font-medium text-muted">
              Section {index + 1} of {sections.length}
            </span>
            <StepDots total={sections.length} current={index} />
          </div>
          <div className="mt-4">
            <ProgressBar
              value={savedCount}
              max={sections.length}
              label="Intake progress"
              tone={savedCount === sections.length ? "sage" : "teal"}
            />
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <h1 className="text-3xl font-semibold leading-tight">{section.title}</h1>
          {section.description ? (
            <p className="mt-2 leading-relaxed text-muted">{section.description}</p>
          ) : null}

          <form
            className="mt-7 space-y-7"
            onSubmit={(e) => {
              e.preventDefault();
              void save(index + 1);
            }}
          >
            {fields.map((field) => {
              const isGroup = field.type === "single" || field.type === "multi";
              return (
                <Field
                  key={field.id}
                  label={field.label}
                  hint={field.help}
                  required={field.required}
                  as={isGroup ? "fieldset" : "label"}
                >
                  {field.type === "textarea" ? (
                    <TextArea
                      required={field.required}
                      placeholder={field.placeholder}
                      value={String(data[field.id] ?? "")}
                      onChange={(e) => setField(field.id, e.target.value)}
                    />
                  ) : field.type === "single" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {field.options?.map((opt) => (
                        <ChoiceCard
                          key={opt.value}
                          type="radio"
                          name={field.id}
                          required={field.required}
                          checked={data[field.id] === opt.value}
                          onChange={() => setField(field.id, opt.value)}
                          label={opt.label}
                        />
                      ))}
                    </div>
                  ) : field.type === "multi" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {field.options?.map((opt) => {
                        const selected = Array.isArray(data[field.id]) ? (data[field.id] as string[]) : [];
                        const on = selected.includes(opt.value);
                        return (
                          <ChoiceCard
                            key={opt.value}
                            type="checkbox"
                            checked={on}
                            onChange={() =>
                              setField(
                                field.id,
                                on ? selected.filter((v) => v !== opt.value) : [...selected, opt.value],
                              )
                            }
                            label={opt.label}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <TextInput
                      type={field.type === "number" ? "number" : field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={String(data[field.id] ?? "")}
                      onChange={(e) =>
                        setField(
                          field.id,
                          field.type === "number" ? Number(e.target.value) : e.target.value,
                        )
                      }
                    />
                  )}
                </Field>
              );
            })}

            <div className="flex flex-wrap items-center gap-3 border-t border-line/70 pt-6">
              {index > 0 ? (
                <Button type="button" variant="secondary" icon={ArrowLeft} onClick={() => void save(index - 1)}>
                  Back
                </Button>
              ) : null}
              <Button
                type="submit"
                loading={saving}
                icon={index === sections.length - 1 ? Camera : ArrowRight}
              >
                {index === sections.length - 1 ? "Save and continue to photos" : "Save and continue"}
              </Button>
              <span className="flex items-center gap-1.5 text-base text-muted">
                <Save className="size-4" aria-hidden="true" />
                Answers save automatically as you move on
              </span>
            </div>
          </form>
        </Card>

        {assessment ? (
          <p className="text-center text-base text-muted">
            Finished the questions already?{" "}
            <Link to={`/assessment/${assessment.id}/uploads`}>Skip ahead to photos</Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
