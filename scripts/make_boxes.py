"""Where the painting stands in each photograph.

    python scripts/make_boxes.py

Nothing is cropped: the photographs keep their white. This only measures the
painting, so that the white around it does not react to the pointer. Reads
IMAGES/thumbs/<slug>.webp (400px) for each slug in js/data.js and writes
js/boxes.js:

    BOXES["<slug>"] = [left, top, right, bottom]   (0-1, of the photograph)

A row or column counts as painting when enough of it is clearly darker or
more coloured than the white ground, so specks and a faint shadow do not
stretch the box. Re-run after adding works.
"""
import json
import os
import re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THUMBS = os.path.join(ROOT, "IMAGES", "thumbs")
ENOUGH = 0.06


def span(counts, size):
    hits = [i for i, n in enumerate(counts) if n >= ENOUGH * size]
    return (hits[0], hits[-1] + 1) if hits else (0, len(counts))


def box(path):
    im = Image.open(path).convert("RGB")
    W, H = im.size
    px = im.load()
    cols, rows = [0] * W, [0] * H
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            if max(r, g, b) - min(r, g, b) > 22 or (r + g + b) / 3 < 222:
                cols[x] += 1
                rows[y] += 1
    x0, x1 = span(cols, H)
    y0, y1 = span(rows, W)
    return [round(x0 / W, 4), round(y0 / H, 4), round(x1 / W, 4), round(y1 / H, 4)]


def main():
    with open(os.path.join(ROOT, "js", "data.js"), encoding="utf-8") as f:
        slugs = re.findall(r'slug:\s*"([^"]+)"', f.read())
    boxes = {s: box(os.path.join(THUMBS, s + ".webp")) for s in slugs}
    body = ",\n".join(f"  {json.dumps(s)}: {json.dumps(b)}" for s, b in boxes.items())
    with open(os.path.join(ROOT, "js", "boxes.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("/* Written by scripts/make_boxes.py: the painting in each photograph, [left, top, right, bottom], 0-1 */\n")
        f.write("const BOXES = {\n" + body + "\n};\n")
    print(len(boxes), "works")


if __name__ == "__main__":
    main()
