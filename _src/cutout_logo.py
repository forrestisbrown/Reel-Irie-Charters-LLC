"""Cuts the official Reel Irie Charters logo out of its off-white background.

Run from the repo root:  python _src/cutout_logo.py
Input:  _src/official-logo.png   Output: _src/official-logo-cutout.png (transparent, cropped)
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path(__file__).parent
im = Image.open(SRC / "official-logo.png").convert("RGB")
a = np.asarray(im).astype(np.float32)
H, W, _ = a.shape

# Background colour sampled from the corners
corners = np.concatenate([a[:12, :12].reshape(-1, 3), a[:12, -12:].reshape(-1, 3), a[-12:, :12].reshape(-1, 3), a[-12:, -12:].reshape(-1, 3)])
bg = np.median(corners, axis=0)

# 1) Pixels that look like paper (close to the background colour)
dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
paper = dist < 38

# 2) Only paper connected to the outside counts as background (flood fill from the border)
mask = Image.fromarray((paper * 255).astype(np.uint8)).copy()  # copy: fills are ignored on array backed images
seed_val = 128
for x, y in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
    if mask.getpixel((x, y)) == 255:
        ImageDraw.floodfill(mask, (x, y), seed_val)
m = np.asarray(mask)
outside = m == seed_val

# 3) Soft edge: the logo's outer edge is always black outline on paper, so a pixel
#    in the transition band is a mix of black and paper. Its alpha is 1 - lum/bg_lum.
lum = a.mean(axis=2)
bg_lum = bg.mean()
alpha = np.ones((H, W), np.float32)
alpha[outside] = 0.0
near = np.asarray(Image.fromarray((outside * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
band = near & ~outside
sat = a.max(axis=2) - a.min(axis=2)
grayish = sat < 40
blend = band & grayish
alpha[blend] = np.clip(1 - lum[blend] / bg_lum, 0, 1) * 1.15
alpha = np.clip(alpha, 0, 1)

rgb = a.copy()
rgb[blend] = 0  # pure black outline under the blended alpha
# Tiny paper specks trapped between the palm fronds become outline black
pocket = paper & ~outside
rgb[pocket] = 0
alpha[pocket] = 1.0

out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
img = Image.fromarray(out, "RGBA")
img = img.crop(img.getbbox())
pad = 8
canvas = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
canvas.paste(img, (pad, pad), img)
canvas.save(SRC / "official-logo-cutout.png", optimize=True)

# Sticker version for dark backgrounds: a cream border so the black palm and outline show
STROKE = 9
pad2 = STROKE + 6
base = Image.new("RGBA", (img.width + pad2 * 2, img.height + pad2 * 2), (0, 0, 0, 0))
base.paste(img, (pad2, pad2), img)
m = base.split()[3].point(lambda v: 255 if v > 60 else 0)
for _ in range(STROKE // 2):
    m = m.filter(ImageFilter.MaxFilter(5))
m = m.filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: 255 if v > 110 else 0).filter(ImageFilter.GaussianBlur(0.7))
sticker = Image.new("RGBA", base.size, (246, 243, 234, 0))
sticker.putalpha(m)
sticker.alpha_composite(base)
sticker.save(SRC / "official-logo-sticker.png", optimize=True)

# Report anything paper coloured left inside the logo (enclosed pockets)
inside_paper = paper & ~outside
print("size", canvas.size, "| enclosed paper pixels left:", int(inside_paper.sum()))
