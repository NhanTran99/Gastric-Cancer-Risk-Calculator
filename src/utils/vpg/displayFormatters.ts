// ============================================================
// displayFormatters.ts — R-09-F1 / R-09-F4
//
// Presentation-only helpers. Contains ZERO prediction math and ZERO
// new derivation logic — resolveNlr/resolvePlr (unmodified, from the
// existing nlrPlrResolver.ts) are reused as-is; this file only
// formats their result for display purposes (R-09-F1: show "(derived)"
// explicitly; R-09-F4: a single clean clinical grade label instead of
// two separately-tagged derived lines).
// ============================================================

import type { LaboratoryModule, TumorPathologyModule } from "../../types/virtualPatient";
import { resolveNlr, resolvePlr } from "./nlrPlrResolver";

export interface DisplayRatio {
  text: string; // e.g. "3.20" or "not entered"
  isDerived: boolean;
  available: boolean;
}

export function displayNlr(lab: LaboratoryModule): DisplayRatio {
  const r = resolveNlr(lab);
  if (r.status !== "ok") return { text: "not entered", isDerived: false, available: false };
  return { text: r.ratio.value.toFixed(2), isDerived: r.ratio.source === "derived", available: true };
}

export function displayPlr(lab: LaboratoryModule): DisplayRatio {
  const r = resolvePlr(lab);
  if (r.status !== "ok") return { text: "not entered", isDerived: false, available: false };
  return { text: r.ratio.value.toFixed(2), isDerived: r.ratio.source === "derived", available: true };
}

/** R-09-Final: raw CBC value formatting for Step 2 displays, which
 *  show Neutrophils/Lymphocytes/Platelets instead of NLR/PLR. Pure
 *  formatting — reads the same LaboratoryModule fields already on
 *  VirtualPatient, no new field, no calculation. */
export function formatRawLabValue(v: number | "unknown"): string {
  return v === "unknown" ? "not entered" : v.toFixed(2);
}

/** R-09-F4: one clean clinical label, e.g. "Grade 3 — High grade" with
 *  a secondary differentiation line "Poor differentiation" — instead
 *  of two separately "(derived)"-tagged rows. Both tumorGrade and
 *  gradeClass are still the SAME derived values as before (from
 *  config/pathologyMapping.ts, unmodified) — only the presentation
 *  changes. Returns null fields when grade is unknown. */
export function formatGradeLabel(tp: TumorPathologyModule): { headline: string; sub: string } | null {
  if (tp.grade === "unknown") return null;
  const gradeWord = tp.gradeClass === "unknown" ? "" : tp.gradeClass === "High risk" ? "High grade" : "Low grade";
  return {
    headline: `Grade ${tp.grade}${gradeWord ? ` — ${gradeWord}` : ""}`,
    sub: tp.tumorGrade === "unknown" ? "" : tp.tumorGrade,
  };
}
