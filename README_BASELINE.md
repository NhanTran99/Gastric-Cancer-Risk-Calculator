# Frozen Regression Baseline — Capture & Verify Procedure

**Status: BASELINE REQUIRES HUMAN LOCAL EXECUTION.**
Claude has not run any code in this repository. `src/__tests__/baseline.frozen.json`
does not exist yet — you must generate it once, locally, before the
regression suite can pass.

## Why this exists

`regression.engines.test.ts` (sections A-D) must compare against the
**actual current output of your operational `calculator.ts` /
`survivalCalculator.ts`**, not a number anyone typed in by hand. This
procedure captures that output directly from your code and freezes it
as a committed baseline, so any future accidental change to the
engines (or to the adapters wrapping them) is caught automatically.

## One-time setup

```bash
npm install -D vitest tsx
```

Add to `package.json` `"scripts"`:
```json
"capture-baseline": "tsx scripts/capture-baseline.ts",
"test": "vitest run"
```

## Step 1 — Capture the baseline

```bash
npm run capture-baseline
```

This runs `scripts/capture-baseline.ts`, which imports and calls your
real `calculateRisk()` / `calculateSurvival()` / adapter functions
directly, and writes `src/__tests__/baseline.frozen.json`.

**Inspect the file before committing it.** It is human-readable JSON —
confirm the `diagnostic`/`survival` arrays contain plausible
probabilities/risks for the listed inputs. This is your one manual
sanity check that the capture ran against working code.

## Step 2 — Commit the baseline

```bash
git add src/__tests__/baseline.frozen.json
git commit -m "Capture frozen regression baseline for VPG adapters (ID-11/R-07-F2)"
```

This file is **not** cohort data (it contains only the four synthetic
diagnostic inputs and four synthetic survival inputs defined in
`scripts/capture-baseline.ts`, plus the engine's numeric output for
each) — it is safe to commit, unlike anything under `local-data/`.

## Step 3 — Run the regression suite

```bash
npm run test
```

Expected result: **NOT EXECUTED — awaiting local human execution** is
what Claude reports; once you run this yourself you will see actual
pass/fail output here. Sections E-H run regardless of whether the
baseline exists (they test this codebase's own logic against the
written locked specification, not against captured model output).

## When to re-capture

Only re-run `npm run capture-baseline` and re-commit the file when a
human has **deliberately and approvedly** changed the operational
model (e.g. a signed-off coefficient update — which is currently out
of scope for this project entirely). If a regression test fails
without such a change having been made, that failure is signal of an
unintended drift — investigate it, do not regenerate the baseline to
silence it.
