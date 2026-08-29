// ============================================================
// VPGStandalone.tsx — optional standalone mount for local dev.
// The real integration is App.tsx rendering VirtualPatientModule
// as the third tab — see App.integration.tsx. This file is only
// useful if you want to preview the VPG module in isolation, e.g.
// by temporarily pointing main.tsx at it.
//
// AppHeader requires a `subtitle: string` prop. This uses the same
// already-approved subtitle text used for the "virtual-patient" tab
// entry in App.integration.tsx's SUBTITLE record, so this standalone
// preview reads identically to the integrated tab. AppHeader itself
// is not modified.
// ============================================================

import { AppHeader } from "./components/layout/AppHeader";
import { VirtualPatientModule } from "./VirtualPatientModule";

export default function VPGStandalone() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader subtitle="Interactive Digital Patient Portrait — Build, review, and predict" />
      <main className="max-w-5xl mx-auto px-6 py-6">
        <VirtualPatientModule />
      </main>
    </div>
  );
}
