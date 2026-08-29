// ============================================================
// PredictedFutureState.tsx — R-10-F3 refinement
//
// Same contract as every prior pass: receives ONLY
// VirtualPatient.predictedFutureState (+ optional observedOutcomes),
// never imports calculateRisk/calculateSurvival, never recomputes
// anything.
//
// CHANGE THIS PASS: the legacy light presentational components
// (RiskGauge, RiskDisplay, ContributionBars, RiskSummaryCard,
// SurvivalCurveChart, ShapWaterfall — all shared with the Diagnostic/
// Survival tabs) are replaced with new VPG-only dark components
// (VpgDiagnosticCard, VpgSurvivalCard) per R-10-F3's explicit
// requirement to remove large white result-card surfaces in Step 3.
// The legacy components themselves are NOT modified and remain used,
// unchanged, by the Diagnostic/Survival tabs — this file simply stops
// importing them. Same RiskResult/SurvivalResult data, same values,
// zero new calculation — presentation only.
//
// MissingDataState (R-09-F3) is unchanged.
// ============================================================

import { VpgDiagnosticCard } from "./VpgDiagnosticCard";
import { VpgSurvivalCard } from "./VpgSurvivalCard";
import { MissingDataState } from "../shared/MissingDataState";
import type { PredictedFutureState as PFS, ObservedOutcomesModule } from "../../../types/virtualPatient";

interface Props {
  predictedFutureState: PFS;
  observedOutcomes?: ObservedOutcomesModule;
}

function ComparisonNote({ observed, predictedLabel }: { observed: string; predictedLabel: string }) {
  return (
    <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mt-3">
      Observed Outcome: <strong>{observed}</strong> — compare against Model Prediction ({predictedLabel}) above. Local/Private mode only; not used to alter the prediction.
    </p>
  );
}

export function PredictedFutureState({ predictedFutureState, observedOutcomes }: Props) {
  const { metastasisPrediction: dx, survivalPrediction: sx } = predictedFutureState;

  return (
    <div className="space-y-6">
      <div>
        {dx.status === "not-run" && (
          <p className="text-[13px] text-slate-500">Run predictions to see this section.</p>
        )}
        {dx.status === "blocked" && <MissingDataState missing={dx.missing} />}
        {dx.status === "ok" && <VpgDiagnosticCard result={dx.result} />}
        {dx.status === "ok" && observedOutcomes && observedOutcomes.metastasisTNM !== "unknown" && (
          <ComparisonNote
            observed={observedOutcomes.metastasisTNM === 1 ? "Metastasis present" : "Metastasis absent"}
            predictedLabel={`${dx.result.probabilityPercent} (${dx.result.category})`}
          />
        )}
      </div>

      <div>
        {sx.status === "not-run" && (
          <p className="text-[13px] text-slate-500">Run predictions to see this section.</p>
        )}
        {sx.status === "blocked" && <MissingDataState missing={sx.missing} />}
        {sx.status === "ok" && (
          <VpgSurvivalCard
            risk12={sx.result.risk12}
            risk24={sx.result.risk24}
            hazardRatio={sx.result.hazardRatio}
            riskBand={sx.result.riskBand}
            curve={sx.result.survivalCurve}
            shapContributions={sx.result.shapContributions}
            isValid={sx.result.isValid}
          />
        )}
        {sx.status === "ok" && observedOutcomes && observedOutcomes.vitalStatus !== "unknown" && (
          <ComparisonNote
            observed={observedOutcomes.vitalStatus === 1 ? "Alive at last follow-up" : "Deceased"}
            predictedLabel={`24mo risk ${(sx.result.risk24 * 100).toFixed(1)}% (${sx.result.riskBand})`}
          />
        )}
      </div>
    </div>
  );
}
