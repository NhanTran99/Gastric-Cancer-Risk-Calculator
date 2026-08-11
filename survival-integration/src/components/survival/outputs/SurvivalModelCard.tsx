import { CollapsiblePanel } from "../../shared/CollapsiblePanel";
import { SURVIVAL_MODEL_CONFIG } from "../../../config/survivalModel";

export function SurvivalModelCard() {
  const { metadata: m, formulaDisplay: fd, cutoffs, riskBands } = SURVIVAL_MODEL_CONFIG;

  return (
    <CollapsiblePanel label="Model Card & Limitations" defaultOpen={false}>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Bootstrap C-index
          </p>
          <p className="text-[18px] font-semibold text-slate-800 tabular-nums leading-none">
            {m.cIndexBootstrap.toFixed(3)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Cohort size
          </p>
          <p className="text-[18px] font-semibold text-slate-800 tabular-nums leading-none">
            n = {m.cohortN} ({m.cohortEvents} deaths)
          </p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Outcome</p>
        <p className="text-[12px] text-slate-600">{m.outcome}</p>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Predictors</p>
        <ul className="space-y-1">
          {fd.terms.map((t) => (
            <li key={t.label} className="flex items-start gap-1.5 text-[12px] text-slate-600">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
              <span>
                {t.label}
                {t.encoding && <span className="text-[10px] text-slate-400 ml-1">({t.encoding})</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Where do the two NLR cutoffs come from?
        </p>
        <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
          <p>
            <span className="font-medium text-red-700">Diagnostic cut-off ({cutoffs.nlrDiagnostic}):</span> the
            Youden-optimal threshold for predicting distant metastasis, from the published diagnostic nomogram
            (n = {m.diagnosticCohortN}).
          </p>
          <p>
            <span className="font-medium text-blue-700">Prognostic cut-off ({cutoffs.nlrPrognostic.toFixed(1)}):</span>{" "}
            a survival-optimal threshold (maximally selected rank statistic) derived independently from this
            overall-survival cohort (n = {m.cohortN}) — not from the diagnostic model.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          How are risk bands defined?
        </p>
        <p className="text-[11px] text-slate-600 leading-relaxed">{riskBands.exploratoryLabel}.</p>
      </div>

      <p className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
        {m.citation}. This survival cohort partly overlaps with, but is not identical to, the 114-patient cohort used
        by the diagnostic (metastasis) tab. C-index reflects bootstrap-corrected internal performance only —
        external validation has not been performed.
      </p>
    </CollapsiblePanel>
  );
}
