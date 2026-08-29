// ============================================================
// ReviewPatient.tsx — R-09-FINAL, refined by R-10-F2
//
// Structure unchanged: LEFT Portrait / CENTER Patient State Summary
// (always visible) / RIGHT Domain Details accordion, one shared
// `expanded` state driving both the portrait's node highlight and
// the right panel's expanded card — fully bidirectional already:
// clicking a portrait node OR a right-panel header both call the
// same setExpanded, so either click updates both sides together.
//
// R-10-F2 changes: (1) default selection is now `null` (nothing
// pre-selected) instead of a hardcoded "pathology" default, removing
// any chance of an initial mismatch between portrait and panel;
// (2) the active/selected right-panel card now has a materially
// stronger highlight (solid sky border + glow shadow, not just a
// faint tint) so the correspondence is visually unmistakable, per
// explicit feedback that the previous highlight wasn't prominent
// enough ("nổi bật lên").
//
// CONTENT (unchanged from R-09-Final): NLR and PLR are NOT displayed
// anywhere on this page — raw CBC values (Neutrophils, Lymphocytes,
// Platelets) are shown instead; NLR/PLR remain derived via the
// unmodified resolveNlr/resolvePlr and shown with "(derived)" only in
// Step 3.
// ============================================================

import { useState } from "react";
import { PatientPortrait, DOMAIN_META, type DomainKey } from "./Portrait/PatientPortrait";
import { MissingDataState } from "./shared/MissingDataState";
import { formatGradeLabel, formatRawLabValue } from "../../utils/vpg/displayFormatters";
import type { useVirtualPatient } from "../../hooks/useVirtualPatient";

type VPHook = ReturnType<typeof useVirtualPatient>;

const DOMAIN_ORDER: DomainKey[] = ["pathology", "location", "size", "laboratory", "treatment"];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px] py-1.5 border-b border-slate-800 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-medium text-right">{value}</span>
    </div>
  );
}

const fmt = (v: unknown) => (v === "unknown" || v === undefined ? "—" : String(v));

function domainSummary(key: DomainKey, vpg: VPHook["patient"]): string {
  const tp = vpg.tumorPathology, tx = vpg.treatment, lab = vpg.laboratory;
  switch (key) {
    case "pathology":
      return formatGradeLabel(tp)?.headline ?? "Not entered";
    case "location":
      return tp.multisite === "unknown" ? "Not entered" : tp.multisite;
    case "size":
      return tp.tumorDiameter === "unknown" ? "Not entered" : String(tp.tumorDiameter);
    case "laboratory":
      return lab.neutrophils === "unknown" && lab.lymphocytes === "unknown" && lab.plt === "unknown"
        ? "Not entered"
        : "Raw CBC values entered";
    case "treatment":
      if (tx.surgery === "unknown" && tx.chemotherapy === "unknown") return "Not entered";
      return [tx.surgery === 1 ? "Surgery" : null, tx.chemotherapy === 1 ? "Chemotherapy" : null].filter(Boolean).join(" + ") || "None recorded";
  }
}

export function ReviewPatient({ vpg }: { vpg: VPHook }) {
  const { patient, diagnosticReadiness, survivalReadiness } = vpg;
  const { demographics: d, laboratory: lab, tumorPathology: tp, treatment: tx } = patient;
  const [expanded, setExpanded] = useState<DomainKey | null>(null);

  const gradeLabel = formatGradeLabel(tp);

  return (
    <div className="space-y-4">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        {/* LEFT — Interactive Digital Patient Portrait */}
        <PatientPortrait
          patient={patient}
          expanded={expanded}
          onExpandedChange={setExpanded}
          showInlinePanel={false}
        />

        {/* CENTER — Patient State Summary */}
        <div className="rounded-xl border border-slate-800 bg-[#0D1526] px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Patient State Summary</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">Observed State</span>
          </div>

          <Row label="Age" value={fmt(d.age)} />
          <Row label="Sex" value={fmt(d.sex)} />
          <Row label="Tumor Location" value={fmt(tp.location)} />
          <Row label="Multisite (derived)" value={fmt(tp.multisite)} />
          <Row label="Grade" value={fmt(tp.grade)} />
          <Row label="Tumor_Grade (derived)" value={fmt(tp.tumorGrade)} />
          <Row label="Tumor_grade_class (derived)" value={fmt(tp.gradeClass)} />
          <Row label="Surgery" value={tx.surgery === "unknown" ? "—" : tx.surgery === 1 ? "Yes" : "No"} />
          <Row label="Chemotherapy" value={tx.chemotherapy === "unknown" ? "—" : tx.chemotherapy === 1 ? "Yes" : "No"} />

          <div className="mt-4 pt-3 border-t border-slate-800">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Laboratory (raw)</p>
            <Row label="Neutrophils" value={`${formatRawLabValue(lab.neutrophils)} ×10⁹/L`} />
            <Row label="Lymphocytes" value={`${formatRawLabValue(lab.lymphocytes)} ×10⁹/L`} />
            <Row label="Platelets" value={`${formatRawLabValue(lab.plt)} ×10⁹/L`} />
            <p className="text-[10px] text-slate-500 mt-2">
              NLR and PLR are derived automatically from these values and used for prediction in Step 3 — not shown here as primary observations.
            </p>
          </div>
        </div>

        {/* RIGHT — Domain Details (accordion; selection synced with portrait) */}
        <div className="rounded-xl border border-slate-800 bg-[#0D1526] px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {expanded ? `${DOMAIN_META[expanded].label} Details` : "Domain Details"}
            </p>
            {expanded && (
              <button className="text-[10px] text-slate-500 hover:text-slate-300" onClick={() => setExpanded(null)}>
                Click to close
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {DOMAIN_ORDER.map((key) => {
              const Icon = DOMAIN_META[key].icon;
              const isOpen = expanded === key;
              return (
                <div
                  key={key}
                  className={[
                    "rounded-lg border transition-all",
                    isOpen
                      ? "border-sky-400 bg-sky-500/10 shadow-[0_0_0_1px_rgba(56,189,248,0.4),0_0_16px_rgba(56,189,248,0.15)]"
                      : "border-slate-800 hover:border-slate-700",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : key)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isOpen ? "text-sky-300" : "text-slate-500"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[12px] font-medium ${isOpen ? "text-sky-200" : "text-slate-300"}`}>{DOMAIN_META[key].label}</p>
                      {!isOpen && <p className="text-[11px] text-slate-500 truncate">{domainSummary(key, patient)}</p>}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 text-[12px] text-slate-300 space-y-1">
                      {key === "pathology" && (
                        gradeLabel ? (
                          <>
                            <p className="text-[14px] font-semibold text-slate-100">{gradeLabel.headline}</p>
                            {gradeLabel.sub && <p className="text-slate-400">{gradeLabel.sub}</p>}
                          </>
                        ) : <p className="text-slate-500">Not entered.</p>
                      )}
                      {key === "location" && (
                        <>
                          <p>Location: {fmt(tp.location)}</p>
                          <p>Multisite (derived): {fmt(tp.multisite)}</p>
                        </>
                      )}
                      {key === "size" && (
                        <>
                          <p>Diameter (as entered): {tp.tumorDiameter === "unknown" ? "not entered" : String(tp.tumorDiameter)}</p>
                          <p className="text-slate-500 text-[11px]">Continuous size representation — no Small/Medium/Large category.</p>
                        </>
                      )}
                      {key === "laboratory" && (
                        <>
                          <p>Neutrophils: {formatRawLabValue(lab.neutrophils)} ×10⁹/L</p>
                          <p>Lymphocytes: {formatRawLabValue(lab.lymphocytes)} ×10⁹/L</p>
                          <p>Platelets: {formatRawLabValue(lab.plt)} ×10⁹/L</p>
                          <p className="text-slate-500 text-[11px]">NLR/PLR are derived from these values for prediction — shown in Step 3.</p>
                        </>
                      )}
                      {key === "treatment" && (
                        <>
                          <p>Surgery: {tx.surgery === "unknown" ? "not entered" : tx.surgery === 1 ? "Yes" : "No"}</p>
                          <p>Chemotherapy: {tx.chemotherapy === "unknown" ? "not entered" : tx.chemotherapy === 1 ? "Yes" : "No"}</p>
                          {tx.chemotherapy === 1 && (
                            <>
                              <p>Chemo type: {fmt(tx.chemoType)}</p>
                              <p>Regimen: {fmt(tx.regimen)}</p>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {patient.observedOutcomes && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400 mb-2">
            Local/Private Mode — Observed Outcome
          </p>
          <Row label="Vital status" value={patient.observedOutcomes.vitalStatus === 1 ? "Alive" : patient.observedOutcomes.vitalStatus === 0 ? "Dead" : "—"} />
          <Row label="Metastasis_TNM" value={fmt(patient.observedOutcomes.metastasisTNM)} />
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-[#0D1526] px-5 py-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Prediction Readiness</p>
        {diagnosticReadiness.ready ? (
          <p className="text-[12px] text-emerald-400">Diagnostic — ready to run</p>
        ) : (
          <MissingDataState missing={diagnosticReadiness.missing.map((m) => `Diagnostic: ${m}`)} />
        )}
        {survivalReadiness.ready ? (
          <p className="text-[12px] text-emerald-400">Survival — ready to run</p>
        ) : (
          <MissingDataState missing={survivalReadiness.missing.map((m) => `Survival: ${m}`)} />
        )}
      </div>
    </div>
  );
}
