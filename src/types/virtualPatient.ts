// ============================================================
// virtualPatient.ts — Virtual Patient schema (Phase 2 VPG)
//
// Source of truth for field shape: 07_DATA_DICTIONARY (41 variables,
// 7 modules) in NLR_VPG_AUDITED_Updated.xlsx.
//
// This file does NOT import from config/model.ts or
// config/survivalModel.ts — the patient object is independent of
// the prediction engines. Adapters (src/adapters/*) are the only
// place that translates VirtualPatient -> engine input types.
//
// Every field is `Unknown` by default, never silently defaulted to
// an absence value. See FS-04 / Contract §14: "Never convert unknown
// into absence."
// ============================================================

/** A field that has not been entered/observed. Distinct from `Absent`. */
export type Unknown = "unknown";

/** A field whose absence is a genuine clinical fact (0/No/None-observed). */
export type Absent = "absent";

/** Generic optional-clinical-value wrapper used across modules.
 *  - value present  -> observed
 *  - "unknown"       -> not available / not yet entered
 *  - "absent"        -> known to be absent (only where semantically valid)
 */
export type Obs<T> = T | Unknown;

// ------------------------------------------------------------
// 01_PATIENT
// ------------------------------------------------------------
export interface IdentityModule {
  /** Internal identifier. Private/local mode only — never rendered
   *  or included in any Public-mode export. */
  patientId: Obs<string>;
  initialDate: Obs<string>; // YYYY-MM-DD
  /** Set only when the object was reconstructed from cohort data in
   *  Private/Local mode. Public "Build New Virtual Patient" always
   *  produces `"synthetic"`. Drives every privacy boundary check. */
  provenance: "synthetic" | "cohort-local";
}

// ------------------------------------------------------------
// 02_DEMOGRAPHICS
// ------------------------------------------------------------
export type Sex = "Male" | "Female";

export interface DemographicsModule {
  age: Obs<number>; // years, integer
  sex: Obs<Sex>;
  bmi: Obs<number>; // kg/m^2
}

// ------------------------------------------------------------
// 03_LABORATORY
// ------------------------------------------------------------
export interface LaboratoryModule {
  rbc: Obs<number>;
  hgb: Obs<number>;
  hct: Obs<number>;
  plt: Obs<number>;
  wbc: Obs<number>;
  neutrophils: Obs<number>;
  lymphocytes: Obs<number>;
  /** Direct entry OR derived from neutrophils/lymphocytes — see
   *  utils/vpg/nlrPlrResolver.ts. Never silently overwritten once
   *  the user has entered it explicitly. */
  nlr: Obs<number>;
  plr: Obs<number>;
  /** Which path produced nlr/plr — required for report transparency
   *  and to satisfy "never silently overwrite" (Contract §7). */
  nlrSource: "direct" | "derived" | Unknown;
  plrSource: "direct" | "derived" | Unknown;
}

// ------------------------------------------------------------
// 04_TUMOR_PATHOLOGY
// ------------------------------------------------------------
export type TumorLocationRaw =
  | "Overlapping"
  | "Antrum"
  | "Pylorus"
  | "Cardia"
  | "Body"
  | "Entire"
  | "Fundus";

export type TumorLocationMultisite = "Single site" | "Overlapping";
export type Curvature = "Lesser" | "Greater" | "Lesser + Greater";
export type TumorSizeClass = "Small" | "Median" | "Big";
export type TumorMorphologyRaw =
  | "Infiltrative ulcerative"
  | "Ulcerative"
  | "Diffuse infiltrative"
  | "Mass"
  | "Unclassifiable";
export type MorphologyClass = "Type 1" | "Type 2" | "Type 3" | "Type 4" | "Type 5";

/** Grade is the ONLY user-facing pathology-grade input.
 *  Tumor_Grade / Tumor_grade_class / gradeHigh are all DERIVED from
 *  this single value via the locked ID-07 mapping
 *  (config/pathologyMapping.ts). Never collect them independently —
 *  that would create the exact "contradictory combination" the
 *  contract forbids. */
export type Grade = 1 | 2 | 3;
export type TumorGradeLabel = "Well differentiation" | "Moderate differentiation" | "Poor differentiation";
export type TumorGradeClass = "Low risk" | "High risk";

export type TumorTnmT = "Tis" | "1-b" | "2" | "3" | "4-a" | "4-b";
export type NodeTnm = "0" | "1" | "2" | "3";
export type Stage = "I-B" | "II-A" | "II-B" | "III-A" | "III-B" | "III-C" | "IV";
export type StageTnm = "I" | "II" | "III" | "IV";

export interface TumorPathologyModule {
  location: Obs<TumorLocationRaw>;
  locationDescription: Obs<string>;
  /** DERIVED display field — set by deriveMultisite(location + description).
   *  This is the ONLY tumor-pathology field the diagnostic adapter reads. */
  multisite: Obs<TumorLocationMultisite>;
  curvature: Obs<Curvature>;
  /** Preserve the original "A x B" / "A x B x C" text — do not force
   *  into a single numeric scalar (Contract data-schema note). */
  tumorDiameter: Obs<string>;
  sizeClass: Obs<TumorSizeClass>;
  morphology: Obs<TumorMorphologyRaw>;
  morphologyClass: Obs<MorphologyClass>;

  /** User-facing pathology grade input (1/2/3). Source for the
   *  locked ID-07 derivation. */
  grade: Obs<Grade>;
  /** DERIVED — never independently editable. */
  tumorGrade: Obs<TumorGradeLabel>;
  /** DERIVED — never independently editable. */
  gradeClass: Obs<TumorGradeClass>;

  tnmT: Obs<TumorTnmT>;
  /** Node_number: integer count of involved nodes. The legacy cohort's
   *  "Bulky" value was recoded to missing during audit — treat any
   *  non-integer input the same way (Unknown, never silently 0). */
  nodeNumber: Obs<number>;
  nodeTnm: Obs<NodeTnm>;
  stage: Obs<Stage>;
  stageTnm: Obs<StageTnm>;
}

// ------------------------------------------------------------
// 05_TREATMENT
// ------------------------------------------------------------
export type ChemoType = "Palliative" | "Neo-adjuvant" | "Adjuvant";
export type Regimen =
  | "CapeOx" | "SOX" | "S-1" | "FOLFOX" | "Capecitabine" | "FLOT" | "CapexOx";

export interface TreatmentModule {
  surgery: Obs<0 | 1>;
  chemotherapy: Obs<0 | 1>;
  chemoType: Obs<ChemoType>;
  regimen: Obs<Regimen>;
}

// ------------------------------------------------------------
// 06_OUTCOMES — OBSERVED ONLY. Never read by the diagnostic adapter.
// Metastasis_TNM is a required SURVIVAL covariate (M1) but is NOT a
// diagnostic-model input (FS §4 / Contract §4 — explicit rule).
// ------------------------------------------------------------
export interface ObservedOutcomesModule {
  recurrence: Obs<0 | 1>;
  recurrenceDate: Obs<string>;
  vitalStatus: Obs<0 | 1>; // 0 = Dead, 1 = Alive
  deathDate: Obs<string>;
  metastasisDescription: Obs<string>;
  /** Number of distant metastatic SITES/ORGANS — not lesion count. */
  metastasisNumber: Obs<number>;
  /** Observed ground truth. Feeds the survival model's M1 covariate
   *  only — see adapters/survivalAdapter.ts. Must never be read by
   *  the diagnostic adapter (that would violate observed/predicted
   *  separation, since the diagnostic model PREDICTS this). */
  metastasisTNM: Obs<0 | 1>;
}

// ------------------------------------------------------------
// survivalInputs — FLAGGED AMBIGUITY, see accompanying report §Gaps.
//
// Metastasis_TNM lives under 06_OUTCOMES (observed) in the audited
// schema, yet the survival engine requires an M1 value for EVERY
// patient it runs on, including a brand-new synthetic Public-mode
// patient that by definition has no observed outcome yet. The source
// documents do not resolve this. Minimum decision taken here (subject
// to Strategist override): a synthetic patient may carry an explicit
// user-entered *hypothetical* M1 state for "what-if" survival
// modeling, kept structurally separate from `observedOutcomes` so it
// can never be mistaken for ground truth or leak into a report as an
// observed fact. In Private/Local mode, `observedOutcomes.metastasisTNM`
// is used instead and this field is left unknown.
// ------------------------------------------------------------
export interface SurvivalModelingInputsModule {
  /** Present ONLY for provenance === "synthetic" patients where the
   *  user has explicitly chosen to model a hypothetical M1 state.
   *  Never populated automatically; never treated as observed fact. */
  hypotheticalM1: Obs<0 | 1>;
}

// ------------------------------------------------------------
// predicted_future_state — populated only after Predictions step runs.
// Shapes are IDENTICAL to the existing engines' RiskResult /
// SurvivalResult (imported, not redefined) so the adapter never
// recomputes anything the presentation layer can already render.
// ------------------------------------------------------------
import type { RiskResult } from "./nomogram";
import type { SurvivalResult } from "./survival";

export type PredictionStatus =
  | { status: "not-run" }
  | { status: "blocked"; reason: string; missing: string[] }
  | { status: "ok"; result: RiskResult };

export type SurvivalPredictionStatus =
  | { status: "not-run" }
  | { status: "blocked"; reason: string; missing: string[] }
  | { status: "ok"; result: SurvivalResult };

export interface PredictedFutureState {
  metastasisPrediction: PredictionStatus;
  survivalPrediction: SurvivalPredictionStatus;
}

// ------------------------------------------------------------
// Root object
// ------------------------------------------------------------
export interface VirtualPatient {
  identity: IdentityModule;
  demographics: DemographicsModule;
  laboratory: LaboratoryModule;
  tumorPathology: TumorPathologyModule;
  treatment: TreatmentModule;
  /** Present only in Private/Local "Load Existing Patient" reconstructions.
   *  Absent (undefined) for every Public "Build New Virtual Patient" object. */
  observedOutcomes?: ObservedOutcomesModule;
  /** See SurvivalModelingInputsModule doc comment above. */
  survivalInputs?: SurvivalModelingInputsModule;
  predictedFutureState: PredictedFutureState;
}

// ------------------------------------------------------------
// Factory — every new patient starts fully Unknown. No field is
// ever defaulted to a clinically meaningful value.
// ------------------------------------------------------------
export function createEmptyVirtualPatient(): VirtualPatient {
  return {
    identity: { patientId: "unknown", initialDate: "unknown", provenance: "synthetic" },
    demographics: { age: "unknown", sex: "unknown", bmi: "unknown" },
    laboratory: {
      rbc: "unknown", hgb: "unknown", hct: "unknown", plt: "unknown", wbc: "unknown",
      neutrophils: "unknown", lymphocytes: "unknown",
      nlr: "unknown", plr: "unknown",
      nlrSource: "unknown", plrSource: "unknown",
    },
    tumorPathology: {
      location: "unknown", locationDescription: "unknown", multisite: "unknown",
      curvature: "unknown", tumorDiameter: "unknown", sizeClass: "unknown",
      morphology: "unknown", morphologyClass: "unknown",
      grade: "unknown", tumorGrade: "unknown", gradeClass: "unknown",
      tnmT: "unknown", nodeNumber: "unknown", nodeTnm: "unknown",
      stage: "unknown", stageTnm: "unknown",
    },
    treatment: { surgery: "unknown", chemotherapy: "unknown", chemoType: "unknown", regimen: "unknown" },
    observedOutcomes: undefined,
    predictedFutureState: {
      metastasisPrediction: { status: "not-run" },
      survivalPrediction: { status: "not-run" },
    },
  };
}
