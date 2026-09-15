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
  const [introShown, setIntroShown] = useState(false);
  const [checkIn, setCheckIn] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const field: FormField | undefined = fields[index];
  const progress = useMemo(() => {
    if (!fields.length) return 0;
    if (phase === "done") return 100;
    if (phase === "intro") return 0;
    return Math.round(((index + (draft || boolDraft !== null ? 0.35 : 0)) / fields.length) * 100);
  }, [fields.length, index, phase, draft, boolDraft]);

  const stamps = useMemo(() => Math.min(index, fields.length), [index, fields.length]);

  useEffect(() => {
    if (phase === "intro") {
      setIntroShown(false);
      const id = requestAnimationFrame(() => setIntroShown(true));
      return () => cancelAnimationFrame(id);
    }
  }, [phase, animKey]);

  useEffect(() => {
    if (phase === "done") {
      setCheckIn(false);
      const id = requestAnimationFrame(() => setCheckIn(true));
      return () => cancelAnimationFrame(id);
    }
  }, [phase, animKey]);

  useEffect(() => {
    if (phase === "questions") inputRef.current?.focus();
  }, [phase, index, animKey]);

  function triggerShake() {
    setShaking(false);
    requestAnimationFrame(() => {
      setShaking(true);
      setTimeout(() => setShaking(false), 320);
    });
  }

  const goNext = useCallback(() => {
    setError(null);
    if (!field) return;

    let value: unknown;
    if (field.type === "boolean") {
      if (boolDraft === null) {
        setError("Choose yes or no.");
        triggerShake();
        return;
      }
      value = boolDraft;
    } else if (field.type === "number") {
      if (draft.trim() === "") {
        if (field.required) {
          setError("This answer is required.");
          triggerShake();
          return;
        }
        value = null;
      } else {
        const n = Number(draft);
        if (!Number.isFinite(n)) {
          setError("Enter a valid number.");
          triggerShake();
          return;
        }
        value = n;
      }
    } else if (field.type === "email") {
      const v = draft.trim();
      if (!v) {
        if (field.required) {
          setError("This answer is required.");
          triggerShake();
          return;
        }
        value = null;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setError("Enter a valid email address.");
        triggerShake();
        return;
      } else {
        value = v;
      }
    } else if (field.type === "select") {
      if (!draft) {
        setError("Choose one of the listed options.");
        triggerShake();
        return;
      }
      value = draft;
    } else {
      const v = draft.trim();
      if (!v && field.required) {
        setError("This answer is required.");
        triggerShake();
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
        triggerShake();
        setPhase("questions");
        return;
      }
      setThankYou(data.thankYouMessage || thankYou);
      setPhase("done");
      setAnimKey((k) => k + 1);
    } catch {
      setError("Network error — try again.");
      triggerShake();
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
    if (field?.type === "boolean") {
      if (e.key === "y" || e.key === "Y" || e.key === "1") {
        setBoolDraft(true);
        setError(null);
      }
      if (e.key === "n" || e.key === "N" || e.key === "2") {
        setBoolDraft(false);
        setError(null);
      }
    }
    if (field?.type === "select" && field.options?.length) {
      const n = Number(e.key);
      if (n >= 1 && n <= field.options.length) {
        setDraft(field.options[n - 1]);
        setError(null);
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-14" onKeyDown={onKeyDown}>
      <div className="mb-4 flex items-center gap-3">
        <div
          className="h-[2px] min-w-0 flex-1 overflow-hidden bg-[var(--rule)]"
          role="progressbar"
          aria-valuenow={Math.min(100, Math.round(progress))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Form progress"
        >
          <div
            className="progress-fill h-full bg-[var(--ember)]"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="letter-kicker shrink-0 tabular-nums">
          {phase === "done"
            ? "Sealed"
            : phase === "intro"
              ? `${fields.length}`
              : `${Math.min(index + 1, fields.length)}/${fields.length}`}
        </div>
        <div className="seal-row shrink-0" aria-label={`${stamps} seals earned`}>
          {fields.map((_, i) => (
            <span key={i} className={`seal-dot ${i < stamps || phase === "done" ? "is-lit" : ""}`} />
          ))}
        </div>
      </div>

      {phase === "intro" && (
        <div key={`intro-${animKey}`} className="letter-sheet step-enter mt-6 p-8 sm:p-12">
          <div className={`t-stagger relative z-[1] ${introShown ? "is-shown" : ""}`}>
            <h1 className="t-stagger-line t-stagger-line--2 letter-question mt-4">{title}</h1>
            {description ? (
              <p className="t-stagger-line t-stagger-line--3 mt-5 max-w-xl text-[1.05rem] leading-relaxed text-[var(--ink-soft)]">
                {description}
              </p>
            ) : null}
          </div>
          <div className="relative z-[1] mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPhase("questions");
                setAnimKey((k) => k + 1);
              }}
            >
              Open the letter
            </button>
            <span className="letter-hint">
              {fields.length} question{fields.length === 1 ? "" : "s"} · Enter advances
            </span>
          </div>
        </div>
      )}

      {phase === "questions" && field && (
        <div key={`q-${animKey}`} className="letter-sheet step-enter mt-6 p-8 sm:p-12">
          <div className="relative z-[1]">
            <h2 className="letter-question mt-4">{field.label}</h2>
            <span className="ink-rule" aria-hidden="true" />
            {field.description ? (
              <p className="mt-3 max-w-xl text-[var(--ink-soft)]">{field.description}</p>
            ) : null}

            <div className={`t-input-wrap mt-10 ${error ? "is-error" : ""}`}>
              <div className={`t-input ${error ? "is-error" : ""} ${shaking ? "is-shaking" : ""}`}>
                {field.type === "textarea" ? (
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    className={`field min-h-[140px] font-letter text-lg ${error ? "field-error" : ""}`}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setError(null);
                    }}
                    placeholder={field.placeholder || "Write your reply…"}
                    aria-label={field.label}
                    aria-invalid={!!error}
                  />
                ) : field.type === "select" ? (
                  <div className="space-y-2" role="listbox" aria-label={field.label}>
                    {(field.options || []).map((o, i) => (
                      <button
                        key={o}
                        type="button"
                        role="option"
                        aria-selected={draft === o}
                        className={`choice-chip ${draft === o ? "is-on" : ""}`}
                        onClick={() => {
                          setDraft(o);
                          setError(null);
                        }}
                      >
                        <span className="font-letter text-[1.05rem]">{o}</span>
                        <kbd>{i + 1}</kbd>
                      </button>
                    ))}
                  </div>
                ) : field.type === "boolean" ? (
                  <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label={field.label}>
                    {[
                      { v: true, label: "Yes", key: "Y" },
                      { v: false, label: "No", key: "N" },
                    ].map((opt) => (
                      <button
                        key={String(opt.v)}
                        type="button"
                        className={`choice-chip ${boolDraft === opt.v ? "is-on" : ""}`}
                        onClick={() => {
                          setBoolDraft(opt.v);
                          setError(null);
                        }}
                        aria-pressed={boolDraft === opt.v}
                      >
                        <span className="font-letter text-lg">{opt.label}</span>
                        <kbd>{opt.key}</kbd>
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    className={`field font-letter text-xl ${error ? "field-error" : ""}`}
                    type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setError(null);
                    }}
                    placeholder={field.placeholder || "Type your answer…"}
                    aria-label={field.label}
                    aria-invalid={!!error}
                  />
                )}
              </div>
              {error && (
                <p className="t-error-msg mt-3 text-sm text-[var(--danger)]" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-ghost" onClick={goBack}>
                Back
              </button>
              <button type="button" className="btn btn-primary" onClick={goNext}>
                {index >= fields.length - 1 ? "Press the seal" : "Continue"}
              </button>
              <span className="letter-hint">
                {field.required ? "Required" : "Optional"} · press Enter
              </span>
            </div>
          </div>
        </div>
      )}

      {phase === "submitting" && (
        <div className="letter-sheet step-enter mt-6 p-10 text-center">
          <p className="eyebrow relative z-[1]">Sending</p>
          <p className="letter-question relative z-[1] mt-4 text-2xl">Sealing your reply…</p>
        </div>
      )}

      {phase === "done" && (
        <div key={`done-${animKey}`} className="letter-sheet step-enter mt-6 p-10 text-center">
          <div className="relative z-[1]">
            <img
              src="/art/wax-seal.png"
              alt=""
              width={88}
              height={88}
              className="seal-press mx-auto rounded-full shadow-md"
              data-state={checkIn ? "in" : "out"}
            />
            <h2 className="letter-question mt-6 text-3xl">Sealed.</h2>
            <p className="mx-auto mt-4 max-w-md text-[var(--ink-soft)]">{thankYou}</p>
          </div>
        </div>
      )}

      {phase === "fatal" && (
        <div className="letter-sheet mt-6 p-10 text-center">
          <p className="letter-question relative z-[1] text-2xl">This form has no questions.</p>
        </div>
      )}
    </div>
  );
}
