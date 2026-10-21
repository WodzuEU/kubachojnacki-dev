# -*- coding: utf-8 -*-
"""Generate missing thumbnails for every image in IMAGES/works/.

Usage:  python scripts/make_thumbs.py        (needs:  pip install Pillow)

For each  IMAGES/works/<slug>.jpg       creates  IMAGES/thumbs/<slug>.webp (400px)
                                            and  IMAGES/thumbs/<slug>-800.webp (800px)
                                            and  IMAGES/thumbs/<slug>-1600.webp (1600px)
For each  IMAGES/works/<slug>-hero.jpg  creates  IMAGES/thumbs/<slug>-hero.webp (1600px)
                                            and  IMAGES/thumbs/<slug>-hero-2400.webp (2400px,
                                                 or the photo's own width when smaller)

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

print(f"created {made} new thumbnail(s)")
