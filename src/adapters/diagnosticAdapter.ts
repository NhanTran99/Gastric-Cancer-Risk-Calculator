// ============================================================
// diagnosticAdapter.ts — VirtualPatient -> existing diagnostic engine
//
// This file contains ZERO prediction mathematics. It only maps
// VirtualPatient fields onto NomogramInputs and calls the existing,
// unmodified calculateRisk() from ../utils/calculator.ts. That file
// is not edited anywhere in this change set.
//
// Model fidelity statement (see also the accompanying report §E):
//  - Engine reused:      src/utils/calculator.ts::calculateRisk()
//  - Coefficients:       unchanged (src/config/model.ts, untouched)
//  - Preprocessing:      unchanged (encodeInputs binary encoding,
//                         raw NLR/PLR, no adapter-side rounding)
//  - Endpoint:            unchanged (distant metastasis probability)
// ============================================================

import { calculateRisk } from "../utils/calculator";
import type { NomogramInputs } from "../types/nomogram";
import type { VirtualPatient, PredictionStatus } from "../types/virtualPatient";
import { checkDiagnosticReadiness } from "../utils/vpg/validation";
import { resolveNlr, resolvePlr } from "../utils/vpg/nlrPlrResolver";
import { multisiteToBinary } from "../utils/vpg/deriveMultisite";

/** Note: calculateRisk()/encodeInputs() take a "single"|"multiple"
 *  TumorLocation string, not the raw 0/1 — encodeInputs() does that
 *  binary mapping internally. We therefore only need to translate our
 *  "Single site"|"Overlapping" vocabulary back into that exact string,
 *  NOT call multisiteToBinary ourselves (that helper exists for
 *  documentation/portrait use, and to prove the two encodings agree).
 */
function toLegacyTumorLocation(multisite: "Single site" | "Overlapping"): "single" | "multiple" {
  const binary = multisiteToBinary(multisite); // 1 = single, 0 = multiple — sanity cross-check
  const mapped = multisite === "Single site" ? "single" : "multiple";
  if ((mapped === "single") !== (binary === 1)) {
    // Defensive: this can only fire if deriveMultisite/multisiteToBinary
    // are edited out of sync with this adapter. Fail loud, never guess.
    throw new Error("Internal encoding mismatch between multisite derivation and legacy encoder.");
  }
  return mapped;
}

export function runDiagnosticPrediction(patient: VirtualPatient): PredictionStatus {
  const readiness = checkDiagnosticReadiness(patient);
  if (!readiness.ready) {
    return { status: "blocked", reason: readiness.reason ?? "Prediction unavailable — required input missing.", missing: readiness.missing };
  }

  const nlr = resolveNlr(patient.laboratory);
  const plr = resolvePlr(patient.laboratory);
  // readiness.ready === true guarantees both resolved to "ok" above.
  if (nlr.status !== "ok" || plr.status !== "ok" || patient.tumorPathology.multisite === "unknown") {
    // Unreachable given checkDiagnosticReadiness, but keeps this
    // function type-safe without a non-null assertion.
    return { status: "blocked", reason: "Prediction unavailable — required input missing.", missing: readiness.missing };
  }

  const inputs: NomogramInputs = {
    tumorLocation: toLegacyTumorLocation(patient.tumorPathology.multisite),
    nlr: nlr.ratio.value,
    plr: plr.ratio.value,
  };

  const result = calculateRisk(inputs);
  return { status: "ok", result };
}
