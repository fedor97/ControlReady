// Rule-based service report validation. No AI grading in the MVP.

import type { ReportValidation, ServiceReport } from "../types";

const REQUIRED_FIELDS: { key: keyof ServiceReport; label: string; minLength: number }[] = [
  { key: "technicianName", label: "Technician Name", minLength: 2 },
  { key: "problemFound", label: "Problem Found", minLength: 10 },
  { key: "rootCause", label: "Root Cause", minLength: 10 },
  { key: "correctiveAction", label: "Corrective Action", minLength: 10 },
  { key: "testingPerformed", label: "Testing Performed", minLength: 10 },
];

/** Keyword credit: rewards reports that actually name the technical cause, not just "fixed it". */
const CREDIT_KEYWORDS = ["ip", "subnet", "vfd", "plc", "network", "communication", "ping", "gateway"];

export function validateServiceReport(report: ServiceReport): ReportValidation {
  const issues: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = (report[field.key] ?? "").toString().trim();
    if (value.length < field.minLength) {
      issues.push(`${field.label} is missing or too brief.`);
    }
  }
  if (!report.finalStatus) {
    issues.push("Final Equipment Status must be selected.");
  }

  const complete = issues.length === 0;

  if (!complete) {
    // Partial credit for whatever was actually filled in, capped low until complete.
    const filledCount = REQUIRED_FIELDS.filter((f) => (report[f.key] ?? "").toString().trim().length >= f.minLength).length;
    const partial = Math.round((filledCount / REQUIRED_FIELDS.length) * 40);
    return { complete, score: partial, issues };
  }

  const narrative = `${report.problemFound} ${report.rootCause} ${report.correctiveAction} ${report.testingPerformed}`.toLowerCase();
  const keywordHits = CREDIT_KEYWORDS.filter((k) => narrative.includes(k)).length;
  const keywordBonus = Math.min(20, keywordHits * 4);

  const lengthBonus = Math.min(
    20,
    Math.floor(
      REQUIRED_FIELDS.slice(1).reduce((sum, f) => sum + (report[f.key] ?? "").toString().trim().length, 0) / 15,
    ),
  );

  const score = Math.min(100, 60 + keywordBonus + lengthBonus);
  return { complete, score, issues };
}
