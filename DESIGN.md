# kubachojnacki.com — design system

The reference for how this site looks, reads, and grows. Any change should
follow this file; if a change contradicts it, update the file in the same
commit — deliberately, not by accident.

**Guiding principle: refine, never replace.** The layout is the artist's own
design. Improvements adjust readability, spacing, and consistency inside it.
Redesigns, new visual concepts, or layout experiments are out — the one
full redesign attempt (the 2026-07 "printed catalogue") was rejected and
lives only in git history (`aeefb41`).

---

## 1. Color

The paintings supply all the color. The UI stays achromatic.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#ffffff` | Page background — **pure white, never tinted.** The artwork photos have white backgrounds; on white the photo edges disappear and the paintings float. |
| `--ink` | `#1a1a18` | Text, primary UI |
| `--mid` | `#6f6f6a` | Secondary text: specs, captions, counts. Held at ≥4.5:1 on white (WCAG AA) — never lighten past this. |
| `--rule` | `#111111` | Strong hairlines (header, section borders) |
| faint rule | `rgba(26,26,24,0.12–0.15)` | The lightbox inquiry divider — the only one left in the page body |
| sold | `#991b1b` | The only accent. Dark brick red — deliberately muted, not alarm-red. |
| hero backdrop | `#0c0c0a` | Behind hero slides while images load |

Rules: no gradients, shadows, or colored UI elements. Never introduce a
second accent color. Sold styling applies the same `#991b1b` consistently in
grid ref-numbers, legend entries, status dots, and the lightbox. Sold
status dots render 50% larger than available ones (8px vs 5px; 6px vs 4px
in the condensed mobile legend) so the red marker reads at a glance.

## 2. Typography

Two families, two jobs:

- **EB Garamond (serif)** — identity and titles: logo, nav, collection
  headings, work titles, section headings, and the italic underlined
  *inquire* links.
- **Montserrat (sans)** — information: specs, prices, captions, counts,
  contact details, footer.

Casing: everything lowercase via `text-transform`, with three exceptions —
the logo (uppercase, letterspaced 0.08em+), the artist's name in prose, and
roman numerals in titles (protected by `protectRoman()` in site.js; never
lowercase titles in JS — CSS does the transform).

Scale (current, after the 2026-07 readability pass — sizes may grow, never
shrink below these):

| Element | Size |
|---|---|
| body base | 14px |
| logo / nav | 1.1rem serif |
| collection heading (h3) | clamp(1.5rem, 3vw, 2.2rem) |
| section headings (about, contact h4) | clamp(1.2rem, 2.2vw, 1.6rem) |
| hero caption title | clamp(1.4rem, 3vw, 2.4rem) |
| lightbox title | 1.6rem |
| legend work title | 1.15rem serif |
| colour subtitle | 0.85em of its title, serif, ink |
| body/meta sans | 12–13.5px |
| small labels (refs, captions, counts) | 11–12px |
| absolute minimum anywhere | 10.5px |

**A work's title is two lines, and both are titles.** The collection name
("Atmosphere") repeats across 31 paintings; the colour words ("blue red")
are what actually name the work. So `.color-subtitle` is set in the serif,
in ink, at `0.85em` of whichever title contains it — a second title one step
down, never a spec line in the sans. Because the size is relative, the pair
holds the same proportion in the legend, in the lightbox, and in the
condensed mobile legend, and there is only one rule to change.

One deliberate exception: below 800px the legend drops to the original
condensed catalogue density (titles 0.85rem, specs and price 8–9px sans).
The artist prefers the old site's compact price tiles on mobile over long
readable columns — the legend is scanned there, not read. The colour
subtitle is not part of the exception: it scales with the title.

## 3. Layout & spacing

- Page gutter: `--pad: clamp(1.5rem, 4vw, 4rem)`.
- **Sections are separated by whitespace, not lines** (changed 2026-09-08 at
  the artist's call: the stack of hairlines through about and contact read as
  clutter). Every section rule, the label underlines, the legend's top rule
  and the footer rule are gone; 220–300px of air now does that job between
  sections and 30–60px within one. Two rules survive because they are doing
  work rather than decorating: the fixed header's bottom edge, and the
  divider between specs and inquiry links inside the lightbox panel. Do not
  reintroduce the others — if two blocks feel run together, the answer is
  more space.
- **Works grid: the visitor picks the density** — 2, 4 or 6 across, from the
  small `grid` control at the top of the works section, remembered in
  `localStorage` (`kch-grid-cols`, default 4). `site.js` writes the count
  inline on each `.visual-grid`, capping it on narrow screens (≤520px: max 3;
  ≤800px: max 4; ≤1100px: max 5) so six across never becomes six thumbnails
  on a phone. The media queries in the stylesheet stay as the no-JS fallback.
  Uniform cells; the photos themselves communicate scale. Works on paper
  render at half the cell width (`.col-<collection-slug>` modifier) so small
  originals read as small.
- Legend: 8 columns → 6 (≤1100px) → condensed 6 (≤800px) → condensed 4
  (≤520px). Desktop keeps the readable sizes; mobile switches to the compact
  catalogue tiles (see the typography exception above).
- **Every section runs gutter-to-gutter**, like the works grid — no
  max-width on section containers. Line length stays readable via per-block
  measures or, where prose would run too wide (the statement), a two-column
  editorial flow. Nothing ends mid-page.
- **Full-width split hero** is the standing-page pattern (newsletter,
  collector drop): a full-height grid with prose/media on one side and the
  action on the other, vertically centred so it owns the whole viewport
  instead of hugging the left edge.
- Header: fixed, single line at every width (compact logo/nav under 520px).
  `--header-h` (58px, 45px ≤520px) keeps the hero offset and scroll
  margins aligned with the real header height.
- Hero caption is right-constrained so it can never overlap the counter.

## 4. Catalog rules

- One work = one line in `js/data.js`. No artwork data anywhere else.
- **Two numbering systems, two jobs.** The `ref` in data.js is the permanent
  archive number — it lives in file slugs, never changes, never gets reused;
  gaps (13, 23, 24, 26…) are intentional (18 was a gap until the artist
  catalogued orange II in 2026-07 — a gap may be filled by its real work,
  never recycled for a different one). The numbers *shown* on the site
  (grid, legend, inquiry emails) are display numbers: sequential 01, 02, 03…
  computed automatically at render, restarting at 01 in each collection.
  Re-sorting collections keeps visible numbering clean with zero renames.
- Slug/file scheme: `<ref>-<collection>-<colors>` (e.g.
  `02-atmosphere-burgundy-blue`).
- **Ordering: within each collection strictly by physical size, largest
  first; catalog-number order within equal sizes. Old and new works
  interleave — no "new works" grouping.**
- Titles: `"Collection | colors"`. Color words, plain and lowercase
  (burgundy, khaki, navy, plum…). Repeat titles are fine; roman numerals
  (I, II, III) distinguish siblings. Exception: works on paper carry only
  their series name ("Study in purple 01", no collection prefix) — the
  collection name appears once, in the heading.
- Sold: `sold: true` — nothing else. Sold works stay in the catalog.
- Held back from sale: `unavailable: true` — reads "currently not
  available" with a grey (`--mid`) dot instead of the red one, for works
  on exhibition, on loan or reserved. The price still shows; only the
  status changes. `sold` wins if both are set.
- Prices are the artist's decision, stated plainly in EUR. Current anchors:
  18×18 = 150 · 50×40 = 450 · 60×50 = 600 · 100×100 = 1300 ·
  150×100 = 1500 · 150×130 = 1900 · 200×150 = 2800.
  Works on paper: 10×7.5 = 80 · 20×15 = 150 · 40×30 = 250.

## 5. Imagery pipeline

- Source photos: painting on a white background (this is why the site bg is
  white). Masters live outside the repo in `STRONA/CATALOG/full`.
- Repo tiers: `IMAGES/thumbs/<slug>.webp` 400px · `<slug>-800.webp` 800px ·
  `<slug>-1600.webp` 1600px — one srcset serves both the grid and the
  lightbox · `<slug>-hero.webp` 1600px, cropped (slideshow and the closeup
  carousels) · `IMAGES/works/<slug>.jpg` the master (max 3450px, q85, median
  505 KB).
- **The JPEG master is not a delivery format.** Everything the site renders
  is WebP; the master is fetched only when a visitor zooms inside the
  lightbox, preloaded and then swapped in so the picture never blinks. That
  is the one moment the brush detail is actually wanted, and the only moment
  anyone pays a megabyte for it. Opening a work costs the 1600px WebP —
  median 107 KB against 505 KB.
- Hero slides use `<slug>-hero.jpg`: a studio shot if one exists, otherwise
  an auto-crop of the display image with white borders trimmed (see
  scratchpad script history) so slides run full-bleed with no white strips.
- Regenerate thumbs anytime: `python scripts/make_thumbs.py` (skips
  existing).

## 6. Signature details (keep these)

- Custom cursors, two only: a small solid black square (default, 9px) and
  a solid black circle (anything clickable, 13px). Every interactive
  selector must also cover its descendants (`.legend-item *` etc.) — the
  pointer takes the cursor of the exact element under it, and the
  universal square rule matches children directly, overriding the parent.
  This is the site's fingerprint.
- Sequential display numbers under every grid image.
- The lightbox restores the page behind it in a single frame. `html` carries
  `scroll-behavior: smooth` for the nav anchors, so `unlockScroll()` turns it
  off for the one jump back — otherwise closing a work animates a scroll all
  the way down from the top of the page.
- Collections may carry a short lowercase `note` under the heading —
  written from the work, concrete images, no gallery jargon.
- Permalinks: `kubachojnacki.com/#<slug>` opens the work's lightbox —
  the link to send collectors.
- Hero slideshow: currently 03 maroon khaki → 39 → 40 → 44 → 45 → 46,
  set via `hero: 1…n` in data.js.
- The lowercase voice: short factual lines, prices stated openly,
  "certificate of authenticity included. shipping worldwide."
- Newsletter lives on the domain, not a Kit subdomain. `newsletter.js`
  renders the signup wherever `#nl-signup` exists — the home page's contact
  section (`.contact-newsletter`, "join the list"), `/newsletter/` and
  `/collector/` — and the archive of past issues from `js/newsletter-data.js`
  wherever `#nl-issues` and `#nl-count` exist (nowhere yet; add it to contact
  once there are issues to show). Each placement reports its own
  `signup/home | newsletter | collector` event, so the numbers say which one
  converts. Keep both inside this system — achromatic, two families,
  lowercase — never a second layout language.
- `site.js` and `newsletter.js` both run on the home page. They share one
  GoatCounter queue and the first to arrive claims the loader
  (`window.__gcLoader`) — two `count.js` tags would count every home-page
  view twice.

## 7. Workflow (non-negotiable)

1. All changes are built and verified locally, then pushed to staging:
   `git push dev dev-pages:main` → https://wodzueu.github.io/kubachojnacki-dev/
2. **Production (`git push origin refactor:main` → kubachojnacki.com) only
   when the artist clearly and explicitly says to promote.** A general
   "looks good" is not an instruction to deploy.
3. Before any production push, tag the current live commit for one-command
   rollback (see `v1-single-file` precedent).
4. Analytics (GoatCounter) loads on the live domain only — staging and
   local previews must never pollute the statistics.
5. Asset links carry a version stamp (`css/style.css?v=YYYYMMDDx`, same on
   the js includes). **Bump the stamp in all three pages whenever
   style.css or any js file changes** — it is what makes browsers drop
   their cached copy; without it reviewers see the previous deploy.

## 8. Site structure

Three HTML pages, one design system, all sharing `css/style.css` and the
fixed header (logo → home; nav: works · about · contact · newsletter).
**About and contact are sections of the home page, not pages of their own** —
the nav links to `#about` and `#contact`, and from a sub-folder to
`../#about`:

- **`/` home** — the hero slideshow (`hero: n` works from data.js) over the
  catalog: the grid-density control, then collections (grid + legend) and the
  lightbox, rendered from `js/data.js`. A hero slide opens that work in the lightbox. Collection
  descriptions come from the portfolio PDFs and live in each collection's
  `note`. Works flagged `draft: true` are held back everywhere until published.
  Two sections close the page:
  - **`#about`** — bio and artist statement. The bio fills its column beside
    a 200px portrait; the statement is set in the same serif voice.
  - **`#contact`** — inquiries / studio / purchase details, then the
    newsletter signup (see §6). This is the only signup most visitors ever
    see, since reaching `/newsletter/` takes a nav click.
- **`/newsletter/`** — the prints announcement. Full-width split: the sliding
  closeup carousel of the two works going to print beside three short lines
  and the signup (label, title, one lead line, CTA — the page says the prints
  are coming and nothing more; sizes, edition, paper, price and date are the
  artist's to decide). The carousel takes its works from `data-slides` on the
  container and its pace from `data-interval` (2200ms here, against the 3800ms
  default — two slides want a quicker cycle than five), so both are
  one-attribute edits. The
  countdown block (`#drop-timer` with a `data-deadline`, driven by
  newsletter.js) still exists for the next drop but is not on the page.
- **`/collector/`** — the atmosphere drop. Full-width split: a sliding
  closeup carousel (`newsletter.js`, no `data-slides` → the default drop
  slugs, zoomed 1.5x from the `<slug>-hero.webp` crops) beside a
  preview-access signup. `noindex`.

`js/site.js` is **page-aware**: each block (hero / collections / lightbox)
runs only if its container is present, so one script drives the home page and
the sub-pages. `js/newsletter.js` is the same: it renders the signup form
everywhere, the past-issues archive only where its containers exist, and the
drop carousel only on the collector page. Image paths are prefixed with
`window.ROOT` (`''` at the site root, `'../'` in a sub-folder) — set it in each
page before the scripts, and always link assets and pages **relatively** so
staging under a sub-path works.
