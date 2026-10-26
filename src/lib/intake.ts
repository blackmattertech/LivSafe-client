export function intakePath(assessment: { id: string; intakeFormId: string | null }) {
  return assessment.intakeFormId
    ? `/assessment/${assessment.id}/forms/${assessment.intakeFormId}`
    : `/assessment/${assessment.id}/intake`;
}
