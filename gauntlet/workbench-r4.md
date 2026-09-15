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
- commit: c8f8211b08a99499a8d7e6a6163067fb60bd3cd0

## r6 — buttons
- files: src/components/ConversationalForm.tsx, src/components/FormEditor.tsx
- shot: gauntlet/shots-r4/r6-buttons-fill-q.png, gauntlet/shots-r4/r6-success-check-done.png
- verdict: success-check now fires on real submit-done (not CSS-only); toast on copy if wired. youform.com uses soft confirm — we keep stamp-red check on canary.
- commit: 06e65fe2351080f210a8f892bddf90fc176b1e0d

## r7 — contrast
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r7-contrast-desk.png
- verdict: Deeper aluminum board + stronger rules; canary pops more. youform.com stays light gray/white — we intentionally diverge on material.
- commit: 4c10030121881be6de947691895509d8c7d67db7

## r8 — fonts
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r8-fonts-desk.png
- verdict: Billboard + job tape heavier; closer to youform marketing hierarchy weight, still serif/clipboard voice.
- commit: 97ac4f8aa65ff4bbe9d3bebc2e1248fb0aa6e242

## r9 — buttons
- files: src/components/Dashboard.tsx
- shot: gauntlet/shots-r4/r9-buttons-desk.png
- verdict: Row actions quieter Edit/Replies, louder Open fill — closer to youform focus on the fill path.
- commit: 81f4bbd72fe5b42add0a23a6eb99aeeda7fae8ba

## r10 — bar gap
- files: src/components/ConversationalForm.tsx, gauntlet/workbench-r4.md, gauntlet/shots-r4/dream-baseline-desk.png, gauntlet/shots-r4/dream-target-ref.png
- shot: gauntlet/shots-r4/r10-bargap-fill.png, gauntlet/shots-r4/r10-bar-home.png
- verdict: Intro CTA now literal OK vs youform; dream-loop target locked from desk baseline. Bar still cooler/marketing; we keep clipboard job desk.
- commit: dfe12283bf34b7ecdeddbd66d92923b0e11a5f0b

## r11 — buttons
- files: src/components/FormEditor.tsx
- shot: gauntlet/shots-r4/r11-buttons-editor.png
- verdict: toast recipe now on real copy/save success in editor; checkbox accent on required. youform has quieter chrome — we keep stamp toast.
- commit: 5f7373ea9545b5b4b6d5466181992d89e1f14b83

## r12 — contrast
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r12-contrast-desk.png, gauntlet/shots-r4/r12-contrast-fill.png
- verdict: Toward dream target: hotter raised sheet, darker clip, hotter amber offsets. vs youform: still warm canary not cool white.
- commit: 38cce2e074e2b08ef2dc2984948066becc111c4c

## r13 — fonts
- files: src/app/globals.css, src/components/Dashboard.tsx
- shot: gauntlet/shots-r4/r13-fonts-desk.png
- verdict: Mark + desk body toward dream target density; youform marketing type is softer sans — we keep Archivo mark.
- commit: 3ccb74f5913b0e817ab0f60fd26006e597facc33

## r14 — bar gap
- files: src/app/globals.css
- shot: gauntlet/shots-r4/r14-bargap-desk-rail.png
- verdict: Tighter billboard/demo-rail toward dream target composition; youform home is marketing-hero, ours stays operational desk.
- commit: fb25fe7f407378ff96f148215858bbbe2069eae0

