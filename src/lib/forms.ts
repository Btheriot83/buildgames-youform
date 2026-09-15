import { randomUUID } from "crypto";
import { getDb, type AppDatabase } from "./db";
import type {
  FormExportPayload,
  FormRecord,
  FormSchema,
  ResponseRecord,
} from "./types";
import { formMetaSchema, formSchemaSchema, slugify } from "./validation";

type FormRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  schema_json: string;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
};

type ResponseRow = {
  id: string;
  form_id: string;
  answers_json: string;
  created_at: string;
};

function mapForm(row: FormRow): FormRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    schema: JSON.parse(row.schema_json) as FormSchema,
    webhook_url: row.webhook_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapResponse(row: ResponseRow): ResponseRecord {
  return {
    id: row.id,
    form_id: row.form_id,
    answers: JSON.parse(row.answers_json) as Record<string, unknown>,
    created_at: row.created_at,
  };
}

function dbOr(db?: AppDatabase) {
  return db ?? getDb();
}

export function listForms(db?: AppDatabase): FormRecord[] {
  const rows = dbOr(db)
    .prepare("SELECT * FROM forms ORDER BY updated_at DESC")
    .all() as FormRow[];
  return rows.map(mapForm);
}

export function getFormById(
  id: string,
  db?: AppDatabase
): FormRecord | null {
  const row = dbOr(db)
    .prepare("SELECT * FROM forms WHERE id = ?")
    .get(id) as FormRow | undefined;
  return row ? mapForm(row) : null;
}

export function getFormBySlug(
  slug: string,
  db?: AppDatabase
): FormRecord | null {
  const row = dbOr(db)
    .prepare("SELECT * FROM forms WHERE slug = ?")
    .get(slug) as FormRow | undefined;
  return row ? mapForm(row) : null;
}

export function createForm(
  input: {
    title: string;
    description?: string;
    slug?: string;
    schema?: FormSchema;
    webhook_url?: string | null;
  },
  db?: AppDatabase
): FormRecord {
  const title = input.title.trim() || "New intake form";
  let slug = slugify(input.slug || title);
  const schema = formSchemaSchema.parse(
    input.schema ?? {
      fields: [
        {
          id: "f_name",
          type: "text",
          label: "Who is filling this out?",
          required: true,
          placeholder: "Name + company",
        },
        {
          id: "f_contact",
          type: "text",
          label: "Best phone or email?",
          required: true,
          placeholder: "(480) 555-0142",
        },
        {
          id: "f_need",
          type: "textarea",
          label: "What do you need us to know?",
          required: true,
          placeholder: "Unit, location, timing…",
        },
        {
          id: "f_urgent",
          type: "boolean",
          label: "Is this urgent?",
          required: true,
        },
      ],
      thankYouMessage: "Thanks — your answers are on the clipboard.",
    }
  );

  const database = dbOr(db);
  const existing = database
    .prepare("SELECT slug FROM forms WHERE slug = ?")
    .get(slug);
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  database
    .prepare(
      `INSERT INTO forms (id, slug, title, description, schema_json, webhook_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      slug,
      title,
      input.description ?? "",
      JSON.stringify(schema),
      input.webhook_url ?? null,
      now,
      now
    );

  return getFormById(id, database)!;
}

export function updateForm(
  id: string,
  patch: {
    title?: string;
    description?: string;
    slug?: string;
    schema?: FormSchema;
    webhook_url?: string | null;
  },
  db?: AppDatabase
): FormRecord {
  const current = getFormById(id, db);
  if (!current) {
    throw new Error("Form not found");
  }

  const meta = formMetaSchema.parse({
    title: patch.title ?? current.title,
    description: patch.description ?? current.description,
    slug: patch.slug ?? current.slug,
    webhook_url:
      patch.webhook_url === undefined
        ? current.webhook_url
        : patch.webhook_url || null,
  });

  const schema = patch.schema
    ? formSchemaSchema.parse(patch.schema)
    : current.schema;

  const database = dbOr(db);
  if (meta.slug !== current.slug) {
    const clash = database
      .prepare("SELECT id FROM forms WHERE slug = ? AND id != ?")
      .get(meta.slug, id);
    if (clash) {
      throw new Error("Slug already in use");
    }
  }

  const now = new Date().toISOString();
  database
    .prepare(
      `UPDATE forms SET title = ?, description = ?, slug = ?, schema_json = ?, webhook_url = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      meta.title,
      meta.description,
      meta.slug,
      JSON.stringify(schema),
      meta.webhook_url,
      now,
      id
    );

  return getFormById(id, database)!;
}

export function deleteForm(id: string, db?: AppDatabase): boolean {
  const result = dbOr(db).prepare("DELETE FROM forms WHERE id = ?").run(id);
  return result.changes > 0;
}

export function listResponses(
  formId: string,
  db?: AppDatabase
): ResponseRecord[] {
  const rows = dbOr(db)
    .prepare(
      "SELECT * FROM responses WHERE form_id = ? ORDER BY created_at DESC"
    )
    .all(formId) as ResponseRow[];
  return rows.map(mapResponse);
}

export function createResponse(
  formId: string,
  answers: Record<string, unknown>,
  db?: AppDatabase
): ResponseRecord {
  const id = randomUUID();
  const now = new Date().toISOString();
  dbOr(db)
    .prepare(
      `INSERT INTO responses (id, form_id, answers_json, created_at) VALUES (?, ?, ?, ?)`
    )
    .run(id, formId, JSON.stringify(answers), now);

  const row = dbOr(db)
    .prepare("SELECT * FROM responses WHERE id = ?")
    .get(id) as ResponseRow;
  return mapResponse(row);
}

export function deleteResponse(
  id: string,
  db?: AppDatabase
): boolean {
  const result = dbOr(db)
    .prepare("DELETE FROM responses WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

export function countResponses(
  formId: string,
  db?: AppDatabase
): number {
  const row = dbOr(db)
    .prepare("SELECT COUNT(*) as c FROM responses WHERE form_id = ?")
    .get(formId) as { c: number };
  return row.c;
}

export function exportFormPayload(
  form: FormRecord,
  includeResponses: boolean,
  db?: AppDatabase
): FormExportPayload {
  const payload: FormExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    form: {
      title: form.title,
      description: form.description,
      slug: form.slug,
      schema: form.schema,
      webhook_url: form.webhook_url,
    },
  };
  if (includeResponses) {
    payload.responses = listResponses(form.id, db).map((r) => ({
      answers: r.answers,
      created_at: r.created_at,
    }));
  }
  return payload;
}

export function importFormPayload(
  payload: unknown,
  db?: AppDatabase
): FormRecord {
  const data = payload as FormExportPayload;
  if (!data || data.version !== 1 || !data.form) {
    throw new Error("Invalid export file (expected version 1)");
  }
  const schema = formSchemaSchema.parse(data.form.schema);
  const form = createForm(
    {
      title: data.form.title,
      description: data.form.description ?? "",
      slug: data.form.slug,
      schema,
      webhook_url: data.form.webhook_url ?? null,
    },
    db
  );

  if (Array.isArray(data.responses)) {
    for (const r of data.responses) {
      createResponse(
        form.id,
        (r.answers ?? {}) as Record<string, unknown>,
        db
      );
    }
  }
  return form;
}

export function responsesToCsv(
  form: FormRecord,
  responses: ResponseRecord[]
): string {
  const fields = form.schema.fields;
  const headers = ["submitted_at", ...fields.map((f) => f.label), "response_id"];
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [headers.map(escape).join(",")];
  for (const r of responses) {
    const cells = [
      r.created_at,
      ...fields.map((f) => r.answers[f.id]),
      r.id,
    ];
    lines.push(cells.map(escape).join(","));
  }
  return lines.join("\n") + "\n";
}

export function getMeta(key: string, db?: AppDatabase): string | null {
  const row = dbOr(db)
    .prepare("SELECT value FROM meta WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setMeta(
  key: string,
  value: string,
  db?: AppDatabase
): void {
  dbOr(db)
    .prepare(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, value);
}
