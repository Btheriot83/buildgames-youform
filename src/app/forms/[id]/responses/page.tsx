import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ResponseTable } from "@/components/ResponseTable";
import { getFormById, listResponses } from "@/lib/forms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export default async function ResponsesPage({ params }: Props) {
  const { id } = await params;
  const form = getFormById(id);
  if (!form) notFound();
  const responses = listResponses(id);

  return (
    <>
      <SiteHeader
        trail={[
          { href: "/", label: "Desk" },
          { href: `/forms/${form.id}`, label: form.title },
          { label: "Responses" },
        ]}
      />
      <main className="shell py-10 sm:py-14">
        <ResponseTable form={form} initialResponses={responses} />
      </main>
    </>
  );
}
