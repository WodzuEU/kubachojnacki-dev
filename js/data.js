/* ============================================================
   CATALOG DATA — the only file to edit when works change.

   To add a painting:
     1. Pick the next ref number (two digits, e.g. "47").
     2. Name the image files with the slug pattern:
          <ref>-<collection>-<colors>            e.g. 47-atmosphere-teal-rust
        and place them in:
          IMAGES/works/<slug>.jpg                (display image, required)
          IMAGES/works/<slug>-hero.jpg           (hero shot, only if hero)
          IMAGES/thumbs/<slug>.webp              (400px wide)
          IMAGES/thumbs/<slug>-800.webp          (800px wide)
          IMAGES/thumbs/<slug>-hero.webp         (1600px wide, only if hero)
        (thumbs: run  python scripts/make_thumbs.py)
     3. Add one entry below, in display order. Done — grid, legend,
        counts, lightbox and hero all update themselves.

   Display order inside a collection: by physical size, largest
   first; within one size by color — violets, blues, greens, reds,
   earth tones last.

   Fields:
     ref    catalog number (stable, never reused)
     slug   image file base name
     title  "Collection | colors" (the part after | is the subtitle)
     medium / size / year / price (EUR, number)
     w, h   pixel size of the display jpg (for layout stability)
     sold   true when sold (omit otherwise)
     unavailable  true when held back from sale but still shown
                  (exhibition, loan, reserved) — grey dot, not red
     hero   1, 2, 3... = position in the homepage slideshow (omit otherwise)

   A collection may carry a short `note` (1-2 lowercase sentences)
   shown under its heading, a `line` (a few words) beside its name in the
   list on the home page, and a `cover`: the slug of the work whose
   closeup (IMAGES/thumbs/<slug>-hero.webp) stands for it on the home page.

   Every collection has its own page, /<name>/ (e.g. /works-on-paper/).
   After ANY change in this file, run
        python scripts/build_collections.py
   which writes those pages, the sitemap and the structured data from
   this file, then saves what site.js draws into the pages themselves
   (scripts/prerender.py, needs Chrome). Forgetting it is never wrong for
   long: site.js sees the pages are out of date and draws them again.

   A collection with no works yet stays off the site until they are added.
   Prints have their own layout:
     kind: "prints"  `prints`: the painting (slug) and its formats;
                     price null shows "price soon"
   ============================================================ */

const SITE = {
  url:       "https://kubachojnacki.com",
  email:     "chojnacki.studio@gmail.com",
  instagram: "https://instagram.com/chojnacki.studio",
  instagramHandle: "@chojnacki.studio",

  // optional integrations — fill in to activate (see README)
  goatcounter: "kubachojnacki",   // analytics code from goatcounter.com (loads on the live domain only)
  newsletter: {
    action: "https://app.kit.com/forms/9647573/subscriptions",  // Kit form "kubachojnacki.com"
    field:  "email_address",
  },
};

// sizes the two paintings are printed in. A1-A3 prices: the artist's plan
// (2026-10-05); A4 and A5 not decided yet.
// each size is a limited edition of `edition` prints
const PRINT_FORMATS = [
  { size: "A1", cm: "59.4 × 84.1 cm", price: 450, edition: 5 },
  { size: "A2", cm: "42 × 59.4 cm",   price: 250, edition: 15 },
  { size: "A3", cm: "29.7 × 42 cm",   price: 150, edition: 30 },
];

// home: the selected works under the slideshow, four across, in this order:
// one loop of colour, from blue through burgundy and khaki to umber and back
// to blue. A work on the site is named by its slug; a painting not yet on the
// site (no name, size or price yet) by its picture alone, shown unlinked.
const HOME = {
  selected: [
    "40-atmosphere-blue",
    "41-atmosphere-burgundy-blue-ii",
    "02-atmosphere-burgundy-blue",
    "03-atmosphere-maroon-khaki",
    { img: "new-01", w: 1500, h: 2000, alt: "A new painting: maroon running down over khaki and white" },
    "38-atmosphere-burgundy-khaki",
    "39-atmosphere-brown-purple",
    { img: "new-02", w: 1500, h: 2000, alt: "A new painting: umber running down over cream, with drops of blue" },
  ],
};

const COLLECTIONS = [
  {
    name: "Atmosphere",
    line: "main body of work, colors conformed to gravity in a single pursuit of gradient",
    cover: "44-atmosphere-lavender-green-ochre",
    note: "Fields of thin acrylic on raw canvas. It moves from violets and blues through green into burgundies and earthy tones; the scale runs from two-metre canvases to intimate works. It studies how color acts on the psyche before cognition catches up, and the gradient never reaches a steady state.",
    works: [
      { ref: "44", slug: "44-atmosphere-lavender-green-ochre", title: "Atmosphere | lavender green ochre", medium: "acrylic on raw canvas", size: "200 × 150 cm", year: 2026, price: 2800, w: 2588, h: 3450, hero: 4 },
      { ref: "45", slug: "45-atmosphere-deep-violet",          title: "Atmosphere | deep violet",          medium: "acrylic on raw canvas", size: "150 × 130 cm", year: 2026, price: 1900, w: 2588, h: 3450, hero: 5 },
      { ref: "46", slug: "46-atmosphere-dark-plum",            title: "Atmosphere | dark plum",            medium: "acrylic on raw canvas", size: "150 × 130 cm", year: 2026, price: 1900, w: 2588, h: 3450, hero: 6 },
      { ref: "01", slug: "01-atmosphere-navy-khaki",           title: "Atmosphere | navy khaki",           medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2025, price: 1500, w: 6048, h: 8064, sold: true },
      { ref: "40", slug: "40-atmosphere-blue",                 title: "Atmosphere | blue",                 medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 2588, h: 3450, hero: 3, unavailable: true },
      { ref: "43", slug: "43-atmosphere-deep-green-blue",      title: "Atmosphere | deep green blue",      medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 2588, h: 3450 },
      { ref: "02", slug: "02-atmosphere-burgundy-blue",        title: "Atmosphere | burgundy blue",        medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 3024, h: 4032, sold: true },
      { ref: "41", slug: "41-atmosphere-burgundy-blue-ii",     title: "Atmosphere | burgundy blue II",     medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 2588, h: 3450 },
      { ref: "03", slug: "03-atmosphere-maroon-khaki",         title: "Atmosphere | maroon khaki",         medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 3024, h: 4032, sold: true, hero: 1 },
      { ref: "38", slug: "38-atmosphere-burgundy-khaki",       title: "Atmosphere | burgundy khaki",       medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 2588, h: 3450, unavailable: true },
      { ref: "39", slug: "39-atmosphere-brown-purple",         title: "Atmosphere | brown purple",         medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 2588, h: 3450, hero: 2 },
      { ref: "42", slug: "42-atmosphere-umber-indigo-azure",   title: "Atmosphere | umber indigo azure",   medium: "acrylic on raw canvas", size: "100 × 100 cm", year: 2026, price: 1300, w: 2588, h: 3450, sold: true },
      { ref: "32", slug: "32-atmosphere-burgundy",             title: "Atmosphere | burgundy",             medium: "acrylic on raw canvas", size: "100 × 100 cm", year: 2026, price: 1300, w: 2588, h: 3450 },
      { ref: "04", slug: "04-atmosphere-cyan-purple-blue",     title: "Atmosphere | cyan purple blue",     medium: "acrylic on raw canvas", size: "100 × 80 cm",  year: 2026, price: 1100, w: 3024, h: 4032 },
      { ref: "37", slug: "37-atmosphere-blue-red",             title: "Atmosphere | blue red",             medium: "acrylic on raw canvas", size: "60 × 50 cm",   year: 2026, price: 600,  w: 2587, h: 3450 },
      { ref: "35", slug: "35-atmosphere-violet-plum-i",        title: "Atmosphere | violet plum I",        medium: "acrylic on raw canvas", size: "50 × 40 cm",   year: 2026, price: 450,  w: 2587, h: 3450 },
      { ref: "36", slug: "36-atmosphere-violet-plum-ii",       title: "Atmosphere | violet plum II",       medium: "acrylic on raw canvas", size: "50 × 40 cm",   year: 2026, price: 450,  w: 2587, h: 3450 },
      { ref: "33", slug: "33-atmosphere-blue",                 title: "Atmosphere | blue",                 medium: "acrylic on raw canvas", size: "50 × 40 cm",   year: 2026, price: 450,  w: 2587, h: 3450 },
      { ref: "34", slug: "34-atmosphere-green-blue",           title: "Atmosphere | green blue",           medium: "acrylic on raw canvas", size: "50 × 40 cm",   year: 2026, price: 450,  w: 2587, h: 3450 },
      { ref: "05", slug: "05-atmosphere-burnt-red-green-i",    title: "Atmosphere | burnt red green I",    medium: "acrylic on raw canvas", size: "50 × 40 cm",   year: 2026, price: 450,  w: 2574, h: 3432, sold: true },
      { ref: "06", slug: "06-atmosphere-burnt-red-green-ii",   title: "Atmosphere | burnt red green II",   medium: "acrylic on raw canvas", size: "50 × 40 cm",   year: 2026, price: 450,  w: 2574, h: 3432 },
      { ref: "07", slug: "07-atmosphere-burnt-red-green-iii",  title: "Atmosphere | burnt red green III",  medium: "acrylic on raw canvas", size: "50 × 40 cm",   year: 2026, price: 450,  w: 2574, h: 3432 },
      { ref: "08", slug: "08-atmosphere-navy-red-khaki-i",     title: "Atmosphere | navy red khaki",       medium: "acrylic on raw canvas", size: "35 × 35 cm",   year: 2026, price: 320,  w: 5147, h: 6863, sold: true },
      { ref: "09", slug: "09-atmosphere-navy-red-khaki-ii",    title: "Atmosphere | navy red khaki",       medium: "acrylic on raw canvas", size: "35 × 35 cm",   year: 2026, price: 320,  w: 5147, h: 6863, sold: true },
      { ref: "10", slug: "10-atmosphere-navy-red-khaki-iii",   title: "Atmosphere | navy red khaki",       medium: "acrylic on raw canvas", size: "35 × 35 cm",   year: 2026, price: 320,  w: 5147, h: 6863 },
      { ref: "11", slug: "11-atmosphere-burgundy-navy",        title: "Atmosphere | burgundy navy",        medium: "acrylic on raw canvas", size: "30 × 30 cm",   year: 2026, price: 260,  w: 5147, h: 6863 },
      { ref: "12", slug: "12-atmosphere-brown-black-red",      title: "Atmosphere | brown black red",      medium: "acrylic on raw canvas", size: "35 × 25 cm",   year: 2026, price: 240,  w: 2574, h: 3432 },
      { ref: "16", slug: "16-atmosphere-steel-blue-red",       title: "Atmosphere | steel blue red",       medium: "acrylic on raw canvas", size: "20 × 20 cm",   year: 2026, price: 180,  w: 2574, h: 3432 },
      { ref: "14", slug: "14-atmosphere-khaki-navy-red",       title: "Atmosphere | khaki navy red",       medium: "acrylic on raw canvas", size: "20 × 20 cm",   year: 2026, price: 180,  w: 2574, h: 3432 },
      { ref: "15", slug: "15-atmosphere-red-blue",             title: "Atmosphere | red blue",             medium: "acrylic on raw canvas", size: "18 × 18 cm",   year: 2025, price: 150,  w: 2574, h: 3432 },
      { ref: "17", slug: "17-atmosphere-deep-orange-blue",     title: "Atmosphere | deep orange blue",     medium: "acrylic on raw canvas", size: "18 × 18 cm",   year: 2025, price: 150,  w: 2574, h: 3432 },
    ],
  },
  {
    name: "Chromatic",
    line: "archival works and experiments, each holding a single color",
    cover: "20-chromatic-red",
    note: "Archival works and experiments exploring hues and colors. Earlier oils sit beside recent acrylics on raw canvas, each holding a single color as it opens.",
    works: [
      { ref: "19", slug: "19-chromatic-blue-orange",  title: "Chromatic | blue orange", medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 3024, h: 4032 },
      { ref: "18", slug: "18-chromatic-orange-ii",    title: "Chromatic | orange II",   medium: "acrylic on raw canvas", size: "100 × 100 cm", year: 2026, price: 1300, w: 2588, h: 3450 },
      { ref: "20", slug: "20-chromatic-red",          title: "Chromatic | red",         medium: "acrylic on raw canvas", size: "100 × 100 cm", year: 2025, price: 1300, w: 3024, h: 4032 },
      { ref: "21", slug: "21-chromatic-orange",      title: "Chromatic | orange",      medium: "acrylic on raw canvas", size: "100 × 70 cm",  year: 2024, price: 950,  w: 3024, h: 4032 },
      { ref: "22", slug: "22-chromatic-blue-i",      title: "Chromatic | blue",        medium: "acrylic on raw canvas", size: "100 × 70 cm",  year: 2026, price: 950,  w: 6048, h: 8064 },
      { ref: "25", slug: "25-chromatic-blue-red",    title: "Chromatic | blue red",    medium: "acrylic on raw canvas", size: "30 × 30 cm",   year: 2026, price: 260,  w: 2574, h: 3432 },
      { ref: "27", slug: "27-chromatic-blue-ii",     title: "Chromatic | blue",        medium: "oil on canvas",         size: "27 × 22 cm",   year: 2024, price: 150,  w: 3024, h: 4032 },
      { ref: "28", slug: "28-chromatic-blue-iii",    title: "Chromatic | blue",        medium: "oil on canvas",         size: "27 × 22 cm",   year: 2024, price: 150,  w: 3024, h: 4032 },
      { ref: "29", slug: "29-chromatic-blue-iv",     title: "Chromatic | blue",        medium: "oil on canvas",         size: "24 × 18 cm",   year: 2024, price: 150,  w: 2984, h: 3979 },
      { ref: "30", slug: "30-chromatic-blue-v",      title: "Chromatic | blue",        medium: "acrylic on raw canvas", size: "18 × 18 cm",   year: 2025, price: 150,  w: 2574, h: 3432 },
    ],
  },
  {
    name: "Works on paper",
    line: "six unique studies, airbrushed on cold press paper",
    cover: "47-paper-purple-01",
    note: "Six unique studies in thin acrylic, airbrushed on cold press paper (300 g, light grain). The series runs from deep purples into crimson reds.",
    works: [
      { ref: "47", slug: "47-paper-purple-01",  title: "Study in purple 01",  medium: "acrylic on cold press paper", size: "40 × 30 cm",   year: 2026, price: 250, w: 425, h: 578 },
      { ref: "48", slug: "48-paper-purple-02",  title: "Study in purple 02",  medium: "acrylic on cold press paper", size: "40 × 30 cm",   year: 2026, price: 250, w: 443, h: 602 },
      { ref: "49", slug: "49-paper-crimson-01", title: "Study in crimson 01", medium: "acrylic on cold press paper", size: "40 × 30 cm",   year: 2026, price: 250, w: 443, h: 602 },
      { ref: "50", slug: "50-paper-crimson-02", title: "Study in crimson 02", medium: "acrylic on cold press paper", size: "20 × 15 cm",   year: 2026, price: 150, w: 443, h: 602 },
      { ref: "51", slug: "51-paper-crimson-03", title: "Study in crimson 03", medium: "acrylic on cold press paper", size: "20 × 15 cm",   year: 2026, price: 150, w: 443, h: 602 },
      { ref: "52", slug: "52-paper-crimson-04", title: "Study in crimson 04", medium: "acrylic on cold press paper", size: "10 × 7.5 cm",  year: 2026, price: 80,  w: 202, h: 289, sold: true },
    ],
  },
  // nine new small works: off the site until their photographs are added here
  // (with a cover and a new note), then run build_collections.py
  {
    name: "Miniatures",
    line: "one color, explored through different tonal shifts",
    note: "Nine new small works. Photographs soon.",
    works: [],
  },
  {
    name: "Prints",
    line: "limited edition prints of two paintings",
    kind: "prints",
    note: "Limited edition prints of two paintings, giclée on fine art archival paper with a white border. Each size frames the painting a little closer.",
    works: [],
    prints: [
      { work: "03-atmosphere-maroon-khaki",  formats: PRINT_FORMATS },
      { work: "02-atmosphere-burgundy-blue", formats: PRINT_FORMATS },
    ],
  },
];
