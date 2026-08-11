// ============================================================
// survivalModel.ts — single source of truth for the Cox survival model
//
// Sibling to config/model.ts (the diagnostic model). To update
// coefficients, cutoffs, or labels for the PROGNOSIS tab, edit
// ONLY this file. No other survival file contains numeric
// model constants.
//
// Model: Cox proportional hazards, "Tier 1 Lean"
// Outcome: Overall survival (time to death)
// Development cohort: N = 99, 62 deaths (a survival-analysis
// subset that partly overlaps with the 114-patient diagnostic
// cohort used in config/model.ts — NOT the same model or cohort).
// Bootstrap-corrected C-index: 0.722
// ============================================================

import type { SurvivalModelConfig } from "../types/survival";

export const SURVIVAL_MODEL_CONFIG: SurvivalModelConfig = {

  displayNames: {
    age: "Age",
    ageUnit: "years",
    metastasis: "Distant metastasis",
    metastasisAbsent: "Absent (M0)",
    metastasisPresent: "Present (M1)",
    differentiation: "Differentiation",
    differentiationWellModerate: "Well / moderate",
    differentiationPoor: "Poor",
    nlr: "Neutrophil-to-Lymphocyte Ratio (NLR)",
    nlrShort: "NLR",
    plr: "Platelet-to-Lymphocyte Ratio (PLR)",
    plrShort: "PLR",
  },

  // ----------------------------------------------------------
  // Cox coefficients (log-hazard scale) and the covariate means
  // they were centered on. Together these give the EXACT
  // Shapley (SHAP) decomposition of the linear predictor:
  //   phi_i = beta_i * (x_i - mean_i)
  // No approximation, no sampling — valid because the Cox model
  // is linear on the log-hazard scale.
  // ----------------------------------------------------------
  coefficients: {
    age: 0.0225,
    m1: 1.6492,
    gradeHigh: 0.2791,
    nlrZ: 0.4104,
    plrZ: -0.1176,
  },
  covariateMeans: {
    age: 57.6869,
    m1: 0.4747,
    gradeHigh: 0.5657,
    nlrZ: 0.0496,
    plrZ: 0.0648,
  },

  // ----------------------------------------------------------
  // Standardization constants — raw NLR/PLR are z-scored before
  // entering the model. Fitted on the same 99-patient cohort.
  // ----------------------------------------------------------
  standardization: {
    nlr: { mean: 2.3242, sd: 1.1841 },
    plr: { mean: 186.0139, sd: 96.8275 },
  },

  // ----------------------------------------------------------
  // Baseline survival S0(t), month = 0..60, evaluated at the
  // mean covariate vector. Patient-specific survival at time t:
  //   S(t) = S0(t) ^ exp(linearPredictor)
  // ----------------------------------------------------------
  baselineSurvival: [
    0.99374,0.94278,0.90673,0.88114,0.85422,0.82414,0.81126,0.77138,0.76755,0.76374,
    0.75728,0.7423,0.69911,0.67961,0.63012,0.61599,0.59148,0.5733,0.55932,0.54693,
    0.51471,0.50087,0.49062,0.47892,0.46748,0.45588,0.44606,0.44197,0.43792,0.4339,
    0.42495,0.4158,0.4158,0.40517,0.40047,0.38211,0.36905,0.36905,0.36905,0.36905,
    0.36905,0.36128,0.34489,0.34489,0.32434,0.31514,0.31514,0.31514,0.31514,0.31514,
    0.31514,0.31514,0.31514,0.31514,0.31514,0.31514,0.31514,0.31514,0.31514,0.31514,
    0.31514,
  ],

  validation: {
    age: { min: 18, max: 100 },
    nlr: { min: 0.1, max: 50 },
    plr: { min: 1, max: 1000 },
  },

  // ----------------------------------------------------------
  // Risk bands — TERTILES (33rd / 66th percentile) of predicted
  // 24-month mortality risk across the 99-patient development
  // cohort. Data-driven, not arbitrary round numbers, and NOT
  // externally validated clinical decision thresholds.
  // ----------------------------------------------------------
  riskBands: {
    lowerThreshold: 0.29,
    higherThreshold: 0.80,
    exploratoryLabel:
      "Tertile-based risk band from the 99-patient development cohort — not an externally validated clinical threshold",
  },

  // ----------------------------------------------------------
  // Diagnostic vs. prognostic NLR cutoffs, for the 2-cutoff
  // visualization. Two DIFFERENT thresholds from two DIFFERENT
  // analyses — this contrast is the tool's central finding.
  // ----------------------------------------------------------
  cutoffs: {
    nlrDiagnostic: 2.0,   // Youden-optimal, distant-metastasis endpoint, N=114
    nlrPrognostic: 3.692, // maximally-selected-rank-statistic, OS endpoint, N=99
    nlrAxisMin: 0.5,
    nlrAxisMax: 8,
  },

  formulaDisplay: {
    outcome: "Overall Survival (time to death)",
    modelType: "Cox Proportional Hazards",
    terms: [
      { label: "Age", coefficient: 0.0225 },
      { label: "Distant metastasis (M1)", coefficient: 1.6492, encoding: "Present = 1, Absent = 0" },
      { label: "Poor differentiation", coefficient: 0.2791, encoding: "Poor = 1, Well/moderate = 0" },
      { label: "NLR (z-score)", coefficient: 0.4104 },
      { label: "PLR (z-score)", coefficient: -0.1176 },
    ],
  },

  metadata: {
    outcome: "Overall Survival",
    modelType: "Cox Proportional Hazards (Tier 1 Lean)",
    cIndexBootstrap: 0.722,
    cohortN: 99,
    cohortEvents: 62,
    diagnosticCohortN: 114,
    citation: "Survival-analysis development cohort, n = 99 (62 deaths)",
  },
};
