# -*- coding: utf-8 -*-
"""Generate missing thumbnails for every image in IMAGES/works/.

Usage:  python scripts/make_thumbs.py        (needs:  pip install Pillow)

For each  IMAGES/works/<slug>.jpg       creates  IMAGES/thumbs/<slug>.webp (400px)
                                            and  IMAGES/thumbs/<slug>-800.webp (800px)
For each  IMAGES/works/<slug>-hero.jpg  creates  IMAGES/thumbs/<slug>-hero.webp (1600px)

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
    else:
        made += resize_webp(f, THUMBS / f"{f.stem}.webp", 400)
        made += resize_webp(f, THUMBS / f"{f.stem}-800.webp", 800)

print(f"created {made} new thumbnail(s)")
