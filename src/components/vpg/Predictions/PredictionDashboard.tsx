// ============================================================
// PredictionDashboard.tsx — R-09-F6, extended by R-09-F8
//
// Step 3 layout: LEFT column keeps the Step-2 patient state visible
// and persistent while the user reviews predictions; RIGHT column
// holds PredictedFutureState (unchanged component, unchanged props).
// Nothing here computes a prediction — this is a layout wrapper only.
//
// R-09-F8: the left column is now a complete "Patient Overview" card
// (Demographics, Laboratory, Tumor/Pathology, Treatment, and the
// Local/Private Observed Outcome when present) instead of a 4-line
// summary. Every field read here already exists on VirtualPatient —
// no new clinical variable, field, or derivation was added; this is
// strictly a presentation expansion using data already available to
// ReviewPatient.tsx.
//
// Observed vs Predicted stays structurally separate: the left column
// renders only observed-state fields (no predictedFutureState prop
// exists on PatientPortrait or this overview) and the right column
// renders PredictedFutureState (predicted-state only) — unchanged
// since R-05/R-07.
// ============================================================

import { PatientPortrait } from "../Portrait/PatientPortrait";
import { PredictedFutureState } from "./PredictedFutureState";
import { Accordion } from "../shared/Accordion";
import { formatGradeLabel, displayNlr, displayPlr } from "../../../utils/vpg/displayFormatters";
import type { VirtualPatient } from "../../../types/virtualPatient";

interface Props {
  patient: VirtualPatient;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[12px] py-1 border-b border-slate-800 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 text-right">{value}</span>
    </div>
  );
}

function OverviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0D1526] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">{title}</p>
      {children}
    </div>
  );
}

const fmt = (v: unknown) => (v === "unknown" || v === undefined ? "—" : String(v));

export function PredictionDashboard({ patient }: Props) {
  const { demographics: d, laboratory: lab, tumorPathology: tp, treatment: tx } = patient;
  const gradeLabel = formatGradeLabel(tp);
  const nlrDisplay = displayNlr(lab);
  const plrDisplay = displayPlr(lab);

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0A0F1A] to-[#0D1526] border border-slate-800 p-6">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
        Patient / Prediction Dashboard
      </p>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* R-09-F8: complete persistent "Patient Overview" card — every
            field below is read directly from the existing VirtualPatient
            object (same source as ReviewPatient/Portrait); no new
            clinical variable or derivation is introduced here. */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl border border-slate-800 bg-[#0D1526] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Patient Overview</p>
            <PatientPortrait patient={patient} compact showInlinePanel={false} />
          </div>

          <OverviewSection title="Demographics">
            <SummaryLine label="Age" value={fmt(d.age)} />
            <SummaryLine label="Sex" value={fmt(d.sex)} />
            <SummaryLine label="BMI" value={fmt(d.bmi)} />
          </OverviewSection>

          <OverviewSection title="Laboratory">
            <SummaryLine label="NLR" value={`${nlrDisplay.text}${nlrDisplay.isDerived ? " (derived)" : ""}`} />
            <SummaryLine label="PLR" value={`${plrDisplay.text}${plrDisplay.isDerived ? " (derived)" : ""}`} />
          </OverviewSection>

          <OverviewSection title="Tumor / Pathology">
            <SummaryLine label="Location" value={fmt(tp.location)} />
            <SummaryLine label="Multisite (derived)" value={fmt(tp.multisite)} />
            <SummaryLine label="Diameter" value={tp.tumorDiameter === "unknown" ? "—" : String(tp.tumorDiameter)} />
            <SummaryLine label="Grade" value={gradeLabel ? gradeLabel.headline : "—"} />
          </OverviewSection>

          <OverviewSection title="Treatment">
            <SummaryLine label="Surgery" value={tx.surgery === "unknown" ? "—" : tx.surgery === 1 ? "Yes" : "No"} />
            <SummaryLine label="Chemotherapy" value={tx.chemotherapy === "unknown" ? "—" : tx.chemotherapy === 1 ? "Yes" : "No"} />
            {tx.chemotherapy === 1 && (
              <>
                <SummaryLine label="Chemo type" value={fmt(tx.chemoType)} />
                <SummaryLine label="Regimen" value={fmt(tx.regimen)} />
              </>
            )}
          </OverviewSection>

          {patient.observedOutcomes && (
            <OverviewSection title="Observed Outcome (Local/Private)">
              <SummaryLine label="Vital status" value={patient.observedOutcomes.vitalStatus === 1 ? "Alive" : patient.observedOutcomes.vitalStatus === 0 ? "Dead" : "—"} />
              <SummaryLine label="Metastasis_TNM" value={fmt(patient.observedOutcomes.metastasisTNM)} />
            </OverviewSection>
          )}
        </div>

        {/* Right column — predictions */}
        <div className="space-y-6">
          <PredictedFutureState
            predictedFutureState={patient.predictedFutureState}
            observedOutcomes={patient.observedOutcomes}
          />

          <Accordion title="Model Transparency & Provenance">
            <p className="mb-2">
              Diagnostic and survival predictions are produced by the existing, unmodified TypeScript engines
              (calculator.ts, survivalCalculator.ts) — no coefficients, endpoints, or preprocessing were altered
              for this dashboard.
            </p>
            <p>
              Original model-fitting/training source is not present in this repository; the operational
              implementation is used as-is per the approved provenance-limitation policy.
            </p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
