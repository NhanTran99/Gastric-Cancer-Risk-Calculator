import type { TumorLocationRaw } from "../../../types/virtualPatient";

const LOCATIONS: TumorLocationRaw[] = ["Antrum", "Pylorus", "Cardia", "Body", "Entire", "Fundus", "Overlapping"];

interface Props {
  location: TumorLocationRaw | "unknown";
  locationDescription: string | "unknown";
  onChange: (location: TumorLocationRaw | "unknown", locationDescription: string | "unknown") => void;
}

export function TumorLocationSelectVPG({ location, locationDescription, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium text-slate-600">Tumor location</label>
      <select
        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[14px]"
        value={location === "unknown" ? "" : location}
        onChange={(e) => onChange((e.target.value || "unknown") as TumorLocationRaw | "unknown", locationDescription)}
      >
        <option value="">— Select —</option>
        {LOCATIONS.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
      {location === "Overlapping" && (
        <input
          type="text"
          placeholder="Describe multi-site involvement (e.g. Antrum, Body)"
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[13px]"
          value={locationDescription === "unknown" ? "" : locationDescription}
          onChange={(e) => onChange(location, e.target.value || "unknown")}
        />
      )}
      <p className="text-[11px] text-slate-400">
        The internal single/multisite encoding used by the diagnostic model is derived automatically and never shown as a raw 0/1 value.
      </p>
    </div>
  );
}
