"""Web images of the prints: each size's final print file, the sheet alone
(on the page it lies on white with a soft shadow, css/style.css).

    python scripts/make_prints.py [path to the sRGB previews]

Reads  <previews>/<A1..A5>_<MK|BB>_sRGB.jpg  (PRINT/OUTPUT/podglad_v13_FINAL)
Writes IMAGES/prints/<work slug>-<a1..a5>-<600|1100>.webp
"""
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, "..", "..", "PRINT", "OUTPUT", "podglad_v13_FINAL")
OUT = os.path.join(REPO, "IMAGES", "prints")

WORKS = {"MK": "03-atmosphere-maroon-khaki", "BB": "02-atmosphere-burgundy-blue"}
SIZES = ["A1", "A2", "A3", "A4", "A5"]


def main():
    os.makedirs(OUT, exist_ok=True)
    for key, slug in WORKS.items():
        for size in SIZES:
            src = os.path.join(SRC, f"{size}_{key}_sRGB.jpg")
            if not os.path.exists(src):
                print("missing", src)
                continue
            img = Image.open(src).convert("RGB")
            for width in (600, 1100):
                out = os.path.join(OUT, f"{slug}-{size.lower()}-{width}.webp")
                im = img.resize((width, round(width * img.height / img.width)), Image.LANCZOS)
                im.save(out, "WEBP", quality=84, method=6)
                print(out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
