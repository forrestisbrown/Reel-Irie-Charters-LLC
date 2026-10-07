"""Builds the Reel Irie Charters logo PNGs from the original artwork.

Run from the repo root:  python _src/make_logos.py
Inputs live in _src/ (original-logo.png, boat.jpg, fonts/). Outputs go to images/ and the root.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

SRC = Path(__file__).parent
ROOT = SRC.parent
PUBLIC = ROOT / "public"
IMG = PUBLIC / "images"
FONT = str(SRC / "fonts" / "Bevan-Regular.ttf")
NAME = "REEL IRIE CHARTERS"

GREEN, GOLD, RED = (25, 200, 60), (255, 214, 20), (236, 36, 28)


def rasta_gradient(w, h):
    """Vertical green -> gold -> red, like the original lettering."""
    t = np.linspace(0, 1, h)[:, None]
    stops = [(0.0, GREEN), (0.3, GREEN), (0.56, GOLD), (0.8, RED), (1.0, RED)]
    out = np.zeros((h, 1, 3))
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        m = ((t >= a) & (t <= b))[:, :, None]
        k = np.clip((t - a) / max(b - a, 1e-6), 0, 1)[:, :, None]
        out = np.where(m, np.array(ca) * (1 - k) + np.array(cb) * k, out)
    return Image.fromarray(np.repeat(out, w, axis=1).astype("uint8"), "RGB")


def arch(img, lift):
    """Bow the text upward in the middle, like the original wordmark."""
    a = np.array(img)
    h, w = a.shape[:2]
    out = np.zeros((h + lift, w, a.shape[2]), dtype=a.dtype)
    for x in range(w):
        u = 2 * x / (w - 1) - 1
        off = int(round(lift * (u * u)))
        out[off:off + h, x] = a[:, x]
    return Image.fromarray(out)


def lettering(size, stroke, lift, tracking=0.02, text=NAME):
    """Gradient lettering with a black outline on a transparent background."""
    font = ImageFont.truetype(FONT, size)
    pad = stroke * 2 + 10
    widths = [font.getlength(c) for c in text]
    track = size * tracking
    w = int(sum(widths) + track * (len(text) - 1) + pad * 2)
    asc, desc = font.getmetrics()
    h = asc + desc + pad * 2
    fill_mask = Image.new("L", (w, h), 0)
    edge_mask = Image.new("L", (w, h), 0)
    df, de = ImageDraw.Draw(fill_mask), ImageDraw.Draw(edge_mask)
    x = pad
    for c, cw in zip(text, widths):
        df.text((x, pad), c, font=font, fill=255)
        de.text((x, pad), c, font=font, fill=255, stroke_width=stroke, stroke_fill=255)
        x += cw + track
    box = edge_mask.getbbox()
    fill_mask, edge_mask = fill_mask.crop(box), edge_mask.crop(box)
    w, h = fill_mask.size
    # gradient spans the letters themselves, not the outline
    inner = fill_mask.getbbox()
    grad = Image.new("RGB", (w, h), GREEN)
    grad.paste(rasta_gradient(w, inner[3] - inner[1]), (0, inner[1]))
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste((0, 0, 0, 255), (0, 0), edge_mask)
    out.paste(grad, (0, 0), fill_mask)
    return arch(out, lift) if lift else out


def main():
    IMG.mkdir(exist_ok=True)

    # 1) Wordmark for the header and footer
    wm = lettering(220, 16, 34)
    wm.thumbnail((1400, 1400), Image.LANCZOS)
    wm.save(IMG / "wordmark.png", optimize=True)
    print("wordmark", wm.size)

    # 1b) Stacked wordmark for small screens: REEL IRIE over CHARTERS
    l1 = lettering(220, 16, 22, text="REEL IRIE")
    l2 = lettering(220, 16, 0, tracking=0.12, text="CHARTERS")
    l2 = l2.resize((int(l1.width * 0.86), int(l2.height * l1.width * 0.86 / l2.width)), Image.LANCZOS)
    gap = -6
    st = Image.new("RGBA", (l1.width, l1.height + l2.height + gap), (0, 0, 0, 0))
    st.paste(l1, (0, 0), l1)
    st.alpha_composite(l2, ((l1.width - l2.width) // 2, l1.height + gap))
    st.thumbnail((900, 900), Image.LANCZOS)
    st.save(IMG / "wordmark-stacked.png", optimize=True)
    print("stacked", st.size)

    # 2) Full logo: original fish + St. Pete line, new name on top
    orig = Image.open(SRC / "original-logo.png").convert("RGB")
    W, H = orig.size
    full = Image.new("RGB", (W, H), (0, 0, 0))
    full.paste(orig.crop((0, 268, W, H)), (0, 268))
    top = lettering(150, 9, 0, tracking=0.0)
    top.thumbnail((W - 90, 230), Image.LANCZOS)
    full.paste(top, ((W - top.width) // 2, 245 - top.height), top)
    full.save(IMG / "logo-full.png", optimize=True)
    full.save(IMG / "logo-full.webp", quality=90)
    print("full logo", full.size)

    # 3) Fish cutout (transparent) for the site art, favicons
    fish = orig.crop((130, 268, 1110, 1060))
    r, g, b = fish.split()
    lum = ImageChops.lighter(ImageChops.lighter(r, g), b)
    fish_rgba = fish.copy()
    fish_rgba.putalpha(lum.point(lambda v: 0 if v < 18 else min(255, (v - 18) * 4)))
    fish_rgba = fish_rgba.crop(fish_rgba.getbbox())
    cut = fish_rgba.copy()
    cut.thumbnail((700, 700), Image.LANCZOS)
    cut.save(IMG / "fish.webp", quality=90)
    cut.save(IMG / "fish.png", optimize=True)
    s = max(fish_rgba.size) + 60
    sq = Image.new("RGB", (s, s), (0, 0, 0))
    sq.paste(fish_rgba, ((s - fish_rgba.width) // 2, (s - fish_rgba.height) // 2), fish_rgba)
    sq.resize((192, 192), Image.LANCZOS).save(PUBLIC / "favicon.png", optimize=True)
    sq.resize((180, 180), Image.LANCZOS).save(PUBLIC / "apple-touch-icon.png", optimize=True)
    sq.resize((512, 512), Image.LANCZOS).save(IMG / "icon-512.png", optimize=True)

    # 4) Boat photo for the hero, plus a share image
    boat = Image.open(SRC / "boat.jpg").convert("RGB")
    boat.save(IMG / "boat.webp", quality=86)
    boat.save(IMG / "boat.jpg", quality=86)
    og = boat.resize((1200, int(1200 * boat.height / boat.width)), Image.LANCZOS)
    og = og.crop((0, (og.height - 630) // 2 + 40, 1200, (og.height - 630) // 2 + 670))
    shade = Image.new("RGBA", og.size, (0, 0, 0, 0))
    ImageDraw.Draw(shade).rectangle((0, 0, 1200, 190), fill=(0, 0, 0, 120))
    og = Image.alpha_composite(og.convert("RGBA"), shade.filter(ImageFilter.GaussianBlur(40)))
    mark = wm.copy()
    mark.thumbnail((900, 200), Image.LANCZOS)
    og.paste(mark, ((1200 - mark.width) // 2, 34), mark)
    og.convert("RGB").save(IMG / "og-image.jpg", quality=88)
    print("og", og.size)


if __name__ == "__main__":
    main()
