import Link from "next/link";

export function SiteHeader({
  trail,
}: {
  trail?: Array<{ href?: string; label: string }>;
}) {
  return (
    <>
      <div className="job-tape" aria-hidden>
        <span>1 · Write questions</span>
        <span>2 · Share fill link</span>
        <span>3 · Read replies</span>
        <span>Canary clipboard</span>
      </div>
      <header className="border-b-[3px] border-[var(--ink)] bg-[var(--sheet-raised)]">
        <div className="shell flex items-center justify-between gap-4 py-3.5">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/art/shop-stamp.jpg"
              alt=""
              width={52}
              height={52}
              className="site-mark-lg object-cover"
            />
            <div>
              <div className="font-mark text-xl leading-none tracking-tight group-hover:text-[var(--stamp)] transition-colors">
                Ember Forms
              </div>
              <div className="eyebrow mt-1.5 !text-[var(--ink-mute)]">intake clipboard · not a survey wizard</div>
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
    </>
  );
}
