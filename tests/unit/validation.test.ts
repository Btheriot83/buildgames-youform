import { describe, expect, it } from "vitest";
import { slugify, validateAnswers } from "../../src/lib/validation";
import type { FormSchema } from "../../src/lib/types";

const schema: FormSchema = {
  fields: [
    { id: "name", type: "text", label: "Name", required: true },
    { id: "email", type: "email", label: "Email", required: true },
    { id: "budget", type: "number", label: "Budget", required: false },
    {
      id: "kind",
      type: "select",
      label: "Kind",
      required: true,
      options: ["A", "B"],
    },
    { id: "ready", type: "boolean", label: "Ready", required: true },
  ],
};

describe("slugify", () => {
  it("makes kebab slugs", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });
});

describe("validateAnswers", () => {
  it("accepts a complete payload", () => {
    const result = validateAnswers(schema, {
      name: "Avery",
      email: "avery@example.com",
      budget: "40",
      kind: "A",
      ready: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.budget).toBe(40);
      expect(result.data.ready).toBe(true);
    }
  });

  it("rejects invalid email and missing required", () => {
    const result = validateAnswers(schema, {
      name: "",
      email: "nope",
      kind: "Z",
      ready: "maybe",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeTruthy();
      expect(result.errors.email).toBeTruthy();
      expect(result.errors.kind).toBeTruthy();
      expect(result.errors.ready).toBeTruthy();
    }
  });
});
