import { FlaskConical } from "lucide-react";

interface Props {
  /** Subtitle changes per active tab - see App.tsx for the two values used. */
  subtitle: string;
}

export function AppHeader({ subtitle }: Props) {
  return (
    <header className="bg-[#0A2540] px-6 py-3.5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
          <FlaskConical className="w-3.5 h-3.5 text-white/80" />
        </div>
        <div>
          <p className="text-white text-[13px] font-semibold tracking-wide leading-none">
            Gastric Cancer Risk Calculator
          </p>
          {/* Subtitle is the primary signal that the two tabs do different
              things — it changes every time the active tab changes. */}
          <p className="text-white/45 text-[11px] mt-1 leading-none transition-opacity duration-150">
            {subtitle}
          </p>
        </div>
      </div>
      <span className="text-[10px] font-medium tracking-widest text-white/65 bg-white/10 border border-white/15 rounded-full px-3 py-1 uppercase">
        Research Tool
      </span>
    </header>
  );
}
