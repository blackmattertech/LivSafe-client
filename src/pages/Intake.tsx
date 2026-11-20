import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ExternalLink,
  FileText,
  Headset,
  HeartHandshake,
  Mail,
  MoreHorizontal,
  ShieldCheck,
  Smile,
  User,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, websiteUrl } from "../api";
import { Button, ChoiceCard, Field, PageLoader, PhoneInput, TextArea, TextInput } from "../components/ui";
import { SectionMenu } from "../components/SectionMenu";
import { intakePath } from "../lib/intake";
import type { Assessment, IntakeField, IntakeSection } from "../types";

const SECTION_BLURB: Record<string, string> = {
  client_info: "Basic details for your written review",
  home_setup: "Home type and who lives there",
  reason: "What prompted this review",
  falls: "Areas where you feel less steady",
  mobility: "Space, access, and clear paths",
  equipment: "Equipment already in the home",
  areas_of_concern: "Rooms and concerns to review",
};

const FIELD_ICON: Record<string, LucideIcon> = {
  resident_name: UserRound,
  age: Calendar,
  email: Mail,
  completer_name: UserRound,
  completer_relationship: Users,
};

const FIELD_PLACEHOLDER: Record<string, string> = {
  resident_name: "Enter first name",
  age: "Enter age",
  email: "Enter email address",
  completer_name: "Enter your name",
  completer_relationship: "e.g. Spouse, Son or daughter, Caregiver",
  lives_with: "e.g. Spouse, son or daughter, roommate",
  home_type_other: "Describe the home type",
};

const CHOICE_ICON: Record<string, LucideIcon> = {
  person_in_home: User,
  spouse: Users,
  adult_child: UserRound,
  other_family: Users,
  caregiver: HeartHandshake,
  friend: Smile,
  other: MoreHorizontal,
};

const PAIRED_FIELDS = [
  ["resident_name", "age"],
  ["email", "phone"],
  ["completer_name", "completer_relationship"],
];

function visible(field: IntakeField, data: Record<string, unknown>) {
  if (!field.showIf) return true;
  return field.showIf.oneOf.includes(String(data[field.showIf.field] ?? ""));
}

function fieldRows(fields: IntakeField[]) {
  const remaining = [...fields];
  const rows: IntakeField[][] = [];
  while (remaining.length) {
    const current = remaining[0];
    const pair = PAIRED_FIELDS.find((ids) => ids[0] === current.id);
    const partner = pair ? remaining.find((field) => field.id === pair[1]) : undefined;
    if (partner) {
      rows.push([current, partner]);
      remaining.splice(0, 1);
      remaining.splice(
        remaining.findIndex((field) => field.id === partner.id),
        1,
      );
    } else {
      rows.push([remaining.shift()!]);
    }
  }
  return rows;
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

  const rows = fieldRows(fields);
  const sectionSaved = Boolean(assessment.intake[section.id]);

  function renderField(field: IntakeField) {
    const hasIcon = field.id in FIELD_ICON;
    const FieldIcon = FIELD_ICON[field.id];
    const placeholder = field.placeholder || FIELD_PLACEHOLDER[field.id];
    const control =
      field.type === "textarea" ? (
        <TextArea
          density="comfortable"
          required={field.required}
          placeholder={placeholder}
          value={String(data[field.id] ?? "")}
          onChange={(e) => setField(field.id, e.target.value)}
        />
      ) : field.type === "single" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {field.options?.map((opt) => (
            <ChoiceCard
              key={opt.value}
              density="comfortable"
              type="radio"
              name={field.id}
              required={field.required}
              icon={field.id === "completed_by" ? CHOICE_ICON[opt.value] : undefined}
              checked={data[field.id] === opt.value}
              onChange={() => setField(field.id, opt.value)}
              label={opt.label}
            />
          ))}
        </div>
      ) : field.type === "multi" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {field.options?.map((opt) => {
            const selected = Array.isArray(data[field.id]) ? (data[field.id] as string[]) : [];
            const on = selected.includes(opt.value);
            const exclusive = field.exclusiveOption;
            return (
              <ChoiceCard
                key={opt.value}
                density="comfortable"
                type="checkbox"
                checked={on}
                onChange={() => {
                  if (on) {
                    setField(
                      field.id,
                      selected.filter((value) => value !== opt.value),
                    );
                    return;
                  }
                  if (exclusive && opt.value === exclusive) {
                    setField(field.id, [exclusive]);
                    return;
                  }
                  if (exclusive) {
                    setField(field.id, [...selected.filter((value) => value !== exclusive), opt.value]);
                    return;
                  }
                  setField(field.id, [...selected, opt.value]);
                }}
                label={opt.label}
              />
            );
          })}
        </div>
      ) : field.type === "checkbox" ? (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-base leading-relaxed shadow-card">
          <input
            className="mt-1 size-5 shrink-0 accent-teal"
            type="checkbox"
            required={field.required}
            checked={data[field.id] === true || data[field.id] === "yes"}
            onChange={(e) => setField(field.id, e.target.checked)}
          />
          <span>{field.label}</span>
        </label>
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
        <div className={hasIcon ? "intake-icon-field" : undefined}>
          {hasIcon ? <FieldIcon className="intake-field-icon" aria-hidden="true" /> : null}
          <TextInput
            density="comfortable"
            className={hasIcon ? "pl-11" : ""}
            type={field.type === "number" ? "text" : field.type}
            inputMode={field.type === "number" ? "numeric" : field.type === "email" ? "email" : undefined}
            autoComplete={field.type === "email" ? "email" : field.id === "resident_name" ? "name" : "off"}
            pattern={field.type === "number" ? "[0-9]*" : undefined}
            required={field.required}
            placeholder={placeholder}
            value={data[field.id] == null ? "" : String(data[field.id])}
            onChange={(e) => {
              const raw = e.target.value;
              setField(field.id, field.type === "number" ? raw.replace(/\D/g, "") : raw);
            }}
          />
        </div>
      );

    if (field.type === "checkbox") {
      return (
        <div key={field.id} className="space-y-2">
          {control}
          {field.help ? <p className="text-sm leading-relaxed text-muted">{field.help}</p> : null}
        </div>
      );
    }

    return (
      <Field
        key={field.id}
        label={field.label}
        hint={field.help}
        required={field.required}
        requiredMark="star"
        as={field.type === "single" || field.type === "multi" || field.type === "tel" ? "fieldset" : "label"}
        density="comfortable"
      >
        {control}
      </Field>
    );
  }

  return (
    <div className="intake-page">
      <header className="intake-hero">
        <img
          src="https://res.cloudinary.com/hoevqlxx/image/upload/f_auto,q_auto/v1795160843/656fed2a-9a17-464c-828a-a024ee29ce26.webp"
          alt=""
          width={2172}
          height={724}
        />
        <div className="intake-hero-text">
          <h1>Home Safety Assessment</h1>
          <p className="intake-hero-lead">Let&apos;s understand the home and the person living in it.</p>
          <p className="intake-hero-copy">
            Your answers help prepare personalized home safety recommendations.
          </p>
        </div>
      </header>

      <div className="intake-mobile-progress">
        <div>
          <span>
            Section {index + 1} of {sections.length}
          </span>
          <strong>{progressPct}% complete</strong>
        </div>
        <div
          className="intake-meter"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={sections.length}
          aria-valuenow={savedCount}
          aria-label="Intake progress"
        >
          <span style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="intake-layout">
        <nav className="intake-card intake-sections" aria-label="Assessment sections">
          <div className="intake-card-head">
            <h2>Assessment Sections</h2>
            <p>
              {sections.length} total section{sections.length === 1 ? "" : "s"}
            </p>
          </div>
          <ol>
            {sections.map((item, i) => {
              const active = i === index;
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => goToSection(i)} aria-current={active ? "step" : undefined}>
                    <span className={active ? "is-current" : undefined}>{i + 1}</span>
                    <span>
                      <strong>{item.title}</strong>
                      {SECTION_BLURB[item.id] ? <small>{SECTION_BLURB[item.id]}</small> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="intake-saved-note">
            <FileText aria-hidden="true" />
            <span>Your progress is saved when you continue</span>
            {sectionSaved ? <Check aria-hidden="true" /> : null}
          </p>
        </nav>

        <section className="intake-card intake-form-card">
          <p className="intake-kicker">
            Section {index + 1} of {sections.length}
          </p>
          <h2>{section.title}</h2>
          {section.description ? <p className="intake-section-copy">{section.description}</p> : null}

          <SectionMenu
            sections={sections}
            index={index}
            saved={sections.map((item) => Boolean(assessment.intake[item.id]))}
            onPick={goToSection}
          />

          <form
            id="intake-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save(index + 1);
            }}
          >
            <div className="intake-fields">
              {rows.map((row) => (
                <div key={row.map((field) => field.id).join("-")} className={row.length > 1 ? "intake-field-row" : undefined}>
                  {row.map((field) => renderField(field))}
                </div>
              ))}
            </div>
            <div className="intake-private-mobile">
              <ShieldCheck aria-hidden="true" />
              <div>
                <strong>Your information is private and secure.</strong>
                <p>All responses are used only for your home safety assessment.</p>
              </div>
            </div>

            <div className="intake-form-foot">
              <p className="intake-saved-note">
                <FileText aria-hidden="true" />
                <span>Your progress is saved when you continue</span>
                {sectionSaved ? <Check aria-hidden="true" /> : null}
              </p>
              <div className="intake-form-actions">
                <Button type="button" variant="secondary" icon={ArrowLeft} disabled={index === 0 || saving} onClick={() => void save(index - 1)}>
                  Previous
                </Button>
                <p>
                  {savedCount} of {sections.length} sections saved
                </p>
                <Button type="submit" className="intake-next" loading={saving}>
                  {isLast ? "Continue to photos" : "Save and continue"}
                  {saving ? null : <ArrowRight className="size-5" aria-hidden="true" />}
                </Button>
              </div>
            </div>
          </form>
        </section>

        <aside className="intake-rail" aria-label="Progress and help">
          <section className="intake-card intake-progress">
            <div className="intake-progress-top">
              <div>
                <h2>Your progress</h2>
                <p>
                  <strong>{progressPct}%</strong>
                </p>
              </div>
              <p>
                Section {index + 1} of {sections.length}
              </p>
            </div>
            <div
              className="intake-meter"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={sections.length}
              aria-valuenow={savedCount}
              aria-label="Intake progress"
            >
              <span style={{ width: `${progressPct}%` }} />
            </div>
            <ol>
              {sections.map((item, i) => (
                <li key={item.id} className={i === index ? "is-current" : undefined}>
                  <span aria-hidden="true" />
                  {i + 1}. {item.title}
                </li>
              ))}
            </ol>
          </section>

          <section className="intake-card intake-help">
            <Headset aria-hidden="true" />
            <h2>Need help?</h2>
            <p>Our team is here if you have any questions about the assessment.</p>
            <a href={`${websiteUrl}/contact/`} target="_blank" rel="noopener noreferrer">
              Contact support
              <ExternalLink aria-hidden="true" />
            </a>
          </section>

          <section className="intake-card intake-private">
            <ShieldCheck aria-hidden="true" />
            <h2>Your information is private</h2>
            <p>All information and photos you share are used only for your home safety assessment.</p>
          </section>
        </aside>
      </div>

      <div className="intake-mobile-bar">
        <Button type="button" variant="secondary" icon={ArrowLeft} disabled={index === 0 || saving} onClick={() => void save(index - 1)}>
          Previous
        </Button>
        <Button type="submit" form="intake-form" className="intake-next" loading={saving}>
          {isLast ? "Continue to photos" : "Save and continue"}
        </Button>
      </div>
    </div>
  );
}

