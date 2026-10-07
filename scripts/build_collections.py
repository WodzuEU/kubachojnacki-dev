"""Writes a page for every collection in js/data.js, the /collections/ page
that lists them, the /works/ forwarder for old links, and sitemap.xml. Run it after adding or renaming a collection:

    python scripts/build_collections.py

Each page carries its name, count and note as plain HTML (what search
engines and link previews read); site.js fills in the grid, the price list
and the line of collections. STAMP must match the ?v= stamp of the pages.
"""
import datetime
import html
import io
import os
import re

STAMP = "20261007r1"
SITE = "https://kubachojnacki.com"
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)


# ── read COLLECTIONS out of data.js ─────────────────────────────────────────
def matching(src, i, open_ch, close_ch):
    """Index of the bracket closing the one at src[i], skipping strings and comments."""
    depth, j, n = 0, i, len(src)
    while j < n:
        ch = src[j]
        if ch == '"' or ch == "'":
            q = ch
            j += 1
            while src[j] != q:
                j += 2 if src[j] == "\\" else 1
        elif src.startswith("//", j):
            j = src.index("\n", j)
        elif src.startswith("/*", j):
            j = src.index("*/", j) + 1
        elif ch == open_ch:
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return j
        j += 1
    raise ValueError("unbalanced " + open_ch)


def objects(src):
    """Top-level {...} blocks of an array literal's inside."""
    out, j = [], 0
    while True:
        k = src.find("{", j)
        if k < 0:
            return out
        # skip braces inside comments
        line_start = src.rfind("\n", 0, k) + 1
        if "//" in src[line_start:k]:
            j = src.index("\n", k)
            continue
        end = matching(src, k, "{", "}")
        out.append(src[k:end + 1])
        j = end + 1


def field(obj, name):
    m = re.search(r'\b' + name + r':\s*"((?:[^"\\]|\\.)*)"', obj)
    return m.group(1).replace('\\"', '"') if m else None


def array(obj, name):
    m = re.search(r'\b' + name + r':\s*\[', obj)
    if not m:
        return ""
    start = m.end() - 1
    return obj[start + 1:matching(obj, start, "[", "]")]


def collections():
    src = io.open(os.path.join(REPO, "js", "data.js"), encoding="utf-8").read()
    start = src.index("[", src.index("const COLLECTIONS"))
    body = src[start + 1:matching(src, start, "[", "]")]
    cols = []
    for obj in objects(body):
        # the collection's own fields, with its works and prints taken out
        head = obj
        for key in ("works", "prints"):
            inner = array(head, key)
            if inner:
                head = head.replace(inner, "", 1)
        name = field(head, "name")
        kind = field(head, "kind")
        works = [w for w in objects(array(obj, "works")) if not re.search(r'\bdraft:\s*true', w)]
        prints = re.findall(r'\bwork:\s*"', array(obj, "prints"))
        count = re.search(r'\bcount:\s*(\d+)', head)
        if not (works or kind in ("prints", "soon")):
            continue
        cols.append({
            "name": name,
            "slug": name.lower().replace(" ", "-"),
            "kind": kind,
            "note": field(head, "note") or "",
            "cover": field(head, "cover"),
            "works": len(works),
            "prints": len(prints),
            "count": int(count.group(1)) if count else 0,
        })
    return cols


# ── the page ─────────────────────────────────────────────────────────────────
HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Kuba Chojnacki</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" href="{site}/{slug}/">
    <meta property="og:title" content="{title} | Kuba Chojnacki">
    <meta property="og:description" content="{desc}">
    <meta property="og:image" content="{site}/{og}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{site}/{slug}/">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#ffffff">
    <link rel="icon" type="image/png" href="../favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css?v={stamp}">
</head>
<body>

    <header class="top">
        <a class="name" href="../">Kuba Chojnacki</a>
        <nav class="menu" aria-label="Site"><a href="../">home</a><a href="../collections/" aria-current="true">collections</a><a href="../about/">about</a><a href="../contact/">contact</a></nav>
    </header>

    <main data-collection="{slug}">
        <section class="col-head grid">
            <div class="sub-row">
                <nav class="sub" id="sub" aria-label="Collections"></nav>
                <span class="density" id="density"></span>
            </div>
            <h1 class="col-title">{name}</h1>
            <p class="col-count">{count}</p>
            <p class="say-text note">{note}</p>
        </section>
{soon}        <section id="collection"></section>
        <nav class="next grid" id="next" aria-label="Next collection"></nav>
    </main>

"""

FOOT_NL = """    <footer class="foot">
        <div class="foot-nl grid">
            <span class="fl">newsletter: subscribers see new works and prints first</span>
            <div class="nl-signup" data-cta="join" data-where="footer"></div>
        </div>
        <div class="foot-row grid">
            <a class="f1" href="mailto:chojnacki.studio@gmail.com">chojnacki.studio@gmail.com</a>
            <a class="f2" href="https://instagram.com/chojnacki.studio" target="_blank" rel="noopener">@chojnacki.studio</a>
            <span class="f3">© 2026, cracow</span>
        </div>
    </footer>
"""

FOOT_PLAIN = """    <footer class="foot">
        <div class="foot-row grid">
            <a class="f1" href="mailto:chojnacki.studio@gmail.com">chojnacki.studio@gmail.com</a>
            <a class="f2" href="https://instagram.com/chojnacki.studio" target="_blank" rel="noopener">@chojnacki.studio</a>
            <span class="f3">© 2026, cracow</span>
        </div>
    </footer>
"""

SOON = """        <section class="soon grid">
            <div class="nl-signup signup" data-cta="tell me when they are up" data-where="{slug}"></div>
        </section>
"""

LIGHTBOX = """
    <div id="lightbox" class="lightbox" role="dialog" aria-modal="true" aria-label="Artwork detail">
        <button class="lightbox-btn lb-close" type="button" aria-label="Close">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <button class="lightbox-btn lb-prev" type="button" aria-label="Previous work">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="lightbox-content">
            <img id="lightbox-img" src="" alt="">
            <div class="lightbox-info">
                <div>
                    <h2 id="lb-title" class="lb-title"></h2>
                    <div id="lb-price" class="lb-price"></div>
                    <div id="lb-status" class="lb-status" hidden></div>
                    <div id="lb-specs" class="lb-specs"></div>
                </div>
                <div class="lb-inquiry-section">
                    <p class="purchase-info">For inquiries please use email or instagram direct message.</p>
                    <a id="lb-inquire-mail" href="mailto:chojnacki.studio@gmail.com" class="lb-submit">Inquire via email</a>
                    <a href="https://instagram.com/chojnacki.studio" target="_blank" rel="noopener" class="lb-submit">Inquire via instagram</a>
                    <div class="lb-extra">
                        <p>Certificate of authenticity included.</p>
                        <p>Shipping worldwide.</p>
                    </div>
                </div>
            </div>
        </div>
        <button class="lightbox-btn lb-next" type="button" aria-label="Next work">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
    </div>
"""

TAIL = """
    <script>window.ROOT = '../';</script>
    <script src="../js/data.js?v={stamp}"></script>
    <script src="../js/site.js?v={stamp}"></script>
    <script src="../js/newsletter.js?v={stamp}"></script>
</body>
</html>
"""

COLLECTIONS_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Collections | Kuba Chojnacki</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" href="{site}/collections/">
    <meta property="og:title" content="Collections | Kuba Chojnacki">
    <meta property="og:description" content="{desc}">
    <meta property="og:image" content="{site}/IMAGES/works/03-atmosphere-maroon-khaki-hero.jpg">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{site}/collections/">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#ffffff">
    <link rel="icon" type="image/png" href="../favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css?v={stamp}">
</head>
<body>

    <header class="top">
        <a class="name" href="../">Kuba Chojnacki</a>
        <nav class="menu" aria-label="Site"><a href="../">home</a><a href="./" aria-current="page">collections</a><a href="../about/">about</a><a href="../contact/">contact</a></nav>
    </header>

    <main>
        <section class="page-head grid">
            <h1 class="col-title">collections</h1>
            <p class="col-count">{count}</p>
        </section>
        <section class="covers grid" aria-label="Collections">
            <div class="cover-grid" id="covers"></div>
        </section>
    </main>

"""

FORWARD = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Works | Kuba Chojnacki</title>
    <meta name="robots" content="noindex">
    <link rel="canonical" href="{site}/">
    <script src="../js/data.js?v={stamp}"></script>
    <script>
        /* /works/ became a page per collection: old links go on to the right one.
           /works/#chromatic -> /chromatic/, /works/#<slug> -> its collection with
           the work open, anything else -> the collections page */
        (function () {{
            var h = decodeURIComponent(location.hash.slice(1)), to = '../collections/';
            var page = function (c) {{ return '../' + c.name.toLowerCase().replace(/\\s+/g, '-') + '/'; }};
            COLLECTIONS.forEach(function (c) {{
                if (page(c) === '../' + h + '/') to = page(c);
                (c.works || []).forEach(function (w) {{ if (w.slug === h) to = page(c) + '#' + h; }});
            }});
            location.replace(to);
        }})();
    </script>
    <noscript><meta http-equiv="refresh" content="0; url=../"></noscript>
</head>
<body></body>
</html>
"""


def describe(c):
    text = f"{c['name']} by Kuba Chojnacki: {c['note']}" if c["note"] else f"{c['name']} by Kuba Chojnacki."
    if len(text) > 158:
        text = text[:158].rsplit(" ", 1)[0].rstrip(",.;:") + "..."
    return text


def og_image(c):
    if c["kind"] != "prints" and c["cover"]:
        for name in (f"{c['cover']}-hero.jpg", f"{c['cover']}.jpg"):
            if os.path.exists(os.path.join(REPO, "IMAGES", "works", name)):
                return f"IMAGES/works/{name}"
    return "IMAGES/works/03-atmosphere-maroon-khaki-hero.jpg"


def count_text(c):
    if c["kind"] == "prints":
        return f"{c['prints']} prints"
    if c["kind"] == "soon":
        return f"{c['count']} works, soon"
    return f"{c['works']} works"


def write(path, text):
    full = os.path.join(REPO, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with io.open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("wrote", path)


def main():
    cols = collections()
    esc = lambda s: html.escape(s, quote=True)
    for c in cols:
        page = HEAD.format(
            title=esc(c["name"]), desc=esc(describe(c)), site=SITE, slug=c["slug"], og=og_image(c),
            stamp=STAMP, name=esc(c["name"].lower()), count=count_text(c), note=esc(c["note"]),
            soon=SOON.format(slug=c["slug"]) if c["kind"] == "soon" else "")
        page += FOOT_PLAIN if c["kind"] == "soon" else FOOT_NL
        if not c["kind"]:
            page += LIGHTBOX
        page += TAIL.format(stamp=STAMP)
        write(f"{c['slug']}/index.html", page)

    names = ", ".join(c["name"].lower() for c in cols)
    write("collections/index.html",
          COLLECTIONS_PAGE.format(site=SITE, stamp=STAMP, count=f"{len(cols)} collections",
                                  desc=esc(f"Collections of paintings by Kuba Chojnacki: {names}."))
          + FOOT_NL + TAIL.format(stamp=STAMP))

    write("works/index.html", FORWARD.format(site=SITE, stamp=STAMP))

    today = datetime.date.today().isoformat()
    urls = [("", "monthly"), ("collections/", "monthly")] + [(c["slug"] + "/", "monthly") for c in cols] + [("about/", "yearly"), ("contact/", "yearly")]
    xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    xml += [f"  <url><loc>{SITE}/{u}</loc><lastmod>{today}</lastmod><changefreq>{f}</changefreq></url>" for u, f in urls]
    xml.append("</urlset>")
    write("sitemap.xml", "\n".join(xml) + "\n")


if __name__ == "__main__":
    main()
