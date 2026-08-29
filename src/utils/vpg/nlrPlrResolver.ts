// ============================================================
// nlrPlrResolver.ts — ID-03 NLR/PLR resolution
//
// Preferred path:  validated direct NLR/PLR -> model adapter
// Fallback path:   Neutrophils/Lymphocytes/PLT -> derive -> adapter
//
// Rule (Contract §7 / FS §6 03_LABORATORY note): never silently
// overwrite an explicit valid user-entered NLR/PLR with a derived
// value. This module is a pure function — it does not mutate
// VirtualPatient; callers decide whether to persist the result.
//
// Rounding: Sheet 7 Data Dictionary specifies NLR/PLR as "Ratio;
// 2 decimals" at the raw-data level. That is a DISPLAY/reporting
// convention for the audited dataset, not a step in the existing
// operational model engines (config/model.ts, config/survivalModel.ts
// consume raw floats with no rounding — confirmed by inspection).
// This resolver therefore does NOT round the value passed to the
// adapters; rounding is applied only at display time, matching
// current operational behavior exactly (Contract §10: preserve
// existing preprocessing, do not introduce new steps).
// ============================================================

import type { LaboratoryModule } from "../../types/virtualPatient";

export interface ResolvedRatio {
  value: number;
  source: "direct" | "derived";
}

export type RatioResolution =
  | { status: "ok"; ratio: ResolvedRatio }
  | { status: "unavailable"; reason: string };

/** Resolves NLR: prefers laboratory.nlr if explicitly entered
 *  (source !== "unknown" markers not required here — presence of a
 *  numeric value on an Obs<number> is sufficient); falls back to
 *  Neutrophils/Lymphocytes if both are present and Lymphocytes > 0. */
export function resolveNlr(lab: LaboratoryModule): RatioResolution {
  if (lab.nlr !== "unknown") {
    return { status: "ok", ratio: { value: lab.nlr, source: "direct" } };
  }
  if (lab.neutrophils !== "unknown" && lab.lymphocytes !== "unknown") {
    if (lab.lymphocytes <= 0) {
      return { status: "unavailable", reason: "Lymphocytes must be > 0 to derive NLR." };
    }
    return {
      status: "ok",
      ratio: { value: lab.neutrophils / lab.lymphocytes, source: "derived" },
    };
  }
  return { status: "unavailable", reason: "NLR not entered and Neutrophils/Lymphocytes incomplete." };
}

/** Resolves PLR: prefers laboratory.plr; falls back to PLT/Lymphocytes. */
export function resolvePlr(lab: LaboratoryModule): RatioResolution {
  if (lab.plr !== "unknown") {
    return { status: "ok", ratio: { value: lab.plr, source: "direct" } };
  }
  if (lab.plt !== "unknown" && lab.lymphocytes !== "unknown") {
    if (lab.lymphocytes <= 0) {
      return { status: "unavailable", reason: "Lymphocytes must be > 0 to derive PLR." };
    }
    return {
      status: "ok",
      ratio: { value: lab.plt / lab.lymphocytes, source: "derived" },
    };
  }
  return { status: "unavailable", reason: "PLR not entered and PLT/Lymphocytes incomplete." };
}
