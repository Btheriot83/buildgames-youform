import { NextResponse } from "next/server";
import {
  deleteForm,
  getFormById,
  updateForm,
  countResponses,
} from "@/lib/forms";
import { formMetaSchema, formSchemaSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const form = getFormById(id);
  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    form: { ...form, responseCount: countResponses(form.id) },
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!getFormById(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const body = await req.json();
    const patch: Parameters<typeof updateForm>[1] = {};
    if (body.title !== undefined || body.slug !== undefined || body.description !== undefined || body.webhook_url !== undefined) {
      const meta = formMetaSchema.partial().parse({
        title: body.title,
        description: body.description,
        slug: body.slug,
        webhook_url: body.webhook_url,
      });
      Object.assign(patch, meta);
    }
    if (body.schema !== undefined) {
      patch.schema = formSchemaSchema.parse(body.schema);
    }
    const form = updateForm(id, patch);
    return NextResponse.json({ form });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ok = deleteForm(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
