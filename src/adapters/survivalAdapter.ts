// ============================================================
// survivalAdapter.ts — VirtualPatient -> existing survival engine
//
// Zero prediction mathematics here either. Maps VirtualPatient onto
// SurvivalInputs and calls the existing, unmodified calculateSurvival()
// from ../utils/survivalCalculator.ts.
//
// gradeHigh is derived exclusively via config/pathologyMapping.ts
// (the locked ID-07 table) and is never read from, or written to,
// VirtualPatient — it exists only inside this adapter call.
//
// Model fidelity statement (see also the accompanying report §E):
//  - Engine reused:      src/utils/survivalCalculator.ts::calculateSurvival()
//  - Coefficients:       unchanged (src/config/survivalModel.ts, untouched)
//  - Standardization:    unchanged — z-scoring happens inside the
//                         existing engine's encodeSurvivalInputs();
//                         this adapter passes raw NLR/PLR, exactly as
//                         the legacy useSurvival() hook does today.
//  - SHAP:                unchanged — computeShapContributions() inside
//                         the existing engine is untouched and exact
//                         (linear-model analytic Shapley, no sampling).
//  - Endpoint:             unchanged (overall survival / mortality risk)
// ============================================================

import { calculateSurvival } from "../utils/survivalCalculator";
import type { SurvivalInputs } from "../types/survival";
import type { VirtualPatient, SurvivalPredictionStatus } from "../types/virtualPatient";
import { checkSurvivalReadiness } from "../utils/vpg/validation";
import { resolveNlr, resolvePlr } from "../utils/vpg/nlrPlrResolver";
import { deriveGradeHigh } from "../config/pathologyMapping";

/** Resolves M1 per the flagged ambiguity documented in
 *  types/virtualPatient.ts (SurvivalModelingInputsModule):
 *  Private/Local reconstructions use the observed ground truth;
 *  synthetic Public-mode patients use the explicit hypothetical value
 *  the user entered for "what-if" modeling. Never silently defaulted. */
function resolveM1(patient: VirtualPatient): 0 | 1 | null {
  const observed = patient.observedOutcomes?.metastasisTNM;
  if (observed !== undefined && observed !== "unknown") return observed;

  const hypothetical = patient.survivalInputs?.hypotheticalM1;
  if (hypothetical !== undefined && hypothetical !== "unknown") return hypothetical;

  return null;
}

export function runSurvivalPrediction(patient: VirtualPatient): SurvivalPredictionStatus {
  const readiness = checkSurvivalReadiness(patient);
  if (!readiness.ready) {
    return { status: "blocked", reason: readiness.reason ?? "Prediction unavailable — required input missing.", missing: readiness.missing };
  }

  const nlr = resolveNlr(patient.laboratory);
  const plr = resolvePlr(patient.laboratory);
  const m1 = resolveM1(patient);
  const grade = patient.tumorPathology.grade;

  if (nlr.status !== "ok" || plr.status !== "ok" || m1 === null || grade === "unknown" || patient.demographics.age === "unknown") {
    // Unreachable given checkSurvivalReadiness — see comment in
    // diagnosticAdapter.ts for why this branch exists anyway.
    return { status: "blocked", reason: "Prediction unavailable — required input missing.", missing: readiness.missing };
  }

  const gradeHigh = deriveGradeHigh(grade);

  const inputs: SurvivalInputs = {
    age: patient.demographics.age,
    m1: m1,
    gradeHigh: gradeHigh,
    nlr: nlr.ratio.value,
    plr: plr.ratio.value,
  };

  const result = calculateSurvival(inputs);
  return { status: "ok", result };
}
