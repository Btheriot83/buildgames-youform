export function StatusBanner({
  tone,
  children,
}: {
  tone: "ok" | "error" | "info";
  children: React.ReactNode;
}) {
  const colors = {
    ok: "border-[var(--ok)] bg-[color-mix(in_srgb,var(--ok)_10%,white)] text-[var(--ok)]",
    error: "border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,white)] text-[var(--danger)]",
    info: "border-[var(--rule-strong)] bg-[var(--paper-raised)] text-[var(--ink-soft)]",
  }[tone];
  return (
    <div role="status" className={`rounded-sm border px-3 py-2 text-sm ${colors}`}>
      {children}
    </div>
  );
}
