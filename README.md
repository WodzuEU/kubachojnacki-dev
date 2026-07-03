# kubachojnacki.com

Portfolio and catalog of paintings by Kuba Chojnacki. Static site served by GitHub Pages.

## Structure

```
index.html          page skeleton (rarely changes)
css/style.css       all styling
js/data.js          ★ THE CATALOG — the only file to edit for new works
js/site.js          renders hero / grid / legend / lightbox from data.js
IMAGES/works/       display images + hero shots   <slug>.jpg, <slug>-hero.jpg
IMAGES/thumbs/      generated WebP (400/800/1600px) — run scripts/make_thumbs.py
IMAGES/about/       studio & portrait photos
scripts/            image tooling
```

## Naming scheme

Every work has a **slug**: `<ref>-<collection>-<colors>`, e.g. `02-atmosphere-burgundy-blue`.
The `ref` is the two-digit catalog number — stable forever, never reused, even for
sold or withdrawn works. All image files use the slug as their base name.

## Adding a painting

1. Export the display photo as `IMAGES/works/<slug>.jpg`
   (plus `<slug>-hero.jpg` if it should appear in the homepage slideshow).
2. Run `python scripts/make_thumbs.py` (generates the WebP thumbnails).
3. Add one entry to `js/data.js` — instructions are at the top of that file.
4. Open `index.html` locally to check, then commit and push.

## Adding a collection

Add a new `{ name: "...", works: [...] }` block to `COLLECTIONS` in `js/data.js`.
The collapsible section, counts, grid and legend are generated automatically.

## Marking a work as sold

Add `sold: true` to its entry in `js/data.js`. Red styling in grid, legend and
lightbox plus the structured-data availability all follow from that one flag.
