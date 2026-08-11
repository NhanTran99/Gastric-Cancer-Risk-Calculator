import { NumericInput } from "../../inputs/NumericInput";
import { SURVIVAL_MODEL_CONFIG } from "../../../config/survivalModel";

const { displayNames: dn, validation } = SURVIVAL_MODEL_CONFIG;

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function SurvivalNLRInput({ value, onChange }: Props) {
  return (
    <NumericInput
      label={dn.nlr}
      shortLabel={dn.nlrShort}
      value={value}
      onChange={onChange}
      min={validation.nlr.min}
      max={validation.nlr.max}
      step={0.1}
      unit="ratio"
    />
  );
}

export function SurvivalPLRInput({ value, onChange }: Props) {
  return (
    <NumericInput
      label={dn.plr}
      shortLabel={dn.plrShort}
      value={value}
      onChange={onChange}
      min={validation.plr.min}
      max={validation.plr.max}
      step={1}
      unit="ratio"
    />
  );
}
