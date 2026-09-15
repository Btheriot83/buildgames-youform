import { NextResponse } from "next/server";
import { importFormPayload } from "@/lib/forms";
import { initDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await initDb();
  try {
    const body = await req.json();
    const form = importFormPayload(body);
    return NextResponse.json({ form }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
