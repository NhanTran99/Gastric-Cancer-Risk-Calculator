// ============================================================
// survival.ts — shared TypeScript interfaces for the prognosis tab
// Sibling to types/nomogram.ts (the diagnostic model's types).
// ============================================================

/** Raw user inputs — exactly what the clinician enters */
export interface SurvivalInputs {
  age: number;
  m1: 0 | 1;
  gradeHigh: 0 | 1;
  nlr: number;
  plr: number;
}

/** Encoded inputs with NLR/PLR converted to z-scores */
export interface EncodedSurvivalInputs {
  age: number;
  m1: 0 | 1;
  gradeHigh: 0 | 1;
  nlrZ: number;
  plrZ: number;
}

/** One point on the predicted survival curve */
export interface SurvivalCurvePoint {
  month: number;
  survival: number; // 0-1
}

/** Exact Shapley contribution of one variable, on the log-hazard scale */
export interface ShapContribution {
  key: "age" | "m1" | "gradeHigh" | "nlrZ" | "plrZ";
  label: string;
  /** phi_i = beta_i * (x_i - mean_i). Positive = increases hazard (worse). */
  value: number;
}

export type RiskBand = "lower" | "intermediate" | "higher";

/** Full calculation result returned by calculateSurvival() */
export interface SurvivalResult {
  /** Linear predictor (log-hazard), centered so 0 = average patient */
  linearPredictor: number;
  /** exp(linearPredictor) — hazard ratio vs. the average patient */
  hazardRatio: number;
  /** Predicted mortality risk (0-1) at 12 and 24 months */
  risk12: number;
  risk24: number;
  /** Full predicted survival curve, month 0-60 */
  survivalCurve: SurvivalCurvePoint[];
  /** Exact SHAP contributions, sorted by |value| descending */
  shapContributions: ShapContribution[];
  riskBand: RiskBand;
  isValid: boolean;
}

/** Shape of SURVIVAL_MODEL_CONFIG exported from config/survivalModel.ts */
export interface SurvivalModelConfig {
  displayNames: {
    age: string;
    ageUnit: string;
    metastasis: string;
    metastasisAbsent: string;
    metastasisPresent: string;
    differentiation: string;
    differentiationWellModerate: string;
    differentiationPoor: string;
    nlr: string;
    nlrShort: string;
    plr: string;
    plrShort: string;
  };
  coefficients: {
    age: number;
    m1: number;
    gradeHigh: number;
    nlrZ: number;
    plrZ: number;
  };
  covariateMeans: {
    age: number;
    m1: number;
    gradeHigh: number;
    nlrZ: number;
    plrZ: number;
  };
  standardization: {
    nlr: { mean: number; sd: number };
    plr: { mean: number; sd: number };
  };
  /** S0(t) at mean covariates, index = month (0-60) */
  baselineSurvival: number[];
  validation: {
    age: { min: number; max: number };
    nlr: { min: number; max: number };
    plr: { min: number; max: number };
  };
  riskBands: {
    lowerThreshold: number;
    higherThreshold: number;
    exploratoryLabel: string;
  };
  cutoffs: {
    nlrDiagnostic: number;
    nlrPrognostic: number;
    nlrAxisMin: number;
    nlrAxisMax: number;
  };
  formulaDisplay: {
    outcome: string;
    modelType: string;
    terms: Array<{ label: string; coefficient: number; encoding?: string }>;
  };
  metadata: {
    outcome: string;
    modelType: string;
    cIndexBootstrap: number;
    cohortN: number;
    cohortEvents: number;
    diagnosticCohortN: number;
    citation: string;
  };
}
