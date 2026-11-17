# Legibility update — 17 November 2026

Status: checked draft on the review branch; not owner-approved or deployed. Main and the live website are unchanged.

## Problem reproduced

A rendered-text audit of the previous candidate (`experience.css?v=20261116-v3.1`) found visible text set far too small for a phone-first local audience. Measured across 1440, 1000, 700, 390 and 320 px widths:

- Smallest visible text: 4 px on 390/320 px and 6 px on larger screens.
- 38–50 visible text items per width were under 11 px; 56–62 under 12 px.
- Examples at 390 px: the “Architectural concept” image disclosure at 5 px, the “Concept interior” label at 6 px, primary hero button at 10 px, enquiry choices (“Home cooling”, “Business cooling”) at 9 px, form fields at 11 px. Form fields under 16 px also make iOS Safari zoom the page on focus.

## Change

A separate stylesheet, `legibility.css`, loads after `experience.css`. `experience.css` is byte-identical to the previous candidate. The new sheet raises only text that was too small:

| Tier | Size |
| --- | --- |
| Tracked uppercase labels, concept/disclosure labels | 11 px |
| Functional text: buttons, links, nav, form labels/notes, chips, footer links | 13 px |
| Running copy | 14 px |
| Mobile menu links | 15 px |
| Form fields and placeholders | 16 px |
| Logo tagline | 9 px (hidden in the header ≤600 px and 801–1000 px, where it cannot fit) |

Small-phone fixes in the same sheet: top bar tightened below 600 px and its location link hidden at 340 px or less, so nothing overflows; hero paragraph wraps balanced; nav links never wrap.

## Verified (local, real browser)

- Element-by-element comparison at five widths: no visible text became smaller; 79–94 items became larger. After the change: minimum 9 px (logo tagline); items under 11 px fell from 38–50 to 1–2; no horizontal overflow at any tested width (320, 340, 360, 375, 390, 414, 600, 700, 820, 1024, 1440, 1920).
- Tablet header (801–1280 px): nav links stay on one line. This was a regression caught during the work (links wrapped at 820 px at 13 px) and fixed before release material was prepared.
- 390 px: hero, quick paths, system explorer, enquiry form screenshots reviewed. End key selects VRF; invalid phone rejected; valid fictional details open the unsent preview; Edit returns to the form with details preserved.
- 320 px: menu open/Escape/focus return; preview dialog inside the viewport.
- 568 × 320 landscape: menu scrolls; the last link is reachable by keyboard and navigates to the enquiry.
- Structure audit: no duplicate IDs, broken ARIA references, unnamed controls or images without alt text. A computed-contrast audit of visible text found no failures; invisible arrow decorations were excluded.
- Standalone review rebuilt; menu, VRF selection, commercial enquiry preselection, unsent preview and Escape pass; no non-local resource loaded.

No real enquiry was sent and no WhatsApp link was opened.

## Not verified

Full assistive-technology testing, real-device rendering, field performance and receiving-side enquiry delivery. The 9 px logo tagline is a logotype detail, not body text.
