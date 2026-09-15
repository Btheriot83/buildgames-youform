import { SiteHeader } from "@/components/SiteHeader";
import { Dashboard } from "@/components/Dashboard";
import { listForms, countResponses } from "@/lib/forms";
import { ensureSampleData } from "@/lib/sample-data";
import { initDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  await initDb();
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
        Single-user · SQLite (local) / sql.js (Vercel) · no accounts · no telemetry
      </footer>
    </>
  );
}
