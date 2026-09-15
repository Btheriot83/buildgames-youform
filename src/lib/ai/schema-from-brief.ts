import { randomUUID } from "crypto";
import type { FieldType, FormField, FormSchema } from "@/lib/types";

export type SchemaDraftResult = {
  title: string;
  description: string;
  schema: FormSchema;
  mode: "llm" | "local";
  provider: "xai" | "openai" | "anthropic" | "local";
  note: string;
};

const ALLOWED: FieldType[] = [
  "text",
  "email",
  "number",
  "textarea",
  "select",
  "boolean",
];

function slugifyLabel(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40) || "field"
  );
}

function normalizeFields(raw: unknown): FormField[] {
  if (!Array.isArray(raw)) return [];
  const out: FormField[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = String(o.label || "").trim();
    if (!label) continue;
    let type = String(o.type || "text").toLowerCase() as FieldType;
    if (!ALLOWED.includes(type)) type = "text";
    const field: FormField = {
      id:
        typeof o.id === "string" && o.id
          ? o.id
          : `f_${slugifyLabel(label)}_${randomUUID().slice(0, 6)}`,
      type,
      label,
      required: o.required !== false,
    };
    if (typeof o.description === "string" && o.description.trim()) {
      field.description = o.description.trim();
    }
    if (typeof o.placeholder === "string" && o.placeholder.trim()) {
      field.placeholder = o.placeholder.trim();
    }
    if (type === "select") {
      const opts = Array.isArray(o.options)
        ? o.options.map((x) => String(x).trim()).filter(Boolean)
        : [];
      field.options = opts.length ? opts : ["Option A", "Option B"];
    }
    out.push(field);
    if (out.length >= 12) break;
  }
  return out;
}

/** Heuristic local draft — honest degraded mode when no working API key. */
export function draftSchemaLocal(brief: string): SchemaDraftResult {
  const text = brief.trim();
  const lower = text.toLowerCase();
  let title = "Untitled correspondence";
  const firstLine = text.split(/[\n.!?]/).map((s) => s.trim()).find(Boolean) || "";
  if (firstLine.length > 3 && firstLine.length < 72) {
    title = firstLine.replace(/^(create|build|make|draft|write)\s+(a|an|the)\s+/i, "");
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  const fields: FormField[] = [];
  const push = (partial: Omit<FormField, "id">) => {
    fields.push({
      ...partial,
      id: `f_${slugifyLabel(partial.label)}_${fields.length + 1}`,
    });
  };

  const wantsName = /name|who|guest|attendee|client/.test(lower);
  const wantsEmail = /email|contact|rsvp|follow.?up|reach/.test(lower);
  const wantsPhone = /phone|call|sms|whatsapp/.test(lower);
  const wantsYesNo = /rsvp|attend|coming|available|interested|yes.?no|confirm/.test(lower);
  const wantsSelect = /choose|pick|option|plan|tier|size|prefer|which|meal/.test(lower);
  const wantsLong = /feedback|comment|note|tell|describe|why|story|detail/.test(lower);
  const wantsNumber = /how many|guests|quantity|budget|age|years|count/.test(lower);

  if (wantsName || fields.length === 0) {
    push({
      type: "text",
      label: "What should we call you?",
      required: true,
      placeholder: "Full name",
    });
  }
  if (wantsEmail) {
    push({
      type: "email",
      label: "Where can we write back?",
      required: true,
      placeholder: "you@example.com",
    });
  }
  if (wantsPhone) {
    push({
      type: "text",
      label: "Best phone number?",
      required: false,
      placeholder: "+1 …",
    });
  }
  if (wantsYesNo) {
    push({
      type: "boolean",
      label: /rsvp|attend|coming/.test(lower) ? "Will you be there?" : "Shall we proceed?",
      required: true,
    });
  }
  if (wantsNumber) {
    push({
      type: "number",
      label: /guest/.test(lower) ? "How many guests?" : "What number should we note?",
      required: false,
      placeholder: "0",
    });
  }
  if (wantsSelect) {
    push({
      type: "select",
      label: /meal/.test(lower) ? "Which meal do you prefer?" : "Which option fits best?",
      required: true,
      options: /meal/.test(lower)
        ? ["Chicken", "Fish", "Vegetarian"]
        : ["Option A", "Option B", "Option C"],
    });
  }
  if (wantsLong || fields.length < 3) {
    push({
      type: "textarea",
      label: "Anything else we should know?",
      required: false,
      placeholder: "A short note…",
    });
  }

  const description =
    text.length > 160 ? `${text.slice(0, 157).trim()}…` : text || "Drafted locally from your brief.";

  return {
    title,
    description,
    schema: {
      fields,
      thankYouMessage: "Thanks — your reply is sealed.",
    },
    mode: "local",
    provider: "local",
    note: "Drafted with local heuristics (no live LLM). Set BUILD_GAMES_LLM_API_KEY / XAI_API_KEY / OPENAI_API_KEY for model drafts.",
  };
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model did not return JSON");
  }
}

type ChatProvider = {
  provider: "xai" | "openai" | "anthropic";
  kind: "openai" | "anthropic";
  url: string;
  key: string;
  model: string;
};

const SYSTEM = `You draft conversational form schemas for Ember Forms.
Return ONLY JSON with keys: title (string), description (string), thankYouMessage (string), fields (array).
Each field: type (text|email|number|textarea|select|boolean), label, required (boolean), optional description, placeholder, options (string[] for select only).
Rules: 3–8 fields; one question = one clear human sentence; no purple SaaS tone; no emoji; no fake stats; select needs 2–6 options.`;

function sharedKey(): string | undefined {
  return (
    process.env.BUILD_GAMES_LLM_API_KEY?.trim() ||
    process.env.XAI_API_KEY?.trim() ||
    process.env.GROK_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.ANTHROPIC_AUTH_TOKEN?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim()
  );
}

function buildProviderAttempts(): ChatProvider[] {
  const shared = sharedKey();
  const out: ChatProvider[] = [];
  const seen = new Set<string>();
  const push = (p: ChatProvider) => {
    const k = `${p.provider}:${p.url}:${p.model}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(p);
  };

  const xaiKey =
    process.env.XAI_API_KEY?.trim() ||
    process.env.GROK_API_KEY?.trim() ||
    (shared?.startsWith("xai-") ? shared : undefined);
  if (xaiKey) {
    push({
      provider: "xai",
      kind: "openai",
      url: "https://api.x.ai/v1/chat/completions",
      key: xaiKey,
      model: process.env.XAI_MODEL?.trim() || "grok-2-latest",
    });
  }

  // Anthropic-compatible (incl. Z.AI gateway via ANTHROPIC_BASE_URL)
  const anthKey =
    process.env.ANTHROPIC_AUTH_TOKEN?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim() ||
    shared;
  const anthBase = (process.env.ANTHROPIC_BASE_URL || "").replace(/\/$/, "");
  if (anthKey && anthBase) {
    const model = (process.env.ANTHROPIC_MODEL || "glm-5.3").split("[")[0];
    push({
      provider: "anthropic",
      kind: "anthropic",
      url: `${anthBase}/v1/messages`,
      key: anthKey,
      model,
    });
  }

  const openaiKey =
    process.env.OPENAI_API_KEY?.trim() ||
    (shared && !shared.startsWith("xai-") ? shared : undefined);
  if (openaiKey) {
    push({
      provider: "openai",
      kind: "openai",
      url: `${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`,
      key: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    });
  }

  // Prefer trying shared key on xAI even if prefix unknown
  if (shared && !xaiKey) {
    push({
      provider: "xai",
      kind: "openai",
      url: "https://api.x.ai/v1/chat/completions",
      key: shared,
      model: process.env.XAI_MODEL?.trim() || "grok-2-latest",
    });
  }

  return out;
}

async function callProvider(provider: ChatProvider, brief: string): Promise<string | null> {
  if (provider.kind === "anthropic") {
    const res = await fetch(provider.url, {
      method: "POST",
      headers: {
        "x-api-key": provider.key,
        Authorization: `Bearer ${provider.key}`,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 1800,
        temperature: 0.4,
        system: SYSTEM,
        messages: [{ role: "user", content: `Plain-English brief:\n${brief}` }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    return data.content?.find((c) => c.type === "text")?.text ?? null;
  }

  const res = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Plain-English brief:\n${brief}` },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? null;
}

function resultFromRaw(
  raw: string,
  brief: string,
  provider: ChatProvider,
): SchemaDraftResult | null {
  try {
    const parsed = extractJsonObject(raw) as Record<string, unknown>;
    const fields = normalizeFields(parsed.fields);
    if (!fields.length) return null;
    return {
      title: String(parsed.title || "Untitled correspondence").slice(0, 120),
      description: String(parsed.description || brief).slice(0, 500),
      schema: {
        fields,
        thankYouMessage: String(
          parsed.thankYouMessage || "Thanks — your reply is sealed.",
        ).slice(0, 280),
      },
      mode: "llm",
      provider: provider.provider,
      note:
        provider.provider === "xai"
          ? "Drafted with xAI Grok."
          : provider.provider === "anthropic"
            ? "Drafted with Anthropic-compatible chat."
            : "Drafted with OpenAI-compatible chat.",
    };
  } catch {
    return null;
  }
}

export async function draftSchemaFromBrief(brief: string): Promise<SchemaDraftResult> {
  const cleaned = brief.trim();
  if (!cleaned) {
    return {
      ...draftSchemaLocal("A short intake form"),
      note: "Empty brief — local starter draft.",
    };
  }

  const attempts = buildProviderAttempts();
  for (const provider of attempts) {
    try {
      const raw = await callProvider(provider, cleaned);
      if (!raw) continue;
      const parsed = resultFromRaw(raw, cleaned, provider);
      if (parsed) return parsed;
    } catch {
      // next
    }
  }
  return draftSchemaLocal(cleaned);
}

export function aiAvailability(): {
  available: boolean;
  provider: "xai" | "openai" | "anthropic" | "none";
} {
  const attempts = buildProviderAttempts();
  if (!attempts.length) return { available: false, provider: "none" };
  return { available: true, provider: attempts[0].provider };
}
