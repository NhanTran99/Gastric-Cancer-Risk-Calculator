import { useState } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { NomogramLayout } from "./components/layout/NomogramLayout";
import { TabSwitcher, type AppTab } from "./components/layout/TabSwitcher";
import { SurvivalLayout } from "./components/survival/SurvivalLayout";
import { useNomogram } from "./hooks/useNomogram";
import { useSurvival } from "./hooks/useSurvival";

// One subtitle per tab - this is the primary signal (Recommendation A)
// that the header itself changes to reflect which tool is active.
const SUBTITLE: Record<AppTab, string> = {
  diagnosis: "Estimating distant metastasis risk at diagnosis",
  prognosis: "Predicting overall survival from routine biomarkers",
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

      {tab === "diagnosis" ? (
        <NomogramLayout
          inputs={diagInputs}
          result={diagResult}
          heatmapGrid={heatmapGrid}
          contourLines={contourLines}
          onTumorLocationChange={setTumorLocation}
          onNlrChange={setDiagNlr}
          onPlrChange={setDiagPlr}
        />
      ) : (
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
    </div>
  );
}
