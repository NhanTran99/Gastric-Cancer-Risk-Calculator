import type { ShapContribution } from "../../../types/survival";

interface Props {
  contributions: ShapContribution[];
  isValid: boolean;
}

export function ShapWaterfall({ contributions, isValid }: Props) {
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.value)), 0.001);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Why This Prediction — SHAP Contributions
        </p>
        <span className="text-[10px] text-slate-400">log-hazard scale</span>
      </div>

      {isValid ? (
        <div className="mt-3 space-y-2">
          {contributions.map((c) => {
            const pct = (Math.abs(c.value) / maxAbs) * 50;
            const positive = c.value >= 0;
            return (
              <div key={c.key} className="flex items-center gap-2 text-xs">
                <div className="w-36 shrink-0 text-right text-slate-500">{c.label}</div>
                <div className="relative h-4 flex-1">
                  <div className="absolute left-1/2 top-0 h-full w-px bg-slate-300" />
                  <div
                    className="absolute top-0 h-full rounded"
                    style={{
                      [positive ? "left" : "right"]: "50%",
                      width: `${pct}%`,
                      background: positive ? "#b91c1c" : "#475569",
                    }}
                  />
                </div>
                <div className={`w-12 shrink-0 tabular-nums ${positive ? "text-red-700" : "text-slate-600"}`}>
                  {positive ? "+" : ""}
                  {c.value.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[13px] text-slate-300 italic mt-3">Enter valid parameters to see contributions.</p>
      )}

      <div className="mt-2 flex justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
        <span>← decreases risk</span>
        <span>increases risk →</span>
      </div>
      <p className="text-[10px] text-slate-400 leading-relaxed mt-2">
        Each bar is the exact contribution of that variable to this patient's log-hazard score, relative to the
        average patient. Bars do not directly translate to percentage points of predicted risk.
      </p>
    </div>
  );
}
