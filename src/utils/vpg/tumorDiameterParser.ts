// ============================================================
// tumorDiameterParser.ts — R-03 refinement
//
// Tumor_diameter_cm is structured free text ("18 x 13", "2.5 x 5",
// "10 x 7 x 2") per Sheet 7 Data Dictionary — it must be preserved
// as entered, never forced into one scalar (Contract data-schema
// note; R-03 explicit instruction).
//
// This module extracts the numeric dimensions ONLY to drive a
// continuous, unlabelled visual scale factor for the portrait
// (radius/opacity), and otherwise always preserves and displays the
// original text. It does NOT bucket into Small/Median/Big and does
// NOT define or imply any clinical size threshold — the scale factor
// is a simple normalized function of geometric mean diameter, purely
// for legibility on an SVG canvas.
// ============================================================

export interface ParsedTumorDiameter {
  raw: string;
  dimensions: number[]; // parsed numbers, in original order, cm
  /** Geometric mean of parsed dimensions — used ONLY as a continuous
   *  visual-scale input, never shown to the user as a clinical value. */
  geometricMeanCm: number | null;
  parseOk: boolean;
}

const DIMENSION_SEPARATOR = /[x×]/i;

export function parseTumorDiameter(raw: string | "unknown"): ParsedTumorDiameter {
  if (raw === "unknown" || raw.trim() === "") {
    return { raw: "", dimensions: [], geometricMeanCm: null, parseOk: false };
  }

  const parts = raw
    .split(DIMENSION_SEPARATOR)
    .map((p) => parseFloat(p.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  if (parts.length === 0) {
    // Unparseable — preserve original text, neutral visual state.
    return { raw, dimensions: [], geometricMeanCm: null, parseOk: false };
  }

  const product = parts.reduce((acc, n) => acc * n, 1);
  const geometricMean = Math.pow(product, 1 / parts.length);

  return { raw, dimensions: parts, geometricMeanCm: geometricMean, parseOk: true };
}

/** Maps a geometric-mean diameter to a bounded SVG radius (10-32px).
 *  Purely a display-legibility clamp — NOT a clinical size category.
 *  The mapping is continuous (no step thresholds), so it cannot be
 *  read as implying a Small/Medium/Large clinical boundary. */
export function diameterToPortraitRadius(geometricMeanCm: number | null): number {
  if (geometricMeanCm === null) return 14; // neutral default when unparseable/unknown
  const MIN_R = 10, MAX_R = 32, SATURATION_CM = 15; // purely a display-canvas clamp, not a clinical cutoff
  const t = Math.min(1, geometricMeanCm / SATURATION_CM);
  return MIN_R + t * (MAX_R - MIN_R);
}
