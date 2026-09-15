import { NextResponse } from "next/server";
import { aiAvailability, draftSchemaFromBrief } from "@/lib/ai/schema-from-brief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(aiAvailability());
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { brief?: string };
    const brief = typeof body.brief === "string" ? body.brief : "";
    if (!brief.trim()) {
      return NextResponse.json({ error: "brief is required" }, { status: 400 });
    }
    if (brief.length > 4000) {
      return NextResponse.json({ error: "brief too long (max 4000)" }, { status: 400 });
    }
    const draft = await draftSchemaFromBrief(brief);
    return NextResponse.json(draft);
  } catch {
    return NextResponse.json({ error: "Could not draft schema" }, { status: 500 });
  }
}
