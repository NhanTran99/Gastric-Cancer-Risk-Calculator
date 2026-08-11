import { SURVIVAL_MODEL_CONFIG } from "../../../config/survivalModel";

interface Props {
  nlrValue: number;
}

const { cutoffs } = SURVIVAL_MODEL_CONFIG;

function positionPct(v: number): string {
  const { nlrAxisMin: min, nlrAxisMax: max } = cutoffs;
  return `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;
}

export function CutoffAxis({ nlrValue }: Props) {
  const dx = cutoffs.nlrDiagnostic;
  const px = cutoffs.nlrPrognostic;

  const zone =
    nlrValue < dx
      ? "below both thresholds"
      : nlrValue < px
      ? "above the diagnostic but below the prognostic threshold"
      : "above both thresholds";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        NLR: Diagnostic vs. Prognostic Thresholds
      </p>
      <p className="mt-1.5 text-[12px] text-slate-500 leading-relaxed">
        The cutoff that best identifies metastasis is not the cutoff that best predicts survival. This patient's NLR
        is shown against both.
      </p>

      <div className="mt-9">
        <div className="relative h-2 rounded-full bg-gradient-to-r from-slate-100 via-amber-100 to-red-200">
          <Marker at={positionPct(dx)} color="#b91c1c" label={`Diagnostic cut-off: ${dx}`} up />
          <Marker at={positionPct(px)} color="#1d4ed8" label={`Prognostic cut-off: ${px.toFixed(1)}`} />
          <div
            className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-slate-800 shadow"
            style={{ left: positionPct(nlrValue) }}
            title={`NLR ${nlrValue}`}
          />
        </div>
        <p className="mt-7 text-[11px] text-slate-500">
          This patient's NLR (<span className="font-medium text-slate-700">{nlrValue}</span>) is {zone}.
        </p>
      </div>
    </div>
  );
}

function Marker({ at, color, label, up }: { at: string; color: string; label: string; up?: boolean }) {
  return (
    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: at }}>
      <div className="h-4 w-px -translate-x-1/2" style={{ background: color }} />
      <div
        className={`absolute ${up ? "-top-6" : "top-3"} -translate-x-1/2 whitespace-nowrap text-[10px] font-medium`}
        style={{ color }}
      >
        {label}
      </div>
    </div>
  );
}
