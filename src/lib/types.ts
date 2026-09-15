export type FieldType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "boolean";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FormSchema {
  fields: FormField[];
  thankYouMessage?: string;
}

export interface FormRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  schema: FormSchema;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResponseRecord {
  id: string;
  form_id: string;
  answers: Record<string, unknown>;
  created_at: string;
}

export interface FormExportPayload {
  version: 1;
  exportedAt: string;
  form: {
    title: string;
    description: string;
    slug: string;
    schema: FormSchema;
    webhook_url: string | null;
  };
  responses?: Array<{
    answers: Record<string, unknown>;
    created_at: string;
  }>;
}
