import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import type { SurvivalCurvePoint, RiskBand } from "../../../types/survival";

interface Props {
  curve: SurvivalCurvePoint[];
  riskBand: RiskBand;
  isValid: boolean;
}

const LINE_COLOR: Record<RiskBand, string> = {
  lower: "#475569",
  intermediate: "#b45309",
  higher: "#b91c1c",
};

export function SurvivalCurveChart({ curve, riskBand, isValid }: Props) {
  const color = isValid ? LINE_COLOR[riskBand] : "#CBD5E1";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
        Predicted Survival Curve
      </p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curve} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              ticks={[0, 12, 24, 36, 48, 60]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              label={{ value: "Months", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94a3b8" }}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} labelFormatter={(l) => `Month ${l}`} />
            <ReferenceLine x={12} stroke="#cbd5e1" strokeDasharray="2 2" />
            <ReferenceLine x={24} stroke="#cbd5e1" strokeDasharray="2 2" />
            <Line type="monotone" dataKey="survival" stroke={color} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
