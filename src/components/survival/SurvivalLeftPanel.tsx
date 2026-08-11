import { AgeInput } from "./inputs/AgeInput";
import { BinaryToggle } from "./inputs/BinaryToggle";
import { SurvivalNLRInput, SurvivalPLRInput } from "./inputs/SurvivalBiomarkerInputs";
import { SafetyDisclaimer } from "../shared/SafetyDisclaimer";
import { SURVIVAL_MODEL_CONFIG } from "../../config/survivalModel";
import type { SurvivalInputs } from "../../types/survival";

const { displayNames: dn } = SURVIVAL_MODEL_CONFIG;

interface Props {
  inputs: SurvivalInputs;
  onAgeChange: (v: number) => void;
  onM1Change: (v: 0 | 1) => void;
  onGradeHighChange: (v: 0 | 1) => void;
  onNlrChange: (v: number) => void;
  onPlrChange: (v: number) => void;
}

export function SurvivalLeftPanel({
  inputs,
  onAgeChange,
  onM1Change,
  onGradeHighChange,
  onNlrChange,
  onPlrChange,
}: Props) {
  return (
    <aside className="flex flex-col gap-0 border-r border-slate-200 bg-white w-full lg:w-[288px] shrink-0">
      <div className="px-5 pt-6 pb-4 border-b border-slate-100">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Patient Parameters
        </p>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5 flex-1">
        <AgeInput value={inputs.age} onChange={onAgeChange} />
        <div className="h-px bg-slate-100" />
        <BinaryToggle
          fieldLabel={dn.metastasis}
          value={inputs.m1}
          onChange={onM1Change}
          options={[
            { value: 0, label: dn.metastasisAbsent, description: "No distant metastasis confirmed" },
            { value: 1, label: dn.metastasisPresent, description: "Distant metastasis confirmed" },
          ]}
        />
        <div className="h-px bg-slate-100" />
        <BinaryToggle
          fieldLabel={dn.differentiation}
          value={inputs.gradeHigh}
          onChange={onGradeHighChange}
          options={[
            { value: 0, label: dn.differentiationWellModerate, description: "Well or moderately differentiated" },
            { value: 1, label: dn.differentiationPoor, description: "Poorly differentiated" },
          ]}
        />
        <div className="h-px bg-slate-100" />
        <SurvivalNLRInput value={inputs.nlr} onChange={onNlrChange} />
        <div className="h-px bg-slate-100" />
        <SurvivalPLRInput value={inputs.plr} onChange={onPlrChange} />
      </div>

      <div className="px-5 pb-5">
        <SafetyDisclaimer />
      </div>
    </aside>
  );
}
