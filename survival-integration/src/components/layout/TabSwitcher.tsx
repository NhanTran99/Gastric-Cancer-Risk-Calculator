export type AppTab = "diagnosis" | "prognosis";

interface Props {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { key: AppTab; label: string; sublabel: string }[] = [
  { key: "diagnosis", label: "1 · Diagnosis", sublabel: "Distant metastasis risk" },
  { key: "prognosis", label: "2 · Prognosis", sublabel: "Overall survival" },
];

export function TabSwitcher({ active, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-slate-200 bg-white px-6 pt-2">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={[
              "px-4 py-2.5 -mb-px border-b-2 text-left transition-colors",
              isActive
                ? "border-slate-800"
                : "border-transparent hover:border-slate-200",
            ].join(" ")}
          >
            <div className={`text-[12px] font-semibold ${isActive ? "text-slate-800" : "text-slate-400"}`}>
              {tab.label}
            </div>
            <div className="text-[10px] text-slate-400">{tab.sublabel}</div>
          </button>
        );
      })}
    </div>
  );
}
