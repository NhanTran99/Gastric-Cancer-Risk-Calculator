import { AlertTriangle } from "lucide-react";

/** R-09-F3: a prediction that cannot run must be UNMISTAKABLE — no
 *  faded number, no partial gauge, no ambiguous placeholder. This
 *  replaces the previous amber inline note with a full-width blocked
 *  state that names every missing variable. Used only when a
 *  readiness/adapter check has already returned "blocked" — this
 *  component renders no prediction math of its own. */
export function MissingDataState({ missing }: { missing: string[] }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 px-6 py-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold text-amber-300">Missing required data — prediction unavailable</p>
          <p className="text-[12px] text-amber-400/80 mt-1">
            This is not a valid prediction. The following inputs are required and not yet entered:
          </p>
          <ul className="mt-2 space-y-1">
            {missing.map((m) => (
              <li key={m} className="text-[12px] text-amber-200 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
