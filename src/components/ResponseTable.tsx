"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormRecord, ResponseRecord } from "@/lib/types";
import { StatusBanner } from "./StatusBanner";

type Props = {
  form: FormRecord;
  initialResponses: ResponseRecord[];
};

export function ResponseTable({ form, initialResponses }: Props) {
  const router = useRouter();
  const [responses, setResponses] = useState(initialResponses);
  const [error, setError] = useState<string | null>(null);
  const fields = form.schema.fields;
  const lead = fields[0];

  async function remove(id: string) {
    if (!confirm("Delete this reply?")) return;
    setError(null);
    const res = await fetch(
      `/api/forms/${form.id}/responses?responseId=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Delete failed");
      return;
    }
    setResponses((r) => r.filter((x) => x.id !== id));
    router.refresh();
  }

  function fmt(v: unknown) {
    if (v === null || v === undefined) return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    return String(v);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Replies · filled clipboards</p>
          <h1 className="font-sheet mt-2 text-3xl tracking-tight">{form.title}</h1>
          <p className="mt-2 text-[var(--ink-mute)]">
            {responses.length} repl{responses.length === 1 ? "y" : "ies"} from public fill
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-primary" href={`/f/${form.slug}`} target="_blank" rel="noreferrer">
            Open public fill
          </a>
          <a className="btn btn-ghost" href={`/api/forms/${form.id}/export?format=csv`}>
            Export CSV
          </a>
          <a className="btn btn-ghost" href={`/forms/${form.id}`}>
            Edit questions
          </a>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <StatusBanner tone="error">{error}</StatusBanner>
        </div>
      )}

      {responses.length === 0 ? (
        <div className="card mt-8 p-10 text-center text-[var(--ink-soft)]">
          No replies yet. Share the public fill{" "}
          <a className="underline underline-offset-4" href={`/f/${form.slug}`}>
            /f/{form.slug}
          </a>
          .
        </div>
      ) : (
        <>
          <ul className="mt-8 grid gap-3">
            {responses.map((r) => (
              <li key={r.id} className="letter-sheet letter-tray !min-h-0 p-5">
                <div className="relative z-[1] flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-sheet text-2xl text-[var(--ink)]">
                      {lead ? fmt(r.answers[lead.id]) : "Reply"}
                    </p>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[var(--ink-mute)]">
                      {new Date(r.created_at).toLocaleString("en-US", { timeZone: "America/Phoenix" })} PT
                    </p>
                    <dl className="mt-3 grid gap-1 text-sm text-[var(--ink-soft)]">
                      {fields.slice(1, 5).map((f) => (
                        <div key={f.id} className="flex flex-wrap gap-2">
                          <dt className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--ink-mute)]">
                            {f.label}
                          </dt>
                          <dd>{fmt(r.answers[f.id])}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost !py-1 text-[var(--danger)]"
                    onClick={() => void remove(r.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="card mt-8 overflow-x-auto">
            <p className="border-b-2 border-[var(--ink)] bg-[var(--sheet)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--ink-mute)]">
              Spreadsheet view
            </p>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--rule)] bg-[var(--sheet)] font-mono text-xs uppercase tracking-wider text-[var(--ink-mute)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  {fields.map((f) => (
                    <th key={f.id} className="px-4 py-3 font-medium">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--rule)] last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-mute)]">
                      {new Date(r.created_at).toLocaleString("en-US", { timeZone: "America/Phoenix" })}
                    </td>
                    {fields.map((f) => (
                      <td key={f.id} className="max-w-xs truncate px-4 py-3" title={fmt(r.answers[f.id])}>
                        {fmt(r.answers[f.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
