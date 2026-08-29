// ============================================================
// vpgPdfExport.ts — R-06 refinement
//
// Reuses the SAME lazy-load pattern as src/utils/export.ts
// (`await import("jspdf")`, loaded only when the user clicks
// Download), so the ~250KB dependency stays out of the initial
// bundle exactly as it does today. Does not modify export.ts itself
// — that file's PDF stays diagnostic-only and untouched; this is a
// new, VPG-specific generator per R-06 ("reuse existing report/PDF
// infrastructure where practical... do not redesign the entire PDF
// system unnecessarily" — reusing the *pattern*, not duplicating the
// diagnostic-only layout, since the VPG report has a materially
// different, dual-model, Observed-vs-Predicted content shape).
// ============================================================

import type { VirtualPatient } from "../../types/virtualPatient";

const NAVY: [number, number, number] = [10, 37, 64];
const SLATE: [number, number, number] = [71, 85, 105];
const BORDER: [number, number, number] = [226, 232, 240];
const AMBER_BG: [number, number, number] = [255, 251, 240];
const AMBER_BORDER: [number, number, number] = [253, 230, 138];
const AMBER_TEXT: [number, number, number] = [146, 64, 14];

export async function generateVpgPdf(patient: VirtualPatient): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const PW = doc.internal.pageSize.getWidth();
  const ML = 18, MR = 18, CW = PW - ML - MR;
  let y = 0;

  const setColor = (c: [number, number, number]) => doc.setTextColor(...c);
  const setFill = (c: [number, number, number]) => doc.setFillColor(...c);
  const setDraw = (c: [number, number, number]) => doc.setDrawColor(...c);
  const hline = (yy: number) => { setDraw(BORDER); doc.setLineWidth(0.2); doc.line(ML, yy, PW - MR, yy); };
  const section = (title: string) => {
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); setColor(SLATE);
    doc.text(title.toUpperCase(), ML, y); y += 5.5;
  };
  const kv = (label: string, value: string) => {
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); setColor(SLATE);
    doc.text(`${label}:`, ML, y);
    doc.setFont("helvetica", "bold"); setColor([15, 23, 42]);
    const lines = doc.splitTextToSize(value, CW - 45);
    doc.text(lines, ML + 45, y);
    y += Math.max(5, lines.length * 4.5);
  };

  // Header
  setFill(NAVY); doc.rect(0, 0, PW, 20, "F");
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); setColor([255, 255, 255]);
  doc.text("Gastric Cancer Virtual Patient Generator — Research Report", ML, 9);
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); setColor([148, 163, 184]);
  doc.text(`Generated ${new Date().toLocaleString()}`, ML, 14.5);
  y = 26;

  section("Observed Patient State");
  kv("Provenance", patient.identity.provenance);
  kv("Age / Sex / BMI", `${patient.demographics.age} / ${patient.demographics.sex} / ${patient.demographics.bmi}`);
  kv("NLR / PLR", `${patient.laboratory.nlr} (${patient.laboratory.nlrSource}) / ${patient.laboratory.plr} (${patient.laboratory.plrSource})`);
  kv("Tumor location / multisite", `${patient.tumorPathology.location} / ${patient.tumorPathology.multisite}`);
  kv("Tumor diameter", String(patient.tumorPathology.tumorDiameter));
  kv("Grade", `${patient.tumorPathology.grade} — ${patient.tumorPathology.tumorGrade} (${patient.tumorPathology.gradeClass})`);
  kv("Surgery / Chemo", `${patient.treatment.surgery} / ${patient.treatment.chemotherapy}`);
  if (patient.treatment.chemotherapy === 1) {
    kv("Chemo type / Regimen", `${patient.treatment.chemoType} / ${patient.treatment.regimen}`);
  }
  y += 3; hline(y); y += 6;

  section("Predicted Future State");
  const dx = patient.predictedFutureState.metastasisPrediction;
  if (dx.status === "ok") {
    kv("Diagnostic — Distant metastasis", `${dx.result.probabilityPercent} (${dx.result.category})`);
  } else {
    kv("Diagnostic", dx.status === "blocked" ? `Unavailable — ${dx.missing.join(", ")}` : "Not run");
  }
  const sx = patient.predictedFutureState.survivalPrediction;
  if (sx.status === "ok") {
    kv("Survival — 12mo / 24mo risk", `${(sx.result.risk12 * 100).toFixed(1)}% / ${(sx.result.risk24 * 100).toFixed(1)}%`);
    kv("Hazard ratio / Risk band", `${sx.result.hazardRatio.toFixed(2)} / ${sx.result.riskBand}`);
    y += 1;
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); setColor(SLATE);
    doc.text("SHAP contributions (log-hazard scale):", ML, y); y += 4.5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
    sx.result.shapContributions.forEach((c) => {
      doc.text(`  ${c.label}: ${c.value >= 0 ? "+" : ""}${c.value.toFixed(3)}`, ML, y);
      y += 4;
    });
  } else {
    kv("Survival", sx.status === "blocked" ? `Unavailable — ${sx.missing.join(", ")}` : "Not run");
  }
  y += 3; hline(y); y += 6;

  if (patient.observedOutcomes) {
    section("Observed Outcome (Private/Local — compare vs. Prediction)");
    kv("Vital status", patient.observedOutcomes.vitalStatus === 1 ? "Alive" : patient.observedOutcomes.vitalStatus === 0 ? "Dead" : "unknown");
    kv("Metastasis_TNM", String(patient.observedOutcomes.metastasisTNM));
    y += 3; hline(y); y += 6;
  }

  section("Model Transparency");
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); setColor(SLATE);
  y = ((): number => {
    const lines = doc.splitTextToSize(
      "Diagnostic and survival predictions are produced by the existing, unmodified TypeScript engines " +
        "(src/utils/calculator.ts, src/utils/survivalCalculator.ts). Original model-fitting/training source is " +
        "not present in this repository; the operational implementation is used as-is per the approved " +
        "provenance-limitation policy.",
      CW
    );
    doc.text(lines, ML, y);
    return y + lines.length * 4;
  })();
  y += 5;

  const disclaimer = "For research and educational use only. Not a substitute for clinical judgment, physician assessment, or established diagnostic/treatment protocols. No treatment recommendation is implied.";
  const dLines = doc.setFontSize(7.5) && doc.splitTextToSize(disclaimer, CW - 6);
  setFill(AMBER_BG); setDraw(AMBER_BORDER); doc.setLineWidth(0.3);
  doc.rect(ML, y, CW, dLines.length * 4 + 6, "FD");
  y += 4.5; setColor(AMBER_TEXT); doc.text(dLines, ML + 3, y);

  const filename = `vpg-report-${patient.identity.provenance}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
