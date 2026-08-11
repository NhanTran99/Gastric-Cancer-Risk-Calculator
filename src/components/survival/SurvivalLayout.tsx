import { SurvivalLeftPanel } from "./SurvivalLeftPanel";
import { SurvivalRightPanel } from "./SurvivalRightPanel";
import type { SurvivalInputs, SurvivalResult } from "../../types/survival";

interface Props {
  inputs: SurvivalInputs;
  result: SurvivalResult;
  onAgeChange: (v: number) => void;
  onM1Change: (v: 0 | 1) => void;
  onGradeHighChange: (v: 0 | 1) => void;
  onNlrChange: (v: number) => void;
  onPlrChange: (v: number) => void;
}

export function SurvivalLayout({
  inputs,
  result,
  onAgeChange,
  onM1Change,
  onGradeHighChange,
  onNlrChange,
  onPlrChange,
}: Props) {
  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0">
      <SurvivalLeftPanel
        inputs={inputs}
        onAgeChange={onAgeChange}
        onM1Change={onM1Change}
        onGradeHighChange={onGradeHighChange}
        onNlrChange={onNlrChange}
        onPlrChange={onPlrChange}
      />
      <SurvivalRightPanel inputs={inputs} result={result} />
    </div>
  );
}
