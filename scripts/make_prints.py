"""Web images of the prints: each size's final print file, hung on a light
wall tone so its white border reads on the white page.

    python scripts/make_prints.py [path to the sRGB previews]

Reads  <previews>/<A1..A5>_<MK|BB>_sRGB.jpg  (PRINT/OUTPUT/podglad_v10_FINAL)
Writes IMAGES/prints/<work slug>-<a1..a5>-<600|1100>.webp  (4:5)
"""
import os
import sys
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, "..", "..", "PRINT", "OUTPUT", "podglad_v10_FINAL")
OUT = os.path.join(REPO, "IMAGES", "prints")

WORKS = {"MK": "03-atmosphere-maroon-khaki", "BB": "02-atmosphere-burgundy-blue"}
SIZES = ["A1", "A2", "A3", "A4", "A5"]
WALL = (237, 237, 234)
W, H = 1100, 1375          # 4:5
PAPER_H = 0.82             # the sheet's height on the wall
CENTRE_Y = 0.47            # hung a little above the middle


def hang(sheet):
    wall = Image.new("RGB", (W, H), WALL)
    h = round(H * PAPER_H)
    w = round(h * sheet.width / sheet.height)
    sheet = sheet.resize((w, h), Image.LANCZOS)
    x, y = (W - w) // 2, round(H * CENTRE_Y - h / 2)
    # a soft shadow, so the sheet sits on the wall instead of being cut out of it
    shadow = Image.new("L", (W, H), 0)
    shadow.paste(46, (x + 2, y + 9, x + w + 2, y + h + 9))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    dark = Image.new("RGB", (W, H), (120, 120, 116))
    wall = Image.composite(dark, wall, shadow)
    wall.paste(sheet, (x, y))
    return wall


def main():
    os.makedirs(OUT, exist_ok=True)
    for key, slug in WORKS.items():
        for size in SIZES:
            src = os.path.join(SRC, f"{size}_{key}_sRGB.jpg")
            if not os.path.exists(src):
                print("missing", src)
                continue
            img = hang(Image.open(src).convert("RGB"))
            for width in (600, 1100):
                out = os.path.join(OUT, f"{slug}-{size.lower()}-{width}.webp")
                im = img if width == W else img.resize((width, round(width * H / W)), Image.LANCZOS)
                im.save(out, "WEBP", quality=84, method=6)
                print(out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
