import { notFound } from "next/navigation";
import Link from "next/link";
import { ConversationalForm } from "@/components/ConversationalForm";
import { getFormBySlug } from "@/lib/forms";
import { ensureSampleData } from "@/lib/sample-data";
import { initDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicFormPage({ params }: Props) {
  await initDb();
  ensureSampleData();
  const { slug } = await params;
  const form = getFormBySlug(slug);
  if (!form) notFound();

  return (
    <div className="min-h-screen">
      <div className="shell flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2 opacity-80 hover:opacity-100">
          <img src="/art/ember-mark.svg" alt="" width={28} height={28} />
          <span className="font-display text-sm tracking-tight">Ember Forms</span>
        </Link>
        <span className="eyebrow">Public reply</span>
      </div>
      <ConversationalForm
        slug={form.slug}
        title={form.title}
        description={form.description}
        schema={form.schema}
      />
    </div>
  );
}
