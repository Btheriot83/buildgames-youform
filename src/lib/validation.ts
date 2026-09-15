import { z } from "zod";
import type { FormField, FormSchema, FieldType } from "./types";

const fieldTypeSchema = z.enum([
  "text",
  "email",
  "number",
  "textarea",
  "select",
  "boolean",
]);

export const formFieldSchema = z.object({
  id: z.string().min(1).max(64),
  type: fieldTypeSchema,
  label: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  required: z.boolean(),
  options: z.array(z.string().min(1).max(200)).max(50).optional(),
  placeholder: z.string().max(200).optional(),
});

export const formSchemaSchema = z.object({
  fields: z.array(formFieldSchema).max(100),
  thankYouMessage: z.string().max(2000).optional(),
});

export const formMetaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  webhook_url: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
});

function valueForField(field: FormField, value: unknown): unknown {
  if (value === undefined || value === null || value === "") {
    return field.required ? undefined : null;
  }
  return value;
}

export function validateAnswers(
  schema: FormSchema,
  answers: Record<string, unknown>
): { ok: true; data: Record<string, unknown> } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};

  for (const field of schema.fields) {
    const raw = valueForField(field, answers[field.id]);

    if (raw === undefined) {
      errors[field.id] = "This answer is required.";
      continue;
    }
    if (raw === null) {
      data[field.id] = null;
      continue;
    }

    switch (field.type as FieldType) {
      case "email": {
        const parsed = z.string().email().safeParse(raw);
        if (!parsed.success) {
          errors[field.id] = "Enter a valid email address.";
        } else {
          data[field.id] = parsed.data;
        }
        break;
      }
      case "number": {
        const n = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(n)) {
          errors[field.id] = "Enter a valid number.";
        } else {
          data[field.id] = n;
        }
        break;
      }
      case "boolean": {
        if (typeof raw === "boolean") {
          data[field.id] = raw;
        } else if (raw === "true" || raw === "yes") {
          data[field.id] = true;
        } else if (raw === "false" || raw === "no") {
          data[field.id] = false;
        } else {
          errors[field.id] = "Choose yes or no.";
        }
        break;
      }
      case "select": {
        const str = String(raw);
        const options = field.options ?? [];
        if (!options.includes(str)) {
          errors[field.id] = "Choose one of the listed options.";
        } else {
          data[field.id] = str;
        }
        break;
      }
      case "textarea":
      case "text":
      default: {
        const str = String(raw).trim();
        if (field.required && !str) {
          errors[field.id] = "This answer is required.";
        } else if (str.length > 5000) {
          errors[field.id] = "Answer is too long (max 5000 characters).";
        } else {
          data[field.id] = str;
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "form";
}

export function newFieldId(): string {
  return `f_${Math.random().toString(36).slice(2, 10)}`;
}
