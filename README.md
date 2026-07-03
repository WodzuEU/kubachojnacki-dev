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

## Sharing a link to one painting

Every work has a permalink: `https://kubachojnacki.com/#<slug>`, e.g.
`https://kubachojnacki.com/#02-atmosphere-burgundy-blue`. Opening it shows
that painting in the lightbox — ideal for Instagram DMs and email inquiries.

## Staging → production workflow

Test changes on the staging repo before they touch the live site:

```
git push dev dev-pages:main      # publish to wodzueu.github.io/kubachojnacki-dev
git push origin refactor:main    # promote to kubachojnacki.com when happy
```

(`dev-pages` = `refactor` + one commit that removes CNAME; the custom domain
must exist only in the production repo.)

## Analytics

[GoatCounter](https://www.goatcounter.com) is configured (`goatcounter: "kubachojnacki"`
in `js/data.js`). It loads **only on kubachojnacki.com**, so local previews and the
staging site never pollute the numbers. Dashboard: https://kubachojnacki.goatcounter.com

## Newsletter

The signup form appears in the contact section once `SITE.newsletter.action` in
`js/data.js` is filled in. It is provider-agnostic — any service that accepts a
plain form POST works. Set `action` and `field`:

| Provider   | action                                                        | field           |
|------------|---------------------------------------------------------------|-----------------|
| Buttondown | `https://buttondown.com/api/emails/embed-subscribe/<username>`| `email`         |
| MailerLite | the `<form action>` URL from their *HTML embed* form code     | `fields[email]` |
| Kit        | `https://app.kit.com/forms/<form-id>/subscriptions`           | `email_address` |
| Mailchimp  | the `<form action>` URL from their embedded form code         | `EMAIL`         |

Switching providers later = changing these two values.
