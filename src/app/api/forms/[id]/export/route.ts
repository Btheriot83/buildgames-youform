import { NextResponse } from "next/server";
import {
  exportFormPayload,
  getFormById,
  listResponses,
  responsesToCsv,
} from "@/lib/forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const form = getFormById(id);
  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "json";
  const includeResponses = url.searchParams.get("responses") !== "0";

  if (format === "csv") {
    const csv = responsesToCsv(form, listResponses(form.id));
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${form.slug}-responses.csv"`,
      },
    });
  }

  const payload = exportFormPayload(form, includeResponses);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${form.slug}-export.json"`,
    },
  });
}
