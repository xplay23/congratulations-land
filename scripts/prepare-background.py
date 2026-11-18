"""Usage: python scripts/prepare-background.py SOURCE FFMPEG
Creates silent VP9/WebM and H.264/MP4 variants plus the first non-black frame.
Only the initial black frame is removed; the remaining video is preserved.
"""
from pathlib import Path
import subprocess
import sys
from PIL import Image

source, ffmpeg = sys.argv[1:3]
out = Path('public/assets')
out.mkdir(exist_ok=True, parents=True)
Path('tmp').mkdir(exist_ok=True)
def run(*args):
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', source, *args], check=True)

run('-vf', 'select=eq(n\\,1)', '-frames:v', '1', '-update', '1', 'tmp/andriiko-first-frame.png')
poster = Image.open('tmp/andriiko-first-frame.png').convert('RGB')
for width in (640, 960, 1280):
    img = poster.resize((width, width * 9 // 16), Image.Resampling.LANCZOS)
    for fmt, options in [('avif', dict(quality=45, speed=6)), ('webp', dict(quality=72, method=6)), ('jpg', dict(quality=76, optimize=True, progressive=True))]:
        img.save(out / f'hero-andriiko-poster-{width}.{fmt}', **options)
for width, height in [(1280, 720), (854, 480)]:
    base = ['-map', '0:v:0', '-an', '-sn', '-dn', '-vf', f'trim=start_frame=1,setpts=PTS-STARTPTS,scale={width}:{height}', '-pix_fmt', 'yuv420p', '-threads', '4']
    rate = '1400k' if height == 720 else '650k'
    run(*base, '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-maxrate', rate, '-bufsize', '2800k', '-profile:v', 'high', '-movflags', '+faststart', '-g', '48', str(out / f'hero-andriiko-{height}.mp4'))
    run(*base, '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '850k' if height == 720 else '400k', '-maxrate', rate, '-bufsize', '2800k', '-deadline', 'good', '-cpu-used', '3', '-row-mt', '1', '-g', '48', str(out / f'hero-andriiko-{height}.webm'))
for file in sorted(out.glob('hero-andriiko-*')):
    print(file.name, file.stat().st_size, flush=True)
