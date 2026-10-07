"""Builds the site's logo files from the official Reel Irie Charters logo.

Run from the repo root (after cutout_logo.py):  python _src/make_brand.py
Inputs:  _src/official-logo-sticker.png (cream border, for dark backgrounds)
         _src/official-logo-cutout.png  (no border, for light backgrounds / print)
         _src/boat.jpg
Outputs: public/images/logo*.png|webp, favicons, og-image.jpg
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

SRC = Path(__file__).parent
PUBLIC = SRC.parent / "public"
IMG = PUBLIC / "images"

sticker = Image.open(SRC / "official-logo-sticker.png").convert("RGBA")
plain = Image.open(SRC / "official-logo-cutout.png").convert("RGBA")


def fit(im, w):
    out = im.copy()
    out.thumbnail((w, w * 2), Image.LANCZOS)
    return out


# Logo on the site (dark backgrounds)
for name, w in [("logo", 520), ("logo-lg", 900)]:
    im = fit(sticker, w)
    im.save(IMG / f"{name}.png", optimize=True)
    im.save(IMG / f"{name}.webp", quality=90, method=6)
    print(name, im.size)

# Plain transparent logo for light backgrounds and print
plain.save(IMG / "logo-plain.png", optimize=True)


def square(im, size, bg=None, margin=0.06):
    canvas = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0))
    inner = int(size * (1 - margin * 2))
    lg = im.copy()
    lg.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(lg, ((size - lg.width) // 2, (size - lg.height) // 2))
    return canvas


square(sticker, 192).save(PUBLIC / "favicon.png", optimize=True)
square(sticker, 180, (5, 5, 5, 255), 0.08).convert("RGB").save(PUBLIC / "apple-touch-icon.png", optimize=True)
square(sticker, 512, (5, 5, 5, 255), 0.08).convert("RGB").save(IMG / "icon-512.png", optimize=True)

# Link preview image: the boat with the logo
boat = Image.open(SRC / "boat.jpg").convert("RGB")
og = boat.resize((1200, int(1200 * boat.height / boat.width)), Image.LANCZOS)
og = og.crop((0, (og.height - 630) // 2 + 40, 1200, (og.height - 630) // 2 + 670)).convert("RGBA")
shade = Image.new("RGBA", og.size, (0, 0, 0, 0))
ImageDraw.Draw(shade).rectangle((0, 0, 520, 630), fill=(0, 0, 0, 110))
og = Image.alpha_composite(og, shade.filter(ImageFilter.GaussianBlur(80)))
mark = fit(sticker, 380)
og.alpha_composite(mark, (48, (630 - mark.height) // 2))
og.convert("RGB").save(IMG / "og-image.jpg", quality=88)
print("og", og.size)
