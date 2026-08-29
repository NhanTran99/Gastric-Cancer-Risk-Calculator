// ============================================================
// cohortLoader.local.ts — R-05 refinement (replaces the earlier stub)
//
// PRIVATE/LOCAL MODE ONLY. Must never be reachable from a component
// that also renders in a plain "Public" session — gated at the call
// site in LoadExistingPatient.tsx by `import.meta.env.DEV`, so a
// production `vite build` (which sets DEV=false, PROD=true) dead-code
// -eliminates the entire Local-mode UI branch and this module is
// never included in the deployed bundle at all.
//
// Why fetch(), not a static import:
//   Vite statically analyzes `import x from "./y.json"` and
//   `import.meta.glob("./cohort/*.json")` at BUILD time and would
//   bundle whatever matches into the production output. A
//   runtime-constructed `fetch(url)` call is NOT statically analyzed
//   — no cohort file is ever pulled into the JS/asset bundle. The
//   `.gitignore` entry (public/local-data/) additionally guarantees
//   the files never even reach the build machine's working tree for
//   a deploy pulled from git (Netlify/Vercel build from the repo,
//   and public/local-data/ is not in the repo).
//
// On-disk location: Vite serves everything under `public/` at the
// site root, so files must live at `public/local-data/cohort/*.json`
// for `fetch("/local-data/cohort/<id>.json")` to resolve in `npm run
// dev`. This directory is never created by this change set — see
// SYNTHETIC_FIXTURE_EXAMPLE.md (new, in this package) for a synthetic
// (non-real) example the researcher can hand-copy locally to
// `public/local-data/cohort/EXAMPLE.json` to test this loader.
// ============================================================

import type { VirtualPatient } from "../../types/virtualPatient";

export class CohortLoadError extends Error {}

/** Minimal structural check — enough to fail loudly on a malformed
 *  local file rather than silently constructing a broken patient.
 *  Does not attempt full schema validation (that happens downstream
 *  via checkDiagnosticReadiness/checkSurvivalReadiness once the
 *  object is loaded, exactly as for a Public-built patient). */
function isStructurallyValid(obj: unknown): obj is VirtualPatient {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    "identity" in o && "demographics" in o && "laboratory" in o &&
    "tumorPathology" in o && "treatment" in o && "predictedFutureState" in o
  );
}

export async function loadExistingPatientLocal(deidentifiedId: string): Promise<VirtualPatient> {
  if (!import.meta.env.DEV) {
    // Defense in depth: even if this were somehow reached in a
    // production bundle, refuse to run rather than attempt a fetch
    // that could 404-leak a request pattern in production logs.
    throw new CohortLoadError("Local existing-patient mode is only available in local development.");
  }

  const safeId = deidentifiedId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (safeId !== deidentifiedId || safeId.length === 0) {
    throw new CohortLoadError("Invalid patient identifier.");
  }

  const res = await fetch(`/local-data/cohort/${safeId}.json`);
  if (!res.ok) {
    throw new CohortLoadError(`No local record found for "${safeId}" (HTTP ${res.status}).`);
  }

  const json = await res.json();
  if (!isStructurallyValid(json)) {
    throw new CohortLoadError(`Local record "${safeId}" does not match the VirtualPatient schema.`);
  }
  if (json.identity.provenance !== "cohort-local") {
    throw new CohortLoadError(
      `Local record "${safeId}" must set identity.provenance = "cohort-local" (found "${json.identity.provenance}").`
    );
  }
  return json;
}

/** Lists available local record IDs for a picker UI. Same DEV-only /
 *  runtime-fetch guarantees as loadExistingPatientLocal. Expects an
 *  `local-data/cohort/index.json` file containing a plain string
 *  array of de-identified IDs — maintained by hand locally, never
 *  committed (covered by the same .gitignore rule). */
export async function listLocalPatientIds(): Promise<string[]> {
  if (!import.meta.env.DEV) return [];
  try {
    const res = await fetch("/local-data/cohort/index.json");
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
