import { NextResponse } from "next/server";
import { getFormBySlug } from "@/lib/forms";
import { ensureSampleData } from "@/lib/sample-data";
import { initDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  await initDb();
  ensureSampleData();
  const { slug } = await ctx.params;
  const form = getFormBySlug(slug);
  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    form: {
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description,
      schema: form.schema,
    },
  });
}
