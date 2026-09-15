import Link from "next/link";

export function SiteHeader({
  trail,
}: {
  trail?: Array<{ href?: string; label: string }>;
}) {
  return (
    <header className="border-b border-[var(--rule)] bg-[var(--paper-raised)]">
      <div className="shell flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/art/ember-mark.svg"
            alt=""
            width={34}
            height={34}
            className="rounded-sm"
          />
          <div>
            <div className="font-mark text-lg leading-none tracking-tight group-hover:text-[var(--ember)] transition-colors">
              Ember Forms
            </div>
            <div className="eyebrow mt-1 !text-[var(--ink-mute)]">letters, not surveys</div>
          </div>
        </Link>
        {trail && trail.length > 0 && (
          <nav aria-label="Breadcrumb" className="text-sm text-[var(--ink-mute)]">
            <ol className="flex flex-wrap items-center gap-2">
              {trail.map((t, i) => (
                <li key={`${t.label}-${i}`} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {t.href ? (
                    <Link href={t.href} className="hover:text-[var(--ink)] underline-offset-4 hover:underline">
                      {t.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--ink-soft)]">{t.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </header>
  );
}
