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
| faint rule | `rgba(26,26,24,0.12–0.15)` | Legend top rule, footer rule, inquiry divider |
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
| body/meta sans | 12–13.5px |
| small labels (refs, captions, counts) | 11–12px |
| absolute minimum anywhere | 10.5px |

One deliberate exception: below 800px the legend drops to the original
condensed catalogue density (titles 0.85rem, sans 8–9px). The artist prefers
the old site's compact price tiles on mobile over long readable columns —
the legend is scanned there, not read.

## 3. Layout & spacing

- Page gutter: `--pad: clamp(1.5rem, 4vw, 4rem)`; sections separated by
  1px `--rule` hairlines.
- Works grid: 5 columns desktop → 4 (≤1100px) → 3 (≤800px and below,
  including phones). Uniform cells; the photos themselves communicate scale.
  Works on paper render at half the cell width (`.col-<collection-slug>`
  modifier) so small originals read as small.
- Legend: 8 columns → 6 (≤1100px) → condensed 6 (≤800px) → condensed 4
  (≤520px). Desktop keeps the readable sizes; mobile switches to the compact
  catalogue tiles (see the typography exception above).
- **Every section runs gutter-to-gutter**, like the works grid — no
  max-width on section containers, hairline rules span the full page. Line
  length stays readable via per-block measures or, where prose would run too
  wide (the statement), a two-column editorial flow. Nothing ends mid-page.
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
- Prices are the artist's decision, stated plainly in EUR. Current anchors:
  18×18 = 150 · 50×40 = 450 · 60×50 = 600 · 100×100 = 1300 ·
  150×100 = 1500 · 150×130 = 1900 · 200×150 = 2800.
  Works on paper: 10×7.5 = 80 · 20×15 = 150 · 40×30 = 250.

## 5. Imagery pipeline

- Source photos: painting on a white background (this is why the site bg is
  white). Masters live outside the repo in `STRONA/CATALOG/full`.
- Repo tiers: `IMAGES/works/<slug>.jpg` display (max 3450px, JPEG q85,
  ~1 MB) · `IMAGES/thumbs/<slug>.webp` 400px + `<slug>-800.webp` 800px
  (grid srcset) · `<slug>-hero.webp` 1600px (slideshow).
- Hero slides use `<slug>-hero.jpg`: a studio shot if one exists, otherwise
  an auto-crop of the display image with white borders trimmed (see
  scratchpad script history) so slides run full-bleed with no white strips.
- Regenerate thumbs anytime: `python scripts/make_thumbs.py` (skips
  existing).

## 6. Signature details (keep these)

- Custom cursors, two only: a small solid black square (default, 9px) and
  an open black ring (anything clickable, 13px). Shape, not just size,
  signals the change. This is the site's fingerprint.
- Sequential display numbers under every grid image.
- Collections may carry a short lowercase `note` under the heading —
  written from the work, concrete images, no gallery jargon.
- Permalinks: `kubachojnacki.com/#<slug>` opens the work's lightbox —
  the link to send collectors.
- Hero slideshow: currently 03 maroon khaki → 39 → 40 → 44 → 45 → 46,
  set via `hero: 1…n` in data.js.
- The lowercase voice: short factual lines, prices stated openly,
  "certificate of authenticity included. shipping worldwide."
- Newsletter lives on the domain, not a Kit subdomain: the signup form
  and an archive of past issues (rendered from `js/newsletter-data.js`)
  sit on the **contact** page. Keep them inside this system — achromatic,
  two families, lowercase — never a second layout language.

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

Three pages, one design system, all sharing `css/style.css` and the fixed
header (logo → home; nav: works · about · contact):

- **`/` home** — the hero slideshow (`hero: n` works from data.js) over the
  catalog: collections (grid + legend) and the lightbox, rendered from
  `js/data.js`. A hero slide opens that work in the lightbox. Collection
  descriptions come from the portfolio PDFs and live in each collection's
  `note`. Works flagged `draft: true` are held back everywhere until published.
- **`/about/`** — bio and artist statement (a home-page section). The bio
  fills its column beside a 400px portrait; the statement is set in the same
  serif voice, flowed across two full-width columns.
- **`/contact/`** — inquiries / studio / purchase details, plus the
  newsletter (signup + past-issues archive).
- **`/newsletter/`** — the studio letters. Full-width split hero: the title
  on one side, lead + signup on the other.
- **`/collector/`** — the atmosphere drop. Full-width split: a sliding
  closeup carousel of the unreleased `draft` atmosphere works (built by
  `newsletter.js` when `#collector-preview` is present, sourced from the
  `<slug>-hero.webp` crops) beside a preview-access signup. `noindex`.

`js/site.js` is **page-aware**: each block (hero / collections / lightbox)
runs only if its container is present, so one script drives the home page and
the sub-pages. `js/newsletter.js` is the same: it renders the signup form
everywhere, the past-issues archive only where its containers exist, and the
drop carousel only on the collector page. Image paths are prefixed with
`window.ROOT` (`''` at the site root, `'../'` in a sub-folder) — set it in each
page before the scripts, and always link assets and pages **relatively** so
staging under a sub-path works.
