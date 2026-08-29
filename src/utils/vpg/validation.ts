// ============================================================
// validation.ts — VPG validation layer
//
// Two kinds of validation:
//  1. Generic field validation (numeric ranges, controlled vocab,
//     dates) — reuses the SAME bounds already defined in
//     config/model.ts / config/survivalModel.ts (never re-declares
//     new thresholds, per "do not invent clinical thresholds").
//  2. Prediction-readiness checks — determine whether the diagnostic
//     / survival adapter has enough validated input to run at all.
//     Missing required input BLOCKS only the affected prediction
//     (FS-04); nothing is silently imputed.
// ============================================================

import type { VirtualPatient } from "../../types/virtualPatient";
import { MODEL_CONFIG } from "../../config/model";
import { SURVIVAL_MODEL_CONFIG } from "../../config/survivalModel";
import { resolveNlr, resolvePlr } from "./nlrPlrResolver";
import { validatePathologyConsistency } from "../../config/pathologyMapping";

export interface ReadinessResult {
  ready: boolean;
  missing: string[];
  reason?: string;
}

/** Checks whether the diagnostic model can run:
 *  requires multisite (derivable from location) + valid NLR + valid PLR. */
export function checkDiagnosticReadiness(patient: VirtualPatient): ReadinessResult {
  const missing: string[] = [];

  if (patient.tumorPathology.multisite === "unknown") {
    missing.push("Tumor location");
  }

  const nlr = resolveNlr(patient.laboratory);
  if (nlr.status === "unavailable") missing.push("NLR");
  else if (nlr.ratio.value < MODEL_CONFIG.validation.nlr.min || nlr.ratio.value > MODEL_CONFIG.validation.nlr.max) {
    missing.push(`NLR out of valid range (${MODEL_CONFIG.validation.nlr.min}-${MODEL_CONFIG.validation.nlr.max})`);
  }

  const plr = resolvePlr(patient.laboratory);
  if (plr.status === "unavailable") missing.push("PLR");
  else if (plr.ratio.value < MODEL_CONFIG.validation.plr.min || plr.ratio.value > MODEL_CONFIG.validation.plr.max) {
    missing.push(`PLR out of valid range (${MODEL_CONFIG.validation.plr.min}-${MODEL_CONFIG.validation.plr.max})`);
  }

  return missing.length === 0
    ? { ready: true, missing: [] }
    : { ready: false, missing, reason: "Prediction unavailable — required input missing." };
}

/** Checks whether the survival model can run:
 *  requires Age, M1 (observed Metastasis_TNM, private/local mode
 *  only, or an explicit synthetic value in Public mode — see note in
 *  adapters/survivalAdapter.ts), valid Grade (for gradeHigh), valid
 *  NLR, valid PLR. */
export function checkSurvivalReadiness(patient: VirtualPatient): ReadinessResult {
  const missing: string[] = [];

  if (patient.demographics.age === "unknown") missing.push("Age");
  else if (
    patient.demographics.age < SURVIVAL_MODEL_CONFIG.validation.age.min ||
    patient.demographics.age > SURVIVAL_MODEL_CONFIG.validation.age.max
  ) {
    missing.push(
      `Age out of valid range (${SURVIVAL_MODEL_CONFIG.validation.age.min}-${SURVIVAL_MODEL_CONFIG.validation.age.max})`
    );
  }

  // M1: Public mode has no "observed outcomes" module at all (by
  // design — see types/virtualPatient.ts). A synthetic Virtual
  // Patient must therefore let the user explicitly set a hypothetical
  // M1 state for the survival "what-if" calculation; this is
  // intentionally NOT read from observedOutcomes.metastasisTNM in
  // that case. See adapters/survivalAdapter.ts for the exact source
  // resolution and the STOP-worthy ambiguity this raised.
  const observedM1 =
    patient.observedOutcomes?.metastasisTNM !== undefined &&
    patient.observedOutcomes?.metastasisTNM !== "unknown";
  const hypotheticalM1 =
    patient.survivalInputs?.hypotheticalM1 !== undefined &&
    patient.survivalInputs?.hypotheticalM1 !== "unknown";
  if (!observedM1 && !hypotheticalM1) missing.push("Metastasis status (M1)");

  if (patient.tumorPathology.grade === "unknown") missing.push("Tumor grade");

  const pathologyCheck = validatePathologyConsistency(
    patient.tumorPathology.grade,
    patient.tumorPathology.tumorGrade,
    patient.tumorPathology.gradeClass
  );
  if (!pathologyCheck.valid) missing.push(`Pathology inconsistency: ${pathologyCheck.reason}`);

  const nlr = resolveNlr(patient.laboratory);
  if (nlr.status === "unavailable") missing.push("NLR");
  else if (nlr.ratio.value < SURVIVAL_MODEL_CONFIG.validation.nlr.min || nlr.ratio.value > SURVIVAL_MODEL_CONFIG.validation.nlr.max) {
    missing.push("NLR out of valid range");
  }

  const plr = resolvePlr(patient.laboratory);
  if (plr.status === "unavailable") missing.push("PLR");
  else if (plr.ratio.value < SURVIVAL_MODEL_CONFIG.validation.plr.min || plr.ratio.value > SURVIVAL_MODEL_CONFIG.validation.plr.max) {
    missing.push("PLR out of valid range");
  }

  return missing.length === 0
    ? { ready: true, missing: [] }
    : { ready: false, missing, reason: "Prediction unavailable — required input missing." };
}

/** Public-mode privacy gate. Call before ANY export/report/network
 *  action in Public mode. Refuses to proceed if a patient object
 *  carries cohort provenance or an identity outside "synthetic". */
export function assertPublicModeSafe(patient: VirtualPatient): void {
  if (patient.identity.provenance !== "synthetic") {
    throw new Error(
      "Privacy violation blocked: a cohort-provenance VirtualPatient cannot be used in Public mode."
    );
  }
  if (patient.observedOutcomes) {
    throw new Error(
      "Privacy violation blocked: observedOutcomes must not be present on a Public-mode VirtualPatient."
    );
  }
}
