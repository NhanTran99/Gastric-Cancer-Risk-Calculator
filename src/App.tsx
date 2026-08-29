// ============================================================
// App.tsx — R-09-F10 (this IS the file to place at src/App.tsx —
// no more App.integration.tsx indirection, per explicit instruction)
//
// Only change from the previous pass: the "virtual-patient" tab's
// wrapper now also carries a minimum height
// (`min-h-[calc(100vh-140px)]`) so the dark background fills the
// entire visible tab area — including below the module when its
// content is shorter than the viewport — eliminating the white
// gutter that could show beneath a short module. The color itself
// (`bg-[#070B14]`) and width (`max-w-7xl`) are unchanged from the
// prior pass.
//
// Diagnostic (NomogramLayout) and Survival (SurvivalLayout) branches:
// byte-identical, unchanged. The approved Option-2 Step 2/3 layout
// inside VirtualPatientModule is not touched by this file at all.
// ============================================================

import { useState } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { NomogramLayout } from "./components/layout/NomogramLayout";
import { TabSwitcher, type AppTab } from "./components/layout/TabSwitcher";
import { SurvivalLayout } from "./components/survival/SurvivalLayout";
import { VirtualPatientModule } from "./VirtualPatientModule";
import { useNomogram } from "./hooks/useNomogram";
import { useSurvival } from "./hooks/useSurvival";

const SUBTITLE: Record<AppTab, string> = {
  diagnosis: "Estimating distant metastasis risk at diagnosis",
  prognosis: "Predicting overall survival from routine biomarkers",
  "virtual-patient": "Interactive Digital Patient Portrait — Build, review, and predict",
};

export default function App() {
  const [tab, setTab] = useState<AppTab>("diagnosis");

  const {
    inputs: diagInputs,
    result: diagResult,
    heatmapGrid,
    contourLines,
    setTumorLocation,
    setNlr: setDiagNlr,
    setPlr: setDiagPlr,
  } = useNomogram();

  const {
    inputs: survInputs,
    result: survResult,
    setAge,
    setM1,
    setGradeHigh,
    setNlr: setSurvNlr,
    setPlr: setSurvPlr,
  } = useSurvival();

  return (
    <div className="min-h-screen overflow-y-auto">
      <AppHeader subtitle={SUBTITLE[tab]} />
      <TabSwitcher active={tab} onChange={setTab} />

      {tab === "diagnosis" && (
        <NomogramLayout
          inputs={diagInputs}
          result={diagResult}
          heatmapGrid={heatmapGrid}
          contourLines={contourLines}
          onTumorLocationChange={setTumorLocation}
          onNlrChange={setDiagNlr}
          onPlrChange={setDiagPlr}
        />
      )}

      {tab === "prognosis" && (
        <SurvivalLayout
          inputs={survInputs}
          result={survResult}
          onAgeChange={setAge}
          onM1Change={setM1}
          onGradeHighChange={setGradeHigh}
          onNlrChange={setSurvNlr}
          onPlrChange={setSurvPlr}
        />
      )}

      {tab === "virtual-patient" && (
        <div className="bg-[#070B14] min-h-[calc(100vh-140px)]">
          <main className="max-w-7xl mx-auto px-6 py-6">
            <VirtualPatientModule />
          </main>
        </div>
      )}
    </div>
  );
}
