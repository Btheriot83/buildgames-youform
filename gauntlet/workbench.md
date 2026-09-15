# Ember Forms — Gauntlet Workbench

**Bar:** https://youform.com/ + live fill https://app.youform.com/forms/xrjcjyti  
**Demo:** https://buildgames-youform.vercel.app  
**Repo:** https://github.com/Btheriot83/buildgames-youform  
**Baseline (honest):** **3.8/10** — prior 8.7 critic score discarded per Brandon.

## Mobbin
Mobbin MCP returned paid-plan gate (2026-09-14 PT). Bar = live original screenshots + Typeform-class one-question fill comps from public web.

## Baseline blind A/B (Round 0)
| Shot | Path |
| --- | --- |
| Bar home | `shots/bar-youform-home.png` |
| Bar fill | `shots/bar-youform-fill.png` |
| Demo desk | `shots/r0-demo-desk.png` |
| Demo intro | `shots/r0-demo-intro.png` |

### Harsh critic (fresh, prefers original)
- **Winner: Original.** Youform fill is a focused full-bleed one-question stage with clear OK/Skip, top progress, spacious type hierarchy. Marketing home is dense product theater (AI builder CTA).
- **Candidate gaps:** (1) No AI schema-from-brief. (2) Fraunces-everywhere tell. (3) SVG flourishes / empty art, not real imagery. (4) Header `backdrop-blur` glass tell. (5) Desk list feels thin vs product desk. (6) Question stage still "card on paper" not correspondence sheet. (7) Select uses native `<select>` — loses letter feel.
- **Score after R0:** **3.8/10**

## Round log

## Round 1 — Letter sheet + AI schema-from-brief + Anshu 1–8
**Built:** Literata letter / Fraunces mark-only; letter-sheet fill; choice chips; AI `/api/ai/schema` (BUILD_GAMES_LLM_API_KEY → Anthropic-compat then xAI/OpenAI); real Higgsfield assets; Tech5 letter-turn/seal-press/ink-rule; Tech6–8 cuts + hand copy.
**Shots:** `r1-desk.png`, `r1-intro.png`, `r1-question.png`
**Critic (fresh, screenshots):** Aesthetic = sunlit blotter. Studio bar still ahead on full-bleed focus. Score **5.2/10**. Original wins blind A/B on fill density; candidate wins anti-slop.
**Biggest gap to fix next:** Desk still admin-list; chrome above question (kicker+seals+bar) still noisy; `[SAMPLE]` voice leak.
**AI:** Live anthropic draft OK locally (`mode=llm`).
**Lenny:** DISCOVER/DEFINE/DELIVER written; techniquesDone [1..8].

## Round 2 — Letter tray desk + quieter chrome (Phase B, identity locked)
**Identity:** Sunlit blotter correspondence (no reseed).
**Built:** Desk rows → letter-sheet tray cards; strip `[SAMPLE]`; single-line progress+count+seals; drop Correspondence/Qn eyebrows; denser sheet; public header uses `font-mark`.
**Shots:** `r2-desk.png`, `r2-intro.png`
**Critic (fresh, screenshots only):** Aesthetic still blotter. Desk now reads as stacked letters — clearer. Intro quieter; title no longer SAMPLE-tagged. vs Youform fill: original still wins full-bleed focus; candidate closer on craft.
**Score:** **5.8/10**. Original still preferred blind on fill stage.
**Biggest gap:** Choice chips require extra Continue click (Youform OK is immediate); editor AI panel still a bit “settings card”; question type size could grow.
