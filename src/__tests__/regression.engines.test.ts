// ============================================================
// regression.engines.test.ts — R-07-F2 refinement
//
// STATUS: NOT EXECUTED BY CLAUDE.
//
// This file no longer contains any hand-derived "expected" numeric
// value for model output. Sections A-D (diagnostic/survival engine
// and adapter fidelity) load src/__tests__/baseline.frozen.json,
// which is produced ONLY by running scripts/capture-baseline.ts
// locally against the real, unmodified engine functions (see
// README_BASELINE.md). If that file does not exist yet, those tests
// fail immediately with an explicit message rather than silently
// skipping or falling back to an assumed number — this is
// intentional per this pass's instruction: "If a baseline cannot be
// established... do NOT invent the expected value."
//
// Sections E-H (ID-07 mapping, NLR/PLR direct-preservation and
// fallback-derivation, missing-value blocking) test this codebase's
// OWN adapter/resolver/mapping logic against the locked written
// specification — not against captured model output — so those do
// NOT require the baseline file and run unconditionally.
// ============================================================

import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { calculateRisk } from "../utils/calculator";
import { calculateSurvival } from "../utils/survivalCalculator";
import { createEmptyVirtualPatient } from "../types/virtualPatient";
import { runDiagnosticPrediction } from "../adapters/diagnosticAdapter";
import { runSurvivalPrediction } from "../adapters/survivalAdapter";
import { deriveGradeHigh, validatePathologyConsistency } from "../config/pathologyMapping";
import { resolveNlr, resolvePlr } from "../utils/vpg/nlrPlrResolver";
import { parseTumorDiameter, diameterToPortraitRadius } from "../utils/vpg/tumorDiameterParser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = resolve(__dirname, "baseline.frozen.json");
const TOLERANCE = 1e-6; // baseline is captured from the exact same code path, so this should be an exact match modulo float noise

type BaselineFile = {
  diagnostic: Array<{ input: { tumorLocation: "single" | "multiple"; nlr: number; plr: number }; output: ReturnType<typeof calculateRisk> }>;
  survival: Array<{ input: { age: number; m1: 0 | 1; gradeHigh: 0 | 1; nlr: number; plr: number }; output: ReturnType<typeof calculateSurvival> }>;
  adapterFidelity: {
    diagnostic: { equivalentToDirectCaseIndex: number; result: ReturnType<typeof runDiagnosticPrediction> };
    survival: { equivalentToDirectCaseIndex: number; result: ReturnType<typeof runSurvivalPrediction> };
  };
};

let baseline: BaselineFile | null = null;
let baselineMissing = false;

beforeAll(() => {
  if (existsSync(BASELINE_PATH)) {
    baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
  } else {
    baselineMissing = true;
  }
});

// ------------------------------------------------------------
// A/B — direct engine output vs captured baseline
// ------------------------------------------------------------
describe("A. Diagnostic engine vs captured baseline", () => {
  it("BASELINE REQUIRES HUMAN LOCAL EXECUTION if not yet captured", () => {
    if (baselineMissing) {
      throw new Error(
        "BASELINE REQUIRES HUMAN LOCAL EXECUTION — run `npm run capture-baseline` " +
          "(see README_BASELINE.md), commit src/__tests__/baseline.frozen.json, then re-run tests."
      );
    }
    expect(baseline).not.toBeNull();
  });

  it("calculateRisk() output matches the captured baseline for every recorded case", () => {
    if (!baseline) return; // previous test already reported the missing-baseline failure
    for (const c of baseline.diagnostic) {
      const live = calculateRisk(c.input);
      expect(Math.abs(live.probability - c.output.probability)).toBeLessThan(TOLERANCE);
      expect(Math.abs(live.logit - c.output.logit)).toBeLessThan(TOLERANCE);
      expect(live.category).toBe(c.output.category);
    }
  });
});

describe("B. Survival engine vs captured baseline", () => {
  it("calculateSurvival() output matches the captured baseline for every recorded case", () => {
    if (!baseline) return;
    for (const c of baseline.survival) {
      const live = calculateSurvival(c.input);
      expect(Math.abs(live.hazardRatio - c.output.hazardRatio)).toBeLessThan(TOLERANCE);
      expect(Math.abs(live.risk12 - c.output.risk12)).toBeLessThan(TOLERANCE);
      expect(Math.abs(live.risk24 - c.output.risk24)).toBeLessThan(TOLERANCE);
      expect(live.riskBand).toBe(c.output.riskBand);
    }
  });
});

// ------------------------------------------------------------
// C/D — adapter output vs the SAME captured baseline entry it was
// constructed to be equivalent to (see capture-baseline.ts comments).
// ------------------------------------------------------------
describe("C. Diagnostic adapter vs captured baseline", () => {
  it("adapter output matches direct-engine baseline for the equivalent VirtualPatient", () => {
    if (!baseline) return;
    const p = createEmptyVirtualPatient();
    p.tumorPathology.location = "Antrum";
    p.tumorPathology.multisite = "Single site";
    p.laboratory.nlr = 3.7;
    p.laboratory.plr = 168;
    p.laboratory.nlrSource = "direct";
    p.laboratory.plrSource = "direct";

    const result = runDiagnosticPrediction(p);
    const expected = baseline.diagnostic[baseline.adapterFidelity.diagnostic.equivalentToDirectCaseIndex].output;

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(Math.abs(result.result.probability - expected.probability)).toBeLessThan(TOLERANCE);
    }
  });
});

describe("D. Survival adapter vs captured baseline", () => {
  it("adapter output matches direct-engine baseline for the equivalent VirtualPatient", () => {
    if (!baseline) return;
    const p = createEmptyVirtualPatient();
    p.demographics.age = 60;
    p.survivalInputs = { hypotheticalM1: 0 };
    p.tumorPathology.grade = 1;
    p.laboratory.nlr = 2.5;
    p.laboratory.plr = 180;

    const result = runSurvivalPrediction(p);
    const expected = baseline.survival[baseline.adapterFidelity.survival.equivalentToDirectCaseIndex].output;

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(Math.abs(result.result.hazardRatio - expected.hazardRatio)).toBeLessThan(TOLERANCE);
    }
  });
});

// ------------------------------------------------------------
// E — ID-07 locked mapping. Tests THIS codebase's implementation
// against the WRITTEN locked table, not against a captured baseline.
// ------------------------------------------------------------
describe("E. ID-07 — locked pathology mapping (no baseline required)", () => {
  it("Grade 1 -> gradeHigh 0", () => expect(deriveGradeHigh(1)).toBe(0));
  it("Grade 2 -> gradeHigh 0", () => expect(deriveGradeHigh(2)).toBe(0));
  it("Grade 3 -> gradeHigh 1", () => expect(deriveGradeHigh(3)).toBe(1));
  it("rejects an inconsistent Grade/Tumor_Grade combination", () => {
    expect(validatePathologyConsistency(3, "Moderate differentiation", "unknown").valid).toBe(false);
  });
});

// ------------------------------------------------------------
// F — direct NLR/PLR must be preserved, never silently replaced.
// ------------------------------------------------------------
describe("F. Direct NLR/PLR preservation (no baseline required)", () => {
  it("an explicit direct NLR is never overwritten by a derivable value", () => {
    const p = createEmptyVirtualPatient();
    p.laboratory.nlr = 4.4;
    p.laboratory.neutrophils = 1; // would derive to 1.0 if (wrongly) used instead
    p.laboratory.lymphocytes = 1;
    const r = resolveNlr(p.laboratory);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.ratio.value).toBe(4.4);
      expect(r.ratio.source).toBe("direct");
    }
  });

  it("an explicit direct PLR is never overwritten by a derivable value", () => {
    const p = createEmptyVirtualPatient();
    p.laboratory.plr = 210;
    p.laboratory.plt = 50;
    p.laboratory.lymphocytes = 1;
    const r = resolvePlr(p.laboratory);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.ratio.value).toBe(210);
      expect(r.ratio.source).toBe("direct");
    }
  });
});

// ------------------------------------------------------------
// G — fallback derivation, only when direct values are absent.
// ------------------------------------------------------------
describe("G. Fallback NLR/PLR derivation (no baseline required)", () => {
  it("derives NLR = Neutrophils / Lymphocytes when direct NLR is absent", () => {
    const p = createEmptyVirtualPatient();
    p.laboratory.neutrophils = 6;
    p.laboratory.lymphocytes = 2;
    const r = resolveNlr(p.laboratory);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.ratio.value).toBe(3);
      expect(r.ratio.source).toBe("derived");
    }
  });

  it("derives PLR = PLT / Lymphocytes when direct PLR is absent", () => {
    const p = createEmptyVirtualPatient();
    p.laboratory.plt = 300;
    p.laboratory.lymphocytes = 2;
    const r = resolvePlr(p.laboratory);
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.ratio.value).toBe(150);
      expect(r.ratio.source).toBe("derived");
    }
  });
});

// ------------------------------------------------------------
// H — missing required inputs must block, never default.
// ------------------------------------------------------------
describe("H. Missing required inputs block prediction (no baseline required)", () => {
  it("a fully-unknown patient blocks both predictions", () => {
    const p = createEmptyVirtualPatient();
    expect(runDiagnosticPrediction(p).status).toBe("blocked");
    expect(runSurvivalPrediction(p).status).toBe("blocked");
  });

  it("diagnostic blocks when only NLR is missing", () => {
    const p = createEmptyVirtualPatient();
    p.tumorPathology.multisite = "Single site";
    p.laboratory.plr = 168;
    expect(runDiagnosticPrediction(p).status).toBe("blocked");
  });

  it("survival blocks when M1 (neither observed nor hypothetical) is set", () => {
    const p = createEmptyVirtualPatient();
    p.demographics.age = 60;
    p.tumorPathology.grade = 1;
    p.laboratory.nlr = 2.5;
    p.laboratory.plr = 180;
    // survivalInputs.hypotheticalM1 intentionally left unset
    expect(runSurvivalPrediction(p).status).toBe("blocked");
  });
});

// ------------------------------------------------------------
// Portrait support logic — pure display transform, no clinical
// threshold, no baseline required.
// ------------------------------------------------------------
describe("Portrait — tumor diameter display transform (no baseline required)", () => {
  it("parses 2D and 3D measurement text and preserves the original string", () => {
    expect(parseTumorDiameter("2.5 x 5").parseOk).toBe(true);
    expect(parseTumorDiameter("10 x 7 x 2").dimensions.length).toBe(3);
    expect(parseTumorDiameter("not measured").raw).toBe("not measured");
  });
  it("radius mapping is continuous (no Small/Medium/Large step)", () => {
    const a = diameterToPortraitRadius(5);
    const b = diameterToPortraitRadius(5.01);
    expect(Math.abs(a - b)).toBeGreaterThan(0);
    expect(Math.abs(a - b)).toBeLessThan(0.1);
  });
});
