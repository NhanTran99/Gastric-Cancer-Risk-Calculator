// ============================================================
// PatientPortrait.tsx — R-09-F5 refinement
//
// Behavior/visual base is UNCHANGED from R-07-F1 (5-domain pentagon,
// connector lines, on-patient tumor marker driven by location/size/
// grade). This pass adds:
//
//  - Controllable `expanded` state (optional `expanded` +
//    `onExpandedChange` props). Uncontrolled by default (keeps
//    working standalone exactly as before) — but Step 2's new
//    "Patient State Explorer" (ReviewPatient.tsx) now passes these
//    down so ITS side detail panel and the portrait's own domain
//    highlighting share one selection state, per R-09-F5 ("clicking
//    a domain... update the detail panel").
//  - `showInlinePanel` (default true): when the parent renders its
//    own detail panel (Step 2), this is set false so the panel isn't
//    duplicated.
//  - `compact` (default false): a smaller, chrome-light rendering
//    used for the persistent left column of Step 3's dashboard
//    (R-09-F6) — same data bindings, no heading text, tighter sizing.
//  - F4: the pathology detail line now uses the shared
//    formatGradeLabel() clean-label formatter instead of two
//    separately "(derived)"-tagged rows.
//
// Everything else — data source (VirtualPatient prop only, no
// duplicate state), the five domains, the diameter/location/grade
// bindings — is unchanged.
// ============================================================

import { useState } from "react";
import { MapPin, Ruler, Microscope, Droplet, Syringe } from "lucide-react";
import type { VirtualPatient } from "../../../types/virtualPatient";
import { parseTumorDiameter, diameterToPortraitRadius } from "../../../utils/vpg/tumorDiameterParser";
import { displayNlr, displayPlr, formatGradeLabel } from "../../../utils/vpg/displayFormatters";

export type DomainKey = "location" | "size" | "pathology" | "laboratory" | "treatment";

interface Props {
  patient: VirtualPatient;
  expanded?: DomainKey | null;
  onExpandedChange?: (k: DomainKey | null) => void;
  showInlinePanel?: boolean;
  compact?: boolean;
}

const LOCATION_ANGLE: Record<string, number> = {
  Fundus: -90, Cardia: -60, Body: 0, Antrum: 60, Pylorus: 90, Entire: 0, Overlapping: 30,
};

const DOMAIN_POS: Record<DomainKey, { x: number; y: number }> = {
  location: { x: 50, y: 8 },
  pathology: { x: 86, y: 38 },
  size: { x: 72, y: 88 },
  laboratory: { x: 28, y: 88 },
  treatment: { x: 14, y: 38 },
};

export const DOMAIN_META: Record<DomainKey, { label: string; icon: typeof MapPin }> = {
  location: { label: "Tumor Location", icon: MapPin },
  size: { label: "Tumor Size", icon: Ruler },
  pathology: { label: "Pathology", icon: Microscope },
  laboratory: { label: "Laboratory", icon: Droplet },
  treatment: { label: "Treatment", icon: Syringe },
};

function hasData(v: unknown): boolean {
  return v !== "unknown" && v !== undefined;
}

export function PatientPortrait({ patient, expanded: expandedProp, onExpandedChange, showInlinePanel = true, compact = false }: Props) {
  const { tumorPathology: tp, laboratory: lab, treatment: tx, demographics: d } = patient;
  const [expandedState, setExpandedState] = useState<DomainKey | null>(null);
  const expanded = expandedProp !== undefined ? expandedProp : expandedState;
  const setExpanded = (k: DomainKey | null) => {
    if (onExpandedChange) onExpandedChange(k);
    if (expandedProp === undefined) setExpandedState(k);
  };

  const angle = tp.location !== "unknown" ? LOCATION_ANGLE[tp.location] ?? 0 : null;
  const gradeColor = tp.gradeClass === "High risk" ? "#EF4444" : tp.gradeClass === "Low risk" ? "#38BDF8" : "#475569";
  const diameter = parseTumorDiameter(tp.tumorDiameter);
  const tumorRadius = diameterToPortraitRadius(diameter.geometricMeanCm);
  const nlrDisplay = displayNlr(lab);
  const plrDisplay = displayPlr(lab);
  const gradeLabel = formatGradeLabel(tp);

  const active = {
    location: hasData(tp.location),
    size: diameter.parseOk,
    pathology: hasData(tp.grade),
    laboratory: nlrDisplay.available || plrDisplay.available,
    treatment: tx.surgery === 1 || tx.chemotherapy === 1,
  };

  const CX = 200, CY = 200;
  const tumorHighlighted = expanded === "location" || expanded === "size" || expanded === "pathology";
  const tumorX = angle !== null ? CX + 46 * Math.cos((angle * Math.PI) / 180) : CX;
  const tumorY = angle !== null ? CY + 30 + 46 * Math.sin((angle * Math.PI) / 180) : CY + 30;

  return (
    <div className={compact ? "" : "rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0A0F1A] to-[#0D1526] px-6 py-6"}>
      {!compact && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Interactive Digital Patient Portrait
          </p>
          <p className="text-[10px] text-slate-500 mb-4">Observed Patient State — click a domain to explore</p>
        </>
      )}

      <div className={`relative w-full mx-auto aspect-square ${compact ? "max-w-[260px]" : "max-w-[440px]"}`}>
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
          {(Object.keys(DOMAIN_POS) as DomainKey[]).map((k) => {
            const p = DOMAIN_POS[k];
            const x = (p.x / 100) * 400, y = (p.y / 100) * 400;
            const isActive = expanded === k;
            return (
              <line
                key={k}
                x1={CX} y1={CY} x2={x} y2={y}
                stroke={isActive ? "#0EA5E9" : active[k] ? "#334155" : "#1E293B"}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? undefined : "3 4"}
              />
            );
          })}

          <circle cx={CX} cy={CY - 42} r={26} fill="#1E293B" stroke="#334155" strokeWidth={1.5} />
          <path
            d={`M ${CX - 48} ${CY + 70} Q ${CX - 48} ${CY - 6} ${CX} ${CY - 6} Q ${CX + 48} ${CY - 6} ${CX + 48} ${CY + 70} Z`}
            fill="#111827" stroke="#334155" strokeWidth={1.5}
          />

          {angle !== null && (
            <circle
              cx={tumorX} cy={tumorY} r={tumorRadius}
              fill={gradeColor} opacity={0.9}
              stroke={tumorHighlighted ? "#E2E8F0" : "none"} strokeWidth={2}
            />
          )}
        </svg>

        {(Object.keys(DOMAIN_POS) as DomainKey[]).map((k) => {
          const pos = DOMAIN_POS[k];
          const meta = DOMAIN_META[k];
          const Icon = meta.icon;
          const isActive = expanded === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setExpanded(expanded === k ? null : k)}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className={[
                "absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 rounded-full transition-all",
                compact ? "px-1.5 py-1.5" : "px-2.5 py-2.5",
                isActive ? "bg-sky-500/25 ring-2 ring-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.35)]" : active[k] ? "bg-slate-800/80 ring-1 ring-slate-600" : "bg-slate-900/60 ring-1 ring-slate-800",
              ].join(" ")}
            >
              <Icon className={`${compact ? "w-3 h-3" : "w-4 h-4"} ${isActive ? "text-sky-300" : active[k] ? "text-slate-200" : "text-slate-600"}`} />
              {!compact && <span className={`text-[9px] whitespace-nowrap ${isActive ? "text-sky-200" : "text-slate-400"}`}>{meta.label}</span>}
            </button>
          );
        })}

        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "58%" }}>
          <p className={`font-semibold text-slate-100 text-center ${compact ? "text-[10px]" : "text-[12px]"}`}>
            {d.age !== "unknown" ? `${d.age}y` : "Age —"}
          </p>
          {!compact && <p className="text-[10px] text-slate-500 text-center">{d.sex !== "unknown" ? d.sex : "Sex —"}</p>}
        </div>
      </div>

      {showInlinePanel && expanded && (
        <div className="mt-4 rounded-lg border border-slate-700 bg-[#111827] px-4 py-3 text-[12px] text-slate-300 space-y-1">
          <p className="text-slate-400 uppercase text-[10px] tracking-widest mb-1">{DOMAIN_META[expanded].label}</p>

          {expanded === "location" && (
            <>
              <p>Location: {tp.location === "unknown" ? "not entered" : tp.location}</p>
              <p>Multisite (derived): {tp.multisite === "unknown" ? "—" : tp.multisite}</p>
            </>
          )}
          {expanded === "size" && (
            <>
              <p>Diameter (as entered): {diameter.raw || "not entered"}</p>
              {diameter.raw && !diameter.parseOk && <p className="text-amber-400">Could not parse dimensions — shown as neutral scale.</p>}
              <p className="text-slate-500 text-[11px]">Visual scale reflects entered dimensions only — not a clinical size category or risk indicator.</p>
            </>
          )}
          {expanded === "pathology" && (
            gradeLabel ? (
              <>
                <p className="text-[13px] font-medium text-slate-100">{gradeLabel.headline}</p>
                {gradeLabel.sub && <p className="text-slate-400">{gradeLabel.sub}</p>}
              </>
            ) : (
              <p>Grade: not entered</p>
            )
          )}
          {expanded === "laboratory" && (
            <>
              <p>Neutrophils: {lab.neutrophils === "unknown" ? "not entered" : lab.neutrophils.toFixed(2)} ×10⁹/L</p>
              <p>Lymphocytes: {lab.lymphocytes === "unknown" ? "not entered" : lab.lymphocytes.toFixed(2)} ×10⁹/L</p>
              <p>Platelets: {lab.plt === "unknown" ? "not entered" : lab.plt.toFixed(2)} ×10⁹/L</p>
              <p className="text-slate-500 text-[11px]">NLR/PLR are derived from these values for prediction — shown in Step 3, not here.</p>
            </>
          )}
          {expanded === "treatment" && (
            <>
              <p>Surgery: {tx.surgery === "unknown" ? "not entered" : tx.surgery === 1 ? "Yes" : "No"}</p>
              <p>Chemotherapy: {tx.chemotherapy === "unknown" ? "not entered" : tx.chemotherapy === 1 ? "Yes" : "No"}</p>
              {tx.chemotherapy === 1 && (
                <>
                  <p>Chemo type: {tx.chemoType === "unknown" ? "not entered" : tx.chemoType}</p>
                  <p>Regimen: {tx.regimen === "unknown" ? "not entered" : tx.regimen}</p>
                </>
              )}
              <p className="text-slate-500 text-[11px]">Observational representation only — not a treatment recommendation.</p>
            </>
          )}
        </div>
      )}

      {!compact && (
        <p className="text-[10px] text-slate-600 text-center mt-3">
          Visual/data representation of entered clinical state only — not a biological simulation.
        </p>
      )}
    </div>
  );
}
