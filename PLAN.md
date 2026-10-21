# Redesign plan: critique round (2026-10-21)

His friend's critique, accepted except the background ("keep the white").
Choices made on the comparison page https://claude.ai/artifact/LAC5ryfYcybPE8mFTqX1M8:

- **1A hero:** painting edge to edge, untouched; title, medium, size and
  counter in one row under it; a very slow drift over the closeup while a
  painting rests. The gradient, dots and arrows go.
- **2A collection page:** index view first (the split page from alt/split:
  paintings + index), "wall" second (each painting as wide as it really is,
  softened: width ∝ cm^0.78). The 2/4/6 toggle and the price tiles go.
- **3C type:** EB Garamond for names and sentences, Inter for information
  (sizes, prices, contact rows, captions) instead of Montserrat. Prose
  (bio, collection notes) in sentence case; menus and labels stay lowercase.
  Brand guidelines (claude-design/guidelines.md, tokens.json) must follow:
  ask whether Instagram and prints switch too.
- **4A pointer:** the normal system pointer; over a painting a small "view"
  follows it a little behind ("zoom" in the lightbox), only on devices
  that hover. The square/circle cursor goes (DESIGN.md §6 to update).
- Background stays #ffffff; no colour tint of the page.

## Build order

- [x] 1. Pre-render (2026-10-21: scripts/prerender.py + put() in site.js, JSON-LD in build_collections.py, noindex on github.io, prerender rules scoped): build script writes the slideshow, selected works,
      collection list, collection grid and index into the HTML; JSON-LD
      `VisualArtwork` per work and `Person` on about; speculation rules
      scoped to the site's own base; staging commit adds `noindex`.
- [x] 2. Collection page from alt/split (index) + wall view; remove
      `.density` and `.legend-grid`; fix the split's known limits (numbers
      repeat in "all", size/price filters overlap, hovering an index row whose
      painting is off screen, white under works on paper); colour sort and a
      colour placeholder from js/colors.js.
- [x] 3. Hero 1A.
- [x] 4. Motion: page change = short dissolve with a few px of drift (no full
      slide); a painting clicked on home grows into the lightbox on its
      collection page (view-transition-name per slug); lightbox pan while
      zoomed (pointer move / drag, damped).
- [x] 5. Type 3C: self-host Inter (latin + latin-ext woff2), swap Montserrat
      in style.css and the split/wall pages; sentence case for prose.
- [x] 6. Pointer 4A.
- [x] 7. DESIGN.md + brand guidelines; stamps; every page at 1440 and 375
      with no console errors; push to dev (`dev-redesign` + CNAME removal).

Done 2026-10-21. alt/split is now the collection page (folder removed). Not decided: whether alt/canvas stays as a page; the effects lab (?explore); whether Instagram, prints and documents move to Inter too.
