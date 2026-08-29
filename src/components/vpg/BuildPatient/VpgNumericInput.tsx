// ============================================================
// VpgNumericInput.tsx — R-02 refinement
//
// The existing legacy NumericInput (src/components/inputs/NumericInput.tsx)
// requires `value: number` and always renders a starting number — fine
// for the Diagnostic/Survival calculators (instant recompute, no
// "unset" concept) but wrong for the VPG builder, where an empty
// field must stay genuinely empty until the clinician types a value.
// This is a NEW component; the legacy NumericInput is untouched and
// still used unmodified by the Diagnostic/Survival tabs.
//
// Contract: onChange fires ONLY on a valid parse. An empty or
// non-numeric field reports "unknown" upward — never a stale/default
// number — so validation.ts's readiness checks see a true absence.
// ============================================================

import { useState } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  label: string;
  value: number | "unknown";
  onChange: (v: number | "unknown") => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

export function VpgNumericInput({ label, value, onChange, min, max, step = 0.1, unit = "", placeholder }: Props) {
  const [raw, setRaw] = useState(value === "unknown" ? "" : String(value));
  const [touched, setTouched] = useState(false);

  const parsed = raw.trim() === "" ? null : parseFloat(raw);
  const outOfRange = touched && parsed !== null && !isNaN(parsed) && (parsed < min || parsed > max);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const str = e.target.value;
    setRaw(str);
    if (str.trim() === "") {
      onChange("unknown");
      return;
    }
    const n = parseFloat(str);
    onChange(isNaN(n) ? "unknown" : n);
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium text-slate-600">{label}</label>
      <div
        className={[
          "flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2.5 transition-all duration-150",
          outOfRange
            ? "border-red-400 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]"
            : "border-slate-200 focus-within:border-blue-400 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.25)]",
        ].join(" ")}
      >
        <input
          type="number"
          inputMode="decimal"
          value={raw}
          placeholder={placeholder ?? "Not entered"}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          onFocus={(e) => e.target.select()}
          step={step}
          aria-label={label}
          className="flex-1 bg-transparent text-[14px] font-medium text-slate-900 outline-none w-0 min-w-0 tabular-nums placeholder:text-slate-300 placeholder:font-normal"
        />
        {unit && <span className="text-[11px] text-slate-400 shrink-0">{unit}</span>}
      </div>
      {outOfRange ? (
        <p className="flex items-center gap-1 text-[11px] text-red-500">
          <AlertCircle className="w-3 h-3" />
          Must be {min}–{max} if entered
        </p>
      ) : (
        <p className="text-[11px] text-slate-400">Leave blank if unknown — valid range {min}–{max}</p>
      )}
    </div>
  );
}
