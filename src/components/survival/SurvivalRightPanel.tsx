import { RiskSummaryCard } from "./outputs/RiskSummaryCard";
import { SurvivalCurveChart } from "./outputs/SurvivalCurveChart";
import { ShapWaterfall } from "./outputs/ShapWaterfall";
import { CutoffAxis } from "./outputs/CutoffAxis";
import { SurvivalModelCard } from "./outputs/SurvivalModelCard";
import type { SurvivalInputs, SurvivalResult } from "../../types/survival";

interface Props {
  inputs: SurvivalInputs;
  result: SurvivalResult;
}

export function SurvivalRightPanel({ inputs, result }: Props) {
  const { risk12, risk24, hazardRatio, riskBand, survivalCurve, shapContributions, isValid } = result;

  return (
    <main className="flex-1 bg-slate-50 overflow-y-auto">
      <div className="px-6 py-6 flex flex-col gap-4 max-w-2xl">
        <RiskSummaryCard
          risk12={risk12}
          risk24={risk24}
          hazardRatio={hazardRatio}
          riskBand={riskBand}
          isValid={isValid}
        />

        <SurvivalCurveChart curve={survivalCurve} riskBand={riskBand} isValid={isValid} />

        <ShapWaterfall contributions={shapContributions} isValid={isValid} />

        <CutoffAxis nlrValue={inputs.nlr} />

        <SurvivalModelCard />
      </div>
    </main>
  );
}
