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
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  const field: FormField | undefined = fields[index];
  const progress = useMemo(() => {
    if (!fields.length) return 0;
    if (phase === "done") return 100;
    if (phase === "intro") return 0;
    return Math.round((index / fields.length) * 100);
  }, [fields.length, index, phase]);

  const stamps = useMemo(() => {
    return Math.min(index, fields.length);
  }, [index, fields.length]);

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
    if (phase === "questions") {
      inputRef.current?.focus();
    }
  }, [phase, index, animKey]);

  // Sliding tabs pill for progress segments
  useEffect(() => {
    const bar = tabsRef.current;
    const pill = pillRef.current;
    if (!bar || !pill || !fields.length) return;
    const tabs = [...bar.querySelectorAll<HTMLElement>(".t-tab")];
    const activeIdx =
      phase === "done"
        ? fields.length - 1
        : phase === "intro"
          ? 0
          : Math.min(index, fields.length - 1);
    const tab = tabs[activeIdx];
    if (!tab) return;
    const animate = phase === "questions" || phase === "done";
    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      void pill.offsetWidth;
      pill.style.transition = prev;
    } else {
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
    }
  }, [phase, index, fields.length]);

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
        {fields.length > 0 && fields.length <= 12 && (
          <div
            ref={tabsRef}
            className="t-tabs mt-4"
            role="tablist"
            aria-label="Question progress"
          >
            <span className="t-tabs-pill" ref={pillRef} aria-hidden="true" />
            {fields.map((f, i) => (
              <button
                key={f.id}
                type="button"
                className="t-tab"
                role="tab"
                aria-selected={
                  phase === "done"
                    ? i === fields.length - 1
                    : phase === "questions"
                      ? i === index
                      : i === 0
                }
                tabIndex={-1}
                disabled
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {phase === "intro" && (
        <div key={`intro-${animKey}`} className="card p-8 sm:p-10">
          <div className={`t-stagger ${introShown ? "is-shown" : ""}`}>
            <p className="t-stagger-line t-stagger-line--1 eyebrow">Correspondence</p>
            <h1 className="t-stagger-line t-stagger-line--2 font-display mt-3 text-3xl leading-tight tracking-tight sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="t-stagger-line t-stagger-line--3 mt-4 text-[var(--ink-soft)]">
                {description}
              </p>
            ) : null}
          </div>
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

          <div
            className={`t-input-wrap mt-8 ${error ? "is-error" : ""}`}
            onKeyDown={onKeyDown}
          >
            <div className={`t-input ${error ? "is-error" : ""} ${shaking ? "is-shaking" : ""}`}>
              {field.type === "textarea" ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  className={`field min-h-[140px] ${error ? "field-error" : ""}`}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setError(null);
                  }}
                  placeholder={field.placeholder}
                  aria-label={field.label}
                  aria-invalid={!!error}
                />
              ) : field.type === "select" ? (
                <select
                  ref={inputRef as React.RefObject<HTMLSelectElement>}
                  className={`field ${error ? "field-error" : ""}`}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setError(null);
                  }}
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
                      onClick={() => {
                        setBoolDraft(v);
                        setError(null);
                      }}
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
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setError(null);
                  }}
                  placeholder={field.placeholder}
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
          <span
            className="t-success-check mx-auto text-[var(--ember)]"
            data-state={checkIn ? "in" : "out"}
            aria-hidden="true"
          >
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" opacity="0.35" />
              <path
                d="M14 25.5 L21 32.5 L34 16.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </span>
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
