import { describe, expect, it } from "vitest";
import { draftSchemaLocal, draftSchemaFromBrief } from "@/lib/ai/schema-from-brief";

describe("draftSchemaLocal", () => {
  it("builds RSVP-shaped fields from a wedding brief", () => {
    const d = draftSchemaLocal(
      "Wedding RSVP: collect name, email, attending yes/no, guest count, and notes",
    );
    expect(d.mode).toBe("local");
    expect(d.schema.fields.length).toBeGreaterThanOrEqual(3);
    const types = d.schema.fields.map((f: { type: string }) => f.type);
    expect(types).toContain("email");
    expect(types).toContain("boolean");
  });

  it("never invents purple SaaS copy in thank you", () => {
    const d = draftSchemaLocal("Studio intake for freelance clients");
    expect(d.schema.thankYouMessage?.toLowerCase()).not.toMatch(/unlimited|10k|ai-powered/);
  });
});

describe("draftSchemaFromBrief", () => {
  it("falls back to local when no API key", async () => {
    const saved = {
      BUILD: process.env.BUILD_GAMES_LLM_API_KEY,
      XAI: process.env.XAI_API_KEY,
      GROK: process.env.GROK_API_KEY,
      OPENAI: process.env.OPENAI_API_KEY,
    };
    delete process.env.BUILD_GAMES_LLM_API_KEY;
    delete process.env.XAI_API_KEY;
    delete process.env.GROK_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const d = await draftSchemaFromBrief("Feedback form with email and comments");
      expect(d.mode).toBe("local");
      expect(d.schema.fields.length).toBeGreaterThan(0);
    } finally {
      if (saved.BUILD) process.env.BUILD_GAMES_LLM_API_KEY = saved.BUILD;
      if (saved.XAI) process.env.XAI_API_KEY = saved.XAI;
      if (saved.GROK) process.env.GROK_API_KEY = saved.GROK;
      if (saved.OPENAI) process.env.OPENAI_API_KEY = saved.OPENAI;
    }
  });
});
