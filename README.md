# Ember Forms

A personal, local-first replacement for the **Youform** core loop: schema-based form editor → conversational public share link → validation → response table → CSV export → optional webhook.

**Stack:** Next.js 15 · TypeScript · SQLite (`better-sqlite3` locally, `sql.js` on Vercel)

## Aesthetic

**Ember Ledger** — warm paper desk, terracotta ink, editorial Fraunces + Source Sans 3. Conversational replies feel like sealing correspondence, not filling a SaaS wizard. Progress “seals” mark questions answered.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sample forms labelled `[SAMPLE]` appear on first run — delete anytime.

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run install:all` | Install dependencies |
| `npm run dev` | Development server (Turbopack) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright smoke (needs prior `npm run build`) |
| `npm run build` | Production build |
| `npm run start` | Production-style local server |
| `npm run prod` | Build + start |

### Permissions / privacy

- Default mode is **single-user and private** (no auth product — anyone with the process can open the desk).
- Public share links (`/f/[slug]`) are intentionally reachable without login.
- Do not expose the desk UI on the public internet without your own access control (reverse proxy basic auth, VPN, etc.).

## Architecture

```
src/lib/db.ts          SQLite connection + migrations (better-sqlite3 / sql.js)
src/lib/forms.ts       Form / response CRUD, import/export, CSV
src/lib/validation.ts  Schema + answer validation (Zod)
src/lib/webhook.ts     Optional POST on submit (degraded if missing/fails)
src/app/api/...        REST for desk + public submit
src/app/f/[slug]       Conversational public form
src/components/...     Editor, desk, responses, conversation UI
data/youform.db        Local database file (gitignored)
```

## Data location & backup

- Default DB path: `data/youform.db` (override with `DATABASE_PATH` in `.env`).
- **Backup:** copy `data/youform.db` (and `-wal`/`-shm` if present after a clean stop), or use **Export JSON** / **Export CSV** per form from the responses page.
- **Import:** Desk → Import JSON (version-1 export payload).

## Environment

See `.env.example`:

- `DATABASE_PATH` — SQLite file path
- `WEBHOOK_TIMEOUT_MS` — outbound webhook timeout
- `NEXT_PUBLIC_APP_URL` — origin for share links in docs/copy helpers

No analytics, telemetry, ads, or third-party accounts.

## Webhook (optional)

Set a webhook URL on a form. On submit we POST JSON:

```json
{
  "event": "form.response.created",
  "formId": "...",
  "formSlug": "...",
  "responseId": "...",
  "answers": {},
  "submittedAt": "..."
}
```

**Degraded mode:** if the URL is empty or the request fails, the response is still stored locally. Delivery is best-effort — not guaranteed.

## SQLite on Vercel

**Local / VPS:** prefers native `better-sqlite3` writing to `data/youform.db` (or `DATABASE_PATH`).

**Vercel / serverless:** automatically falls back to pure-JS [`sql.js`](https://sql.js.org) when `VERCEL=1` is set, or when `better-sqlite3` fails to load. Data is persisted under `/tmp/ember-forms.db` when writable.

> **Demo caveat:** `/tmp` on Vercel is **ephemeral**. Cold starts (and new instances) may reset demo forms/responses. Sample data reseeds automatically. For durable hosted storage, run on a VPS with a volume or swap in [Turso](https://turso.tech) / libSQL (`@libsql/client`).

Force the Vercel path locally: `USE_SQLJS=1 npm run dev`.

`next.config` marks both `better-sqlite3` and `sql.js` as `serverExternalPackages`.

## Limitations (vs paid Youform)

Deliberately **not** included:

- Spam / abuse defense at scale
- Large template & integration catalogs
- Compliance controls, SSO, team roles
- Guaranteed webhook delivery / retries at scale

This is a polished personal tool, not a multi-tenant SaaS.

## Design notes (Lenny process)

- Seed-derived direction **Ember Ledger** (ember terracotta + bone paper + moss) — no purple SaaS clichés.
- Motion: step transitions, ink progress bar, seal dots as light gamification.
- Custom SVG marks/flourishes over flat gray chrome.

## License

Private contest candidate for Brandon Theriot / Build Games.


## AI schema-from-brief
Editor panel posts to `POST /api/ai/schema` with a plain-English brief.
Server-side only. Reads `BUILD_GAMES_LLM_API_KEY` (preferred), then tries Anthropic-compatible (`ANTHROPIC_BASE_URL`), xAI, OpenAI.
If no live provider answers, returns an honest local heuristic draft (`mode: "local"`).
Never expose keys to the client bundle.
