"""Rebuild responsive AVIF/WebP/JPEG derivatives. Requires Pillow with AVIF support."""
from pathlib import Path
from PIL import Image
assets = Path('public/assets')
for stem in ['christmas-gifts', 'christmas-birthday', 'christmas-photo', 'christmas-song']:
    image = Image.open(assets / f'{stem}.webp').convert('RGB')
    for width in (360, 640, 720):
        img = image.resize((width, width * 2 // 3), Image.Resampling.LANCZOS)
        for fmt, options in [('avif', dict(quality=45, speed=6)), ('webp', dict(quality=73, method=6)), ('jpg', dict(quality=76, optimize=True, progressive=True))]:
            img.save(assets / f'{stem}-{width}.{fmt}', **options)
# Reuse the full-size JPEG as the source, never enlarge it.
image = Image.open(assets / 'mykolay-station-1280.jpg').convert('RGB')
for width in (360, 640, 960):
    img = image.resize((width, width * 9 // 16), Image.Resampling.LANCZOS)
    for fmt, options in [('avif', dict(quality=45, speed=6)), ('webp', dict(quality=73, method=6)), ('jpg', dict(quality=76, optimize=True, progressive=True))]:
        img.save(assets / f'mykolay-station-{width}.{fmt}', **options)
