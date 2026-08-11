import { useState, useMemo } from "react";
import { calculateSurvival, validateSurvivalInputs } from "../utils/survivalCalculator";
import type { SurvivalInputs, SurvivalResult } from "../types/survival";

const DEFAULT_INPUTS: SurvivalInputs = {
  age: 60,
  m1: 0,
  gradeHigh: 0,
  nlr: 2.5,
  plr: 180,
};

export interface SurvivalState {
  inputs: SurvivalInputs;
  result: SurvivalResult;
  validationError: string | null;
  setAge: (v: number) => void;
  setM1: (v: 0 | 1) => void;
  setGradeHigh: (v: 0 | 1) => void;
  setNlr: (v: number) => void;
  setPlr: (v: number) => void;
}

export function useSurvival(): SurvivalState {
  const [inputs, setInputs] = useState<SurvivalInputs>(DEFAULT_INPUTS);

  const validationError = useMemo(() => validateSurvivalInputs(inputs), [inputs]);
  const result = useMemo(() => calculateSurvival(inputs), [inputs]);

  function setAge(v: number) {
    setInputs((prev) => ({ ...prev, age: v }));
  }
  function setM1(v: 0 | 1) {
    setInputs((prev) => ({ ...prev, m1: v }));
  }
  function setGradeHigh(v: 0 | 1) {
    setInputs((prev) => ({ ...prev, gradeHigh: v }));
  }
  function setNlr(v: number) {
    setInputs((prev) => ({ ...prev, nlr: v }));
  }
  function setPlr(v: number) {
    setInputs((prev) => ({ ...prev, plr: v }));
  }

  return { inputs, result, validationError, setAge, setM1, setGradeHigh, setNlr, setPlr };
}
