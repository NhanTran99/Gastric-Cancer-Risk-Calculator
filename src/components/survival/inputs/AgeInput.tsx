import { NumericInput } from "../../inputs/NumericInput";
import { SURVIVAL_MODEL_CONFIG } from "../../../config/survivalModel";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const { displayNames: dn, validation } = SURVIVAL_MODEL_CONFIG;

export function AgeInput({ value, onChange }: Props) {
  return (
    <NumericInput
      label={dn.age}
      shortLabel={dn.age}
      value={value}
      onChange={onChange}
      min={validation.age.min}
      max={validation.age.max}
      step={1}
      unit={dn.ageUnit}
    />
  );
}
