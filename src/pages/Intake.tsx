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
  PhoneInput,
  ProgressBar,
  StepDots,
  TextArea,
  TextInput,
} from "../components/ui";
import { intakePath } from "../lib/intake";
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
      setData({
        phone_country_code: "+1",
        ...(a.assessment.intake[cfg.sections[start]?.id] ?? {}),
      });
    });
  }, [id]);

  const section = sections[index];
  const fields = useMemo(() => section?.fields.filter((f) => visible(f, data)) ?? [], [section, data]);
  const savedCount = useMemo(
    () => sections.filter((s) => assessment?.intake[s.id]).length,
    [sections, assessment],
  );
  const progressPct = sections.length ? Math.round((savedCount / sections.length) * 100) : 0;
  const isLast = index === sections.length - 1;

  function sectionData(sectionId: string | undefined) {
    const saved = (sectionId && assessment?.intake[sectionId]) || {};
    return {
      phone_country_code: "+1",
      ...saved,
    } as Record<string, unknown>;
  }

  function setField(fid: string, value: unknown) {
    setData((prev) => ({ ...prev, [fid]: value }));
  }

  function goToSection(i: number) {
    setIndex(i);
    setData(sectionData(sections[i]?.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(nextIndex: number) {
    if (!section || !id) return;
    const payload = { ...data };
    for (const field of section.fields) {
      if (field.type !== "number") continue;
      const raw = String(payload[field.id] ?? "").trim();
      payload[field.id] = raw === "" ? "" : Number(raw);
    }
    setSaving(true);
    try {
      const updated = await api<{ assessment: Assessment }>(`/api/assessments/${id}/intake/${section.id}`, {
        method: "PUT",
        body: JSON.stringify({ data: payload }),
      });
      setAssessment(updated.assessment);
      if (nextIndex >= sections.length) {
        navigate(`/assessment/${id}/uploads`);
        return;
      }
      setIndex(nextIndex);
      setData({
        phone_country_code: "+1",
        ...(updated.assessment.intake[sections[nextIndex].id] ?? {}),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  if (!section || !assessment) return <PageLoader label="Loading intake" />;
  if (!assessment.requiresIntake) return <Navigate to="/reports" replace />;
  if (assessment.intakeFormId) return <Navigate to={intakePath(assessment)} replace />;
  if (assessment.submittedAt) return <Navigate to={`/assessment/${id}/submitted`} replace />;

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)] xl:items-start">
      <nav aria-label="Intake sections" className="hidden min-w-0 xl:sticky xl:top-24 xl:block">
        <Card className="p-4">
          <p className="mb-3 flex items-center gap-2 px-1 text-base font-semibold">
            <ClipboardList className="size-5 text-teal" aria-hidden="true" />
            Intake
          </p>
          <ol className="flex flex-col space-y-1">
            {sections.map((s, i) => {
              const done = Boolean(assessment?.intake[s.id]);
              const active = i === index;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => goToSection(i)}
                    className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-base transition-colors ${
                      active ? "bg-teal-soft font-medium text-ink" : "text-muted hover:bg-linen"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded-full text-sm ${
                        done || active ? "bg-teal text-white" : "border border-line-strong"
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

      <div className="mx-auto w-full min-w-0 max-w-2xl">
        <div className="sticky top-[calc(env(safe-area-inset-top)+3.75rem)] z-20 -mx-4 mb-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-sm xl:static xl:mx-0 xl:mb-5 xl:rounded-xl xl:border xl:bg-paper xl:px-6 xl:py-5 xl:shadow-card xl:backdrop-blur-none">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold text-ink xl:font-medium xl:text-muted">
                Section {index + 1} of {sections.length}
              </p>
              <Link to={`/assessment/${id}/forms`} className="text-base font-medium">
                Forms
              </Link>
            </div>
            <p className="text-base font-medium tabular-nums text-teal xl:hidden">{progressPct}%</p>
            <div className="hidden sm:block xl:block">
              <StepDots total={sections.length} current={index} />
            </div>
          </div>
          <div
            className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-line xl:hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={sections.length}
            aria-valuenow={savedCount}
            aria-label="Intake progress"
          >
            <div
              className="h-full rounded-full bg-teal transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <label className="mt-3 block xl:hidden">
            <span className="sr-only">Jump to a section</span>
            <select
              className="min-h-14 w-full rounded-xl border border-line-strong bg-paper px-4 text-lg text-ink"
              value={index}
              onChange={(e) => goToSection(Number(e.target.value))}
            >
              {sections.map((s, i) => (
                <option key={s.id} value={i}>
                  {i + 1}. {s.title}
                  {assessment?.intake[s.id] ? " ✓" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 hidden xl:block">
            <ProgressBar
              value={savedCount}
              max={sections.length}
              label="Intake progress"
              tone="teal"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-4 shadow-card sm:p-8 xl:rounded-xl">
          <p className="text-base font-semibold text-teal xl:hidden">Take your time</p>
          <h1 className="mt-1 text-pretty text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-3xl xl:mt-0">
            {section.title}
          </h1>
          {section.description ? (
            <p className="mt-3 text-pretty text-lg leading-relaxed text-muted xl:mt-2 xl:text-base">
              {section.description}
            </p>
          ) : null}

          <form
            id="intake-form"
            className="mt-6 space-y-8 xl:mt-7 xl:space-y-7"
            onSubmit={(e) => {
              e.preventDefault();
              void save(index + 1);
            }}
          >
            {fields.map((field) => {
              const isGroup = field.type === "single" || field.type === "multi" || field.type === "tel";
              return (
                <Field
                  key={field.id}
                  label={field.label}
                  hint={field.help}
                  required={field.required}
                  as={isGroup ? "fieldset" : "label"}
                  density="comfortable"
                >
                  {field.type === "textarea" ? (
                    <TextArea
                      density="comfortable"
                      required={field.required}
                      placeholder={field.placeholder}
                      value={String(data[field.id] ?? "")}
                      onChange={(e) => setField(field.id, e.target.value)}
                    />
                  ) : field.type === "single" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {field.options?.map((opt) => (
                        <ChoiceCard
                          key={opt.value}
                          density="comfortable"
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
                    <div className="grid gap-3 md:grid-cols-2">
                      {field.options?.map((opt) => {
                        const selected = Array.isArray(data[field.id]) ? (data[field.id] as string[]) : [];
                        const on = selected.includes(opt.value);
                        return (
                          <ChoiceCard
                            key={opt.value}
                            density="comfortable"
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
                  ) : field.type === "tel" ? (
                    <PhoneInput
                      id={field.id}
                      density="comfortable"
                      required={field.required}
                      countryCode={String(data.phone_country_code ?? "+1")}
                      number={String(data[field.id] ?? "")}
                      onCountryChange={(code) => setField("phone_country_code", code)}
                      onNumberChange={(value) => setField(field.id, value)}
                    />
                  ) : (
                    <TextInput
                      density="comfortable"
                      type={field.type === "number" ? "text" : field.type}
                      inputMode={
                        field.type === "number"
                          ? "numeric"
                          : field.type === "email"
                            ? "email"
                            : undefined
                      }
                      autoComplete={
                        field.type === "email"
                          ? "email"
                          : field.id === "resident_name"
                            ? "name"
                            : "off"
                      }
                      pattern={field.type === "number" ? "[0-9]*" : undefined}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={data[field.id] == null ? "" : String(data[field.id])}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setField(field.id, field.type === "number" ? raw.replace(/\D/g, "") : raw);
                      }}
                    />
                  )}
                </Field>
              );
            })}

            <div className="hidden border-t border-line/70 pt-6 xl:flex xl:flex-wrap xl:items-center xl:gap-3">
              {index > 0 ? (
                <Button type="button" variant="secondary" icon={ArrowLeft} onClick={() => void save(index - 1)}>
                  Back
                </Button>
              ) : null}
              <Button type="submit" loading={saving} icon={isLast ? Camera : ArrowRight}>
                {isLast ? "Save and continue to photos" : "Save and continue"}
              </Button>
              <span className="flex items-center gap-1.5 text-base text-muted">
                <Save className="size-4" aria-hidden="true" />
                Answers save when you continue
              </span>
            </div>

            <div className="h-28 xl:hidden" aria-hidden="true" />
          </form>
        </div>

        {assessment ? (
          <p className="mt-5 hidden text-center text-base text-muted xl:block">
            Finished the questions already?{" "}
            <Link to={`/assessment/${assessment.id}/uploads`}>Skip ahead to photos</Link>
          </p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lift xl:hidden">
        <div className="mx-auto flex max-w-2xl gap-3">
          {index > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              icon={ArrowLeft}
              className="shrink-0"
              disabled={saving}
              onClick={() => void save(index - 1)}
            >
              Back
            </Button>
          ) : null}
          <Button
            type="submit"
            form="intake-form"
            size="lg"
            loading={saving}
            className="min-w-0 flex-1"
            icon={isLast ? Camera : ArrowRight}
          >
            {isLast ? "Continue to photos" : "Save and continue"}
          </Button>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted">
          Your answers are saved when you continue
        </p>
      </div>
    </div>
  );
}
