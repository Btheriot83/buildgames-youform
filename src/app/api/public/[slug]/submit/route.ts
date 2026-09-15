import { NextResponse } from "next/server";
import { createResponse, getFormBySlug } from "@/lib/forms";
import { validateAnswers } from "@/lib/validation";
import { deliverWebhook } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const form = getFormBySlug(slug);
  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = validateAnswers(form.schema, body.answers ?? {});
  if (!result.ok) {
    return NextResponse.json(
      { error: "Validation failed", errors: result.errors },
      { status: 422 }
    );
  }

  const response = createResponse(form.id, result.data);
  const webhook = await deliverWebhook(form.webhook_url, {
    event: "form.response.created",
    formId: form.id,
    formSlug: form.slug,
    responseId: response.id,
    answers: result.data,
    submittedAt: response.created_at,
  });

  return NextResponse.json({
    ok: true,
    responseId: response.id,
    thankYouMessage:
      form.schema.thankYouMessage || "Thanks — your answers are in.",
    webhook,
  });
}
