"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormField, FormSchema } from "@/lib/types";

type Props = {
  slug: string;
  title: string;
  description: string;
  schema: FormSchema;
};

type Phase = "intro" | "questions" | "submitting" | "done" | "fatal";

export function ConversationalForm({ slug, title, description, schema }: Props) {
  const fields = schema.fields;
  const [phase, setPhase] = useState<Phase>(fields.length ? "intro" : "fatal");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [draft, setDraft] = useState<string>("");
  const [boolDraft, setBoolDraft] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thankYou, setThankYou] = useState(schema.thankYouMessage || "Thanks.");
  const [animKey, setAnimKey] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  const field: FormField | undefined = fields[index];
  const progress = useMemo(() => {
    if (!fields.length) return 0;
    if (phase === "done") return 100;
    if (phase === "intro") return 0;
    return Math.round((index / fields.length) * 100);
  }, [fields.length, index, phase]);

  const stamps = useMemo(() => {
    // Light gamification: "stamps" collected as questions answered
    return Math.min(index, fields.length);
  }, [index, fields.length]);

  useEffect(() => {
    if (phase === "questions") {
      inputRef.current?.focus();
    }
  }, [phase, index, animKey]);

  const goNext = useCallback(() => {
    setError(null);
    if (!field) return;

    let value: unknown;
    if (field.type === "boolean") {
      if (boolDraft === null) {
        setError("Choose yes or no.");
        return;
      }
      value = boolDraft;
    } else if (field.type === "number") {
      if (draft.trim() === "") {
        if (field.required) {
          setError("This answer is required.");
          return;
        }
        value = null;
      } else {
        const n = Number(draft);
        if (!Number.isFinite(n)) {
          setError("Enter a valid number.");
          return;
        }
        value = n;
      }
    } else if (field.type === "email") {
      const v = draft.trim();
      if (!v) {
        if (field.required) {
          setError("This answer is required.");
          return;
        }
        value = null;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setError("Enter a valid email address.");
        return;
      } else {
        value = v;
      }
    } else if (field.type === "select") {
      if (!draft) {
        setError("Choose one of the listed options.");
        return;
      }
      value = draft;
    } else {
      const v = draft.trim();
      if (!v && field.required) {
        setError("This answer is required.");
        return;
      }
      value = v || null;
    }

    const nextAnswers = { ...answers, [field.id]: value };
    setAnswers(nextAnswers);
    setDraft("");
    setBoolDraft(null);

    if (index >= fields.length - 1) {
      void submit(nextAnswers);
      return;
    }
    setIndex((i) => i + 1);
    setAnimKey((k) => k + 1);
    // submit is stable enough for this flow; recreating goNext each render is fine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, boolDraft, draft, field, fields.length, index]);

  async function submit(finalAnswers: Record<string, unknown>) {
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/public/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json();
      if (!res.ok) {
        const first =
          data.errors && typeof data.errors === "object"
            ? (Object.values(data.errors)[0] as string)
            : data.error || "Could not submit.";
        setError(first);
        setPhase("questions");
        return;
      }
      setThankYou(data.thankYouMessage || thankYou);
      setPhase("done");
      setAnimKey((k) => k + 1);
    } catch {
      setError("Network error — try again.");
      setPhase("questions");
    }
  }

  function goBack() {
    if (index === 0) {
      setPhase("intro");
      return;
    }
    const prev = fields[index - 1];
    const prevVal = answers[prev.id];
    if (prev.type === "boolean") {
      setBoolDraft(typeof prevVal === "boolean" ? prevVal : null);
      setDraft("");
    } else {
      setDraft(prevVal === null || prevVal === undefined ? "" : String(prevVal));
      setBoolDraft(null);
    }
    setError(null);
    setIndex((i) => i - 1);
    setAnimKey((k) => k + 1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && field?.type !== "textarea") {
      e.preventDefault();
      goNext();
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-16">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 text-xs font-mono uppercase tracking-[0.14em] text-[var(--ink-mute)]">
          <span>
            {phase === "done"
              ? "Complete"
              : phase === "intro"
                ? "Ready"
                : `Question ${Math.min(index + 1, fields.length)} of ${fields.length}`}
          </span>
          <span aria-live="polite" className="text-[var(--ember)]">
            {stamps > 0 ? `${stamps} seal${stamps === 1 ? "" : "s"}` : "—"}
          </span>
        </div>
        <div
          className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[var(--rule)]"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Form progress"
        >
          <div
            className="progress-fill h-full bg-[var(--ember)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {fields.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                i < stamps || phase === "done"
                  ? "bg-[var(--ember)] ember-dot"
                  : i === index && phase === "questions"
                    ? "bg-[var(--moss)]"
                    : "bg-[var(--rule-strong)]"
              }`}
            />
          ))}
        </div>
      </div>

      {phase === "intro" && (
        <div key={`intro-${animKey}`} className="step-enter card p-8 sm:p-10">
          <p className="eyebrow">Correspondence</p>
          <h1 className="font-display mt-3 text-3xl leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-[var(--ink-soft)]">{description}</p>
          ) : null}
          <img
            src="/art/ledger-flourish.svg"
            alt=""
            className="mt-8 w-full opacity-90"
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPhase("questions");
                setAnimKey((k) => k + 1);
              }}
            >
              Begin
            </button>
            <span className="self-center text-sm text-[var(--ink-mute)]">
              {fields.length} question{fields.length === 1 ? "" : "s"} · Enter to advance
            </span>
          </div>
        </div>
      )}

      {phase === "questions" && field && (
        <div key={`q-${animKey}`} className="step-enter card p-8 sm:p-10">
          <p className="eyebrow">Q{index + 1}</p>
          <h2 className="font-display mt-3 text-2xl leading-snug sm:text-3xl">
            {field.label}
          </h2>
          {field.description ? (
            <p className="mt-3 text-[var(--ink-soft)]">{field.description}</p>
          ) : null}

          <div className="mt-8" onKeyDown={onKeyDown}>
            {field.type === "textarea" ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                className={`field min-h-[140px] ${error ? "field-error" : ""}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={field.placeholder}
                aria-label={field.label}
                aria-invalid={!!error}
              />
            ) : field.type === "select" ? (
              <select
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                className={`field ${error ? "field-error" : ""}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label={field.label}
                aria-invalid={!!error}
              >
                <option value="">Choose…</option>
                {(field.options || []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : field.type === "boolean" ? (
              <div className="flex gap-3" role="group" aria-label={field.label}>
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    className={`btn flex-1 ${
                      boolDraft === v ? "btn-primary" : "btn-ghost"
                    }`}
                    onClick={() => setBoolDraft(v)}
                    aria-pressed={boolDraft === v}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className={`field ${error ? "field-error" : ""}`}
                type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={field.placeholder}
                aria-label={field.label}
                aria-invalid={!!error}
              />
            )}
          </div>

          {error && (
            <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-ghost" onClick={goBack}>
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={goNext}>
              {index >= fields.length - 1 ? "Submit" : "Continue"}
            </button>
            <span className="text-sm text-[var(--ink-mute)]">
              {field.required ? "Required" : "Optional"}
            </span>
          </div>
        </div>
      )}

      {phase === "submitting" && (
        <div className="step-enter card p-10 text-center">
          <p className="eyebrow">Sending</p>
          <p className="font-display mt-4 text-2xl">Sealing your reply…</p>
          <div className="mx-auto mt-6 h-2 w-40 overflow-hidden rounded-full bg-[var(--rule)]">
            <div className="h-full w-1/2 animate-pulse bg-[var(--ember)]" />
          </div>
        </div>
      )}

      {phase === "done" && (
        <div key={`done-${animKey}`} className="step-enter card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ember)] text-xl text-[#fff9f2]">
            ✓
          </div>
          <h2 className="font-display mt-6 text-3xl">Sealed.</h2>
          <p className="mx-auto mt-4 max-w-md text-[var(--ink-soft)]">{thankYou}</p>
          <img
            src="/art/ledger-flourish.svg"
            alt=""
            className="mx-auto mt-8 w-full max-w-sm opacity-80"
          />
        </div>
      )}

      {phase === "fatal" && (
        <div className="card p-10 text-center">
          <p className="font-display text-2xl">This form has no questions.</p>
        </div>
      )}
    </div>
  );
}
