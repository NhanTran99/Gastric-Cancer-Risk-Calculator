import type { Grade } from "../../../types/virtualPatient";

interface Props {
  grade: Grade | "unknown";
  onChange: (g: Grade) => void;
}

const OPTIONS: { value: Grade; label: string; hint: string }[] = [
  { value: 1, label: "Grade 1 — Low grade", hint: "Well differentiation" },
  { value: 2, label: "Grade 2 — Intermediate grade", hint: "Moderate differentiation" },
  { value: 3, label: "Grade 3 — High grade", hint: "Poor differentiation" },
];

/** ID-07: this is the ONLY UI control for pathology grade. Tumor_Grade
 *  and Tumor_grade_class are derived automatically the moment a grade
 *  is chosen (see useVirtualPatient::setGrade). gradeHigh is never
 *  computed or shown here — it exists only inside survivalAdapter.ts. */
export function GradeSelect({ grade, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium text-slate-600">Pathology grade</label>
      <div className="grid gap-1.5 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const active = grade === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                "text-left rounded-lg border px-3 py-2.5 transition-all",
                active ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300",
              ].join(" ")}
            >
              <p className={`text-[12px] font-medium ${active ? "text-blue-700" : "text-slate-800"}`}>{opt.label}</p>
              <p className="text-[11px] text-slate-400">{opt.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
