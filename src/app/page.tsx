import { SiteHeader } from "@/components/SiteHeader";
import { Dashboard } from "@/components/Dashboard";
import { listForms, countResponses } from "@/lib/forms";
import { ensureSampleData } from "@/lib/sample-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function HomePage() {
  ensureSampleData();
  const forms = listForms().map((f) => ({
    ...f,
    responseCount: countResponses(f.id),
  }));

  return (
    <>
      <SiteHeader />
      <main className="shell py-10 sm:py-14">
        <Dashboard initialForms={forms} />
      </main>
      <footer className="shell pb-10 pt-4 text-sm text-[var(--ink-mute)]">
        <hr className="rule mb-6" />
        Single-user · SQLite on disk · no accounts · no telemetry
      </footer>
    </>
  );
}
