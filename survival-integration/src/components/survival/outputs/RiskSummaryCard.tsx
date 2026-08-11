import { SURVIVAL_MODEL_CONFIG } from "../../../config/survivalModel";
import type { RiskBand } from "../../../types/survival";

interface Props {
  risk12: number;
  risk24: number;
  hazardRatio: number;
  riskBand: RiskBand;
  isValid: boolean;
}

// Same palette convention as the diagnostic tab: slate/amber/red,
// never green — low risk should not read as "clinically safe".
const TONE: Record<RiskBand, { text: string; bg: string; border: string; label: string }> = {
  lower: { text: "text-slate-700", bg: "bg-slate-50", border: "border-slate-300", label: "Lower predicted risk" },
  intermediate: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", label: "Intermediate predicted risk" },
  higher: { text: "text-red-700", bg: "bg-red-50", border: "border-red-300", label: "Higher predicted risk" },
};

export function RiskSummaryCard({ risk12, risk24, hazardRatio, riskBand, isValid }: Props) {
  if (!isValid) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Predicted Mortality Risk
        </p>
        <p className="text-[18px] text-slate-300 font-light">Enter valid parameters</p>
      </div>
    );
  }

  const tone = TONE[riskBand];

  return (
    <div className={`rounded-2xl border px-5 py-4 ${tone.bg} ${tone.border}`}>
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Predicted Mortality Risk
        </p>
        <span className={`rounded-full border bg-white px-2 py-0.5 text-[11px] font-semibold ${tone.text} ${tone.border}`}>
          {tone.label}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-8">
        <div>
          <div className={`text-[36px] font-bold leading-none tabular-nums ${tone.text}`}>
            {(risk12 * 100).toFixed(0)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">at 12 months</div>
        </div>
        <div>
          <div className={`text-[36px] font-bold leading-none tabular-nums ${tone.text}`}>
            {(risk24 * 100).toFixed(0)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">at 24 months</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[16px] font-semibold text-slate-700 tabular-nums">{hazardRatio.toFixed(2)}×</div>
          <div className="text-[11px] text-slate-400">hazard vs. average patient</div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-100">
        {SURVIVAL_MODEL_CONFIG.riskBands.exploratoryLabel}.
      </p>
    </div>
  );
}
