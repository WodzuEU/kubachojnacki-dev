# kubachojnacki.com — design system

The reference for how this site looks, reads, and grows. Any change should
follow this file; if a change contradicts it, update the file in the same
commit — deliberately, not by accident.

**Guiding principle: refine, never replace.** The layout is the artist's own
design. Improvements adjust readability, spacing, and consistency inside it.
Redesigns, new visual concepts, or layout experiments are out — the one
full redesign attempt (the 2026-07 "printed catalogue") was rejected and
lives only in git history (`aeefb41`).

**2026-10: minimal first, then a page per collection.** Built from this
site after several rejected proposals (none of them on this branch). The
artist's brief: minimalism first, start from the original, nothing
overworked. After the first minimal pass he asked for three originals back:
the **header** (the name in capitals, semibold; the menu at the right edge,
the current page underlined), the **slideshow** on the home page, and the
**lightbox**. Contact took the newsletter page's split, with its sliding
closeups. On 2026-10-07, after a study of ten references he chose (artifact
"Website redesign"), he asked for: home = slideshow, then the sentence, then
one closeup per collection; a page for every collection, reached through a
line of all collections; prints sold by email with formats and prices; a
newsletter line in every footer; and the type layout he liked in
Holographik and Daniel Lanzrath, words framing the page with empty margin
around. The rules:

- **Twelve columns; text starts on column 1 or column 7**, the menu ends at
  the right edge. Pictures fill whole columns (2, 4 or 6 across; five
  across is gone, twelve does not split into five).
- **Two families, two jobs.** EB Garamond is the voice: the name and menu,
  the sentences (statement, notes, bio), the names of works. Montserrat is
  information: caption rows, sizes, prices, the price list.
- **Three sizes:** `--s` (12px, facts), `--m` (1.15rem, the voice),
  `--l` (≤2.2rem, collection names and the contact sentence). The lightbox
  keeps its original sizes; the phone header keeps its smaller name/menu.
- **Words frame the picture.** The home slideshow sits inside the page
  margins, between the header line and one row of words under it (title
  on column 1, medium on 7, size on 10, counter at the edge), nothing laid
  over the painting.
- **One line**, under the fixed header. Two accents only: the underline on
  the page (or collection) you are on, and the line of an email field.
- **Two distances:** `--near` inside a block, `--far` between blocks.
- **Nothing that is not needed.** If something new seems necessary, it has
  to replace something.

Where sections 1–7 below describe the one-page site and disagree with
these rules, these rules win. Section 8 describes the new structure.

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
- Permalinks: `kubachojnacki.com/<collection>/#<slug>` opens the work's
  lightbox, the link to send collectors (the short `/#<slug>` forwards
  there).
- Hero slideshow: currently 03 maroon khaki → 39 → 40 → 44 → 45 → 46,
  set via `hero: 1…n` in data.js.
- The lowercase voice: short factual lines, prices stated openly,
  "certificate of authenticity included. shipping worldwide."
- Newsletter lives on the domain, not a Kit subdomain. `newsletter.js`
  renders a signup into every `.nl-signup` (and `#nl-signup` on
  `/collector/`): the footer line on each page (`join`), the contact page's
  newsletter row, the page of a collection still to come. Each reports its
  `data-where` as a `signup/<where>` event (`footer`, `contact`,
  `miniatures`, `collector`), so the numbers say which placement converts.
  The archive of past issues from `js/newsletter-data.js` renders wherever
  `#nl-issues` and `#nl-count` exist (nowhere yet). Keep all of it inside
  this system: achromatic, two families, lowercase, never a second layout
  language.
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

The home page, a page per collection, about and contact, with the original
header on each: `KUBA CHOJNACKI` (EB Garamond 600, capitals, home link) and
`works, about, contact` at the right edge. `works` leads to the collections
on the home page and is underlined on every collection page. All share
`css/style.css`; `/collector/` keeps the old look through `css/legacy.css`.

- **`/` home**: the original slideshow of the selected works (the
  `hero: 1…n` works in data.js, in that order), inside the page margins and
  filling the first screen under the header; crossfade every 5 s, arrows,
  swipe. Under it one row of words: title, medium, size and year, counter.
  A slide opens its work on its collection page. Then the sentence from
  column 7, then `collections`: one closeup per collection, three across
  (its `cover` work's `-hero.webp`; prints show the A2 print on the wall;
  a collection still to come shows "photographs soon"), name and count
  under each, opening the collection's page.
- **`/<collection>/`** (atmosphere, chromatic, works-on-paper, miniatures,
  prints): the collections as one line of words (the current one in ink,
  underlined) with `grid 2 4 6` at the edge; the name at `--l` with its
  count on column 1, the `note` from column 7. Under it the grid, each work
  with one caption row (number, name, price; sold in red with the dot),
  then the price list (number, name, medium, size, price, status), then
  `next` and the following collection. `/<collection>/#<slug>` opens a work
  in the original lightbox; prev/next stay in the collection; a slug from
  another collection forwards to its page. The pages are written by
  `scripts/build_collections.py` from data.js (run it after adding or
  renaming a collection; its STAMP must match the pages' `?v=`).
- **`/prints/`** (`kind: "prints"`): the two prints side by side on a light
  wall tone (`IMAGES/prints/`, from the final print files by
  `scripts/make_prints.py`), each with the original's size and status and a
  row per format (size, cm, price, `order` by email). Picking a format
  shows its own framing; a format without a price reads "price soon".
- **`/miniatures/`** (`kind: "soon"`): the note and a signup until the
  photographs arrive; then it becomes an ordinary collection.
- **`/about/`**: the portrait on column 1, the bio and the statement from
  column 7.
- **`/contact/`**: the newsletter page's split: on the left half, bleeding
  to the edge, the sliding closeups of the two works in print
  (`.preview-carousel`, newsletter.js); from column 8 the inquiry sentence
  at `--l`, then the facts as rows (email, instagram, studio, shipping,
  prints, newsletter with the signup).
- **Footer** on every page: the newsletter in one line (label on column 1,
  the field from column 7, `join` at the edge), then email, instagram,
  city. Contact and a collection still to come leave the footer line out,
  since their page already holds the signup.
- Links from the one-page site keep working: `/#<slug>` and
  `/works/#<slug>` go to `/<collection>/#<slug>`; `/works/#<collection>`
  to that page; `/works/` and `/#works` to the collections on the home
  page; `/#about`, `/#contact` to their pages; `/newsletter/` and
  `/#newsletter` to `/contact/`.

`js/site.js` is **page-aware**: each block (the slideshow, the works page,
the lightbox) runs only if its container is present. Image and page
paths are prefixed with `window.ROOT` (`''` at the site root, `'../'` in a
sub-folder); always link assets and pages **relatively** so staging under a
sub-path works.
