"""Writes what js/site.js draws into the pages themselves, so a page arrives
whole: search engines, link previews and slow connections see the paintings,
names and prices before any script runs.

    python scripts/prerender.py        (build_collections.py runs it at the end)

Each page is opened once in headless Chrome. site.js reports every block it
fills (`put()` in site.js) with a fingerprint of the HTML; this script saves
that HTML between <!--pre:ID--> marks inside the block and the fingerprint
as data-pre="…" on it. In the browser site.js leaves a block alone while the
fingerprint still matches, and draws it again when it does not (data.js
changed since the last run), so a forgotten run is never wrong for long.

Needs Chrome or Edge (found by scripts/cdp.py). Re-run after any change to
js/data.js or to the HTML that site.js writes.
"""
import functools
import http.server
import io
import json
import os
import re
import socket
import sys
import threading

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from cdp import Browser, CHROME  # noqa: E402

# the pages whose blocks site.js fills
PAGES = ["index.html"] + sorted(
    f"{d}/index.html" for d in os.listdir(REPO)
    if os.path.exists(os.path.join(REPO, d, "index.html"))
    and 'data-collection="' in io.open(os.path.join(REPO, d, "index.html"), encoding="utf-8").read())


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def serve():
    port = free_port()
    handler = functools.partial(QuietHandler, directory=REPO)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, port


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def save(path, blocks):
    """Put each block's HTML into the page, between its marks."""
    full = os.path.join(REPO, path)
    src = io.open(full, encoding="utf-8").read()
    for bid, b in blocks.items():
        m = re.search(r'<(\w+)\b([^>]*\bid="' + re.escape(bid) + r'"[^>]*)>', src)
        if not m:
            raise SystemExit(f"{path}: no element with id={bid}")
        tag, attrs = m.group(1), m.group(2)
        attrs = re.sub(r'\s+data-pre="[^"]*"', "", attrs) + f' data-pre="{b["h"]}"'
        start, end = f"<!--pre:{bid}-->", f"<!--/pre:{bid}-->"
        after = m.end()
        if src.startswith(start, after):
            stop = src.index(end, after) + len(end)
        elif src.startswith(f"</{tag}>", after):
            stop = after
        else:
            raise SystemExit(f"{path}: #{bid} is not empty and has no <!--pre--> marks")
        src = src[:m.start()] + f"<{tag}{attrs}>" + start + b["html"] + end + src[stop:]
    with io.open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(src)


def main():
    if not CHROME:
        print("prerender: Chrome or Edge not found, pages left as they are (site.js still draws them)")
        return
    httpd, port = serve()
    try:
        with Browser(port=free_port()) as b:
            p = b.page(1440, 900)
            p.call("Page.addScriptToEvaluateOnNewDocument", source="window.__SNAP = {};")
            for path in PAGES:
                url = f"http://127.0.0.1:{port}/" + path.replace("index.html", "")
                p.errors.clear()
                p.go(url, wait=2.0)
                blocks = json.loads(p.js("JSON.stringify(window.__SNAP || {})") or "{}")
                errs = [e for e in p.errors if "favicon" not in e]
                if errs:
                    raise SystemExit(f"prerender: {path} has errors, nothing saved: {errs[:2]}")
                if not blocks:
                    print(f"prerender: {path}: nothing drawn")
                    continue
                save(path, blocks)
                print(f"prerendered {path}: " + ", ".join(f"#{k}" for k in blocks))
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    main()
