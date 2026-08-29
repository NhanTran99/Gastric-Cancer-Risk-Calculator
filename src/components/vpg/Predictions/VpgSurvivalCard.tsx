// ============================================================
// VpgSurvivalCard.tsx — R-10-F3
//
// Dark, VPG-only presentational card for the survival prediction.
// Reads ONLY the already-computed SurvivalResult object (risk12,
// risk24, hazardRatio, riskBand, survivalCurve, shapContributions,
// isValid) — the same object the legacy RiskSummaryCard/
// SurvivalCurveChart/ShapWaterfall components already render. Zero
// new prediction math. Uses recharts (already an existing project
// dependency, same library the legacy SurvivalCurveChart already
// uses) purely for the line chart's dark rendering.
//
// Not touching the legacy survival components — they remain used,
// unmodified, by the Survival tab.
// ============================================================

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SurvivalCurvePoint, RiskBand, ShapContribution } from "../../../types/survival";
import { Accordion } from "../shared/Accordion";

interface Props {
  risk12: number;
  risk24: number;
  hazardRatio: number;
  riskBand: RiskBand;
  curve: SurvivalCurvePoint[];
  shapContributions: ShapContribution[];
  isValid: boolean;
}

const BAND_COLOR: Record<RiskBand, string> = {
  lower: "#38BDF8",
  intermediate: "#F59E0B",
  higher: "#F43F5E",
};
const BAND_LABEL: Record<RiskBand, string> = {
  lower: "Lower predicted risk",
  intermediate: "Intermediate predicted risk",
  higher: "Higher predicted risk",
};

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] px-3 py-2.5 text-center">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-[18px] font-semibold text-slate-100 mt-0.5">{value}</p>
    </div>
  );
}

export function VpgSurvivalCard({ risk12, risk24, hazardRatio, riskBand, curve, shapContributions, isValid }: Props) {
  const color = BAND_COLOR[riskBand];
  const chartData = curve.map((p) => ({ month: p.month, survival: Math.round(p.survival * 1000) / 10 }));

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0D1526] px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Survival Prognosis</p>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}1A` }}>
          {isValid ? BAND_LABEL[riskBand] : "—"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatTile label="12-month risk" value={isValid ? `${(risk12 * 100).toFixed(1)}%` : "—"} />
        <StatTile label="24-month risk" value={isValid ? `${(risk24 * 100).toFixed(1)}%` : "—"} />
        <StatTile label="Hazard ratio" value={isValid ? hazardRatio.toFixed(2) : "—"} />
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#111827] px-3 py-3 mb-4" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 10, fill: "#64748B" }} />
            <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: "#64748B" }} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#94A3B8" }}
              itemStyle={{ color: "#F1F5F9" }}
            />
            <Line type="monotone" dataKey="survival" name="Survival" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Accordion title="Explainability (SHAP)">
        <div className="space-y-2.5">
          {shapContributions.map((c) => {
            const maxAbs = Math.max(...shapContributions.map((x) => Math.abs(x.value)), 0.001);
            const pct = (Math.abs(c.value) / maxAbs) * 100;
            const positive = c.value >= 0;
            return (
              <div key={c.key}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-slate-400">{c.label}</span>
                  <span className={positive ? "text-rose-400" : "text-sky-400"}>{positive ? "+" : ""}{c.value.toFixed(3)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: positive ? "#F43F5E" : "#38BDF8" }} />
                </div>
              </div>
            );
          })}
        </div>
      </Accordion>
    </div>
  );
}
