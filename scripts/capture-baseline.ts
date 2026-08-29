// ============================================================
// scripts/capture-baseline.ts — R-07-F2
//
// THIS SCRIPT IS NOT EXECUTED BY CLAUDE. It must be run locally by
// the user (see README_BASELINE.md in this package for exact
// commands). It imports the REAL, unmodified engine functions
// (src/utils/calculator.ts, src/utils/survivalCalculator.ts) and
// calls them directly — the output is the actual current behavior of
// your operational implementation, not a hand-derived or assumed
// value. That output is written to
// src/__tests__/baseline.frozen.json and becomes the frozen
// regression baseline that regression.engines.test.ts compares
// against on every future run.
//
// Re-run this script and commit the updated JSON only when a human
// has deliberately decided the operational model behavior should
// change (e.g. an approved coefficient update) — NOT to make a
// failing test pass. A regression-test failure after an unintended
// change means the engine's behavior drifted; the fix is to
// investigate the drift, not to regenerate the baseline.
// ============================================================

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { calculateRisk } from "../src/utils/calculator";
import { calculateSurvival } from "../src/utils/survivalCalculator";
import { createEmptyVirtualPatient } from "../src/types/virtualPatient";
import { runDiagnosticPrediction } from "../src/adapters/diagnosticAdapter";
import { runSurvivalPrediction } from "../src/adapters/survivalAdapter";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ------------------------------------------------------------
// A/B — direct engine cases. Inputs are arbitrary-but-fixed
// (chosen to span low/mid/high ranges); OUTPUTS are whatever the
// real engine returns — captured here, never assumed.
// ------------------------------------------------------------
const diagnosticCases = [
  { tumorLocation: "single" as const, nlr: 3.7, plr: 168 },
  { tumorLocation: "multiple" as const, nlr: 2.0, plr: 100 },
  { tumorLocation: "single" as const, nlr: 0.5, plr: 50 },
  { tumorLocation: "multiple" as const, nlr: 8.0, plr: 400 },
];

const survivalCases = [
  { age: 60, m1: 0 as const, gradeHigh: 0 as const, nlr: 2.5, plr: 180 },
  { age: 70, m1: 1 as const, gradeHigh: 1 as const, nlr: 4.0, plr: 250 },
  { age: 45, m1: 0 as const, gradeHigh: 0 as const, nlr: 1.5, plr: 120 },
  { age: 80, m1: 1 as const, gradeHigh: 1 as const, nlr: 6.0, plr: 350 },
];

// ------------------------------------------------------------
// C/D — adapter-level cases, built as VirtualPatient objects whose
// resolved values are IDENTICAL to one of the direct-engine cases
// above, so the test file can assert adapter output === that
// specific captured direct-engine baseline entry.
// ------------------------------------------------------------
function diagnosticAdapterPatient() {
  const p = createEmptyVirtualPatient();
  p.tumorPathology.location = "Antrum";
  p.tumorPathology.multisite = "Single site";
  p.laboratory.nlr = 3.7;
  p.laboratory.plr = 168;
  p.laboratory.nlrSource = "direct";
  p.laboratory.plrSource = "direct";
  return p; // equivalent to diagnosticCases[0]
}

function survivalAdapterPatient() {
  const p = createEmptyVirtualPatient();
  p.demographics.age = 60;
  p.survivalInputs = { hypotheticalM1: 0 };
  p.tumorPathology.grade = 1; // -> gradeHigh 0 via locked mapping
  p.laboratory.nlr = 2.5;
  p.laboratory.plr = 180;
  return p; // equivalent to survivalCases[0]
}

function main() {
  const diagnostic = diagnosticCases.map((input) => ({ input, output: calculateRisk(input) }));
  const survival = survivalCases.map((input) => ({ input, output: calculateSurvival(input) }));

  const diagAdapterResult = runDiagnosticPrediction(diagnosticAdapterPatient());
  const survAdapterResult = runSurvivalPrediction(survivalAdapterPatient());

  const baseline = {
    capturedAt: new Date().toISOString(),
    capturedBy: "HUMAN LOCAL EXECUTION via scripts/capture-baseline.ts — not Claude",
    engineSource: {
      diagnostic: "src/utils/calculator.ts::calculateRisk (unmodified)",
      survival: "src/utils/survivalCalculator.ts::calculateSurvival (unmodified)",
    },
    diagnostic,
    survival,
    adapterFidelity: {
      diagnostic: { equivalentToDirectCaseIndex: 0, result: diagAdapterResult },
      survival: { equivalentToDirectCaseIndex: 0, result: survAdapterResult },
    },
  };

  const outPath = resolve(__dirname, "../src/__tests__/baseline.frozen.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(baseline, null, 2) + "\n", "utf-8");
  console.log(`Frozen baseline written to ${outPath}`);
  console.log("Commit this file. Regression tests will compare future runs against it.");
}

main();
