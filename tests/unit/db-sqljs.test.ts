import { describe, expect, it } from "vitest";
import { createMemoryDbAsync } from "../../src/lib/db";
import {
  createForm,
  createResponse,
  listForms,
  listResponses,
} from "../../src/lib/forms";

describe("sql.js memory adapter", () => {
  it("supports form CRUD without better-sqlite3", async () => {
    const db = await createMemoryDbAsync();
    const form = createForm(
      {
        title: "SQLJS form",
        slug: "sqljs-form",
        schema: {
          fields: [{ id: "n", type: "text", label: "Name", required: true }],
          thankYouMessage: "ok",
        },
      },
      db
    );
    createResponse(form.id, { n: "Pat" }, db);
    expect(listForms(db).some((f) => f.slug === "sqljs-form")).toBe(true);
    expect(listResponses(form.id, db)).toHaveLength(1);
  });
});
