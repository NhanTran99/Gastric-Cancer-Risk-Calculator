import { useState } from "react";
import { loadExistingPatientLocal, listLocalPatientIds, CohortLoadError } from "../../utils/vpg/cohortLoader.local";
import type { useVirtualPatient } from "../../hooks/useVirtualPatient";

type VPHook = ReturnType<typeof useVirtualPatient>;

export function LoadExistingPatient({ vpg, onLoaded }: { vpg: VPHook; onLoaded: () => void }) {
  const [ids, setIds] = useState<string[] | null>(null);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!import.meta.env.DEV) {
    // Same guarantee as cohortLoader.local.ts — this branch is the
    // only UI entry point into local-mode loading, and it refuses to
    // render at all outside a local dev session.
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0D1526] px-5 py-4 text-[13px] text-slate-400">
        Local patient loading is only available when running this application locally.
      </div>
    );
  }

  async function refreshList() {
    setIds(await listLocalPatientIds());
  }

  async function handleLoad() {
    setError(null);
    setLoading(true);
    try {
      const patient = await loadExistingPatientLocal(selected);
      vpg.loadFromRecord(patient);
      onLoaded();
    } catch (e) {
      setError(e instanceof CohortLoadError ? e.message : "Failed to load local patient record.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0D1526] px-5 py-5 space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          LOAD EXISTING PATIENT — LOCAL / PRIVATE ONLY
        </p>
        <p className="text-[12px] text-slate-500 mt-1">
          Load a patient record stored locally on this computer. Local patient data is not included in public builds or deployments.
        </p>
      </div>

      <div className="flex gap-2">
        <button type="button" className="text-[12px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300" onClick={refreshList}>
          Refresh list
        </button>
        {ids && (
          <select className="flex-1 rounded-lg border border-slate-700 bg-[#111827] text-slate-200 px-3.5 py-2 text-[13px]" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">— Select a local record —</option>
            {ids.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        )}
      </div>

      {error && <p className="text-[12px] text-red-400">{error}</p>}

      <button
        type="button"
        disabled={!selected || loading}
        onClick={handleLoad}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[13px] disabled:opacity-40"
      >
        {loading ? "Loading…" : "Load Patient"}
      </button>
    </div>
  );
}
