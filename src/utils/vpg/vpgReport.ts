// ============================================================
// vpgReport.ts — VPG report data assembly
//
// Reuses the existing export.ts CLIPBOARD-TEXT PATTERN conceptually
// (plain-text sectioned report) rather than importing its
// diagnostic-only ReportData shape, since Contract §16/§17 require a
// combined observed+predicted, dual-model report that export.ts's
// current interface does not cover (confirmed in the earlier
// inspection report §12). generateAndDownloadPDF's jsPDF drawing
// helpers in export.ts remain reusable as-is for a future PDF pass;
// this file only produces the text/data payload, mirroring
// buildClipboardText()'s section-list style.
// ============================================================

import type { VirtualPatient } from "../../types/virtualPatient";
import { assertPublicModeSafe } from "./validation";

export function buildVpgReportText(patient: VirtualPatient): string {
  // Public-mode privacy gate — refuses to build a report for a
  // cohort-provenance patient outside Private/Local mode call sites.
  if (patient.identity.provenance === "synthetic") {
    assertPublicModeSafe(patient);
  }

  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push("GASTRIC CANCER VIRTUAL PATIENT GENERATOR — RESEARCH REPORT");
  lines.push("=".repeat(60));
  lines.push("");
  lines.push(`Generated: ${now}`);
  lines.push(`Patient provenance: ${patient.identity.provenance}`);
  if (patient.identity.provenance === "cohort-local") {
    lines.push(`Patient ID (private/local only): ${patient.identity.patientId}`);
  }
  lines.push("");

  lines.push("OBSERVED PATIENT PROFILE");
  lines.push(`  Age: ${patient.demographics.age}  Sex: ${patient.demographics.sex}  BMI: ${patient.demographics.bmi}`);
  lines.push("");

  lines.push("TUMOR / PATHOLOGY");
  const tp = patient.tumorPathology;
  lines.push(`  Location: ${tp.location} (multisite: ${tp.multisite})`);
  lines.push(`  Grade: ${tp.grade}  Tumor_Grade: ${tp.tumorGrade}  Tumor_grade_class: ${tp.gradeClass}`);
  lines.push("");

  lines.push("LABORATORY PROFILE");
  lines.push(`  NLR: ${patient.laboratory.nlr} (${patient.laboratory.nlrSource})  PLR: ${patient.laboratory.plr} (${patient.laboratory.plrSource})`);
  lines.push("");

  lines.push("TREATMENT");
  lines.push(`  Surgery: ${patient.treatment.surgery}  Chemotherapy: ${patient.treatment.chemotherapy}`);
  lines.push("");

  lines.push("PREDICTED FUTURE STATE");
  const dx = patient.predictedFutureState.metastasisPrediction;
  if (dx.status === "ok") {
    lines.push(`  Diagnostic — Distant metastasis probability: ${dx.result.probabilityPercent} (${dx.result.category})`);
  } else if (dx.status === "blocked") {
    lines.push(`  Diagnostic — unavailable: ${dx.missing.join(", ")}`);
  } else {
    lines.push("  Diagnostic — not run.");
  }
  const sx = patient.predictedFutureState.survivalPrediction;
  if (sx.status === "ok") {
    lines.push(`  Survival — 12mo risk: ${(sx.result.risk12 * 100).toFixed(1)}%  24mo risk: ${(sx.result.risk24 * 100).toFixed(1)}%  HR: ${sx.result.hazardRatio.toFixed(2)}  Band: ${sx.result.riskBand}`);
  } else if (sx.status === "blocked") {
    lines.push(`  Survival — unavailable: ${sx.missing.join(", ")}`);
  } else {
    lines.push("  Survival — not run.");
  }
  lines.push("");

  if (patient.observedOutcomes) {
    lines.push("OBSERVED OUTCOME (private/local mode — compare vs. prediction)");
    lines.push(`  Vital status: ${patient.observedOutcomes.vitalStatus}  Metastasis_TNM: ${patient.observedOutcomes.metastasisTNM}`);
    lines.push("");
  }

  lines.push("MODEL TRANSPARENCY");
  lines.push("  Diagnostic engine: existing TypeScript logistic-regression implementation (src/utils/calculator.ts), unmodified.");
  lines.push("  Survival engine: existing TypeScript Cox-PH implementation (src/utils/survivalCalculator.ts), unmodified.");
  lines.push("  Provenance note: original model-fitting/training source (R or Python) is not present in this repository;");
  lines.push("  the operational TypeScript implementation is used as-is per the approved provenance-limitation policy.");
  lines.push("");

  lines.push("DISCLAIMER");
  lines.push("  For research and educational use only. Not a substitute for clinical judgment, physician assessment,");
  lines.push("  or established diagnostic/treatment protocols.");

  return lines.join("\n");
}
