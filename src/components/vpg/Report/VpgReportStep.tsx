import { useMemo, useState } from "react";
import { buildVpgReportText } from "../../../utils/vpg/vpgReport";
import { generateVpgPdf } from "../../../utils/vpg/vpgPdfExport";
import { copyToClipboard } from "../../../utils/export";
import type { useVirtualPatient } from "../../../hooks/useVirtualPatient";

type VPHook = ReturnType<typeof useVirtualPatient>;

export function VpgReportStep({ vpg }: { vpg: VPHook }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const text = useMemo(() => buildVpgReportText(vpg.patient), [vpg.patient]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">VPG Research Report</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-[12px] px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            onClick={async () => {
              const ok = await copyToClipboard(text);
              setCopied(ok);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied" : "Copy to clipboard"}
          </button>
          <button
            type="button"
            disabled={downloading}
            className="text-[12px] px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            onClick={async () => {
              setDownloadError(null);
              setDownloading(true);
              try {
                await generateVpgPdf(vpg.patient);
              } catch {
                setDownloadError("PDF generation failed. Your browser may block the download — try again or use Copy to clipboard.");
              } finally {
                setDownloading(false);
              }
            }}
          >
            {downloading ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>
      {downloadError && <p className="text-[12px] text-red-600">{downloadError}</p>}
      <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[12px] text-slate-700 leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
