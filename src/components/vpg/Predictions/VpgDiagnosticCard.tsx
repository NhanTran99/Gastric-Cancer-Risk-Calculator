// ============================================================
// VpgDiagnosticCard.tsx — R-10-F3
//
// Dark, VPG-only presentational card for the diagnostic prediction.
// Reads ONLY the already-computed RiskResult object (probability,
// probabilityPercent, category, contributions, isValid) — the exact
// same object the legacy RiskGauge/RiskDisplay/ContributionBars
// components (src/components/outputs/*) already render. This file
// computes ZERO prediction math; it only draws the same numbers with
// a dark visual language.
//
// Why a new component instead of restyling the legacy ones: those
// components are shared with the Diagnostic tab (untouched, outside
// VPG scope) — editing them would change that tab's appearance too,
// which is explicitly out of bounds ("do not refactor unrelated
// code"). This file is VPG-only and is never imported by App.tsx's
// diagnosis/prognosis branches.
// ============================================================

import type { RiskResult, RiskCategory } from "../../../types/nomogram";
import { Accordion } from "../shared/Accordion";

interface Props {
  result: RiskResult;
}

const CATEGORY_COLOR: Record<RiskCategory, string> = {
  low: "#38BDF8",
  intermediate: "#F59E0B",
  high: "#F43F5E",
};
const CATEGORY_LABEL: Record<RiskCategory, string> = {
  low: "Low Risk",
  intermediate: "Intermediate Risk",
  high: "High Risk",
};

const BAR_COLORS = ["#0EA5E9", "#8B5CF6", "#475569"];

export function VpgDiagnosticCard({ result }: Props) {
  const color = CATEGORY_COLOR[result.category];
  const R = 70, SW = 10;
  const circumference = 2 * Math.PI * R;
  const filled = circumference * Math.min(1, Math.max(0, result.probability));

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0D1526] px-5 py-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-sky-500" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Distant Metastasis Risk</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        <svg viewBox="0 0 180 180" className="w-40 h-40 shrink-0">
          <circle cx={90} cy={90} r={R} fill="none" stroke="#1E293B" strokeWidth={SW} />
          <circle
            cx={90} cy={90} r={R} fill="none" stroke={color} strokeWidth={SW}
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
          />
          <text x={90} y={86} textAnchor="middle" fontSize={26} fontWeight={700} fill="#F1F5F9">
            {result.isValid ? result.probabilityPercent : "—"}
          </text>
          <text x={90} y={108} textAnchor="middle" fontSize={11} fill={color} fontWeight={600}>
            {CATEGORY_LABEL[result.category]}
          </text>
        </svg>

        <div className="flex-1 rounded-xl border border-slate-800 bg-[#111827] px-4 py-3">
          <p className="text-[13px] text-slate-300">
            The model estimates a{" "}
            <span className="font-semibold" style={{ color }}>{result.probabilityPercent} probability</span>{" "}
            of distant metastasis.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Accordion title="Predictor Contributions">
          <div className="space-y-2.5">
            {result.contributions.map((c, i) => (
              <div key={c.label}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-slate-400">{c.label}</span>
                  <span className="text-slate-200 font-medium">{c.percentContribution.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.percentContribution}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Accordion>
      </div>
    </div>
  );
}
