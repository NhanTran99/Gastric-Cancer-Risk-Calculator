// ============================================================
// VirtualPatientModule.tsx — R-10-F1
//
// Change this pass: removed the duplicate top step-tab bar (it
// duplicated the sidebar's step navigation exactly — same 4 steps,
// same click behavior). The persistent left sidebar is now the ONLY
// step-navigation control across all 4 steps. A slim top strip
// remains, showing only the Mode indicator (not step navigation),
// since nothing else requires removal there.
//
// Sidebar step glyphs now literally match the requested states:
// checkmark for completed, filled dot for the active step, empty
// ring for pending steps.
//
// No step added/renamed/reordered. No change to global app
// navigation (AppHeader/TabSwitcher) outside this module.
// ============================================================

import { useState } from "react";
import { CheckCircle2, Users } from "lucide-react";
import { useVirtualPatient, type VpgStep } from "./hooks/useVirtualPatient";
import { BuildPatient } from "./components/vpg/BuildPatient/BuildPatient";
import { LoadExistingPatient } from "./components/vpg/LoadExistingPatient";
import { ReviewPatient } from "./components/vpg/ReviewPatient";
import { PredictionDashboard } from "./components/vpg/Predictions/PredictionDashboard";
import { VpgReportStep } from "./components/vpg/Report/VpgReportStep";
import { SafetyDisclaimer } from "./components/shared/SafetyDisclaimer";

const STEPS: { key: VpgStep; shortLabel: string }[] = [
  { key: "build", shortLabel: "Build Patient" },
  { key: "review", shortLabel: "Review Patient" },
  { key: "predictions", shortLabel: "Predictions" },
  { key: "report", shortLabel: "Report" },
];

type EntryMode = "choose" | "public" | "private";

const SECONDARY_BTN = "px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-[13px] hover:bg-slate-800/60 transition-colors";
const PRIMARY_BTN = "px-4 py-2 rounded-lg bg-blue-600 text-white text-[13px] hover:bg-blue-500 transition-colors";

export function VirtualPatientModule() {
  const vpg = useVirtualPatient();
  const { step, setStep } = vpg;
  const [entryMode, setEntryMode] = useState<EntryMode>("choose");

  if (entryMode === "choose") {
    return (
      <div className="rounded-2xl bg-gradient-to-b from-[#0A0F1A] to-[#0D1526] border border-slate-800 px-6 py-14">
        <div className="max-w-2xl mx-auto space-y-5">
          <p className="text-[13px] text-slate-400 text-center">
            Choose how to start this Virtual Patient session.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setEntryMode("public")}
              className="rounded-2xl border border-slate-800 bg-[#0D1526] px-5 py-6 text-left hover:border-sky-500/50 hover:bg-[#111c30] transition-colors"
            >
              <p className="text-[14px] font-semibold text-slate-100">Build New Virtual Patient</p>
              <p className="text-[12px] text-slate-500 mt-1">Public mode. Enter clinical characteristics to construct a new synthetic patient.</p>
            </button>
            <button
              onClick={() => setEntryMode("private")}
              className="rounded-2xl border border-slate-800 bg-[#0D1526] px-5 py-6 text-left hover:border-sky-500/50 hover:bg-[#111c30] transition-colors"
            >
              <p className="text-[14px] font-semibold text-slate-100">Load Existing Patient</p>
              <p className="text-[12px] text-slate-500 mt-1">Local/Private mode only — available only when running locally (npm run dev).</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#070B14] flex flex-col lg:flex-row">
      {/* Persistent left sidebar — the ONLY step-navigation control, all 4 steps */}
      <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0A0F1A] px-4 py-5">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-100 leading-none">VPG</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Virtual Patient Generator</p>
          </div>
        </div>

        <nav className="space-y-1">
          {STEPS.map((s, i) => {
            const isActive = step === s.key;
            const isDone = i < activeIndex;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(s.key)}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12.5px] transition-colors",
                  isActive ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40 font-medium" : "text-slate-400 hover:bg-slate-800/50",
                ].join(" ")}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isActive ? (
                  <span className="w-4 h-4 rounded-full bg-sky-400 shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                )}
                {i + 1}. {s.shortLabel}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-end px-6 py-3 border-b border-slate-800">
          <span className="text-[11px] text-slate-500">
            Mode: {entryMode === "public" ? "Public (synthetic)" : "Private/Local"}
          </span>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {step === "build" && entryMode === "public" && (
            <>
              <BuildPatient vpg={vpg} />
              <div className="flex justify-end">
                <button className={PRIMARY_BTN} onClick={() => setStep("review")}>
                  Continue to Review →
                </button>
              </div>
            </>
          )}

          {step === "build" && entryMode === "private" && (
            <LoadExistingPatient vpg={vpg} onLoaded={() => setStep("review")} />
          )}

          {step === "review" && (
            <>
              <ReviewPatient vpg={vpg} />
              <div className="flex justify-between">
                <button className={SECONDARY_BTN} onClick={() => setStep("build")}>← Back</button>
                <button className={PRIMARY_BTN} onClick={vpg.runPredictions}>
                  Run Predictions →
                </button>
              </div>
            </>
          )}

          {step === "predictions" && (
            <>
              <PredictionDashboard patient={vpg.patient} />
              <div className="flex justify-between">
                <button className={SECONDARY_BTN} onClick={() => setStep("review")}>← Back</button>
                <button className={PRIMARY_BTN} onClick={() => setStep("report")}>
                  Continue to Report →
                </button>
              </div>
            </>
          )}

          {step === "report" && (
            <>
              <VpgReportStep vpg={vpg} />
              <div className="flex justify-between">
                <button className={SECONDARY_BTN} onClick={() => setStep("predictions")}>← Back</button>
                <button
                  className={SECONDARY_BTN}
                  onClick={() => { vpg.reset(); setEntryMode("choose"); }}
                >
                  Start New Virtual Patient
                </button>
              </div>
            </>
          )}

          <SafetyDisclaimer />
        </div>
      </div>
    </div>
  );
}
