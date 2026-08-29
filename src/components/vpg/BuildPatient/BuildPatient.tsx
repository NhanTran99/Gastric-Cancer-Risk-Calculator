// ============================================================
// BuildPatient.tsx — refined per R-02, R-03, R-04
//
// R-02: every field starts genuinely empty. VpgNumericInput (new,
// blank-capable) replaces the legacy NumericInput here — no
// clinically meaningful default is ever pre-filled or substituted.
// R-03: Tumor_size Small/Median/Big picker REMOVED. Replaced with a
// free-text Tumor_diameter_cm field preserving "A x B"/"A x B x C".
// R-04: added Chemo_type and Regimen selects (shown once
// Chemotherapy = Yes), matching the audited 05_TREATMENT vocabulary.
// ============================================================

import { VpgNumericInput } from "./VpgNumericInput";
import { TumorLocationSelectVPG } from "./TumorLocationSelectVPG";
import { GradeSelect } from "./GradeSelect";
import { displayNlr, displayPlr } from "../../../utils/vpg/displayFormatters";
import type { Sex, ChemoType, Regimen } from "../../../types/virtualPatient";
import type { useVirtualPatient } from "../../../hooks/useVirtualPatient";

type VPHook = ReturnType<typeof useVirtualPatient>;

const CHEMO_TYPES: ChemoType[] = ["Palliative", "Neo-adjuvant", "Adjuvant"];
const REGIMENS: Regimen[] = ["CapeOx", "SOX", "S-1", "FOLFOX", "Capecitabine", "FLOT", "CapexOx"];

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{title}</p>
        {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function BuildPatient({ vpg }: { vpg: VPHook }) {
  const { patient, updateDemographics, updateLaboratory, updateTumorPathology, setGrade, updateTreatment, setHypotheticalM1 } = vpg;
  const d = patient.demographics;
  const lab = patient.laboratory;
  const tp = patient.tumorPathology;
  const tx = patient.treatment;
  const nlrPreview = displayNlr(lab);
  const plrPreview = displayPlr(lab);

  return (
    <div className="space-y-5">
      <Section title="Demographics">
        <div className="grid gap-4 sm:grid-cols-3">
          <VpgNumericInput label="Age" value={d.age} onChange={(v) => updateDemographics({ age: v })} min={18} max={100} step={1} unit="years" />
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-slate-600">Sex</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[14px]"
              value={d.sex === "unknown" ? "" : d.sex}
              onChange={(e) => updateDemographics({ sex: (e.target.value || "unknown") as Sex | "unknown" })}
            >
              <option value="">Not entered</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <VpgNumericInput label="BMI" value={d.bmi} onChange={(v) => updateDemographics({ bmi: v })} min={10} max={60} step={0.1} unit="kg/m²" />
        </div>
      </Section>

      <Section title="Laboratory" hint="Required for both predictions — enter NLR/PLR directly, or Neutrophils+Lymphocytes+PLT to derive them.">
        <div className="grid gap-4 sm:grid-cols-2">
          <VpgNumericInput label="Neutrophil-to-Lymphocyte Ratio (NLR)" value={lab.nlr} onChange={(v) => updateLaboratory({ nlr: v, nlrSource: v === "unknown" ? "unknown" : "direct" })} min={0.1} max={50} step={0.1} unit="ratio" />
          <VpgNumericInput label="Platelet-to-Lymphocyte Ratio (PLR)" value={lab.plr} onChange={(v) => updateLaboratory({ plr: v, plrSource: v === "unknown" ? "unknown" : "direct" })} min={1} max={1000} step={1} unit="ratio" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <VpgNumericInput label="Neutrophils" value={lab.neutrophils} onChange={(v) => updateLaboratory({ neutrophils: v })} min={0} max={50} step={0.1} />
          <VpgNumericInput label="Lymphocytes" value={lab.lymphocytes} onChange={(v) => updateLaboratory({ lymphocytes: v })} min={0} max={20} step={0.1} />
          <VpgNumericInput label="PLT" value={lab.plt} onChange={(v) => updateLaboratory({ plt: v })} min={0} max={1000} step={1} unit="×10³/µL" />
        </div>
        {(nlrPreview.available || plrPreview.available) && (
          <p className="text-[11px] text-slate-500">
            {nlrPreview.available && <>NLR: <span className="font-medium text-slate-700">{nlrPreview.text}{nlrPreview.isDerived ? " (derived)" : ""}</span></>}
            {nlrPreview.available && plrPreview.available && "  ·  "}
            {plrPreview.available && <>PLR: <span className="font-medium text-slate-700">{plrPreview.text}{plrPreview.isDerived ? " (derived)" : ""}</span></>}
          </p>
        )}
      </Section>

      <Section title="Tumor & Pathology" hint="Required for both predictions">
        <TumorLocationSelectVPG
          location={tp.location}
          locationDescription={tp.locationDescription}
          onChange={(location, locationDescription) => updateTumorPathology({ location, locationDescription })}
        />

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium text-slate-600">Tumor diameter</label>
          <input
            type="text"
            placeholder='e.g. "2.5 x 5" or "10 x 7 x 2" — leave blank if unknown'
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[13px] placeholder:text-slate-300"
            value={tp.tumorDiameter === "unknown" ? "" : tp.tumorDiameter}
            onChange={(e) => updateTumorPathology({ tumorDiameter: e.target.value === "" ? "unknown" : e.target.value })}
          />
          <p className="text-[11px] text-slate-400">
            Original measurement text is preserved exactly and drives the portrait's tumor scale — not a Small/Medium/Large category.
          </p>
        </div>

        <GradeSelect grade={tp.grade} onChange={setGrade} />
      </Section>

      <Section title="Treatment" hint="Representation only — never used as a model input and never used to recommend or optimize treatment.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-slate-600">Surgery</label>
            <div className="flex gap-2">
              {[0, 1].map((v) => (
                <button key={v} type="button" onClick={() => updateTreatment({ surgery: v as 0 | 1 })}
                  className={`px-3 py-1.5 rounded-lg border text-[12px] ${tx.surgery === v ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}>
                  {v === 1 ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-slate-600">Chemotherapy</label>
            <div className="flex gap-2">
              {[0, 1].map((v) => (
                <button key={v} type="button" onClick={() => updateTreatment({ chemotherapy: v as 0 | 1 })}
                  className={`px-3 py-1.5 rounded-lg border text-[12px] ${tx.chemotherapy === v ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}>
                  {v === 1 ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {tx.chemotherapy === 1 && (
          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-slate-600">Chemo type</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[14px]"
                value={tx.chemoType === "unknown" ? "" : tx.chemoType}
                onChange={(e) => updateTreatment({ chemoType: (e.target.value || "unknown") as ChemoType | "unknown" })}
              >
                <option value="">Not entered</option>
                {CHEMO_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-slate-600">Regimen</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[14px]"
                value={tx.regimen === "unknown" ? "" : tx.regimen}
                onChange={(e) => updateTreatment({ regimen: (e.target.value || "unknown") as Regimen | "unknown" })}
              >
                <option value="">Not entered</option>
                {REGIMENS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}
      </Section>

      <Section title="Survival modeling — hypothetical metastasis status (M1)" hint="A modeling input for the survival what-if calculation, not an observed outcome.">
        <div className="flex gap-3">
          <button type="button" onClick={() => setHypotheticalM1(0)} className={`px-4 py-2 rounded-lg border text-[13px] ${patient.survivalInputs?.hypotheticalM1 === 0 ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200"}`}>
            Absent (M0)
          </button>
          <button type="button" onClick={() => setHypotheticalM1(1)} className={`px-4 py-2 rounded-lg border text-[13px] ${patient.survivalInputs?.hypotheticalM1 === 1 ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200"}`}>
            Present (M1)
          </button>
        </div>
      </Section>
    </div>
  );
}
