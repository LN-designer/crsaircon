# CRS Aircon — Comfort, by design

Prepared 16 November 2026. Review candidate; not approved or deployed.

## Experience

An original architectural direction replaces the earlier local design: a full-width tropical interior, deep olive and warm stone, CRS burgundy, Manrope with Instrument Serif, asymmetric service compositions, original isometric linework and a shared airflow motif. This is a working static website, not an image of a website.

Home, business and service paths lead to relevant enquiries. A five-system explorer explains split, window, cassette, ducted and VRF options. Its selected system is carried into the enquiry; visitor-written details are preserved when their selection changes. No capacity, savings or suitability is calculated from incomplete information.

Motion is deliberately restrained. It can be paused and respects the operating system's reduced-motion preference. Mobile navigation, touch targets, form text sizes, keyboard tab selection and a native preview dialog are implemented.

## Current design references

- [Webflow — 8 web design trends to watch in 2026](https://webflow.com/blog/web-design-trends-2026): ownable visual systems, concise copy and craft. Used as direction, not a copied layout.
- [Figma — Top web design trends for 2026](https://www.figma.com/resource-library/web-design-trends/): immersive composition, bold typography and purposeful interaction. Selected techniques are adapted to a local HVAC business; no external runtime is introduced.

## Source and hosting

Base: `LN-designer/crsaircon`, main commit `2cc2074fc666e3f0eab59db2b76b02b67958ccf4`.

Review branch: `design/comfort-by-design-20261116`. GitHub authentication and branch creation succeeded as `LN-designer`. No change to main or GitHub Pages settings is authorised by this review candidate. Release requires the owner's decision on the concrete result.

Deployable changes are `index.html`, `experience.css`, `experience.js`, `robots.txt`, `sitemap.xml` and `assets/experience/`. This document is handoff material. The existing `CNAME`, Google verification, published phone/email/address and all unrelated repository files are preserved. Original equipment photographs, shop photo, logo and brand assets continue to use their existing paths.

The original repository contains both `logo-LG.png` and `logo-lg.png`. macOS reports a checkout collision; neither path is included in this change. Remote integration uses an explicit file list, preserving both original Git blobs.

## Assets and originality

- New hero: built-in imagegen, generated for this design. Original PNG retained locally in `redesign-review-v3/comfort-hero-original.png`. This is a concept interior, not a CRS customer property or completed job. The visible website label and alt text identify that distinction.
- Secondary home concept: the previously generated CRS interior, retained with its original provenance in `../Asset_Provenance.md` in the workspace. It is also labelled as a concept.
- Original vector isometric building, icons and airflow paths: written for this design in the HTML/CSS.
- Equipment, brand and storefront images: existing repository assets. No new project or authorisation claim is inferred from them.
- [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) and [Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif): SIL Open Font License, subset as self-hosted WOFF2. Both licences are supplied in `assets/experience/`.
- New photographic derivatives are optimised WebP images inside self-contained SVG containers. This transports raster imagery through the connected repository tool's text-file interface, without an external image host. They render as normal image assets. Approximate sizes: wide hero 276 KB, mobile hero 85 KB, secondary concept 89 KB; fonts stylesheet 58 KB. These are file sizes, not a measured live speed claim.

### New hero prompt — built-in imagegen

Use case: photorealistic-natural. Asset type: a premium full-bleed website hero photograph for CRS Aircon, a Chennai air-conditioning business. Create a deeply atmospheric, exceptional architectural editorial image, wide landscape 16:9, 1920x1080 or larger. Scene: a refined contemporary tropical South Indian living space at dusk, sophisticated warm limestone and smoked teak architecture, large open-plan interior with a sculptural off-white curved sofa at the right, a low dark travertine coffee table, a tall indoor tropical plant, beautifully framed garden beyond full-height glass at far right, natural soft golden side light and muted deep green foliage. A discreet, realistic, unbranded white wall-mounted split air-conditioner is high on the right wall, appropriately scaled with a credible grille. Left 45 percent is a dark richly textured charcoal-olive plaster wall with shadow, almost empty, providing clean uninterrupted negative space for separately typeset light headline. Interior and meaningful furniture are mostly at the right 60 percent. Camera wide angle but not distorted at human eye level. Photoreal professional architectural photography, deliberate asymmetry and layered spatial depth, gorgeous tactile materials, dramatic chiaroscuro, premium quiet luxury, slight cinematic grain, no excessive orange tint, rich natural whites, charcoal olive, warm timber. Top strip stays relatively dark and calm for a website navigation overlay. Text: none. Do not put letters, logos, captions, badges, numbers, UI, arrows, airflow streaks, watermark or people in the image. No floating furniture, no huge AC, no fake brand. This is an original concept scene, not evidence of an actual customer installation. Prioritise beautiful spatial composition, true-to-life material detail and luxurious architectural feeling. Entire frame is the photograph, no borders.

## Enquiry behaviour

The visitor enters details locally, reviews a preview, opens WhatsApp, then sends there themselves. Preview is not business receipt or a booking. No Formspree submission, external script, tracking pixel or browser storage has been introduced. A disabled default fieldset prevents native form data from entering the URL if JavaScript is missing. Phone and email remain available. Attribution accepts a bounded `utm_content` label, not arbitrary markup. Preview text uses text nodes, never visitor HTML.

## Checked locally

- Real embedded-browser rendering at desktop 1440 and 1785 px, mobile 390 px and a narrow 320 px viewport, with loaded self-hosted fonts and concept images.
- No horizontal document overflow at the checked desktop/mobile sizes. Mobile hero typography fits at 320 px.
- Mobile menu opens, closes on navigation and Escape, and is hidden when no script is loaded.
- System selection, corresponding image/copy, End-key navigation, commercial preselection and source-label construction.
- Changing a system preserves a visitor-written requirement.
- Repeated-zero phone input is rejected and focuses the phone field. Fictional labelled test details open the local preview; Escape and Edit close it and return focus.
- Preview stays within the narrow viewport. The mobile contact bar clears the form and dialog.
- Reduced-motion preference suppresses ambient animation and hides the motion control. Manual Pause/Resume is supplied.
- Failed-script fixture: all named form fields and submit control remain disabled, FormData is empty, Enter leaves the query empty and call/email fallback remains visible.
- Only local-origin resources were observed during the normal enquiry preview. No external message or enquiry was sent.
- Internal anchors, local assets, duplicate IDs, JSON structured data, SVG and sitemap XML, domain, verification and contact values passed static checks.

Not established by these checks: real business enquiry receipt, booking response, stock/model availability, full assistive-technology audit, field performance/Core Web Vitals or search indexing. Public checks follow approved deployment. No social content or schedule was changed by this redesign.
