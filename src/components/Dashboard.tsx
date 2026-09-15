"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormRecord } from "@/lib/types";
import { StatusBanner } from "./StatusBanner";

type FormRow = FormRecord & { responseCount: number };

export function Dashboard({ initialForms }: { initialForms: FormRow[] }) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForms(initialForms);
    setRevealed(false);
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, [initialForms]);

  useEffect(() => {
    if (!ok) {
      setToastOpen(false);
      return;
    }
    setToastOpen(false);
    const id = requestAnimationFrame(() => setToastOpen(true));
    const t = setTimeout(() => setToastOpen(false), 2200);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [ok]);

  async function createForm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled form" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create form");
        return;
      }
      router.push(`/forms/${data.form.id}`);
    } catch {
      setError("Network error creating form.");
    } finally {
      setBusy(false);
    }
  }

  async function onImport(file: File) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/forms/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }
      setOk(`Imported “${data.form.title}”.`);
      router.refresh();
    } catch {
      setError("Import needs a valid Ember Forms JSON export.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Desk</p>
          <h1 className="font-letter mt-2 text-4xl tracking-tight sm:text-5xl">
            Correspondence desk
          </h1>
          <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
            One letter at a time. Draft the questions from a brief, share the link, read the replies.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={createForm} disabled={busy}>
            New letter
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {(error || ok) && (
        <div className="mt-6">
          {error && <StatusBanner tone="error">{error}</StatusBanner>}
          {ok && (
            <div
              className={`t-toast fixed bottom-6 right-6 z-40 rounded-sm border border-[var(--ok)] bg-[color-mix(in_srgb,var(--ok)_12%,white)] px-4 py-2 text-sm text-[var(--ok)] shadow-lg ${toastOpen ? "is-open" : ""}`}
              role="status"
            >
              {ok}
            </div>
          )}
        </div>
      )}

      <div className={`t-skel mt-10 ${revealed ? "is-revealed" : ""}`} data-state={revealed ? "ready" : "loading"}>
        <div className="t-skel-skeleton is-pulsing space-y-3" aria-hidden={!revealed}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-sm border border-[var(--rule)] bg-[var(--paper-raised)]" />
          ))}
        </div>
        <div className="t-skel-content">
          {forms.length === 0 ? (
            <div className="card overflow-hidden text-center">
              <img src="/art/empty-desk.png" alt="" className="mx-auto max-h-56 w-full object-cover" />
              <div className="p-8">
                <p className="font-letter text-2xl">Nothing on the blotter yet</p>
                <p className="mt-2 text-sm text-[var(--ink-mute)]">Begin blank, or open a letter and let the brief draft the questions.</p>
                <button type="button" className="btn btn-primary mt-6" onClick={createForm} disabled={busy}>
                  Write the first letter
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)] bg-[var(--paper-raised)] shadow-[var(--shadow)]">
              {forms.map((f) => (
                <li key={f.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/forms/${f.id}`}
                      className="font-letter text-xl tracking-tight hover:text-[var(--ember)]"
                    >
                      {f.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-[var(--ink-mute)]">
                      <span>/f/{f.slug}</span>
                      <span>{f.responseCount} response{f.responseCount === 1 ? "" : "s"}</span>
                      <span>{new Date(f.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link className="btn btn-ghost !py-2" href={`/forms/${f.id}`}>
                      Edit
                    </Link>
                    <Link
                      className="btn btn-ghost relative !py-2"
                      href={`/forms/${f.id}/responses`}
                      style={{ position: "relative" }}
                    >
                      Responses
                      <span
                        className="t-badge"
                        data-open={f.responseCount > 0 ? "true" : "false"}
                        aria-hidden={f.responseCount === 0}
                      >
                        <span className="t-badge-dot">
                          {f.responseCount > 99 ? "99+" : f.responseCount || ""}
                        </span>
                      </span>
                    </Link>
                    <Link className="btn btn-moss !py-2" href={`/f/${f.slug}`} target="_blank">
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
