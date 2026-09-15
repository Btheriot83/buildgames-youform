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

  async function remove(id: string) {
    if (!confirm("Delete this response?")) return;
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
          <p className="eyebrow">Replies</p>
          <h1 className="font-display mt-2 text-3xl tracking-tight">{form.title}</h1>
          <p className="mt-2 text-[var(--ink-mute)]">
            {responses.length} repl{responses.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-primary" href={`/api/forms/${form.id}/export?format=csv`}>
            Export CSV
          </a>
          <a className="btn btn-ghost" href={`/api/forms/${form.id}/export?format=json`}>
            Export JSON
          </a>
          <a className="btn btn-ghost" href={`/forms/${form.id}`}>
            Edit schema
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
        <div className="card mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--rule)] bg-[#faf4eb] font-mono text-xs uppercase tracking-wider text-[var(--ink-mute)]">
              <tr>
                <th className="px-4 py-3 font-medium">Submitted</th>
                {fields.map((f) => (
                  <th key={f.id} className="px-4 py-3 font-medium">
                    {f.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-b border-[var(--rule)] last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-mute)]">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  {fields.map((f) => (
                    <td key={f.id} className="max-w-xs truncate px-4 py-3" title={fmt(r.answers[f.id])}>
                      {fmt(r.answers[f.id])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-[var(--danger)] underline-offset-2 hover:underline"
                      onClick={() => void remove(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
