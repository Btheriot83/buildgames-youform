# Ember Forms — Phase B4 Integrity Gauntlet (20 counted rounds)

**Identity (LOCKED):** Canary Clipboard — no reseed  
**Bar:** https://youform.com/  
**Demo:** https://buildgames-youform.vercel.app  
**Hard bars:** Flat paper/ink · real AZ data · job ≤3s · separate `rN:` commits

## Transitions.dev wiring (real actions)
| Recipe | Fires on |
| --- | --- |
| success-check | Public fill submit → done phase (`ConversationalForm`) |
| toast | Dashboard import success; FormEditor copy link (r11) |
| error-state-shake | Fill validation fail (`is-shaking` on field) |
| skeleton-reveal | Desk form list first paint (`Dashboard` t-skel) |
| texts-reveal / stagger | Fill intro title/description (`t-stagger`) |
| notification-badge | Replies count badge on desk rows (`t-badge`) |

## Dream-loop
- baseline: `.dream-loop/baseline.png` (desk core job)
- target: `.dream-loop/target.png` (Higgsfield refine of baseline; gitignored)
- shot refs: `gauntlet/shots-r4/dream-baseline-desk.png`, `dream-target-ref.png`

## Round log

## r1 — contrast
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r1-contrast-desk.png, gauntlet/shots-r4/r1-contrast-fill.png
- verdict: Hotter canary sheet + deeper ink; clearer than washed aluminum, still not youform.com cool-white stage (identity).
- commit: d6c3de3b32bed407ff3cd66d8fb8f680ff4e1ce2

## r2 — fonts
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r2-fonts-fill.png
- verdict: Heavier/tighter question type approaches youform one-question scale; serif still a Canary tell vs youform sans.
- commit: eb715caa931110a205d3735bfa7879d137ed03e3

## r3 — buttons
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r3-buttons-desk.png
- verdict: Larger primary stamp CTA closer to youform OK hit-target; offset shadow still clipboard, not soft youform pill.
- commit: 5d32efa54b5c0729b47cb5c7fb1b554a7c9adecc

## r4 — bar gap
- files: src/app/globals.css, src/components/ConversationalForm.tsx
- shot: gauntlet/shots-r4/r4-bargap-fill.png
- verdict: Narrower fill stage + taller sheet mirrors youform focus column; chrome still canary clip, not bare white.
- commit: 6b3f36231e73ab70f130d08a353fe29d726fbec6

## r5 — bar gap
- files: src/components/ConversationalForm.tsx, gauntlet/workbench-r4.md
- shot: gauntlet/shots-r4/r5-bargap-fill.png, gauntlet/shots-r4/r5-demo-desk.png, gauntlet/shots-r4/r5-bar-home.png
- verdict: Intro OK CTA closer to youform.com OK affordance; bar A/B captured — youform still cooler/whiter, we keep canary clipboard.
- commit: aece11ac2181e70592d0a77af35e5a6940d14520

## r6 — buttons
- files: src/components/ConversationalForm.tsx, src/components/FormEditor.tsx
- shot: gauntlet/shots-r4/r6-buttons-fill-q.png, gauntlet/shots-r4/r6-success-check-done.png
- verdict: success-check now fires on real submit-done (not CSS-only); toast on copy if wired. youform.com uses soft confirm — we keep stamp-red check on canary.
- commit: b40e3d75d64006820b0fa67d07a35d8aa63200db

## r7 — contrast
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r7-contrast-desk.png
- verdict: Deeper aluminum board + stronger rules; canary pops more. youform.com stays light gray/white — we intentionally diverge on material.
- commit: 935a6a533ab6d19aed287a77abb7feb7b5c0edf9

## r8 — fonts
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r8-fonts-desk.png
- verdict: Billboard + job tape heavier; closer to youform marketing hierarchy weight, still serif/clipboard voice.
- commit: e56c162e239c5da2ee24847798f19d52ebaf61e9

## r9 — buttons
- files: src/components/Dashboard.tsx
- shot: gauntlet/shots-r4/r9-buttons-desk.png
- verdict: Row actions quieter Edit/Replies, louder Open fill — closer to youform focus on the fill path.
- commit: fc984ed062dd6b8db3a5bce89afbed3c8fb8880f

## r10 — bar gap
- files: src/components/ConversationalForm.tsx, gauntlet/workbench-r4.md, gauntlet/shots-r4/dream-baseline-desk.png, gauntlet/shots-r4/dream-target-ref.png
- shot: gauntlet/shots-r4/r10-bargap-fill.png, gauntlet/shots-r4/r10-bar-home.png
- verdict: Intro CTA now literal OK vs youform; dream-loop target locked from desk baseline. Bar still cooler/marketing; we keep clipboard job desk.
- commit: c01786979f2e86d061a3d352a019fc7f9a8da972

## r11 — buttons
- files: src/components/FormEditor.tsx
- shot: gauntlet/shots-r4/r11-buttons-editor.png
- verdict: toast recipe now on real copy/save success in editor; checkbox accent on required. youform has quieter chrome — we keep stamp toast.
- commit: c21bf9f6a6a4474eb5906f597e982b049cc2bcdf

## r12 — contrast
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r12-contrast-desk.png, gauntlet/shots-r4/r12-contrast-fill.png
- verdict: Toward dream target: hotter raised sheet, darker clip, hotter amber offsets. vs youform: still warm canary not cool white.
- commit: bf31dddb29c6c6ce88fb695ee6426a11b5daa37c

## r13 — fonts
- files: src/app/globals.css, src/components/Dashboard.tsx
- shot: gauntlet/shots-r4/r13-fonts-desk.png
- verdict: Mark + desk body toward dream target density; youform marketing type is softer sans — we keep Archivo mark.
- commit: 439872d6ed855e38240e8036ed896ca27440e2b7

## r14 — bar gap
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r14-bargap-desk-rail.png
- verdict: Tighter billboard/demo-rail toward dream target composition; youform home is marketing-hero, ours stays operational desk.
- commit: d384d02bab4060ece7f35b0a842ba2d02fdcb38b

## r15 — contrast
- files: src/app/globals.css, src/components/ConversationalForm.tsx
- shot: gauntlet/shots-r4/r15-contrast-fill.png, gauntlet/shots-r4/r15-bar-home.png
- verdict: Thicker stamp progress + darker secondary text; bar A/B — youform progress is minimal; ours stays clipboard hole-punch language.
- commit: 7f84575d58b998b556b682570111e0da76ce3c12

## r16 — buttons
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r16-buttons-fill.png
- verdict: Choice chips heavier hit targets toward dream/youform OK targets; still hard-ink not soft pills.
- commit: 9a1ca5042b9d0ffeb8d989ff18ee139470be0cd8

## r17 — fonts
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r17-fonts-fill.png
- verdict: Larger question + thicker field rule toward dream fill focus; youform uses big sans question — we keep sheet serif.
- commit: 37ef1840101d314e8486efef1a9450b086936422

## r18 — bar gap
- files: src/app/globals.css, src/components/ConversationalForm.tsx
- shot: gauntlet/shots-r4/r18-bargap-fill.png
- verdict: Bigger seal dots + tighter cue copy; still clipboard progress language vs youform minimal bar.
- commit: cdc790d99ef96d738cc75e80ae221e2a22758110

## r19 — contrast
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r19-contrast-desk.png
- verdict: Card/plate shadow weights toward dream target materials; youform avoids hard offsets entirely.
- commit: c6a7d2d9264dc51106214952b14a824b2beea90a

## r20 — buttons
- files: src/app/globals.css, src/app/page.tsx
- shot: gauntlet/shots-r4/r20-buttons-desk.png, gauntlet/shots-r4/r20-bar-home.png
- verdict: Ghost buttons readable on board + footer tighten; final bar A/B — youform wins cool marketing polish; Ember wins clipboard job clarity.
- commit: 2a8085de5e39a3ef8409c15b03c0572dcada4166

