export function StatusBanner({
  tone,
  children,
}: {
  tone: "ok" | "error" | "info";
  children: React.ReactNode;
}) {
  const styles =
    tone === "ok"
      ? "border-[var(--ok)] bg-[var(--sheet-raised)] text-[var(--ok)]"
      : tone === "error"
        ? "border-[var(--danger)] bg-[var(--sheet-raised)] text-[var(--danger)]"
        : "border-[var(--ink)] bg-[var(--sheet-raised)] text-[var(--ink-soft)]";
  return (
    <div className={`rounded-sm border-2 px-4 py-3 text-sm ${styles}`} role="status">
      {children}
    </div>
  );
}
