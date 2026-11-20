import argparse
import math
import random
import shutil
import subprocess
import time
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent.parent
VIDEOS_DIR = ROOT / "videos"
BUILD_DIR = ROOT / "build"
AUDIO_RU = ROOT / "audio"
AUDIO_UA = ROOT / "audio_ua"
BGM_PATH = AUDIO_RU / "bgm_suno.mp3"
PHOTO_PATH = ROOT.parent / "public" / "samples" / "nicholas_preview.jpg"


def run(cmd):
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        print(res.stdout)
        raise RuntimeError(f"Command failed with exit {res.returncode}")
    return res.stdout


def probe_duration(path: Path) -> float:
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path)
    ], text=True).strip()
    return float(out)


def detect_speech_end(path: Path) -> float:
    res = subprocess.run([
        "ffmpeg", "-i", str(path), "-af", "silencedetect=noise=-42dB:d=0.10", "-f", "null", "-"
    ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
    total = probe_duration(path)
    last_start = None
    for line in res.stdout.splitlines():
        if "silence_start:" in line:
            last_start = float(line.split("silence_start:")[1].strip().split()[0])
    if last_start is not None and total - last_start < 1.2 and last_start > 0.5:
        return last_start + 0.04
    return total


def find_pauses_and_end(path: Path, noise_db: str = "-40dB", min_d: float = 0.12):
    res = subprocess.run([
        "ffmpeg", "-i", str(path), "-af", f"silencedetect=noise={noise_db}:d={min_d}", "-f", "null", "-"
    ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
    total = probe_duration(path)
    pauses = []
    cur_start = None
    for line in res.stdout.splitlines():
        if "silence_start:" in line:
            cur_start = float(line.split("silence_start:")[1].strip().split()[0])
        elif "silence_end:" in line and cur_start is not None:
            end_t = float(line.split("silence_end:")[1].strip().split()[0])
            pauses.append((cur_start, end_t))
            cur_start = None
    speech_end = total
    if cur_start is not None and total - cur_start < 1.2 and cur_start > 0.5:
        speech_end = cur_start + 0.04
    elif pauses and total - pauses[-1][1] < 0.05 and total - pauses[-1][0] < 1.2 and pauses[-1][0] > 0.5:
        speech_end = pauses[-1][0] + 0.04
    return pauses, speech_end, total


def prepare_overlay_04b(frame0_path: Path, overlay_out: Path, name_text: str, photo_path: Path = PHOTO_PATH):
    bg = Image.open(frame0_path).convert("RGBA")
    photo = Image.open(photo_path).convert("RGBA")

    r, g, b, a = photo.split()
    r = ImageEnhance.Brightness(r).enhance(1.04)
    g = ImageEnhance.Brightness(g).enhance(0.97)
    b = ImageEnhance.Brightness(b).enhance(0.84)
    photo = Image.merge("RGBA", (r, g, b, a))
    photo = ImageEnhance.Contrast(photo).enhance(0.95)

    target_size = (244, 244)
    photo = ImageOps.fit(photo, target_size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.35))

    radius = 12
    mask = Image.new("L", target_size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, target_size[0] - 1, target_size[1] - 1], radius=radius, fill=255)
    photo.putalpha(mask)

    overlay = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    cx, cy = 822, 286
    px, py = cx - target_size[0] // 2, cy - target_size[1] // 2

    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [px - 8, py - 6, px + target_size[0] + 10, py + target_size[1] + 12],
        radius=radius + 4,
        fill=(45, 25, 10, 85),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    overlay = Image.alpha_composite(overlay, shadow)
    od = ImageDraw.Draw(overlay)

    od.rounded_rectangle(
        [px - 7, py - 7, px + target_size[0] + 6, py + target_size[1] + 6],
        radius=radius + 3,
        fill=(235, 212, 168, 235),
        outline=(145, 102, 42, 230),
        width=2,
    )
    od.rounded_rectangle(
        [px - 2, py - 2, px + target_size[0] + 1, py + target_size[1] + 1],
        radius=radius + 1,
        outline=(185, 140, 62, 210),
        width=2,
    )
    overlay.paste(photo, (px, py), photo)
    od = ImageDraw.Draw(overlay)

    fallback_georgiai = str(ROOT.parent / "assets" / "fonts" / "georgiai.ttf")
    font_size = 58
    while font_size >= 34:
        try:
            font = ImageFont.truetype(r"C:\Windows\Fonts\Gabriola.ttf", font_size)
        except OSError:
            try:
                font = ImageFont.truetype(r"C:\Windows\Fonts\georgiai.ttf", max(28, font_size - 14))
            except OSError:
                font = ImageFont.truetype(fallback_georgiai, max(28, font_size - 14))
        bbox = od.textbbox((0, 0), name_text, font=font)
        if (bbox[2] - bbox[0]) <= 275:
            break
        font_size -= 2

    tw = bbox[2] - bbox[0]
    tx = cx - tw // 2 - bbox[0]
    ty = py + target_size[1] + 18 - bbox[1]

    od.text((tx + 1, ty + 1), name_text, font=font, fill=(110, 75, 40, 70))
    od.text((tx, ty), name_text, font=font, fill=(68, 38, 16, 225))
    line_half = max(75, min(135, tw // 2 + 16))
    line_y = ty + bbox[3] + 6
    od.line([(cx - line_half, line_y), (cx + line_half, line_y)], fill=(160, 118, 48, 175), width=2)

    overlay.save(overlay_out)


def generate_magic_transition_mov(out_mov: Path, spark_dir: Path, duration: float = 0.70, fps: int = 24, seed: int = 2026, strength: float = 0.95):
    if out_mov.exists():
        return
    spark_dir.mkdir(parents=True, exist_ok=True)
    for old in spark_dir.glob("f_*.png"):
        old.unlink()

    rng = random.Random(seed)
    n_frames = max(6, int(round(duration * fps)))
    w, h = 1280, 720
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = (xx - w / 2.0) / (w * 0.55)
    dy = (yy - h / 2.0) / (h * 0.55)
    radial = np.exp(-(dx * dx + dy * dy) * 1.4)

    particles = [{
        "x": rng.uniform(0.08 * w, 0.92 * w),
        "y": rng.uniform(0.15 * h, 0.95 * h),
        "vx": rng.uniform(-35, 35),
        "vy": rng.uniform(-110, -30),
        "r": rng.uniform(2.5, 8.5),
        "phase": rng.uniform(0.1, 0.9),
        "bright": rng.uniform(0.6, 1.0),
    } for _ in range(48)]

    for i in range(n_frames):
        p = i / max(1, n_frames - 1)
        env = math.sin(math.pi * p) ** 1.35 * strength
        alpha_bg = np.clip(radial * env * 135.0, 0, 255).astype(np.uint8)
        frame = np.zeros((h, w, 4), dtype=np.uint8)
        frame[:, :, 0] = 255
        frame[:, :, 1] = 222
        frame[:, :, 2] = 140
        frame[:, :, 3] = alpha_bg
        im = Image.fromarray(frame, mode="RGBA")

        glow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow_layer)
        t_sec = i / fps
        for pt in particles:
            px = pt["x"] + pt["vx"] * t_sec
            py = pt["y"] + pt["vy"] * t_sec
            twinkle = 0.5 + 0.5 * math.sin(p * math.pi * 2.0 + pt["phase"] * 6.0)
            a = int(min(255, env * 220 * pt["bright"] * twinkle))
            if a <= 4:
                continue
            ro = pt["r"] * 2.4
            gd.ellipse([px - ro, py - ro, px + ro, py + ro], fill=(255, 215, 110, a // 3))
            ri = pt["r"] * 0.75
            gd.ellipse([px - ri, py - ri, px + ri, py + ri], fill=(255, 248, 210, a))
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(1.5))
        Image.alpha_composite(im, glow_layer).save(spark_dir / f"f_{i:04d}.png")

    run([
        "ffmpeg", "-y", "-v", "error", "-framerate", str(fps),
        "-i", str(spark_dir / "f_%04d.png"),
        "-c:v", "png", "-pix_fmt", "rgba", str(out_mov)
    ])


def trim_audio(src: Path, dst: Path, start: float, end: float, atempo: float = 1.0):
    dur = (end - start) / atempo
    fade_out_st = max(0.0, dur - 0.03)
    af = [f"atrim=start={start:.3f}:end={end:.3f}", "asetpts=PTS-STARTPTS"]
    if abs(atempo - 1.0) > 1e-3:
        af.append(f"atempo={atempo:.4f}")
    af += ["afade=t=in:d=0.02", f"afade=t=out:st={fade_out_st:.3f}:d=0.03", "aresample=48000", "aformat=channel_layouts=stereo"]
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", ",".join(af), str(dst)])


def concat_audio_parts(part_specs, dst: Path):
    """part_specs = [(src_path, start, end, atempo), ...]"""
    tmp_files = []
    for i, (src, st, en, tempo) in enumerate(part_specs):
        p = dst.parent / f"{dst.stem}_p{i}.wav"
        trim_audio(src, p, st, en, atempo=tempo)
        tmp_files.append(p)
    if len(tmp_files) == 1:
        tmp_files[0].replace(dst)
        return
    cmd = ["ffmpeg", "-y", "-v", "error"]
    for p in tmp_files:
        cmd += ["-i", str(p)]
    ins = "".join(f"[{i}:a]" for i in range(len(tmp_files)))
    cmd += ["-filter_complex", f"{ins}concat=n={len(tmp_files)}:v=0:a=1[out]", "-map", "[out]", str(dst)]
    run(cmd)


def build_pilot(lang: str, tag: str, display_name: str, out_video: Path, photo_path: Path = PHOTO_PATH, custom_audio_dir: Path | None = None, keep_work: bool = False):
    work = BUILD_DIR / f"work_{tag}"
    try:
        _build_pilot_impl(work, lang, tag, display_name, out_video, photo_path=photo_path, custom_audio_dir=custom_audio_dir)
    finally:
        if not keep_work:
            shutil.rmtree(work, ignore_errors=True)


def _build_pilot_impl(work: Path, lang: str, tag: str, display_name: str, out_video: Path, photo_path: Path = PHOTO_PATH, custom_audio_dir: Path | None = None):
    t0 = time.perf_counter()
    clips_dir = work / "clips"
    proc_audio = work / "audio"
    clips_dir.mkdir(parents=True, exist_ok=True)
    proc_audio.mkdir(parents=True, exist_ok=True)

    def pick_audio(filename: str, fallback_dir: Path) -> Path:
        if custom_audio_dir is not None and (custom_audio_dir / filename).exists():
            return custom_audio_dir / filename
        return fallback_dir / filename

    if lang == "ru":
        adir = AUDIO_RU
        trim_audio(pick_audio("line_01.mp3", adir), proc_audio / "v01.wav", 0.0, 4.26)
        raw_03_end = detect_speech_end(pick_audio("line_03_v2.mp3", adir))
        trim_audio(pick_audio("line_03_v2.mp3", adir), proc_audio / "v03.wav", 0.0, raw_03_end, atempo=1.10)
        trim_audio(pick_audio("line_04a.mp3", adir), proc_audio / "v04a.wav", 0.0, 3.70)
        raw_04b_end = detect_speech_end(pick_audio("line_04b.mp3", adir))
        trim_audio(pick_audio("line_04b.mp3", adir), proc_audio / "v04b.wav", 0.0, raw_04b_end)
        trim_audio(pick_audio("line_04c.mp3", adir), proc_audio / "v04c.wav", 0.0, 2.22)
        concat_audio_parts([
            (adir / "line_05b_1_v2.mp3", 0.02, 3.01, 1.08),
            (adir / "line_05b_1_v2.mp3", 3.24, 5.60, 1.08),
        ], proc_audio / "v05b_1.wav")
        trim_audio(adir / "line_05b_2_v2.mp3", proc_audio / "v05b_2.wav", 0.0, 2.18, atempo=1.09)
        raw_07_1_end = detect_speech_end(pick_audio("line_07_1.mp3", adir))
        trim_audio(pick_audio("line_07_1.mp3", adir), proc_audio / "v07_1.wav", 0.0, raw_07_1_end)
        concat_audio_parts([
            (adir / "line_07_2_v2.mp3", 0.0, 2.77, 1.08),
            (adir / "line_07_2_v2.mp3", 3.02, 3.82, 1.04),
        ], proc_audio / "v07_2.wav")
    else:  # uk
        adir = AUDIO_UA
        trim_audio(pick_audio("line_01.mp3", adir), proc_audio / "v01.wav", 0.0, 3.80)
        line03_src = pick_audio("line_03.mp3", adir)
        if custom_audio_dir is not None and line03_src.parent == custom_audio_dir:
            pauses, sp_end, _ = find_pauses_and_end(line03_src)
            mid_pauses = [p for p in pauses if 0.8 <= p[0] <= 3.0 and p[1] < sp_end - 1.0]
            if mid_pauses:
                p_st, p_en = mid_pauses[0]
                t1_end = min(p_st + 0.03, p_en)
                t2_start = max(p_st + 0.03, p_en - 0.04)
                raw_dur = t1_end + (sp_end - t2_start)
                tempo2 = max(1.06, min(1.16, raw_dur / 6.35))
                concat_audio_parts([
                    (line03_src, 0.0, t1_end, 1.06),
                    (line03_src, t2_start, sp_end, tempo2),
                ], proc_audio / "v03.wav")
            else:
                tempo = max(1.04, min(1.16, sp_end / 6.35))
                trim_audio(line03_src, proc_audio / "v03.wav", 0.0, sp_end, atempo=tempo)
        else:
            # UA line_03: 0..1.45 (pause 1.45..1.94 -> shorten slightly) + 1.90..7.93 @ 1.15x -> ~6.30s
            concat_audio_parts([
                (line03_src, 0.0, 1.46, 1.06),
                (line03_src, 1.78, 7.95, 1.16),
            ], proc_audio / "v03.wav")
        trim_audio(pick_audio("line_04a.mp3", adir), proc_audio / "v04a.wav", 0.0, 3.60)
        line04b_src = pick_audio("line_04b.mp3", adir)
        raw_04b_end = detect_speech_end(line04b_src)
        trim_audio(line04b_src, proc_audio / "v04b.wav", 0.0, raw_04b_end)
        trim_audio(pick_audio("line_04c.mp3", adir), proc_audio / "v04c.wav", 0.0, 2.10)
        # UA 05b_1: 5.12s -> tighten internal pause 2.50..2.86 + 1.06x -> ~4.55s
        concat_audio_parts([
            (adir / "line_05b_1.mp3", 0.0, 2.52, 1.05),
            (adir / "line_05b_1.mp3", 2.75, 5.15, 1.05),
        ], proc_audio / "v05b_1.wav")
        trim_audio(adir / "line_05b_2.mp3", proc_audio / "v05b_2.wav", 0.0, 2.10, atempo=1.06)
        line07_1_src = pick_audio("line_07_1.mp3", adir)
        raw_07_1_end = detect_speech_end(line07_1_src)
        trim_audio(line07_1_src, proc_audio / "v07_1.wav", 0.0, raw_07_1_end)
        # UA 07_2: 0..2.83 + pause 2.83..3.19 + 3.19..4.06 -> ~3.30s
        concat_audio_parts([
            (adir / "line_07_2.mp3", 0.0, 2.85, 1.10),
            (adir / "line_07_2.mp3", 3.08, 4.08, 1.05),
        ], proc_audio / "v07_2.wav")

    v03_wav = proc_audio / "v03.wav"
    v03_dur = probe_duration(v03_wav)
    v04b_wav = proc_audio / "v04b.wav"
    v04b_dur = probe_duration(v04b_wav)

    amb_file = proc_audio / "fireplace_amb.wav"
    if not amb_file.exists():
        run([
            "ffmpeg", "-y", "-v", "error", "-i", str(VIDEOS_DIR / "Elderly_man_reading_book_at_afc79866.mp4"),
            "-af", "atrim=0.2:9.5,asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st=9.0:d=0.3,aresample=48000,aformat=channel_layouts=stereo",
            str(amb_file)
        ])
    frame0_04b = work / "04b_frame0.png"
    if not frame0_04b.exists():
        run(["ffmpeg", "-y", "-v", "error", "-i", str(VIDEOS_DIR / "Man_reading_antique_book_88e0e6e6.mp4"), "-frames:v", "1", str(frame0_04b)])
    overlay_04b = work / "overlay_04b.png"
    prepare_overlay_04b(frame0_04b, overlay_04b, display_name, photo_path=photo_path)
    spark_trans = BUILD_DIR / "spark_trans.mov"
    generate_magic_transition_mov(spark_trans, BUILD_DIR / "sparks")

    def cut_video(src_name: str, out_name: str, ss: float, dur: float, keep_audio_vol: float = 0.0, extra_vf: str = ""):
        src = VIDEOS_DIR / src_name
        dst = clips_dir / out_name
        vf_parts = [f"trim=start={ss:.3f}:duration={dur:.3f}", "setpts=PTS-STARTPTS", "fps=24", "scale=1280:720:flags=lanczos", "setsar=1"]
        if extra_vf:
            vf_parts.append(extra_vf)

        if keep_audio_vol > 0:
            af = [f"atrim=start={ss:.3f}:duration={dur:.3f}", "asetpts=PTS-STARTPTS", f"volume={keep_audio_vol:.3f}",
                  "afade=t=in:d=0.15", f"afade=t=out:st={max(0.0, dur - 0.15):.3f}:d=0.15",
                  "aresample=48000", "aformat=channel_layouts=stereo"]
            run([
                "ffmpeg", "-y", "-v", "error", "-i", str(src),
                "-vf", ",".join(vf_parts), "-af", ",".join(af),
                "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", str(dst)
            ])
        else:
            run([
                "ffmpeg", "-y", "-v", "error", "-i", str(src),
                "-f", "lavfi", "-t", f"{dur:.3f}", "-i", "anullsrc=r=48000:cl=stereo",
                "-vf", ",".join(vf_parts), "-map", "0:v:0", "-map", "1:a:0",
                "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-shortest", str(dst)
            ])
        return dst, probe_duration(dst)

    s03_speech_offset = 0.44
    s03_dur = min(7.25, max(5.20, s03_speech_offset + v03_dur + 0.25))

    c01, d01 = cut_video("Snow_falling_on_alpine_chalet_620ffea8.mp4", "01.mkv", 0.00, 3.65, extra_vf="fade=t=in:st=0:d=0.4")
    c02, d02 = cut_video("Elderly_man_reading_book_at_afc79866.mp4", "02.mkv", 0.50, 4.10, keep_audio_vol=0.55)
    c03, d03 = cut_video("Elderly_man_speaking_at_desk_f5436366.mp4", "03.mkv", 0.65, s03_dur)
    c04a, d04a = cut_video("Elderly_man_reading_antique_book_a98d7f22.mp4", "04a.mkv", 0.20, 4.20, keep_audio_vol=0.45)

    s04b_speech_offset = 0.35 if v04b_dur > 8.0 else 0.45
    d04b_dur = min(10.00, max(4.20, s04b_speech_offset + v04b_dur + 0.35))
    c04b = clips_dir / "04b.mkv"
    run([
        "ffmpeg", "-y", "-v", "error",
        "-i", str(VIDEOS_DIR / "Man_reading_antique_book_88e0e6e6.mp4"),
        "-loop", "1", "-t", f"{d04b_dur:.3f}", "-i", str(overlay_04b),
        "-filter_complex",
        f"[0:v]trim=start=0.0:duration={d04b_dur:.3f},setpts=PTS-STARTPTS,fps=24,scale=1280:720:flags=lanczos,setsar=1[v0];"
        f"[1:v]format=rgba,fade=t=in:st=0.15:d=0.45:alpha=1[ov];"
        f"[v0][ov]overlay=0:0:shortest=1[v];"
        f"[0:a]atrim=start=0.0:duration={d04b_dur:.3f},asetpts=PTS-STARTPTS,volume=0.45,afade=t=in:d=0.15,afade=t=out:st={d04b_dur-0.15:.3f}:d=0.15,aresample=48000,aformat=channel_layouts=stereo[a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", str(c04b)
    ])
    d04b = probe_duration(c04b)

    c04c, d04c = cut_video("Elderly_man_speaking_in_study_e058903b.mp4", "04c.mkv", 1.30, 3.02)
    c05a, d05a = cut_video("Character_placing_gift_box_on_7aafa13c.mp4", "05a.mkv", 0.20, 4.20, keep_audio_vol=0.0)

    c05b = clips_dir / "05b.mkv"
    d05b_tot = 4.52 * 1.14 + (7.93 - 4.52)
    run([
        "ffmpeg", "-y", "-v", "error",
        "-i", str(VIDEOS_DIR / "Man_speaking_near_gift_box_533e503f.mp4"),
        "-f", "lavfi", "-t", f"{d05b_tot:.3f}", "-i", "anullsrc=r=48000:cl=stereo",
        "-filter_complex",
        "[0:v]split=2[va][vb];"
        "[va]trim=start=0.0:end=4.52,setpts=(PTS-STARTPTS)*1.14[v1];"
        "[vb]trim=start=4.52:end=7.93,setpts=PTS-STARTPTS[v2];"
        "[v1][v2]concat=n=2:v=1:a=0,fps=24,scale=1280:720:flags=lanczos,setsar=1[v]",
        "-map", "[v]", "-map", "1:a:0",
        "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-shortest", str(c05b)
    ])
    d05b = probe_duration(c05b)

    c06, d06 = cut_video("Elderly_man_touching_gift_box_b65df33e.mp4", "06.mkv", 0.20, 4.00, keep_audio_vol=0.0)

    # Shot 07: natural end fade only on last 0.45s so closing smile & wave stay bright while music blooms
    c07 = clips_dir / "07.mkv"
    d07_tot = 3.80 + (6.30 - 3.80) * 1.32 + (7.93 - 6.30)
    run([
        "ffmpeg", "-y", "-v", "error",
        "-i", str(VIDEOS_DIR / "Elderly_man_waving_holiday_farewell_1a684e39.mp4"),
        "-f", "lavfi", "-t", f"{d07_tot:.3f}", "-i", "anullsrc=r=48000:cl=stereo",
        "-filter_complex",
        f"[0:v]split=3[va][vb][vc];"
        f"[va]trim=start=0.0:end=3.80,setpts=PTS-STARTPTS[v1];"
        f"[vb]trim=start=3.80:end=6.30,setpts=(PTS-STARTPTS)*1.32[v2];"
        f"[vc]trim=start=6.30:end=7.93,setpts=PTS-STARTPTS[v3];"
        f"[v1][v2][v3]concat=n=3:v=1:a=0,fps=24,scale=1280:720:flags=lanczos,setsar=1,fade=t=out:st={d07_tot-0.45:.3f}:d=0.45:color=#2a1a08[v]",
        "-map", "[v]", "-map", "1:a:0",
        "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-shortest", str(c07)
    ])
    d07 = probe_duration(c07)

    clip_list = [
        ("01", c01, d01), ("02", c02, d02), ("03", c03, d03), ("04a", c04a, d04a),
        ("04b", c04b, d04b), ("04c", c04c, d04c), ("05a", c05a, d05a),
        ("05b", c05b, d05b), ("06", c06, d06), ("07", c07, d07),
    ]
    transitions = [
        ("fade", 0.55, True),
        ("fade", 0.16, False),
        ("fade", 0.16, False),
        ("fade", 0.40, True),
        ("fade", 0.35, True),
        ("fade", 0.16, False),
        ("fade", 0.16, False),
        ("fade", 0.25, False),
        ("fade", 0.55, True),
    ]

    starts = {}
    spark_times = []
    cur_end = clip_list[0][2]
    starts[clip_list[0][0]] = 0.0
    for i, (tr_type, ov_dur, use_spark) in enumerate(transitions):
        offset = cur_end - ov_dur
        next_name, _, next_dur = clip_list[i + 1]
        starts[next_name] = offset
        if use_spark:
            spark_times.append(max(0.0, offset + ov_dur * 0.5 - 0.35))
        cur_end = offset + next_dur
    total_dur = cur_end

    cmd = ["ffmpeg", "-y", "-v", "error"]
    for _, path, _ in clip_list:
        cmd += ["-i", str(path)]
    for st in spark_times:
        cmd += ["-itsoffset", f"{st:.3f}", "-i", str(spark_trans)]

    fc = []
    prev_v, prev_a = "[0:v]", "[0:a]"
    cur_t = clip_list[0][2]
    for i, (tr_type, ov_dur, _) in enumerate(transitions):
        offset = cur_t - ov_dur
        out_v = f"[xv{i}]" if i < len(transitions) - 1 else "[vbase]"
        out_a = f"[xa{i}]" if i < len(transitions) - 1 else "[abase]"
        fc.append(f"{prev_v}[{i+1}:v]xfade=transition={tr_type}:duration={ov_dur:.3f}:offset={offset:.3f}{out_v}")
        fc.append(f"{prev_a}[{i+1}:a]acrossfade=d={ov_dur:.3f}:c1=tri:c2=tri{out_a}")
        prev_v, prev_a = out_v, out_a
        cur_t = offset + clip_list[i + 1][2]

    v_cur = "[vbase]"
    base_sp_idx = len(clip_list)
    for k, _ in enumerate(spark_times):
        v_nxt = f"[vsp{k}]" if k < len(spark_times) - 1 else "[vout]"
        fc.append(f"{v_cur}[{base_sp_idx + k}:v]overlay=0:0:eof_action=pass{v_nxt}")
        v_cur = v_nxt

    xfade_mkv = work / "xfade_master.mkv"
    cmd += [
        "-filter_complex", ";".join(fc),
        "-map", "[vout]", "-map", "[abase]",
        "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le",
        str(xfade_mkv)
    ]
    run(cmd)

    voice_events = [
        (proc_audio / "v01.wav", starts["01"] + 0.15),
        (v03_wav, starts["03"] + s03_speech_offset),
        (proc_audio / "v04a.wav", starts["04a"] + 0.25),
        (v04b_wav, starts["04b"] + s04b_speech_offset),
        (proc_audio / "v04c.wav", starts["04c"] + 0.65),
        (proc_audio / "v05b_1.wav", starts["05b"] + 0.15),
        (proc_audio / "v05b_2.wav", starts["05b"] + 5.45),
        (proc_audio / "v07_1.wav", starts["07"] + 0.45),
        (proc_audio / "v07_2.wav", starts["07"] + 3.82),
    ]

    amb_start = max(0.0, starts["02"] - 0.20)
    amb_dur = total_dur - amb_start

    mcmd = ["ffmpeg", "-y", "-v", "error", "-i", str(xfade_mkv), "-stream_loop", "-1", "-i", str(amb_file), "-i", str(BGM_PATH)]
    for vp, _ in voice_events:
        mcmd += ["-i", str(vp)]

    # Keep BGM playing all the way to the very end (pad speech with silence to total_dur so sidechaincompress NEVER stalls on EOF!)
    mfc = [
        f"[1:a]atrim=0:{amb_dur:.3f},adelay={int(round(amb_start*1000))}|{int(round(amb_start*1000))},volume=0.20,afade=t=in:st={amb_start:.3f}:d=0.6,afade=t=out:st={total_dur-0.18:.3f}:d=0.18[amb]",
        f"[2:a]atrim=0:{total_dur:.3f},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume=0.38,afade=t=in:d=0.4,afade=t=out:st={total_dur-0.18:.3f}:d=0.18[bgm]",
        "[0:a][amb][bgm]amix=inputs=3:duration=first:normalize=0[bg]",
    ]
    vlabels = []
    for idx, (_, offset) in enumerate(voice_events):
        ms = int(round(offset * 1000))
        lbl = f"vl{idx}"
        mfc.append(f"[{idx+3}:a]adelay={ms}|{ms},volume=1.25[{lbl}]")
        vlabels.append(f"[{lbl}]")

    mfc.append("".join(vlabels) + f"amix=inputs={len(vlabels)}:duration=longest:normalize=0,apad=whole_dur={total_dur:.3f},acompressor=threshold=-16dB:ratio=2.5:attack=15:release=180[speech]")
    mfc.append("[speech]asplit=2[sp_sc][sp_mix]")
    mfc.append("[bg][sp_sc]sidechaincompress=threshold=0.012:ratio=5.5:attack=100:release=500:knee=6[bg_duck]")
    mfc.append("[bg_duck][sp_mix]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[aout]")

    mcmd += [
        "-filter_complex", ";".join(mfc),
        "-map", "0:v:0", "-map", "[aout]",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        str(out_video)
    ]
    run(mcmd)
    elapsed = time.perf_counter() - t0
    print(f"SAVED [{tag}] -> {out_video} | dur={total_dur:.2f}s | size={out_video.stat().st_size} bytes | build_time={elapsed:.2f}s")


def main():
    parser = argparse.ArgumentParser(description="Assemble personalized greeting video from video-pipeline assets.")
    parser.add_argument("--lang", choices=["ru", "uk"], help="Language to build (omit to run default Mishanya RU+UA builds).")
    parser.add_argument("--tag", help="Build tag (used for work_<tag> directory).")
    parser.add_argument("--name", help="Display name rendered under the photo in shot 04b.")
    parser.add_argument("--photo", type=Path, default=PHOTO_PATH, help="Path to child photo.")
    parser.add_argument("--custom-audio", type=Path, default=None, help="Directory with custom personalized line_*.mp3 files.")
    parser.add_argument("--out", type=Path, help="Output MP4 path.")
    parser.add_argument("--keep-work", action="store_true", help="Keep intermediate build/work_<tag> directory for debugging.")
    args = parser.parse_args()

    out_dir = ROOT / "output"
    out_dir.mkdir(parents=True, exist_ok=True)
    if args.lang:
        tag = args.tag or f"custom_{args.lang}"
        name = args.name or "Мишаня"
        out_path = args.out or (out_dir / f"pilot_{tag}_720p.mp4")
        build_pilot(args.lang, tag, name, out_path, photo_path=args.photo, custom_audio_dir=args.custom_audio, keep_work=args.keep_work)
    else:
        build_pilot("ru", "mishanya_ru", "Мишаня", out_dir / "pilot_mishanya_ru_720p_v9.mp4", keep_work=args.keep_work)
        build_pilot("uk", "mishanya_ua", "Мишаня", out_dir / "pilot_mishanya_ua_720p_v2.mp4", keep_work=args.keep_work)


if __name__ == "__main__":
    main()
