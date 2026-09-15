"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormRecord } from "@/lib/types";
import { StatusBanner } from "./StatusBanner";

type FormRow = FormRecord & { responseCount: number };

function displayTitle(title: string) {
  return title.replace(/^\[SAMPLE\]\s*/i, "").trim() || title;
}

export function Dashboard({ initialForms }: { initialForms: FormRow[] }) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const demo = forms.find((f) => f.slug === "az-diesel-intake") || forms[0];

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
        body: JSON.stringify({ title: "New intake form" }),
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
      <div className="desk-billboard">
        <div className="desk-billboard-copy">
          <div>
            <p className="eyebrow">Form builder desk</p>
            <h1 className="billboard-title">
              Write questions.
              <br />
              Share the fill.
              <br />
              Read replies.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-[var(--ink-soft)]">
              Build a conversational intake on a canary clipboard. One question at a time for the public link — replies land back on this desk.
            </p>
            <div className="job-loop mt-4" aria-label="Product loop">
              <span>Write</span>
              <span>Share fill</span>
              <span>Read replies</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={createForm} disabled={busy}>
              Write questions
            </button>
            {demo && (
              <Link className="btn btn-amber" href={`/f/${demo.slug}`} target="_blank">
                Try public fill
              </Link>
            )}
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
        <aside className="desk-materials" aria-hidden>
          <figure className="desk-plate">
            <img src="/art/clipboard-hero.jpg" alt="" />
            <figcaption>Aluminum clip · canary sheet · shop stamp</figcaption>
          </figure>
          <div className="seal-plate">
            <img src="/art/shop-stamp.jpg" alt="" />
            <p>Stamp presses when they finish</p>
          </div>
        </aside>
      </div>

      {demo && (
        <div className="demo-rail">
          <div>
            <p className="eyebrow">First-run demo</p>
            <p className="mt-1 font-sheet text-xl text-[var(--ink)]">{displayTitle(demo.title)}</p>
            <p>
              Open the public fill, answer like a driver on the roadside, then check replies on the desk.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-primary" href={`/f/${demo.slug}`} target="_blank">
              Open public fill
            </Link>
            <Link className="btn btn-ghost" href={`/forms/${demo.id}`}>
              Edit questions
            </Link>
            <Link className="btn btn-ghost" href={`/forms/${demo.id}/responses`}>
              Read replies
            </Link>
          </div>
        </div>
      )}

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
            <div key={i} className="h-16 rounded-sm border border-[var(--rule)] bg-[var(--sheet-raised)]" />
          ))}
        </div>
        <div className="t-skel-content">
          {forms.length === 0 ? (
            <div className="card overflow-hidden text-center">
              <img src="/art/clipboard-hero.jpg" alt="" className="mx-auto max-h-56 w-full object-cover" />
              <div className="p-8">
                <p className="font-sheet text-2xl">Clipboard is empty</p>
                <p className="mt-2 text-sm text-[var(--ink-mute)]">
                  Write the first questions, or draft them from a plain-English brief.
                </p>
                <button type="button" className="btn btn-primary mt-6" onClick={createForm} disabled={busy}>
                  Write questions
                </button>
              </div>
            </div>
          ) : (
            <ul className="grid gap-3">
              {forms.map((f) => (
                <li
                  key={f.id}
                  className="letter-sheet letter-tray !min-h-0 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="relative z-[1] min-w-0 pr-10">
                    <Link
                      href={`/forms/${f.id}`}
                      className="font-sheet text-xl tracking-tight hover:text-[var(--stamp)]"
                    >
                      {displayTitle(f.title)}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--ink-mute)]">
                      <span className="font-mono text-xs">/f/{f.slug}</span>
                      <span>
                        {f.responseCount} repl{f.responseCount === 1 ? "y" : "ies"}
                      </span>
                    </div>
                  </div>
                  <div className="relative z-[1] flex flex-wrap gap-2">
                    <Link className="btn btn-ghost !py-2" href={`/forms/${f.id}`}>
                      Edit questions
                    </Link>
                    <Link
                      className="btn btn-ghost relative !py-2"
                      href={`/forms/${f.id}/responses`}
                      style={{ position: "relative" }}
                    >
                      Replies
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
                    <Link className="btn btn-amber !py-2" href={`/f/${f.slug}`} target="_blank">
                      Public fill
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
