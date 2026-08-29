// ============================================================
// pathologyMapping.ts — LOCKED ID-07 pathology-to-model mapping
//
// Source: VPG_Implementation_Contract_v1.0_FINAL.md §5 (ID-07) and
// VPG_Functional_Specification_v1.0_UPDATED.md §2 (ID-07), both
// APPROVED/LOCKED, cross-checked against Sheet 7 Data Dictionary's
// footer note in NLR_VPG_AUDITED_Updated.xlsx:
//
//   "Grade mapping rule: Grade 1 <-> Low grade <-> Well differentiation;
//    Grade 2 <-> Intermediate grade <-> Moderate differentiation;
//    Grade 3 <-> High grade <-> Poor differentiation. For survival-model
//    integration, Poor differentiation maps to gradeHigh = 1;
//    Well/Moderate differentiation maps to gradeHigh = 0."
//
// This is the ONLY function in the codebase permitted to produce
// `gradeHigh`. It is intentionally NOT exported alongside any UI
// input component — gradeHigh must never become a user-editable
// field (Contract §5 ID-07 rule, §19 "MUST NOT expose gradeHigh").
//
// Do not edit this mapping without updating the .xlsx footer note
// and both source documents in lockstep — all three must agree.
// ============================================================

import type { Grade, TumorGradeLabel, TumorGradeClass } from "../types/virtualPatient";

export interface PathologyMappingRow {
  grade: Grade;
  tumorGrade: TumorGradeLabel;
  gradeClass: TumorGradeClass;
  gradeHigh: 0 | 1;
}

export const LOCKED_PATHOLOGY_MAPPING: readonly PathologyMappingRow[] = [
  { grade: 1, tumorGrade: "Well differentiation", gradeClass: "Low risk", gradeHigh: 0 },
  { grade: 2, tumorGrade: "Moderate differentiation", gradeClass: "Low risk", gradeHigh: 0 },
  { grade: 3, tumorGrade: "Poor differentiation", gradeClass: "High risk", gradeHigh: 1 },
] as const;

function rowForGrade(grade: Grade): PathologyMappingRow {
  const row = LOCKED_PATHOLOGY_MAPPING.find((r) => r.grade === grade);
  if (!row) {
    // Grade is typed as 1|2|3, so this only fires on a runtime type
    // violation (e.g. malformed cohort-import data in Private/Local
    // mode). Fail loudly — never silently coerce.
    throw new Error(`Invalid Grade value: ${grade}. Must be 1, 2, or 3.`);
  }
  return row;
}

/** Derives the display-only Tumor_Grade label from Grade. */
export function deriveTumorGrade(grade: Grade): TumorGradeLabel {
  return rowForGrade(grade).tumorGrade;
}

/** Derives the display-only Tumor_grade_class from Grade. */
export function deriveGradeClass(grade: Grade): TumorGradeClass {
  return rowForGrade(grade).gradeClass;
}

/** THE gradeHigh derivation. Called only from adapters/survivalAdapter.ts.
 *  gradeHigh is never stored on VirtualPatient and never rendered by
 *  any Build/Review UI component. */
export function deriveGradeHigh(grade: Grade): 0 | 1 {
  return rowForGrade(grade).gradeHigh;
}

/** Pathology consistency validator (Contract §14 / FS §11).
 *  Given a full (grade, tumorGrade, gradeClass) triple as entered/
 *  reconstructed — e.g. from a Private/Local cohort record where all
 *  three columns exist independently in the audited Excel — checks
 *  that they agree with the locked mapping. Any mismatch is rejected,
 *  never silently corrected, per the explicit contract rule:
 *  "Grade 3 + Intermediate grade" etc. must fail validation. */
export function validatePathologyConsistency(
  grade: Grade | "unknown",
  tumorGrade: TumorGradeLabel | "unknown",
  gradeClass: TumorGradeClass | "unknown"
): { valid: true } | { valid: false; reason: string } {
  if (grade === "unknown") {
    // Nothing to check against — Grade is the source field, so if it
    // is unknown, tumorGrade/gradeClass must ALSO be unknown/derived-
    // never independently entered.
    if (tumorGrade !== "unknown" || gradeClass !== "unknown") {
      return {
        valid: false,
        reason:
          "Tumor_Grade or Tumor_grade_class is set while Grade is unknown. " +
          "These fields are derived from Grade only and cannot exist independently.",
      };
    }
    return { valid: true };
  }

  const expected = rowForGrade(grade);
  if (tumorGrade !== "unknown" && tumorGrade !== expected.tumorGrade) {
    return {
      valid: false,
      reason: `Grade ${grade} requires Tumor_Grade = "${expected.tumorGrade}", got "${tumorGrade}".`,
    };
  }
  if (gradeClass !== "unknown" && gradeClass !== expected.gradeClass) {
    return {
      valid: false,
      reason: `Grade ${grade} requires Tumor_grade_class = "${expected.gradeClass}", got "${gradeClass}".`,
    };
  }
  return { valid: true };
}
