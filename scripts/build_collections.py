"""Writes a page for every collection in js/data.js, the /collections/ and
/works/ forwarders (both go on to the first collection, or to the one a link
names), and sitemap.xml. Run it after adding or renaming a collection:

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

STAMP = "20261015a"
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
        # a collection shows once it has works (prints have no works)
        if not (works or kind == "prints"):
            continue
        cols.append({
            "name": name,
            "slug": name.lower().replace(" ", "-"),
            "kind": kind,
            "note": field(head, "note") or "",
            "cover": field(head, "cover"),
            "works": len(works),
            "prints": len(prints),
        })
    return cols


# ── the page ─────────────────────────────────────────────────────────────────
HEAD = """<!DOCTYPE html>
<html lang="en" data-order="{order}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
        /* the pages stand in a row: going on, the next one slides in from the
           right; going back, from the left (the row itself: js/site.js) */
        addEventListener('pagereveal', function (e) {{
            if (!e.viewTransition) return;
            var me = +document.documentElement.dataset.order, dir, from;
            try {{ dir = sessionStorage.getItem('kch-dir'); from = +sessionStorage.getItem('kch-from'); sessionStorage.removeItem('kch-dir'); }} catch (x) {{}}
            e.viewTransition.types.add(dir || (from > me ? 'back' : 'forward'));
        }});
        addEventListener('pageswap', function () {{
            try {{ sessionStorage.setItem('kch-from', document.documentElement.dataset.order); }} catch (x) {{}}
        }});
    </script>
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
    <link rel="preload" href="../fonts/eb-garamond-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="../css/fonts.css?v={stamp}">
    <link rel="stylesheet" href="../css/style.css?v={stamp}">
</head>
<body>

    <a class="skip" href="#main">skip to content</a>

    <header class="top">
        <a class="name" href="../">Kuba Chojnacki</a>
        <nav class="menu" aria-label="Site"><a href="../">home</a><a href="../{first}/" aria-current="true">collections</a><a href="../about/">about</a><a href="../contact/">contact</a></nav>
    </header>

    <main id="main" data-collection="{slug}">
        <section class="col-head grid">
            <div class="col-line">{line}</div>
            <p class="say-text note">{note}</p>
            <span class="density" id="density"></span>
        </section>
        <section id="collection"></section>
    </main>

"""

FOOT_NL = """    <footer class="foot">
        <div class="foot-top grid">
            <div class="foot-nl">
                <span class="fl">newsletter: subscribers see new works and prints first</span>
                <div class="nl-signup" data-cta="join" data-where="footer"></div>
            </div>
            <nav class="next" aria-label="Next"><a href="{next_href}"><span class="next-label">next</span><span class="next-name">{next_name}</span></a></nav>
        </div>
        <div class="foot-row grid">
            <a class="f1" href="mailto:chojnacki.studio@gmail.com">chojnacki.studio@gmail.com</a>
            <a class="f2" href="https://instagram.com/chojnacki.studio" target="_blank" rel="noopener">@chojnacki.studio</a>
            <span class="f3"><a href="../privacy/">privacy</a><span>© 2026, cracow</span></span>
        </div>
    </footer>
"""

LIGHTBOX = """
    <div id="lightbox" class="lightbox" role="dialog" aria-modal="true" aria-label="Artwork detail">
        <button class="lightbox-btn lb-close" type="button" aria-label="Close">
            <svg aria-hidden="true" focusable="false" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <button class="lightbox-btn lb-prev" type="button" aria-label="Previous work">
            <svg aria-hidden="true" focusable="false" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M15 18l-6-6 6-6"/></svg>
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
            <svg aria-hidden="true" focusable="false" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M9 18l6-6-6-6"/></svg>
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

FORWARD = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Kuba Chojnacki</title>
    <meta name="robots" content="noindex">
    <link rel="canonical" href="{site}/{first}/">
    <script src="../js/data.js?v={stamp}"></script>
    <script>
        /* collections open straight into the first one: old links to /works/ and
           /collections/ go on to the right page. #chromatic -> /chromatic/,
           #<slug> -> its collection with the work open, anything else -> the
           first collection */
        (function () {{
            var h = decodeURIComponent(location.hash.slice(1)), to = '../{first}/';
            var page = function (c) {{ return '../' + c.name.toLowerCase().replace(/\\s+/g, '-') + '/'; }};
            COLLECTIONS.forEach(function (c) {{
                if (page(c) === '../' + h + '/') to = page(c);
                (c.works || []).forEach(function (w) {{ if (w.slug === h) to = page(c) + '#' + h; }});
            }});
            location.replace(to);
        }})();
    </script>
    <noscript><meta http-equiv="refresh" content="0; url=../{first}/"></noscript>
</head>
<body></body>
</html>
"""


def describe(c):
    text = f"{c['name']} by Kuba Chojnacki: {c['note']}" if c["note"] else f"{c['name']} by Kuba Chojnacki."
    if len(text) > 158:
        text = text[:158].rsplit(" ", 1)[0].rstrip(",.;:") + "…"
    return text


def og_image(c):
    if c["kind"] != "prints" and c["cover"]:
        for name in (f"{c['cover']}-hero.jpg", f"{c['cover']}.jpg"):
            if os.path.exists(os.path.join(REPO, "IMAGES", "works", name)):
                return f"IMAGES/works/{name}"
    return "IMAGES/works/03-atmosphere-maroon-khaki-hero.jpg"


def col_line(c, cols, esc):
    # every collection in one line, in order; this one is the page's title, large
    return "".join(f'<h1 class="col-title">{esc(x["name"].lower())}</h1>' if x is c
                   else f'<a href="../{x["slug"]}/">{esc(x["name"].lower())}</a>' for x in cols)


def write(path, text):
    full = os.path.join(REPO, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with io.open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("wrote", path)


def main():
    cols = collections()
    esc = lambda s: html.escape(s, quote=True)
    for i, c in enumerate(cols):
        page = HEAD.format(
            title=esc(c["name"]), desc=esc(describe(c)), site=SITE, slug=c["slug"], og=og_image(c),
            stamp=STAMP, line=col_line(c, cols, esc), note=esc(c["note"]), first=cols[0]["slug"], order=i + 1)
        # the way on: the next collection, after the last one the about page
        nx = cols[i + 1] if i + 1 < len(cols) else None
        page += FOOT_NL.format(next_href=f"../{nx['slug']}/" if nx else "../about/",
                               next_name=esc(nx["name"].lower()) if nx else "about")
        if not c["kind"]:
            page += LIGHTBOX
        page += TAIL.format(stamp=STAMP)
        write(f"{c['slug']}/index.html", page)

    for path, title in (("collections", "Collections"), ("works", "Works")):
        write(f"{path}/index.html", FORWARD.format(site=SITE, stamp=STAMP, title=title, first=cols[0]["slug"]))

    today = datetime.date.today().isoformat()
    urls = [("", "monthly")] + [(c["slug"] + "/", "monthly") for c in cols] + [("about/", "yearly"), ("contact/", "yearly"), ("privacy/", "yearly")]
    xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    xml += [f"  <url><loc>{SITE}/{u}</loc><lastmod>{today}</lastmod><changefreq>{f}</changefreq></url>" for u, f in urls]
    xml.append("</urlset>")
    write("sitemap.xml", "\n".join(xml) + "\n")


if __name__ == "__main__":
    main()
