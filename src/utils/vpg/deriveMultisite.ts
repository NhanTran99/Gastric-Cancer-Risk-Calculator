// ============================================================
// deriveMultisite.ts — ID-04 tumor-location multisite derivation
//
// The user selects a clinical Tumor_location (+ optional
// Tumor_location_description for multi-site cases). The VPG derives
// Tumor_location_multisite ("Single site" | "Overlapping") and, at
// the diagnostic-adapter boundary, the hidden binary:
//   single     -> 1
//   overlapping -> 0
// matching src/utils/calculator.ts::encodeInputs() EXACTLY (single=1,
// multiple=0) so the existing engine's math is reproduced unchanged.
//
// "Overlapping" as a Tumor_location value (per Sheet 7 controlled
// vocabulary) means the tumor spans more than one sub-region — same
// clinical concept as "multiple" in the legacy nomogram UI, just the
// audited-cohort vocabulary term. A locationDescription naming more
// than one distinct site is treated the same way.
// ============================================================

import type { TumorLocationRaw, TumorLocationMultisite } from "../../types/virtualPatient";

export function deriveMultisite(
  location: TumorLocationRaw | "unknown",
  locationDescription: string | "unknown"
): TumorLocationMultisite | "unknown" {
  if (location === "unknown") return "unknown";
  if (location === "Overlapping") return "Overlapping";

  // Single named region (Antrum/Pylorus/Cardia/Body/Entire/Fundus).
  // "Entire" (whole stomach) is clinically a single contiguous
  // involvement, not multisite — kept as "Single site" per the
  // controlled vocabulary; this is a judgment call worth confirming
  // with the Strategist if it diverges from the original 114-patient
  // cohort's coding convention (see §Gaps in the accompanying report).
  if (locationDescription !== "unknown" && locationDescription.includes(",")) {
    // A comma-separated multi-site free-text description overrides a
    // single coded location, e.g. "Antrum, Body".
    return "Overlapping";
  }
  return "Single site";
}

/** The hidden binary the diagnostic engine actually consumes.
 *  single site -> 1, overlapping -> 0 (matches calculator.ts exactly). */
export function multisiteToBinary(m: TumorLocationMultisite): 0 | 1 {
  return m === "Single site" ? 1 : 0;
}
