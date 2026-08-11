import { Crosshair, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";

export type AppTab = "diagnosis" | "prognosis";

interface Props {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: {
  key: AppTab;
  label: string;
  sublabel: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  // Crosshair: a single point-in-time assessment ("is metastasis present now?")
  { key: "diagnosis", label: "1 · Diagnosis", sublabel: "Distant metastasis risk", Icon: Crosshair },
  // TrendingUp: a trajectory over time ("how does survival unfold?") -
  // deliberately a different icon shape than diagnosis, not just a
  // different color, so the two tabs read as different KINDS of tool.
  { key: "prognosis", label: "2 · Prognosis", sublabel: "Overall survival", Icon: TrendingUp },
];

export function TabSwitcher({ active, onChange }: Props) {
  return (
    <div className="flex gap-1.5 border-b border-slate-200 bg-white px-6 pt-3 pb-3">
      {TABS.map(({ key, label, sublabel, Icon }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left transition-all duration-150",
              isActive
                ? "border-blue-500 bg-blue-50 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]"
                : "border-transparent text-slate-400 hover:bg-slate-50 hover:border-slate-200",
            ].join(" ")}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
            <div>
              <div className={`text-[12px] font-semibold ${isActive ? "text-blue-700" : "text-slate-500"}`}>
                {label}
              </div>
              <div className={`text-[10px] ${isActive ? "text-blue-500/80" : "text-slate-400"}`}>
                {sublabel}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
