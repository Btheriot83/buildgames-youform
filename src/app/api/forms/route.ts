import { NextResponse } from "next/server";
import { createForm, listForms, countResponses } from "@/lib/forms";
import { ensureSampleData } from "@/lib/sample-data";
import { formMetaSchema, formSchemaSchema } from "@/lib/validation";
import { initDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await initDb();
  ensureSampleData();
  const forms = listForms().map((f) => ({
    ...f,
    responseCount: countResponses(f.id),
  }));
  return NextResponse.json({ forms });
}

export async function POST(req: Request) {
  await initDb();
  try {
    const body = await req.json();
    const meta = formMetaSchema.partial({ slug: true }).parse({
      title: body.title ?? "Untitled form",
      description: body.description ?? "",
      slug: body.slug,
      webhook_url: body.webhook_url ?? null,
    });
    const schema = body.schema
      ? formSchemaSchema.parse(body.schema)
      : undefined;
    const form = createForm({
      title: meta.title,
      description: meta.description,
      slug: meta.slug,
      webhook_url: meta.webhook_url,
      schema,
    });
    return NextResponse.json({ form }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
