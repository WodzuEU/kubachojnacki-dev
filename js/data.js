/* ============================================================
   CATALOG DATA — the only file to edit when works change.

   To add a painting:
     1. Pick the next ref number (two digits, e.g. "31").
     2. Name the image files with the slug pattern:
          <ref>-<collection>-<colors>            e.g. 31-atmosphere-teal-rust
        and place them in:
          IMAGES/works/<slug>.jpg                (display image, required)
          IMAGES/works/<slug>-hero.jpg           (hero shot, only if hero)
          IMAGES/thumbs/<slug>.webp              (400px wide)
          IMAGES/thumbs/<slug>-800.webp          (800px wide)
          IMAGES/thumbs/<slug>-hero.webp         (1600px wide, only if hero)
        (thumbs: run  python scripts/make_thumbs.py)
     3. Add one entry below, in display order. Done — grid,
        legend, counts, lightbox and hero all update themselves.

   Fields:
     ref    catalog number (stable, never reused)
     slug   image file base name
     title  "Collection | colors" (the part after | is the subtitle)
     medium / size / year / price (EUR, number)
     w, h   pixel size of the display jpg (for layout stability)
     sold   true when sold (omit otherwise)
     hero   1, 2, 3... = position in the homepage slideshow (omit otherwise)
   ============================================================ */

const SITE = {
  url:       "https://kubachojnacki.com",
  email:     "chojnacki.studio@gmail.com",
  instagram: "https://instagram.com/chojnacki.studio",
  instagramHandle: "@chojnacki.studio",

  // optional integrations — fill in to activate (see README)
  goatcounter: "kubachojnacki",   // analytics code from goatcounter.com (loads on the live domain only)
  newsletter: {
    action: "",       // form POST URL from your email provider (see README for per-provider values)
    field:  "email",  // name of the email field (Buttondown: "email", Mailchimp: "EMAIL", MailerLite: "fields[email]", Kit: "email_address")
  },
};

const COLLECTIONS = [
  {
    name: "Atmosphere",
    works: [
      { ref: "01", slug: "01-atmosphere-navy-khaki",         title: "Atmosphere | navy khaki",           medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2025, price: 1500, w: 6048, h: 8064, hero: 3 },
      { ref: "02", slug: "02-atmosphere-burgundy-blue",      title: "Atmosphere | burgundy blue",        medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 3024, h: 4032, hero: 1, sold: true },
      { ref: "03", slug: "03-atmosphere-maroon-khaki",       title: "Atmosphere | maroon khaki",         medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 3024, h: 4032, hero: 2, sold: true },
      { ref: "04", slug: "04-atmosphere-cyan-purple-blue",   title: "Atmosphere | cyan purple blue",     medium: "acrylic on raw canvas", size: "100 × 80 cm",  year: 2026, price: 1100, w: 3024, h: 4032 },
      { ref: "05", slug: "05-atmosphere-burnt-red-green-i",  title: "Atmosphere | burnt red green I",    medium: "acrylic on raw canvas", size: "50 × 40 cm",   year: 2026, price: 450,  w: 2574, h: 3432 },
      { ref: "06", slug: "06-atmosphere-burnt-red-green-ii", title: "Atmosphere | burnt red green II",   medium: "acrylic on raw canvas", size: "50 × 40 cm",   year: 2026, price: 450,  w: 2574, h: 3432 },
      { ref: "07", slug: "07-atmosphere-burnt-red-green-iii",title: "Atmosphere | burnt red green III",  medium: "acrylic on raw canvas", size: "50 × 40 cm",   year: 2026, price: 450,  w: 2574, h: 3432 },
      { ref: "08", slug: "08-atmosphere-navy-red-khaki-i",   title: "Atmosphere | navy red khaki",       medium: "acrylic on raw canvas", size: "35 × 35 cm",   year: 2026, price: 320,  w: 5147, h: 6863 },
      { ref: "09", slug: "09-atmosphere-navy-red-khaki-ii",  title: "Atmosphere | navy red khaki",       medium: "acrylic on raw canvas", size: "35 × 35 cm",   year: 2026, price: 320,  w: 5147, h: 6863 },
      { ref: "10", slug: "10-atmosphere-navy-red-khaki-iii", title: "Atmosphere | navy red khaki",       medium: "acrylic on raw canvas", size: "35 × 35 cm",   year: 2026, price: 320,  w: 5147, h: 6863 },
      { ref: "11", slug: "11-atmosphere-burgundy-navy",      title: "Atmosphere | burgundy navy",        medium: "acrylic on raw canvas", size: "30 × 30 cm",   year: 2026, price: 260,  w: 5147, h: 6863 },
      { ref: "12", slug: "12-atmosphere-brown-black-red",    title: "Atmosphere | brown black red",      medium: "acrylic on raw canvas", size: "35 × 25 cm",   year: 2026, price: 240,  w: 2574, h: 3432 },
      { ref: "14", slug: "14-atmosphere-khaki-navy-red",     title: "Atmosphere | khaki navy red",       medium: "acrylic on raw canvas", size: "20 × 20 cm",   year: 2026, price: 180,  w: 2574, h: 3432 },
      { ref: "15", slug: "15-atmosphere-red-blue",           title: "Atmosphere | red blue",             medium: "acrylic on raw canvas", size: "18 × 18 cm",   year: 2025, price: 150,  w: 2574, h: 3432 },
      { ref: "16", slug: "16-atmosphere-steel-blue-red",     title: "Atmosphere | steel blue red",       medium: "acrylic on raw canvas", size: "20 × 20 cm",   year: 2026, price: 180,  w: 2574, h: 3432 },
      { ref: "17", slug: "17-atmosphere-deep-orange-blue",   title: "Atmosphere | deep orange blue",     medium: "acrylic on raw canvas", size: "18 × 18 cm",   year: 2025, price: 150,  w: 2574, h: 3432 },
    ],
  },
  {
    name: "Chromatic",
    works: [
      { ref: "19", slug: "19-chromatic-blue-orange", title: "Chromatic | blue orange", medium: "acrylic on raw canvas", size: "150 × 100 cm", year: 2026, price: 1500, w: 3024, h: 4032, hero: 4 },
      { ref: "20", slug: "20-chromatic-red",         title: "Chromatic | red",         medium: "acrylic on raw canvas", size: "100 × 100 cm", year: 2025, price: 1300, w: 3024, h: 4032, hero: 6 },
      { ref: "21", slug: "21-chromatic-orange",      title: "Chromatic | orange",      medium: "acrylic on raw canvas", size: "100 × 70 cm",  year: 2024, price: 950,  w: 3024, h: 4032 },
      { ref: "22", slug: "22-chromatic-blue-i",      title: "Chromatic | blue",        medium: "acrylic on raw canvas", size: "100 × 70 cm",  year: 2026, price: 950,  w: 6048, h: 8064, hero: 5 },
      { ref: "25", slug: "25-chromatic-blue-red",    title: "Chromatic | blue red",    medium: "acrylic on raw canvas", size: "30 × 30 cm",   year: 2026, price: 260,  w: 2574, h: 3432 },
      { ref: "27", slug: "27-chromatic-blue-ii",     title: "Chromatic | blue",        medium: "oil on canvas",         size: "27 × 22 cm",   year: 2024, price: 150,  w: 3024, h: 4032 },
      { ref: "28", slug: "28-chromatic-blue-iii",    title: "Chromatic | blue",        medium: "oil on canvas",         size: "27 × 22 cm",   year: 2024, price: 150,  w: 3024, h: 4032 },
      { ref: "29", slug: "29-chromatic-blue-iv",     title: "Chromatic | blue",        medium: "oil on canvas",         size: "24 × 18 cm",   year: 2024, price: 150,  w: 2984, h: 3979 },
      { ref: "30", slug: "30-chromatic-blue-v",      title: "Chromatic | blue",        medium: "acrylic on raw canvas", size: "18 × 18 cm",   year: 2025, price: 150,  w: 2574, h: 3432 },
    ],
  },
];
