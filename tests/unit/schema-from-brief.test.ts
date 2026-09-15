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
    const keys = [
      "BUILD_GAMES_LLM_API_KEY",
      "XAI_API_KEY",
      "GROK_API_KEY",
      "OPENAI_API_KEY",
      "ANTHROPIC_AUTH_TOKEN",
      "ANTHROPIC_API_KEY",
    ] as const;
    const saved: Record<string, string | undefined> = {};
    for (const k of keys) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    const base = process.env.ANTHROPIC_BASE_URL;
    delete process.env.ANTHROPIC_BASE_URL;
    try {
      const d = await draftSchemaFromBrief("Feedback form with email and comments");
      expect(d.mode).toBe("local");
      expect(d.schema.fields.length).toBeGreaterThan(0);
    } finally {
      for (const k of keys) {
        if (saved[k] !== undefined) process.env[k] = saved[k];
      }
      if (base !== undefined) process.env.ANTHROPIC_BASE_URL = base;
    }
  }, 15000);
});
