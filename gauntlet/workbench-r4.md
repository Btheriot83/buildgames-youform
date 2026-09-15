# Ember Forms — Phase B4 Integrity Gauntlet (20 counted rounds)

**Identity (LOCKED):** Canary Clipboard — no reseed  
**Bar:** https://youform.com/  
**Demo:** https://buildgames-youform.vercel.app  
**Hard bars:** Flat paper/ink · real AZ data · job ≤3s · separate `rN:` commits

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

