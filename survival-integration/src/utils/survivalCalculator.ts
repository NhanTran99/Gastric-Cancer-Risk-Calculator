// ============================================================
// survivalCalculator.ts — pure calculation functions
//
// Sibling to utils/calculator.ts (the diagnostic model). All
// functions are stateless and dependency-free. The only
// external dependency is SURVIVAL_MODEL_CONFIG.
// ============================================================

import { SURVIVAL_MODEL_CONFIG } from "../config/survivalModel";
import type {
  SurvivalInputs,
  EncodedSurvivalInputs,
  SurvivalResult,
  SurvivalCurvePoint,
  ShapContribution,
  RiskBand,
} from "../types/survival";

// ------------------------------------------------------------
// Step 1 — encodeSurvivalInputs()
// Converts raw NLR/PLR to z-scores using the fitted
// standardization constants.
// ------------------------------------------------------------
export function encodeSurvivalInputs(inputs: SurvivalInputs): EncodedSurvivalInputs {
  const { nlr, plr } = SURVIVAL_MODEL_CONFIG.standardization;
  return {
    age: inputs.age,
    m1: inputs.m1,
    gradeHigh: inputs.gradeHigh,
    nlrZ: (inputs.nlr - nlr.mean) / nlr.sd,
    plrZ: (inputs.plr - plr.mean) / plr.sd,
  };
}

// ------------------------------------------------------------
// Step 2 — computeLinearPredictor()
// Sum of beta_i * (x_i - mean_i) across all covariates. This
// is centered so 0 = the average patient in the development
// cohort (hazard ratio 1.0).
// ------------------------------------------------------------
export function computeLinearPredictor(encoded: EncodedSurvivalInputs): number {
  const { coefficients: c, covariateMeans: m } = SURVIVAL_MODEL_CONFIG;
  return (
    c.age * (encoded.age - m.age) +
    c.m1 * (encoded.m1 - m.m1) +
    c.gradeHigh * (encoded.gradeHigh - m.gradeHigh) +
    c.nlrZ * (encoded.nlrZ - m.nlrZ) +
    c.plrZ * (encoded.plrZ - m.plrZ)
  );
}

// ------------------------------------------------------------
// Step 3 — computeShapContributions()
// EXACT Shapley decomposition for a linear (Cox) model:
//   phi_i = beta_i * (x_i - mean_i)
// Sum of all phi_i equals the linear predictor exactly — no
// approximation, no sampling needed for a linear model.
// Sorted by |value| descending (largest driver first).
// ------------------------------------------------------------
export function computeShapContributions(encoded: EncodedSurvivalInputs): ShapContribution[] {
  const { coefficients: c, covariateMeans: m, displayNames: dn } = SURVIVAL_MODEL_CONFIG;

  const raw: ShapContribution[] = [
    { key: "age", label: dn.age, value: c.age * (encoded.age - m.age) },
    { key: "m1", label: dn.metastasis, value: c.m1 * (encoded.m1 - m.m1) },
    { key: "gradeHigh", label: dn.differentiationPoor, value: c.gradeHigh * (encoded.gradeHigh - m.gradeHigh) },
    { key: "nlrZ", label: dn.nlrShort, value: c.nlrZ * (encoded.nlrZ - m.nlrZ) },
    { key: "plrZ", label: dn.plrShort, value: c.plrZ * (encoded.plrZ - m.plrZ) },
  ];

  return raw.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

// ------------------------------------------------------------
// Step 4 — computeSurvivalCurve()
// S(t) = S0(t) ^ exp(linearPredictor), for every month 0-60.
// ------------------------------------------------------------
export function computeSurvivalCurve(linearPredictor: number): SurvivalCurvePoint[] {
  const hr = Math.exp(linearPredictor);
  return SURVIVAL_MODEL_CONFIG.baselineSurvival.map((s0, month) => ({
    month,
    survival: Math.pow(s0, hr),
  }));
}

// ------------------------------------------------------------
// Step 5 — riskAtMonth()
// Predicted mortality risk (1 - survival) at a given month.
// ------------------------------------------------------------
export function riskAtMonth(curve: SurvivalCurvePoint[], month: number): number {
  const point = curve.find((p) => p.month === month);
  return point ? 1 - point.survival : NaN;
}

// ------------------------------------------------------------
// Step 6 — classifySurvivalRisk()
// Tertile-based risk band from SURVIVAL_MODEL_CONFIG.riskBands.
// ------------------------------------------------------------
export function classifySurvivalRisk(risk24: number): RiskBand {
  const { lowerThreshold, higherThreshold } = SURVIVAL_MODEL_CONFIG.riskBands;
  if (risk24 < lowerThreshold) return "lower";
  if (risk24 >= higherThreshold) return "higher";
  return "intermediate";
}

// ------------------------------------------------------------
// Step 7 — validateSurvivalInputs()
// ------------------------------------------------------------
export function validateSurvivalInputs(inputs: SurvivalInputs): string | null {
  const { age, nlr, plr } = SURVIVAL_MODEL_CONFIG.validation;
  if (isNaN(inputs.age) || inputs.age < age.min || inputs.age > age.max) {
    return `Age must be between ${age.min} and ${age.max}.`;
  }
  if (isNaN(inputs.nlr) || inputs.nlr < nlr.min || inputs.nlr > nlr.max) {
    return `NLR must be between ${nlr.min} and ${nlr.max}.`;
  }
  if (isNaN(inputs.plr) || inputs.plr < plr.min || inputs.plr > plr.max) {
    return `PLR must be between ${plr.min} and ${plr.max}.`;
  }
  return null;
}

// ------------------------------------------------------------
// calculateSurvival() — main export
// Orchestrates steps 1-6. This is the only function that UI
// components and hooks should call.
// ------------------------------------------------------------
export function calculateSurvival(inputs: SurvivalInputs): SurvivalResult {
  const validationError = validateSurvivalInputs(inputs);
  const isValid = validationError === null;

  const encoded = encodeSurvivalInputs(inputs);
  const linearPredictor = computeLinearPredictor(encoded);
  const hazardRatio = Math.exp(linearPredictor);
  const survivalCurve = computeSurvivalCurve(linearPredictor);
  const risk12 = riskAtMonth(survivalCurve, 12);
  const risk24 = riskAtMonth(survivalCurve, 24);
  const shapContributions = computeShapContributions(encoded);
  const riskBand = classifySurvivalRisk(risk24);

  return {
    linearPredictor,
    hazardRatio,
    risk12,
    risk24,
    survivalCurve,
    shapContributions,
    riskBand,
    isValid,
  };
}
