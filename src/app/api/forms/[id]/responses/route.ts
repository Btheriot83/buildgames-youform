import { NextResponse } from "next/server";
import {
  deleteResponse,
  getFormById,
  listResponses,
} from "@/lib/forms";
import { initDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  await initDb();
  const { id } = await ctx.params;
  const form = getFormById(id);
  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ responses: listResponses(id) });
}

export async function DELETE(req: Request, ctx: Ctx) {
  await initDb();
  const { id } = await ctx.params;
  if (!getFormById(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = new URL(req.url);
  const responseId = url.searchParams.get("responseId");
  if (!responseId) {
    return NextResponse.json(
      { error: "responseId query required" },
      { status: 400 }
    );
  }
  const ok = deleteResponse(responseId);
  if (!ok) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
