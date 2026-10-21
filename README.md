# kubachojnacki.com

Portfolio and catalog of paintings by Kuba Chojnacki. Static site served by GitHub Pages.

Design decisions, tokens, and workflow rules live in [DESIGN.md](DESIGN.md) — read it before changing anything visual.

## Structure

A page per collection, one design system (see [DESIGN.md](DESIGN.md) §8):

```
index.html            home: the slideshow, eight selected works, the collections
<collection>/         one page per collection (atmosphere, chromatic, works-on-paper,
                      prints), written by scripts/build_collections.py
about/index.html      bio + artist statement (static prose)
contact/index.html    inquiries + the newsletter
works/, collections/  forward old links to the right collection page
privacy/index.html    what the site keeps (newsletter, inquiries, analytics, hosting)
fonts/, css/fonts.css the typefaces, kept here rather than at Google
js/explore.js         the effects lab, only with ?explore (to be removed)
css/style.css         all styling
js/data.js            ★ THE CATALOG: the only file to edit for new works
js/site.js            page-aware: renders slideshow / closeups / grid / price tiles /
                      prints / lightbox from data.js
js/newsletter.js      renders every signup form (footer, contact) + the contact carousel
IMAGES/works/         display images + hero shots   <slug>.jpg, <slug>-hero.jpg
IMAGES/thumbs/        generated WebP (400/800/1600px): run scripts/make_thumbs.py
IMAGES/prints/        the prints on a wall tone: run scripts/make_prints.py
IMAGES/about/         studio & portrait photos
scripts/              image and page tooling
```

Assets and cross-page links are **relative** (`../css/…`, `../about/`) so the
site also works when served under a sub-path on staging. Each page sets
`window.ROOT` before its scripts so image paths resolve from any depth.

## Naming scheme

Every work has a **slug**: `<ref>-<collection>-<colors>`, e.g. `02-atmosphere-burgundy-blue`.
The `ref` is the two-digit catalog number — stable forever, never reused, even for
sold or withdrawn works. All image files use the slug as their base name.

## Adding a painting

1. Export the display photo as `IMAGES/works/<slug>.jpg`
   (plus `<slug>-hero.jpg` if it should appear in the splash slideshow).
2. Run `python scripts/make_thumbs.py` (generates the WebP thumbnails).
3. Add one entry to `js/data.js` — instructions are at the top of that file.
4. Open `index.html` locally to check, then commit and push.

## Adding a collection

Add a new `{ name: "...", cover: "<slug>", note: "...", works: [...] }` block to
`COLLECTIONS` in `js/data.js`, then run `python scripts/build_collections.py`.
That writes the collection's page and the sitemap; its closeup on the home page,
the line of collections, the grid and the price list follow from data.js. A
collection with no works yet (`works: []`) stays off the site until its works
are added.

## Marking a work as sold

Add `sold: true` to its entry in `js/data.js`. Red styling in grid, legend and
lightbox plus the structured-data availability all follow from that one flag.

## Sharing a link to one painting

Every work has a permalink: `https://kubachojnacki.com/<collection>/#<slug>`,
e.g. `https://kubachojnacki.com/atmosphere/#02-atmosphere-burgundy-blue`. Opening
it shows that painting in the lightbox, ideal for Instagram DMs and email
inquiries. The older short form `https://kubachojnacki.com/#<slug>` still works
and forwards there.

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

The signup form sits in the footer of every page and on the **contact page**
(rendered by `js/newsletter.js` into every `.nl-signup`) and works once `SITE.newsletter.action` in `js/data.js` is
filled in. It is provider-agnostic — any service that accepts a plain form POST
works. Set `action` and `field`:

| Provider   | action                                                        | field           |
|------------|---------------------------------------------------------------|-----------------|
| Buttondown | `https://buttondown.com/api/emails/embed-subscribe/<username>`| `email`         |
| MailerLite | the `<form action>` URL from their *HTML embed* form code     | `fields[email]` |
| Kit        | `https://app.kit.com/forms/<form-id>/subscriptions`           | `email_address` |
| Mailchimp  | the `<form action>` URL from their embedded form code         | `EMAIL`         |

Switching providers later = changing these two values.

### Past-issues archive

Below the signup form, the contact page shows an archive of past issues in the
site's own type — so the newsletter lives on the domain, not on a separate
Kit-hosted subdomain. Issues are listed from `js/newsletter-data.js`, one entry
per published Kit broadcast, newest first:

```js
const NEWSLETTER_ISSUES = [
  { date: "2026-07-10", title: "first light", excerpt: "…", url: "https://…" },
];
```

`date` (ISO) and `title` are required; `excerpt` and `url` (the broadcast's
public "view in browser" link) are optional. Empty array → the page shows a
graceful "first issue on its way" state. Add a line here each time you send an
issue; the list can also be regenerated automatically from Kit's broadcast RSS
feed by a small build step (GitHub Action) if you want it hands-off.
