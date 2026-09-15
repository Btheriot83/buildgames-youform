import { describe, expect, it } from "vitest";
import { createMemoryDb } from "../../src/lib/db";
import {
  createForm,
  createResponse,
  exportFormPayload,
  importFormPayload,
  listResponses,
  responsesToCsv,
  updateForm,
} from "../../src/lib/forms";
import { validateAnswers } from "../../src/lib/validation";

describe("forms data model", () => {
  it("creates, updates, and collects responses", () => {
    const db = createMemoryDb();
    const form = createForm(
      {
        title: "Test intake",
        slug: "test-intake",
        schema: {
          fields: [
            { id: "n", type: "text", label: "Name", required: true },
            { id: "e", type: "email", label: "Email", required: true },
          ],
          thankYouMessage: "Thanks",
        },
      },
      db
    );
    expect(form.slug).toBe("test-intake");

    const updated = updateForm(
      form.id,
      { title: "Test intake v2", webhook_url: "https://example.com/hook" },
      db
    );
    expect(updated.title).toBe("Test intake v2");
    expect(updated.webhook_url).toContain("example.com");

    const parsed = validateAnswers(form.schema, {
      n: "Sam",
      e: "sam@example.com",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const response = createResponse(form.id, parsed.data, db);
    expect(listResponses(form.id, db)).toHaveLength(1);

    const csv = responsesToCsv(updated, listResponses(form.id, db));
    expect(csv).toContain("Name");
    expect(csv).toContain("Sam");

    const payload = exportFormPayload(updated, true, db);
    const imported = importFormPayload(payload, db);
    expect(imported.title).toBe("Test intake v2");
    expect(listResponses(imported.id, db).length).toBeGreaterThanOrEqual(1);
    expect(response.id).toBeTruthy();
  });
});
