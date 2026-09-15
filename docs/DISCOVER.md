# Discover — Ember Forms (youform)

**Seed (docs only, never in UI):** `c0e4d92beac73d74f1448a0318d722d6c2ddadda74b5fe6dd10b02af51d39b59`

## Subpattern reads
| Slice | Hex | Derivation |
| --- | --- | --- |
| `c0e4d92b` | hue 35° | Warm amber-ochre ink (not terracotta cliché alone) |
| `eac73d74` | hue 340° | Dusty rose / sealing-wax undertone |
| `f1448a03` | hue 75° | Olive-moss blotter |
| layout bits 0·2·3 | — | Single-column letter stage; asymmetric desk rail; full-bleed question |
| type bits 0·1·1 | — | Mark serif (Fraunces) only in logo; Literata for letter body; Source Sans UI |
| motion bits 2·0·1 | — | Soft vertical step-in; no bounce; progress ink-draw |

## Brief A — “Cabinet of unanswered letters” (discarded)
**Feel:** Walking into a dim municipal archive at 4pm — dust motes, brass drawer pulls, the smell of old glue. Forms live in pigeonholes.  
**Why discarded:** Too museum / too dark. Competes with the light correspondence job and invites perma-dark + grey-body slop.

## Brief B — “Night telegraph desk” (discarded)
**Feel:** Green banker's lamp, ticker tape, urgent clicks. Industrial panel energy.  
**Why discarded:** Cool-green + panel chrome reads “dashboard SaaS” and pulls away from one-question letter fill.

## Brief C — PICKED — “Sunlit blotter correspondence”
**Feel:** Late-morning desk by a north window. Cream blotter warm under the wrist. Iron-gall ink that has almost dried. A terracotta wax seal cooling on the sill. Questions arrive one at a time like lines in a letter you are writing to someone you respect — not a wizard, not a chat bubble. The air smells faintly of paper and orange oil. When you finish, the seal presses with a quiet physical certainty.  
**References (ambitious, not SaaS):** Wes Anderson epistolary prop table; a Japanese stationery counter; the quiet of writing a condolence note.  
**Serves core job:** Conversational form fill as correspondence + AI that drafts the field schema from a plain-English brief.

## Decision
Ship **Brief C**. Color: paper `#efe6d8`, ink `#1c1612`, ember/wax `#b84322`, moss blotter `#556342`. Type: Fraunces mark-only, Literata letter, Source Sans UI. Motion: letter-sheet step-in + seal dots, no glow theater.

## Techniques 1–2 checklist
- [x] Tech 1 Seed string via `openssl rand -hex 32`
- [x] Tech 2 Three ambitious sensory briefs; pick Brief C; discard A/B with reasons
