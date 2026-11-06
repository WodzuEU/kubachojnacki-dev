# -*- coding: utf-8 -*-
"""Generate missing thumbnails for every image in IMAGES/works/.

Usage:  python scripts/make_thumbs.py        (needs:  pip install Pillow)

For each  IMAGES/works/<slug>.jpg       creates  IMAGES/thumbs/<slug>.webp (400px)
                                            and  IMAGES/thumbs/<slug>-800.webp (800px)
                                            and  IMAGES/thumbs/<slug>-1600.webp (1600px)
For each  IMAGES/works/<slug>-hero.jpg  creates  IMAGES/thumbs/<slug>-hero.webp (1600px)
                                            and  IMAGES/thumbs/<slug>-hero-2400.webp (2400px,
                                                 or the photo's own width when smaller)
                                            and  IMAGES/thumbs/<slug>-tile.webp (800px, the home tiles)
and once  IMAGES/og.jpg, the 1200 x 630 closeup every page's link preview shows.

The 1600px tier is what the lightbox shows; the slideshow takes the 2400px
hero on wide or sharp screens. The source JPEG is only fetched when a visitor
zooms into a work, so nobody downloads a megabyte by accident.

Existing thumbnails are skipped, so it is always safe to re-run.
"""
from pathlib import Path
from PIL import Image

ROOT   = Path(__file__).resolve().parent.parent
WORKS  = ROOT / "IMAGES" / "works"
THUMBS = ROOT / "IMAGES" / "thumbs"
THUMBS.mkdir(parents=True, exist_ok=True)

def resize_webp(src: Path, dst: Path, width: int, quality: int = 82):
    if dst.exists():
        return False
    img = Image.open(src).convert("RGB")
    w, h = img.size
    if w > width:
        img = img.resize((width, round(h * width / w)), Image.LANCZOS)
    img.save(dst, "WEBP", quality=quality, method=6)
    return True

made = 0
for f in sorted(WORKS.glob("*.jpg")):
    if f.stem.endswith("-hero"):
        made += resize_webp(f, THUMBS / f"{f.stem}.webp", 1600, quality=80)
        made += resize_webp(f, THUMBS / f"{f.stem}-2400.webp", 2400, quality=78)
    else:
        made += resize_webp(f, THUMBS / f"{f.stem}.webp", 400)
        made += resize_webp(f, THUMBS / f"{f.stem}-800.webp", 800)
        made += resize_webp(f, THUMBS / f"{f.stem}-1600.webp", 1600)

# the home tiles, from every closeup (some have no JPEG master)
for f in sorted(THUMBS.glob("*-hero.webp")):
    made += resize_webp(f, THUMBS / f"{f.stem[:-5]}-tile.webp", 800, quality=80)

og = ROOT / "IMAGES" / "og.jpg"
if not og.exists():
    img = Image.open(WORKS / "03-atmosphere-maroon-khaki-hero.jpg").convert("RGB")
    w, h = img.size
    box_h = round(w * 630 / 1200)
    top = max(0, (h - box_h) // 2)
    img.crop((0, top, w, top + box_h)).resize((1200, 630), Image.LANCZOS).save(og, "JPEG", quality=82, optimize=True, progressive=True)
    made += 1

print(f"created {made} new thumbnail(s)")
