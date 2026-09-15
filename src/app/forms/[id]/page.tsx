import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { FormEditor } from "@/components/FormEditor";
import { getFormById } from "@/lib/forms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export default async function FormEditPage({ params }: Props) {
  const { id } = await params;
  const form = getFormById(id);
  if (!form) notFound();

  return (
    <>
      <SiteHeader
        trail={[
          { href: "/", label: "Desk" },
          { label: form.title },
        ]}
      />
      <main className="shell py-10 sm:py-14">
        <FormEditor form={form} />
      </main>
    </>
  );
}
