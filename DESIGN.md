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
  the sentences (notes, collection texts), the names of works and
  collections. Montserrat is information: sizes, prices, the price tiles,
  the about text and the contact rows (2026-10-10, his Canva).
- **Sizes.** Garamond: `--m` (1.15rem, sentences and links), `--l` (≤2.2rem,
  names of collections and works, the slideshow caption, "selected works"), `--xl`
  (≈2.75rem, the `next` link and the line on the about page). Montserrat:
  `--s` (12px, small facts) and `--t` (1.0625rem, rows that are read). The
  lightbox keeps its original sizes; the phone header its smaller name/menu.
- **EB Garamond 400 only**, roman and italic: the name in the header is
  regular since 2026-10-10 (he asked for it lighter), headings are set to
  400 so nothing is ever drawn as a fake bold.
- **Fonts live on this site** (2026-10-11): `fonts/` holds the variable woff2
  files (EB Garamond roman and italic, Montserrat; latin and latin-ext for
  the Polish letters), `css/fonts.css` declares them; nothing loads from
  Google, so no visitor's address goes there. The roman Garamond is preloaded.
- **One line**, under the fixed header. Accents only: the underline on the
  page (or size) you are on, the line of an email field, the short line
  over the print sizes.
- **Two distances:** `--near` inside a block, `--far` between blocks.
- **Nothing that is not needed.** If something new seems necessary, it has
  to replace something.
- **Checked against Vercel's Web Interface Guidelines** (2026-10-10): a skip
  link on every page; icon SVGs hidden from screen readers; the slideshow and
  the contact slider play one round and rest, and wait under the pointer or
  keyboard focus; the lightbox zooms with Enter or Space too; numbers never
  part from their units (`nb()` in site.js, `450 €`); the email field
  autocompletes and says "sending…"; the thank-you is read out; the fixed
  header never covers what has focus (`scroll-padding-top`); the lightbox
  keeps its scroll to itself (`overscroll-behavior`). Not followed, by house
  style: Title Case, second person, numerals for small counts.
- **Audited with the redesign-existing-projects skill** (2026-10-10): kept
  from it a -0.01em tracking on large Garamond, even line breaks
  (`text-wrap`), a pixel of press on buttons, the numeral span as a class
  (`.rn`), social cards on about/contact, and the 404 brought to the current
  menu. Not taken, because his choices say otherwise: a font swap, more
  weights, grain or background imagery, a max-width container, scroll
  reveals and staggered entries, broken-grid overlaps.

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
- **Works grid: the visitor picks the density**: 2, 4 or 6 across, from three
  icons at the right of the collection head, each a small picture of its own
  grid, as in a shop (2026-10-10, his request), the one in use dark. **6 across
  to start**; a choice is remembered in `localStorage` (`kch-grid-cols`). On a
  phone (≤800px) the grid is two across and the icons are hidden.
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
- Sequential display numbers under every grid image: number, then name
  ("07 burgundy blue"), Montserrat 12px. With a mouse they show on hover; on
  a touch screen (`hover: none`) they always stand under the painting.
- Motion (2026-10-15 smoothness pass). Three lengths and two curves, as
  tokens in `:root` that site.js reads too: `--t-fast` 200ms (hover, press),
  `--t-base` 450ms (lightbox, page slide, caption, a step), `--t-slow` 900ms
  (slide crossfade, a picture arriving); `--ease` between two rests,
  `--ease-out` for what arrives. Only opacity and transform move. A picture
  is decoded before it fades in or replaces another. The slideshow crossfade
  keeps the leaving painting whole underneath (no grey dip), plays one
  round, and waits while hovered, focused, scrolled away or in a hidden tab.
  Pages slide as one row (forward/back types); the header never moves.
  `scrollbar-gutter: stable` keeps every page the same width, so nothing
  shifts when the lightbox locks the page. ← → walk the pages only when no
  control has focus. Reduced motion: no page slide, no rises, instant fades.
- Prerender: site.js adds speculation rules, so Chrome draws a page of the
  site while the pointer rests on its link. GoatCounter loads (in site.js
  and newsletter.js) only once a prerendered page is really opened.
- The slideshow's first painting is preloaded in index.html; when `hero: 1`
  changes in data.js, change that `<link rel="preload">` too. Slides use
  `-hero.webp` (1600) and `-hero-2400.webp`; the JPEG masters are for zoom.
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
  newsletter row. Each reports its
  `data-where` as a `signup/<where>` event (`footer`, `contact`,
  `collector`), so the numbers say which placement converts.
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

Rebuilt 2026-10-10 from his Canva design ("Copy of Copy of Website redesign",
DAHXg-DmNi0): home page 2 of his four (page 3, a scroll scene opening the
slideshow onto a turning row of works and then the collections, was built
first and set aside the same day: "that's not gonna work"), about page 9.

The home page, a collections page, a page per collection, about and
contact, with the original header on each: `KUBA CHOJNACKI` (EB Garamond
400, capitals, home link) and `home, collections, about, contact` at the
right edge. `collections` is underlined on the collections page and on every
collection page. All share `css/style.css`; `/collector/` keeps the old look
through `css/legacy.css`.

- **`/` home**: the original slideshow of the `hero: 1…n` works, edge to
  edge across the first screen under the header (4:5 on a phone);
  crossfade every 5 s, arrows, swipe; the work's name on the painting,
  bottom left, white Garamond `--l`. Under it "selected works" at `--l` and
  the eight works of `HOME.selected` (data.js), whole, four across in 4:5
  boxes (two on a phone), no captions, each opening on its collection page.
  Then "collections" (`--m`) and the collections one to a row: the name at
  `--xl` on columns 1-3, its `line` (data.js, a few words) at `--m` from
  column 4; the row opens the collection (stacked on a phone). His Canva
  also lists "studio notes" last: not built, no page for it yet. Then the
  footer with `next works`.
- **`collections` goes straight in** (2026-10-10, his call: "show already
  the expanded view"): the menu link and home's `next works` open the first
  collection (atmosphere) with its paintings and the line of the others.
  There is no in-between page of tiles: `/collections/` is a forwarder like
  `/works/`. The hand-written pages (index, about, contact) link
  `atmosphere/` directly; if the first collection ever changes, change
  those three links too (the generated pages follow data.js).
- A collection with no works yet (miniatures, until its photographs come)
  is left out everywhere: no picture, no page, not in the line of
  collections or the `next` chain.
- **`/<collection>/`** (atmosphere, chromatic, works-on-paper, prints): one
  line of all collections in order, this one as the page's `h1` at `--l`,
  the others at `--m`; the `note` under it on columns 1–6, `grid 2 4 6` at
  the right edge. The grid shows **the paintings alone**, no captions (his
  Canva); names, numbers and prices are in **the original site's grid of
  small tiles** under it (number, name, medium / size / year, price,
  status; 8 across, 6 under 1100px, the condensed 6 and 4 on phones).
  `/<collection>/#<slug>` opens a work in the original lightbox; prev/next
  stay in the collection; a slug from another collection forwards to its
  page. The pages, the line of collections and the `next` link are written
  by `scripts/build_collections.py` from data.js (run it after adding or
  renaming a collection; its STAMP must match the pages' `?v=`).
- **`/prints/`** (`kind: "prints"`): one print to a row, the picture on
  columns 1–4 (an A-paper box over the print on its wall tone,
  `IMAGES/prints/`), its words from column 5: the name at `--l` with the
  original's size and status; an optional per-print `note`; a row per
  format, A1 450 €, A2 250 €, A3 150 €, each with its own `order` link (an
  email with the size in the subject) and its edition (5, 15, 30;
  `PRINT_FORMATS` in data.js); at the foot of the column, under a short
  line, the three sizes in cm. Clicking a size shows its framing (A2 to
  start) and underlines it. A4 and A5 are gone (his Canva).
- **`/about/`**: the portrait on column 1; from column 7, in Montserrat
  `--t`, the sentence that used to open the home page and the statement;
  then, across the page, centred, at `--xl`: "color caught in a shift,
  transmission of one hue to another | gradient". Footer row only.
- **`/contact/`**: the sliding closeups of the two works in print, upright
  (A-paper proportions) on columns 2–5, no caption or dots; from column 7
  the rows in Montserrat `--t`: email, instagram, studio, newsletter with
  the signup. Footer row only.
- **Footer** on home and every collection page: the newsletter
  on the left (label over the field, columns 1–4), and on the right the
  way on, large: `next` (Montserrat, grey) and the next page in Garamond
  `--xl` with an arrow. Home leads to `works` (atmosphere), each
  collection to the next, prints to `about`. Then
  email, instagram, city.
- **The selected works** (2026-10-11) are the eight he sent, in colour order,
  one loop from blue through burgundy and khaki to umber: `HOME.selected` in
  data.js. Two are new paintings not yet on the site (`new-01`, `new-02` in
  IMAGES/thumbs): they hang unlinked until they have a name, size and price.
- **Grid icons**: small framed paintings, two, four or six to a row, outlined;
  the one in use filled.
- **`/privacy/`**: who keeps what (the newsletter list at Kit, inquiries,
  cookieless GoatCounter, GitHub's server logs, local fonts), as fact rows like
  the contact page; linked from every footer beside the year.
- **The effects lab** (`?explore`, js/explore.js, css/explore.css): switches
  to try effects on the real pages before choosing. Not part of the site:
  site.js loads it only after a visit with `?explore`. When he has chosen,
  move the chosen effects into style.css/site.js and delete both files and
  the loader.
- Links from the one-page site keep working: `/#<slug>` and
  `/works/#<slug>` go to `/<collection>/#<slug>`; `/works/#<collection>`
  to that page; `/works/`, `/collections/` and `/#works` to the first collection; `/#about`, `/#contact` to their pages; `/newsletter/` and
  `/#newsletter` to `/contact/`.

`js/site.js` is **page-aware**: each block (the slideshow, the works page,
the lightbox) runs only if its container is present. Image and page
paths are prefixed with `window.ROOT` (`''` at the site root, `'../'` in a
sub-folder); always link assets and pages **relatively** so staging under a
sub-path works.
