"""Generate Android launcher icons and splash images from the Play Store icon.
Usage: python3 scripts/make_icons.py <icon.png> <android res dir>"""
import os, sys
from PIL import Image, ImageDraw, ImageFilter

src_path, res = sys.argv[1], sys.argv[2]
src = Image.open(src_path).convert('RGBA').resize((1024, 1024), Image.LANCZOS)

# Inner art (cube on gradient), inside the rounded frame of the store icon
inner = src.crop((128, 128, 896, 896))

def soft_circle(size, inner_r, outer_r):
    """Alpha mask: opaque inside inner_r, fading to 0 at outer_r (fractions of size)."""
    big = size * 4
    m = Image.new('L', (big, big), 0)
    d = ImageDraw.Draw(m)
    steps = 24
    for i in range(steps + 1):
        r = outer_r - (outer_r - inner_r) * i / steps
        a = int(255 * i / steps)
        c = big / 2
        d.ellipse((c - r * big, c - r * big, c + r * big, c + r * big), fill=a)
    return m.resize((size, size), Image.LANCZOS)

# Adaptive icon layers (108dp canvas; only the central 72dp is ever shown, 66dp is safe)
background = inner.resize((1024, 1024), Image.LANCZOS).filter(ImageFilter.GaussianBlur(60)).convert('RGB')
S = 600
art = inner.resize((S, S), Image.LANCZOS)
art.putalpha(soft_circle(S, 0.46, 0.50))
foreground = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
foreground.paste(art, ((1024 - S) // 2, (1024 - S) // 2), art)

# What a launcher shows: background + foreground, masked
composite = background.convert('RGBA')
composite.alpha_composite(foreground)
view = composite.crop((171, 171, 853, 853))          # the visible 72dp of 108dp

densities = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, k in densities.items():
    d = os.path.join(res, f'mipmap-{name}')
    os.makedirs(d, exist_ok=True)
    legacy = int(48 * k)
    adaptive = int(108 * k)
    src.resize((legacy, legacy), Image.LANCZOS).save(os.path.join(d, 'ic_launcher.png'))
    rnd = view.resize((legacy, legacy), Image.LANCZOS)
    mask = Image.new('L', (legacy * 4, legacy * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, legacy * 4 - 1, legacy * 4 - 1), fill=255)
    rnd.putalpha(mask.resize((legacy, legacy), Image.LANCZOS))
    rnd.save(os.path.join(d, 'ic_launcher_round.png'))
    foreground.resize((adaptive, adaptive), Image.LANCZOS).save(os.path.join(d, 'ic_launcher_foreground.png'))
    background.resize((adaptive, adaptive), Image.LANCZOS).save(os.path.join(d, 'ic_launcher_background.png'))

anydpi = os.path.join(res, 'mipmap-anydpi-v26')
os.makedirs(anydpi, exist_ok=True)
xml = ('<?xml version="1.0" encoding="utf-8"?>\n'
       '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
       '    <background android:drawable="@mipmap/ic_launcher_background"/>\n'
       '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
       '</adaptive-icon>\n')
for f in ('ic_launcher.xml', 'ic_launcher_round.xml'):
    open(os.path.join(anydpi, f), 'w').write(xml)

# Splash images (older Android): gradient background with the icon in the middle
count = 0
for root, _, files in os.walk(res):
    for f in files:
        if f == 'splash.png':
            p = os.path.join(root, f)
            w, h = Image.open(p).size
            side = max(w, h)
            bg = background.resize((side, side), Image.LANCZOS).crop(((side - w) // 2, (side - h) // 2, (side - w) // 2 + w, (side - h) // 2 + h)).convert('RGBA')
            ic = int(min(w, h) * 0.32)
            icon = view.resize((ic, ic), Image.LANCZOS)
            m = Image.new('L', (ic * 4, ic * 4), 0)
            ImageDraw.Draw(m).rounded_rectangle((0, 0, ic * 4 - 1, ic * 4 - 1), radius=int(ic * 4 * 0.22), fill=255)
            icon.putalpha(m.resize((ic, ic), Image.LANCZOS))
            bg.alpha_composite(icon, ((w - ic) // 2, (h - ic) // 2))
            bg.convert('RGB').save(p)
            count += 1
print(f'Icons written for {len(densities)} densities; {count} splash images replaced.')
