import { useCallback, useMemo, useState } from "react";
import {
  createEmptyVirtualPatient,
  type VirtualPatient,
  type Grade,
} from "../types/virtualPatient";
import { deriveMultisite } from "../utils/vpg/deriveMultisite";
import { deriveGradeClass, deriveTumorGrade } from "../config/pathologyMapping";
import { runDiagnosticPrediction } from "../adapters/diagnosticAdapter";
import { runSurvivalPrediction } from "../adapters/survivalAdapter";
import { checkDiagnosticReadiness, checkSurvivalReadiness } from "../utils/vpg/validation";

export type VpgStep = "build" | "review" | "predictions" | "report";

export function useVirtualPatient() {
  const [patient, setPatient] = useState<VirtualPatient>(createEmptyVirtualPatient());
  const [step, setStep] = useState<VpgStep>("build");

  // ---- Field updaters -----------------------------------------------
  // Grouped by module. Grade updates ALSO recompute the two derived
  // display fields (Tumor_Grade, Tumor_grade_class) via the locked
  // mapping — never independently editable (ID-07 rule).
  const updateDemographics = useCallback(
    (patch: Partial<VirtualPatient["demographics"]>) =>
      setPatient((p) => ({ ...p, demographics: { ...p.demographics, ...patch } })),
    []
  );

  const updateLaboratory = useCallback(
    (patch: Partial<VirtualPatient["laboratory"]>) =>
      setPatient((p) => ({ ...p, laboratory: { ...p.laboratory, ...patch } })),
    []
  );

  const updateTumorPathology = useCallback(
    (patch: Partial<VirtualPatient["tumorPathology"]>) =>
      setPatient((p) => {
        const next = { ...p.tumorPathology, ...patch };
        if (patch.location !== undefined || patch.locationDescription !== undefined) {
          next.multisite = deriveMultisite(next.location, next.locationDescription);
        }
        return { ...p, tumorPathology: next };
      }),
    []
  );

  /** The ONLY way to set Grade — always recomputes tumorGrade/gradeClass
   *  together so the three fields can never drift out of sync. */
  const setGrade = useCallback(
    (grade: Grade) =>
      setPatient((p) => ({
        ...p,
        tumorPathology: {
          ...p.tumorPathology,
          grade,
          tumorGrade: deriveTumorGrade(grade),
          gradeClass: deriveGradeClass(grade),
        },
      })),
    []
  );

  const updateTreatment = useCallback(
    (patch: Partial<VirtualPatient["treatment"]>) =>
      setPatient((p) => ({ ...p, treatment: { ...p.treatment, ...patch } })),
    []
  );

  const setHypotheticalM1 = useCallback(
    (v: 0 | 1) =>
      setPatient((p) => ({ ...p, survivalInputs: { hypotheticalM1: v } })),
    []
  );

  // ---- Readiness (used by Review step + step-nav gating) -------------
  const diagnosticReadiness = useMemo(() => checkDiagnosticReadiness(patient), [patient]);
  const survivalReadiness = useMemo(() => checkSurvivalReadiness(patient), [patient]);

  // ---- Predictions step ------------------------------------------------
  const runPredictions = useCallback(() => {
    setPatient((p) => ({
      ...p,
      predictedFutureState: {
        metastasisPrediction: runDiagnosticPrediction(p),
        survivalPrediction: runSurvivalPrediction(p),
      },
    }));
    setStep("predictions");
  }, []);

  const reset = useCallback(() => {
    setPatient(createEmptyVirtualPatient());
    setStep("build");
  }, []);

  /** R-05: entry point for Private/Local "Load Existing Patient".
   *  Replaces the current patient wholesale with a cohort-provenance
   *  record already validated structurally by cohortLoader.local.ts.
   *  Never called from any Public-mode code path. */
  const loadFromRecord = useCallback((record: VirtualPatient) => {
    setPatient(record);
    setStep("review");
  }, []);

  return {
    loadFromRecord,
    patient,
    step,
    setStep,
    updateDemographics,
    updateLaboratory,
    updateTumorPathology,
    setGrade,
    updateTreatment,
    setHypotheticalM1,
    diagnosticReadiness,
    survivalReadiness,
    runPredictions,
    reset,
  };
}
