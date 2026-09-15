"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FieldType, FormField, FormRecord, FormSchema } from "@/lib/types";
import { newFieldId } from "@/lib/validation";
import { StatusBanner } from "./StatusBanner";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "boolean", label: "Yes / No" },
];

type Props = { form: FormRecord };

type AiMeta = { available: boolean; provider: "xai" | "openai" | "anthropic" | "none" };

export function FormEditor({ form }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description);
  const [slug, setSlug] = useState(form.slug);
  const [webhook, setWebhook] = useState(form.webhook_url || "");
  const [schema, setSchema] = useState<FormSchema>(form.schema);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [brief, setBrief] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [aiMeta, setAiMeta] = useState<AiMeta>({ available: false, provider: "none" });
  const [aiNote, setAiNote] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/ai/schema")
      .then((r) => r.json())
      .then((d: AiMeta) => setAiMeta(d))
      .catch(() => setAiMeta({ available: false, provider: "none" }));
  }, []);

  const shareUrl = useMemo(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "";
    return `${origin}/f/${slug}`;
  }, [slug]);

  function updateField(id: string, patch: Partial<FormField>) {
    setSchema((s) => ({
      ...s,
      fields: s.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }

  function removeField(id: string) {
    setSchema((s) => ({ ...s, fields: s.fields.filter((f) => f.id !== id) }));
  }

  function moveField(id: string, dir: -1 | 1) {
    setSchema((s) => {
      const idx = s.fields.findIndex((f) => f.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= s.fields.length) return s;
      const fields = [...s.fields];
      const [item] = fields.splice(idx, 1);
      fields.splice(next, 0, item);
      return { ...s, fields };
    });
  }

  function addField() {
    const field: FormField = {
      id: newFieldId(),
      type: "text",
      label: "New question",
      required: true,
    };
    setSchema((s) => ({ ...s, fields: [...s.fields, field] }));
  }

  async function draftFromBrief() {
    if (!brief.trim()) {
      setMessage({ tone: "error", text: "Write a plain-English brief first." });
      return;
    }
    setDrafting(true);
    setMessage(null);
    setAiNote(null);
    try {
      const res = await fetch("/api/ai/schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ tone: "error", text: data.error || "Draft failed" });
        return;
      }
      setTitle(data.title || title);
      setDescription(data.description || description);
      setSchema(data.schema);
      setAiNote(data.note || null);
      setMessage({
        tone: "ok",
        text:
          data.mode === "llm"
            ? `Schema drafted via ${data.provider}. Review before saving.`
            : "Local heuristic draft (no API key). Review before saving.",
      });
    } catch {
      setMessage({ tone: "error", text: "Network error while drafting." });
    } finally {
      setDrafting(false);
    }
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          slug,
          webhook_url: webhook || null,
          schema,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ tone: "error", text: data.error || "Save failed" });
        return;
      }
      setSlug(data.form.slug);
      setMessage({ tone: "ok", text: "Saved." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "Network error while saving." });
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setMessage({ tone: "info", text: shareUrl });
    }
  }

  async function removeForm() {
    if (!confirm("Delete this form and all responses?")) return;
    const res = await fetch(`/api/forms/${form.id}`, { method: "DELETE" });
    if (res.ok) router.push("/");
    else setMessage({ tone: "error", text: "Could not delete." });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="card p-6 sm:p-8">
        <p className="eyebrow">Schema</p>
        <h1 className="font-letter mt-2 text-3xl tracking-tight">Compose the letter</h1>

        <div className="mt-6 border-b border-[var(--rule)] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">From a brief</p>
            <span className="degraded-pill">
              {aiMeta.available
                ? aiMeta.provider === "xai"
                  ? "xAI live"
                  : aiMeta.provider === "anthropic"
                    ? "LLM live"
                    : "OpenAI live"
                : "degraded · local draft"}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Tell us what you need to ask. We draft the questions; you keep the pen.
          </p>
          <textarea
            className="field-box mt-3 min-h-[96px]"
            placeholder="e.g. Wedding RSVP: name, email, attending yes/no, guest count, meal choice (chicken/fish/veg), notes"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            aria-label="Plain-English form brief"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-moss"
              onClick={draftFromBrief}
              disabled={drafting}
            >
              {drafting ? "Drafting…" : "Draft from brief"}
            </button>
            {!aiMeta.available && (
              <span className="self-center text-xs text-[var(--ink-mute)]">
                Set XAI_API_KEY / GROK_API_KEY / OPENAI_API_KEY for model drafts
              </span>
            )}
          </div>
          {aiNote && <p className="mt-2 text-xs text-[var(--ink-mute)]">{aiNote}</p>}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" className="field-box" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="desc">Description</label>
            <textarea id="desc" className="field-box min-h-[88px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="slug">Public slug</label>
              <input id="slug" className="field-box font-mono text-sm" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="webhook">Webhook URL (optional)</label>
              <input id="webhook" className="field-box font-mono text-sm" placeholder="https://…" value={webhook} onChange={(e) => setWebhook(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="thanks">Thank-you message</label>
            <input
              id="thanks"
              className="field-box"
              value={schema.thankYouMessage || ""}
              onChange={(e) => setSchema({ ...schema, thankYouMessage: e.target.value })}
            />
          </div>
        </div>

        <hr className="rule my-8" />

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-letter text-xl">Questions</h2>
          <button type="button" className="btn btn-ghost" onClick={addField}>
            Add a line
          </button>
        </div>

        <ul className="mt-4 space-y-4">
          {schema.fields.length === 0 && (
            <li className="rounded-sm border border-dashed border-[var(--rule-strong)] p-6 text-[var(--ink-mute)]">
              No questions yet — draft from a brief or add one by hand.
            </li>
          )}
          {schema.fields.map((f, i) => (
            <li key={f.id} className="rounded-sm border border-[var(--rule)] bg-[#fffdf9] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--ink-mute)]">
                  #{i + 1}
                </span>
                <div className="flex gap-1">
                  <button type="button" className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => moveField(f.id, -1)} aria-label="Move up">↑</button>
                  <button type="button" className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => moveField(f.id, 1)} aria-label="Move down">↓</button>
                  <button type="button" className="btn btn-ghost !px-2 !py-1 text-xs text-[var(--danger)]" onClick={() => removeField(f.id)}>Remove</button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor={`label-${f.id}`}>Label</label>
                  <input id={`label-${f.id}`} className="field-box" value={f.label} onChange={(e) => updateField(f.id, { label: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor={`type-${f.id}`}>Type</label>
                  <select
                    id={`type-${f.id}`}
                    className="field-box"
                    value={f.type}
                    onChange={(e) => updateField(f.id, { type: e.target.value as FieldType })}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => updateField(f.id, { required: e.target.checked })}
                    />
                    Required
                  </label>
                </div>
                {f.type === "select" && (
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor={`opts-${f.id}`}>Options (comma-separated)</label>
                    <input
                      id={`opts-${f.id}`}
                      className="field-box"
                      value={(f.options || []).join(", ")}
                      onChange={(e) =>
                        updateField(f.id, {
                          options: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="label" htmlFor={`ph-${f.id}`}>Placeholder</label>
                  <input
                    id={`ph-${f.id}`}
                    className="field-box"
                    value={f.placeholder || ""}
                    onChange={(e) => updateField(f.id, { placeholder: e.target.value })}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save letter"}
          </button>
          <button type="button" className="btn btn-ghost text-[var(--danger)]" onClick={removeForm}>
            Delete
          </button>
        </div>
        {message && (
          <div className="mt-4">
            <StatusBanner tone={message.tone}>{message.text}</StatusBanner>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        {schema.fields.length > 0 && (
          <div className="letter-sheet !min-h-0 p-5">
            <p className="relative z-[1] eyebrow">Letter preview</p>
            <ol className="relative z-[1] mt-3 space-y-2">
              {schema.fields.map((f, i) => (
                <li key={f.id} className="font-letter text-[1.05rem] leading-snug text-[var(--ink)]">
                  <span className="letter-kicker mr-2">{i + 1}</span>
                  {f.label}
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="card p-6">
          <p className="eyebrow">Share</p>
          <p className="mt-2 break-all font-mono text-sm text-[var(--ink-soft)]">{shareUrl}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-moss" onClick={copyLink}>
              {copied ? "Copied" : "Copy link"}
            </button>
            <a className="btn btn-ghost" href={`/f/${slug}`} target="_blank" rel="noreferrer">
              Open public form
            </a>
            <a className="btn btn-ghost" href={`/forms/${form.id}/responses`}>
              Responses
            </a>
          </div>
          <p className="mt-4 text-sm text-[var(--ink-mute)]">
            Webhook is optional. If unset or unreachable, responses still save locally.
          </p>
        </div>
        <div className="card overflow-hidden">
          <img src="/art/wax-seal.png" alt="" className="mx-auto w-40 p-6" />
        </div>
      </aside>
    </div>
  );
}
