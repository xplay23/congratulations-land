import argparse
import json
import math
import random
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
BUILD_DIR = ROOT / "build"

DUCKING_PRESETS = {
    "gentle": "threshold=0.018:ratio=3.5:attack=120:release=450:knee=6",
    "standard": "threshold=0.012:ratio=5.5:attack=100:release=500:knee=6",
    "strong": "threshold=0.009:ratio=8.0:attack=80:release=550:knee=6",
}


def run(cmd: list[str]) -> str:
    res = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if res.returncode != 0:
        print(res.stdout)
        raise RuntimeError(f"Command failed with exit {res.returncode}: {' '.join(cmd[:6])}")
    return res.stdout


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    return float(out)


def has_audio_stream(path: Path) -> bool:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_type",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    return out == "audio"


def detect_speech_end(path: Path) -> float:
    res = subprocess.run(
        [
            "ffmpeg",
            "-i",
            str(path),
            "-af",
            "silencedetect=noise=-40dB:d=0.06",
            "-f",
            "null",
            "-",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    total = probe_duration(path)
    cur_start = None
    last_closed = None
    for line in res.stdout.splitlines():
        if "silence_start:" in line:
            cur_start = float(line.split("silence_start:")[1].strip().split()[0])
        elif "silence_end:" in line and cur_start is not None:
            end_t = float(line.split("silence_end:")[1].strip().split()[0])
            last_closed = (cur_start, end_t)
            cur_start = None
    trail_start = None
    if cur_start is not None:
        trail_start = cur_start
    elif last_closed is not None and total - last_closed[1] < 0.05:
        trail_start = last_closed[0]
    if trail_start is not None and total - trail_start < 1.2 and trail_start > 0.5:
        return trail_start + 0.04
    return total


def find_pauses_and_end(path: Path, noise_db: str = "-40dB", min_d: float = 0.12):
    res = subprocess.run(
        [
            "ffmpeg",
            "-i",
            str(path),
            "-af",
            f"silencedetect=noise={noise_db}:d={min_d}",
            "-f",
            "null",
            "-",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
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
    elif (
        pauses
        and total - pauses[-1][1] < 0.05
        and total - pauses[-1][0] < 1.2
        and pauses[-1][0] > 0.5
    ):
        speech_end = pauses[-1][0] + 0.04
    return pauses, speech_end, total


def trim_audio(src: Path, dst: Path, start: float, end: float, atempo: float = 1.0):
    end = max(start + 0.05, end)
    dur = (end - start) / max(0.5, atempo)
    fade_out_st = max(0.0, dur - 0.03)
    af = [f"atrim=start={start:.3f}:end={end:.3f}", "asetpts=PTS-STARTPTS"]
    if abs(atempo - 1.0) > 1e-3:
        af.append(f"atempo={atempo:.4f}")
    af += [
        "afade=t=in:d=0.02",
        f"afade=t=out:st={fade_out_st:.3f}:d=0.03",
        "aresample=48000",
        "aformat=channel_layouts=stereo",
    ]
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", ",".join(af), str(dst)])


def concat_audio_parts(part_specs: list[tuple[Path, float, float, float]], dst: Path):
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
    cmd += [
        "-filter_complex",
        f"{ins}concat=n={len(tmp_files)}:v=0:a=1[out]",
        "-map",
        "[out]",
        str(dst),
    ]
    run(cmd)


def process_voice_line(vl: dict[str, Any], out_wav: Path) -> float:
    src = Path(vl["audioPath"])
    if not src.exists():
        raise FileNotFoundError(f"Voice audio file not found: {src}")

    segments = vl.get("audioSegments") or []
    if segments:
        specs = [
            (src, float(seg["start"]), float(seg["end"]), float(seg.get("atempo", 1.0)))
            for seg in segments
        ]
        concat_audio_parts(specs, out_wav)
        return probe_duration(out_wav)

    start = float(vl.get("trimStart") or 0.0)
    raw_end = vl.get("trimEnd")
    trim_silence = bool(vl.get("trimSilenceEnd", True))
    base_tempo = float(vl.get("atempo", 1.0))
    auto_fit_max = vl.get("autoFitMaxTempo")
    auto_fit_target = vl.get("autoFitTargetSec")

    if raw_end is not None and float(raw_end) > start:
        end = float(raw_end)
        trim_audio(src, out_wav, start, end, atempo=base_tempo)
        return probe_duration(out_wav)

    if auto_fit_max is not None and auto_fit_target is not None:
        max_tempo = float(auto_fit_max)
        target_sec = float(auto_fit_target)
        sp_end = detect_speech_end(src) if trim_silence else probe_duration(src)
        if sp_end - start <= target_sec + 0.15:
            trim_audio(src, out_wav, start, sp_end, atempo=base_tempo)
            return probe_duration(out_wav)

        pauses, sp_end_full, _ = find_pauses_and_end(src)
        mid_pauses = [
            p for p in pauses if 0.8 <= p[0] <= 3.0 and p[1] < sp_end_full - 1.0
        ]
        if mid_pauses:
            p_st, p_en = mid_pauses[0]
            t1_end = min(p_st + 0.03, p_en)
            t2_start = max(p_st + 0.03, p_en - 0.04)
            raw_dur = (t1_end - start) + (sp_end_full - t2_start)
            tempo2 = max(base_tempo, min(max_tempo, raw_dur / target_sec))
            concat_audio_parts(
                [
                    (src, start, t1_end, min(max_tempo, max(1.0, base_tempo))),
                    (src, t2_start, sp_end_full, tempo2),
                ],
                out_wav,
            )
            return probe_duration(out_wav)

        tempo = max(base_tempo, min(max_tempo, (sp_end_full - start) / target_sec))
        trim_audio(src, out_wav, start, sp_end_full, atempo=tempo)
        return probe_duration(out_wav)

    end = detect_speech_end(src) if trim_silence else probe_duration(src)
    trim_audio(src, out_wav, start, end, atempo=base_tempo)
    return probe_duration(out_wav)


def parse_hex_color(hex_str: str, default_rgb=(68, 38, 16)) -> tuple[int, int, int]:
    try:
        s = hex_str.strip().lstrip("#")
        if len(s) == 6:
            return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))
    except Exception:
        pass
    return default_rgb


def load_caption_font(font_size: int, fallback_font_path: Path):
    candidates = [
        (r"C:\Windows\Fonts\Gabriola.ttf", font_size),
        (r"C:\Windows\Fonts\georgiai.ttf", max(24, font_size - 14)),
        (str(fallback_font_path), max(24, font_size - 14)),
    ]
    for path_str, sz in candidates:
        try:
            return ImageFont.truetype(path_str, sz)
        except OSError:
            continue
    return ImageFont.load_default()


def render_photo_overlay_png(
    canvas_size: tuple[int, int],
    overlay_cfg: dict[str, Any],
    overlay_out: Path,
    fallback_font_path: Path,
):
    photo_path = Path(overlay_cfg["photoPath"])
    if not photo_path.exists():
        raise FileNotFoundError(f"Overlay photo not found: {photo_path}")

    photo = Image.open(photo_path).convert("RGBA")
    if overlay_cfg.get("warmTint", True):
        r, g, b, a = photo.split()
        r = ImageEnhance.Brightness(r).enhance(1.04)
        g = ImageEnhance.Brightness(g).enhance(0.97)
        b = ImageEnhance.Brightness(b).enhance(0.84)
        photo = Image.merge("RGBA", (r, g, b, a))
        photo = ImageEnhance.Contrast(photo).enhance(0.95)

    w = max(32, int(round(float(overlay_cfg.get("width", 244)))))
    h = max(32, int(round(float(overlay_cfg.get("height", 244)))))
    target_size = (w, h)
    photo = ImageOps.fit(
        photo, target_size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.35)
    )

    radius = max(0, int(round(float(overlay_cfg.get("borderRadius", 12)))))
    if radius > 0:
        mask = Image.new("L", target_size, 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, w - 1, h - 1], radius=radius, fill=255
        )
        photo.putalpha(mask)

    preset = overlay_cfg.get("framePreset", "antique_book")
    caption_text = str(overlay_cfg.get("captionText") or "").strip()
    caption_cfg = overlay_cfg.get("caption") or {}

    # Render card onto an isolated card buffer so rotation works cleanly
    pad_x = 120
    pad_top = 40
    pad_bottom = 140
    card_w = w + pad_x * 2
    card_h = h + pad_top + pad_bottom
    card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    px = pad_x
    py = pad_top
    local_cx = px + w // 2

    if preset == "antique_book":
        shadow = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle(
            [px - 8, py - 6, px + w + 10, py + h + 12],
            radius=radius + 4,
            fill=(45, 25, 10, 85),
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(8))
        card = Image.alpha_composite(card, shadow)
        cd = ImageDraw.Draw(card)
        cd.rounded_rectangle(
            [px - 7, py - 7, px + w + 6, py + h + 6],
            radius=radius + 3,
            fill=(235, 212, 168, 235),
            outline=(145, 102, 42, 230),
            width=2,
        )
        cd.rounded_rectangle(
            [px - 2, py - 2, px + w + 1, py + h + 1],
            radius=radius + 1,
            outline=(185, 140, 62, 210),
            width=2,
        )
    elif preset == "polaroid":
        shadow = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle(
            [px - 14, py - 14, px + w + 16, py + h + 66],
            radius=8,
            fill=(20, 18, 16, 110),
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(10))
        card = Image.alpha_composite(card, shadow)
        cd = ImageDraw.Draw(card)
        cd.rounded_rectangle(
            [px - 12, py - 12, px + w + 12, py + h + 62],
            radius=6,
            fill=(248, 245, 238, 248),
            outline=(215, 206, 192, 240),
            width=2,
        )
    elif preset == "gold_frame":
        shadow = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle(
            [px - 12, py - 10, px + w + 14, py + h + 14],
            radius=radius + 6,
            fill=(30, 18, 5, 120),
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(9))
        card = Image.alpha_composite(card, shadow)
        cd = ImageDraw.Draw(card)
        cd.rounded_rectangle(
            [px - 10, py - 10, px + w + 10, py + h + 10],
            radius=radius + 5,
            fill=(196, 152, 68, 245),
            outline=(120, 82, 24, 245),
            width=3,
        )
        cd.rounded_rectangle(
            [px - 4, py - 4, px + w + 4, py + h + 4],
            radius=radius + 2,
            outline=(248, 224, 148, 235),
            width=2,
        )

    card.paste(photo, (px, py), photo)
    cd = ImageDraw.Draw(card)

    if caption_text:
        max_fs = int(caption_cfg.get("maxFontSize", 58))
        min_fs = int(caption_cfg.get("minFontSize", 34))
        max_w = int(caption_cfg.get("maxWidth", max(w + 30, 275)))
        offset_y = int(caption_cfg.get("offsetY", 18))
        rgb = parse_hex_color(str(caption_cfg.get("color", "#442610")))
        underline = bool(caption_cfg.get("underline", preset == "antique_book"))

        font_size = max_fs
        font = load_caption_font(font_size, fallback_font_path)
        bbox = cd.textbbox((0, 0), caption_text, font=font)
        while font_size > min_fs and (bbox[2] - bbox[0]) > max_w:
            font_size -= 2
            font = load_caption_font(font_size, fallback_font_path)
            bbox = cd.textbbox((0, 0), caption_text, font=font)

        tw = bbox[2] - bbox[0]
        tx = local_cx - tw // 2 - bbox[0]
        ty = py + h + offset_y - bbox[1]
        cd.text((tx + 1, ty + 1), caption_text, font=font, fill=(110, 75, 40, 70))
        cd.text((tx, ty), caption_text, font=font, fill=(rgb[0], rgb[1], rgb[2], 225))
        if underline:
            line_half = max(75, min(135, tw // 2 + 16))
            line_y = ty + bbox[3] + 6
            cd.line(
                [(local_cx - line_half, line_y), (local_cx + line_half, line_y)],
                fill=(160, 118, 48, 175),
                width=2,
            )

    rotation = float(overlay_cfg.get("rotation") or 0.0)
    if abs(rotation) > 0.05:
        card = card.rotate(-rotation, resample=Image.Resampling.BICUBIC, expand=True)

    full = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    # Align card's photo center onto (cx, cy) scaled to actual canvas
    scale_x = canvas_size[0] / 1280.0
    scale_y = canvas_size[1] / 720.0
    cx = int(round(float(overlay_cfg.get("cx", 822)) * scale_x))
    cy = int(round(float(overlay_cfg.get("cy", 286)) * scale_y))

    # Photo center within unrotated card was (pad_x + w/2, pad_top + h/2)
    # After expand=True rotation, paste centered around (cx, cy) with vertical adjustment
    offset_center_y = (pad_top + h / 2.0) - (card_h / 2.0)
    paste_x = int(round(cx - card.width / 2.0))
    paste_y = int(round(cy - card.height / 2.0 - offset_center_y))
    full.alpha_composite(card, (paste_x, paste_y))
    full.save(overlay_out)


def generate_magic_transition_mov(
    out_mov: Path,
    spark_dir: Path,
    width: int = 1280,
    height: int = 720,
    duration: float = 0.70,
    fps: int = 24,
    seed: int = 2026,
    strength: float = 0.95,
):
    if out_mov.exists():
        return
    spark_dir.mkdir(parents=True, exist_ok=True)
    for old in spark_dir.glob("f_*.png"):
        old.unlink()

    rng = random.Random(seed)
    n_frames = max(6, int(round(duration * fps)))
    w, h = width, height
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = (xx - w / 2.0) / (w * 0.55)
    dy = (yy - h / 2.0) / (h * 0.55)
    radial = np.exp(-(dx * dx + dy * dy) * 1.4)

    particles = [
        {
            "x": rng.uniform(0.08 * w, 0.92 * w),
            "y": rng.uniform(0.15 * h, 0.95 * h),
            "vx": rng.uniform(-35, 35),
            "vy": rng.uniform(-110, -30),
            "r": rng.uniform(2.5, 8.5),
            "phase": rng.uniform(0.1, 0.9),
            "bright": rng.uniform(0.6, 1.0),
        }
        for _ in range(48)
    ]

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

    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-framerate",
            str(fps),
            "-i",
            str(spark_dir / "f_%04d.png"),
            "-c:v",
            "png",
            "-pix_fmt",
            "rgba",
            str(out_mov),
        ]
    )


def render_shot_clip(
    shot: dict[str, Any],
    shot_dur: float,
    out_mkv: Path,
    work: Path,
    width: int,
    height: int,
    fps: int,
    fallback_font_path: Path,
    video_stretch: float = 1.0,
) -> float:
    src = Path(shot["videoPath"])
    if not src.exists():
        raise FileNotFoundError(f"Shot video not found: {src}")

    trim_start = float(shot.get("trimStart", 0.0))
    keep_vol = float(shot.get("keepClipAudioVolume", 0.0))
    speed_segments = shot.get("speedSegments") or []
    overlays = shot.get("overlays") or []
    fade_in = shot.get("fadeIn")
    fade_out = shot.get("fadeOut")

    # Render overlay PNGs if present
    overlay_files: list[tuple[Path, float, float]] = []
    for idx, ov in enumerate(overlays):
        ov_png = work / f"ov_{shot['key']}_{idx}.png"
        render_photo_overlay_png((width, height), ov, ov_png, fallback_font_path)
        overlay_files.append(
            (
                ov_png,
                float(ov.get("fadeInStart", 0.15)),
                float(ov.get("fadeInDuration", 0.45)),
            )
        )

    cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(src)]
    for ov_png, _, _ in overlay_files:
        cmd += ["-loop", "1", "-t", f"{shot_dur:.3f}", "-i", str(ov_png)]

    source_has_audio = keep_vol > 0 and has_audio_stream(src)
    anull_idx = None
    if not source_has_audio:
        anull_idx = 1 + len(overlay_files)
        cmd += [
            "-f",
            "lavfi",
            "-t",
            f"{shot_dur:.3f}",
            "-i",
            "anullsrc=r=48000:cl=stereo",
        ]

    fc: list[str] = []

    if speed_segments:
        n = len(speed_segments)
        split_labels = "".join(f"[vs{i}]" for i in range(n))
        fc.append(f"[0:v]split={n}{split_labels}")
        seg_outs = []
        for i, seg in enumerate(speed_segments):
            s0 = float(seg["start"])
            s1 = float(seg["end"])
            factor = float(seg.get("factor", 1.0))
            pts_expr = (
                f"(PTS-STARTPTS)*{factor:.4f}"
                if abs(factor - 1.0) > 1e-3
                else "PTS-STARTPTS"
            )
            fc.append(
                f"[vs{i}]trim=start={s0:.3f}:end={s1:.3f},setpts={pts_expr}[vseg{i}]"
            )
            seg_outs.append(f"[vseg{i}]")
        base_v = (
            f"{''.join(seg_outs)}concat=n={n}:v=1:a=0,"
            f"fps={fps},scale={width}:{height}:flags=lanczos,setsar=1"
        )
    else:
        src_trim_dur = shot_dur / max(1.0, video_stretch)
        pts_expr = (
            f"(PTS-STARTPTS)*{video_stretch:.4f}"
            if abs(video_stretch - 1.0) > 1e-3
            else "PTS-STARTPTS"
        )
        base_v = (
            f"[0:v]trim=start={trim_start:.3f}:duration={src_trim_dur:.3f},"
            f"setpts={pts_expr},fps={fps},scale={width}:{height}:flags=lanczos,setsar=1"
        )

    post_vf: list[str] = []
    if fade_in and float(fade_in.get("duration", 0)) > 0:
        d_in = float(fade_in["duration"])
        c_in = fade_in.get("color")
        post_vf.append(
            f"fade=t=in:st=0:d={d_in:.3f}" + (f":color={c_in}" if c_in else "")
        )
    if fade_out and float(fade_out.get("duration", 0)) > 0:
        d_out = float(fade_out["duration"])
        st_out = max(0.0, shot_dur - d_out)
        c_out = fade_out.get("color")
        post_vf.append(
            f"fade=t=out:st={st_out:.3f}:d={d_out:.3f}"
            + (f":color={c_out}" if c_out else "")
        )

    if post_vf:
        base_v += "," + ",".join(post_vf)

    fc.append(f"{base_v}[vcur0]")
    cur_v = "[vcur0]"

    for idx, (_, fade_st, fade_d) in enumerate(overlay_files):
        in_idx = 1 + idx
        ov_lbl = f"[ov{idx}]"
        nxt_v = f"[vcur{idx + 1}]"
        if fade_d > 0:
            fc.append(
                f"[{in_idx}:v]format=rgba,fade=t=in:st={fade_st:.3f}:d={fade_d:.3f}:alpha=1{ov_lbl}"
            )
        else:
            fc.append(f"[{in_idx}:v]format=rgba{ov_lbl}")
        fc.append(f"{cur_v}{ov_lbl}overlay=0:0:shortest=1{nxt_v}")
        cur_v = nxt_v

    if source_has_audio:
        af = [
            f"atrim=start={trim_start:.3f}:duration={shot_dur:.3f}",
            "asetpts=PTS-STARTPTS",
            f"volume={keep_vol:.3f}",
            "afade=t=in:d=0.15",
            f"afade=t=out:st={max(0.0, shot_dur - 0.15):.3f}:d=0.15",
            "aresample=48000",
            "aformat=channel_layouts=stereo",
        ]
        fc.append(f"[0:a]{','.join(af)}[aout]")
        a_map = "[aout]"
    else:
        a_map = f"{anull_idx}:a:0"

    cmd += [
        "-filter_complex",
        ";".join(fc),
        "-map",
        cur_v,
        "-map",
        a_map,
        "-c:v",
        "libx264",
        "-crf",
        "15",
        "-preset",
        "medium",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "pcm_s16le",
        "-shortest",
        str(out_mkv),
    ]
    run(cmd)
    return probe_duration(out_mkv)


def build_from_manifest(
    manifest: dict[str, Any],
    out_video: Path,
    only_shot: str | None = None,
    keep_work: bool = False,
):
    tag = str(manifest.get("tag") or "custom")
    work = BUILD_DIR / f"work_{tag}"
    try:
        return _build_impl(manifest, work, out_video, only_shot=only_shot)
    finally:
        if not keep_work:
            shutil.rmtree(work, ignore_errors=True)


def _build_impl(
    manifest: dict[str, Any],
    work: Path,
    out_video: Path,
    only_shot: str | None = None,
):
    t0 = time.perf_counter()
    clips_dir = work / "clips"
    proc_audio = work / "audio"
    clips_dir.mkdir(parents=True, exist_ok=True)
    proc_audio.mkdir(parents=True, exist_ok=True)
    out_video.parent.mkdir(parents=True, exist_ok=True)

    output_cfg = manifest.get("output") or {}
    width = int(output_cfg.get("width", 1280))
    height = int(output_cfg.get("height", 720))
    fps = int(output_cfg.get("fps", 24))
    audio_cfg = manifest.get("audio") or {}
    fallback_font = Path(
        manifest.get("fontFallbackPath")
        or str(ROOT.parent / "assets" / "fonts" / "georgiai.ttf")
    )

    shots: list[dict[str, Any]] = manifest.get("shots") or []
    if only_shot:
        shots = [s for s in shots if s.get("key") == only_shot or s.get("id") == only_shot]
        if not shots:
            raise ValueError(f"Shot '{only_shot}' not found in manifest")

    if not shots:
        raise ValueError("Manifest contains no shots")

    warnings: list[str] = []

    # 1. Process all voice lines first so fit_to_speech shots know exact durations
    processed_voices: dict[str, list[dict[str, Any]]] = {}
    for s_idx, shot in enumerate(shots):
        s_key = str(shot["key"])
        v_list = []
        for v_idx, vl in enumerate(shot.get("voiceLines") or []):
            wav_path = proc_audio / f"v_{s_idx:02d}_{v_idx:02d}_{vl['id']}.wav"
            dur = process_voice_line(vl, wav_path)
            v_list.append(
                {
                    "id": vl["id"],
                    "wav": wav_path,
                    "dur": dur,
                    "offsetSec": float(vl.get("offsetSec", 0.0)),
                    "volume": float(vl.get("volume", 1.25)),
                }
            )
        processed_voices[s_key] = v_list

    # 2. Compute shot durations & render individual clips
    clip_list: list[tuple[str, Path, float, dict[str, Any]]] = []
    for s_idx, shot in enumerate(shots):
        s_key = str(shot["key"])
        src_path = Path(shot["videoPath"])
        src_dur = probe_duration(src_path)
        trim_start = float(shot.get("trimStart", 0.0))
        available_src = max(0.5, src_dur - trim_start)
        speed_segments = shot.get("speedSegments") or []
        v_list = processed_voices[s_key]

        video_stretch = 1.0
        if speed_segments:
            target_dur = sum(
                (float(seg["end"]) - float(seg["start"])) * float(seg.get("factor", 1.0))
                for seg in speed_segments
            )
        elif shot.get("durationMode") == "fit_to_speech":
            fit = shot.get("fitToSpeech") or {}
            target_vl_id = fit.get("voiceLineId")
            target_vl = next(
                (v for v in v_list if v["id"] == target_vl_id),
                v_list[0] if v_list else None,
            )
            min_dur = float(fit.get("minDur", 2.5))
            max_dur = float(fit.get("maxDur", available_src))
            pad_after = float(fit.get("padAfterSpeech", 0.2))
            if target_vl:
                long_th = fit.get("longSpeechThresholdSec")
                long_off = fit.get("longSpeechOffsetSec")
                if (
                    long_th is not None
                    and long_off is not None
                    and target_vl["dur"] > float(long_th)
                ):
                    target_vl["offsetSec"] = float(long_off)
                desired = target_vl["offsetSec"] + target_vl["dur"] + pad_after
                target_dur = min(max_dur, max(min_dur, desired))
            else:
                target_dur = min(max_dur, max(min_dur, available_src))

            if target_dur > available_src + 0.02:
                strategy = fit.get("overflowStrategy", "clamp")
                if strategy == "slow_video":
                    video_stretch = min(1.35, target_dur / available_src)
                    target_dur = min(target_dur, available_src * video_stretch)
                    warnings.append(
                        f"Shot {s_key}: slowed video {video_stretch:.2f}x to fit speech ({target_dur:.2f}s)"
                    )
                else:
                    warnings.append(
                        f"Shot {s_key}: clamped duration from {target_dur:.2f}s to source {available_src:.2f}s"
                    )
                    target_dur = available_src
        else:
            fixed_dur = float(shot.get("fixedDuration") or available_src)
            target_dur = min(fixed_dur, available_src)

        out_mkv = clips_dir / f"{s_idx:02d}_{s_key}.mkv"
        actual_dur = render_shot_clip(
            shot=shot,
            shot_dur=target_dur,
            out_mkv=out_mkv,
            work=work,
            width=width,
            height=height,
            fps=fps,
            fallback_font_path=fallback_font,
            video_stretch=video_stretch,
        )
        clip_list.append((s_key, out_mkv, actual_dur, shot))

    # 3. Fast path for single-shot preview (--only-shot) or single-clip manifest
    starts: dict[str, float] = {}
    if len(clip_list) == 1:
        s_key, c_path, c_dur, _ = clip_list[0]
        starts[s_key] = 0.0
        total_dur = c_dur
        xfade_mkv = c_path
    else:
        spark_trans = BUILD_DIR / f"spark_trans_{width}x{height}_{fps}.mov"
        need_sparks = any(
            bool((c[3].get("transitionIn") or {}).get("spark"))
            for c in clip_list[1:]
        )
        if need_sparks:
            generate_magic_transition_mov(
                spark_trans,
                BUILD_DIR / f"sparks_{width}x{height}_{fps}",
                width=width,
                height=height,
                fps=fps,
            )

        transitions = []
        for i in range(1, len(clip_list)):
            tr = clip_list[i][3].get("transitionIn") or {}
            tr_type = str(tr.get("type", "fade"))
            tr_dur = float(tr.get("duration", 0.25))
            if tr_type == "none" or tr_dur < 0.02:
                tr_type = "fade"
                tr_dur = 0.02
            # Clamp overlap so it never exceeds half of either neighboring clip
            max_ov = min(clip_list[i - 1][2], clip_list[i][2]) * 0.45
            tr_dur = min(tr_dur, max(0.02, max_ov))
            transitions.append((tr_type, tr_dur, bool(tr.get("spark", False))))

        spark_times: list[float] = []
        cur_end = clip_list[0][2]
        starts[clip_list[0][0]] = 0.0
        for i, (tr_type, ov_dur, use_spark) in enumerate(transitions):
            offset = max(0.0, cur_end - ov_dur)
            next_key, _, next_dur, _ = clip_list[i + 1]
            starts[next_key] = offset
            if use_spark:
                spark_times.append(max(0.0, offset + ov_dur * 0.5 - 0.35))
            cur_end = offset + next_dur
        total_dur = cur_end

        cmd = ["ffmpeg", "-y", "-v", "error"]
        for _, c_path, _, _ in clip_list:
            cmd += ["-i", str(c_path)]
        for st in spark_times:
            cmd += ["-itsoffset", f"{st:.3f}", "-i", str(spark_trans)]

        fc = []
        prev_v, prev_a = "[0:v]", "[0:a]"
        cur_t = clip_list[0][2]
        for i, (tr_type, ov_dur, _) in enumerate(transitions):
            offset = max(0.0, cur_t - ov_dur)
            out_v = f"[xv{i}]" if i < len(transitions) - 1 else "[vbase]"
            out_a = f"[xa{i}]" if i < len(transitions) - 1 else "[abase]"
            fc.append(
                f"{prev_v}[{i + 1}:v]xfade=transition={tr_type}:duration={ov_dur:.3f}:offset={offset:.3f}{out_v}"
            )
            fc.append(
                f"{prev_a}[{i + 1}:a]acrossfade=d={ov_dur:.3f}:c1=tri:c2=tri{out_a}"
            )
            prev_v, prev_a = out_v, out_a
            cur_t = offset + clip_list[i + 1][2]

        v_cur = "[vbase]"
        if spark_times:
            base_sp_idx = len(clip_list)
            for k, _ in enumerate(spark_times):
                v_nxt = f"[vsp{k}]" if k < len(spark_times) - 1 else "[vout]"
                fc.append(f"{v_cur}[{base_sp_idx + k}:v]overlay=0:0:eof_action=pass{v_nxt}")
                v_cur = v_nxt
        else:
            fc.append(f"{v_cur}null[vout]")

        xfade_mkv = work / "xfade_master.mkv"
        cmd += [
            "-filter_complex",
            ";".join(fc),
            "-map",
            "[vout]",
            "-map",
            "[abase]",
            "-c:v",
            "libx264",
            "-crf",
            "15",
            "-preset",
            "medium",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "pcm_s16le",
            str(xfade_mkv),
        ]
        run(cmd)

    # 4. Prepare Ambient & BGM tracks
    amb_file: Path | None = None
    amb_mode = str(audio_cfg.get("ambientMode", "none"))
    amb_vol = float(audio_cfg.get("ambientVolume", 0.20))
    amb_start = 0.0

    if not only_shot and amb_mode != "none" and amb_vol > 0:
        amb_start_key = str(audio_cfg.get("ambientStartShotKey") or "")
        if amb_start_key in starts:
            amb_start = max(0.0, starts[amb_start_key] - 0.20)
        if amb_mode == "asset" and audio_cfg.get("ambientPath"):
            p = Path(audio_cfg["ambientPath"])
            if p.exists():
                amb_file = p
        elif amb_mode == "extract_from_shot":
            src_key = str(audio_cfg.get("ambientSourceShotKey") or "")
            src_shot = next((s for s in shots if s.get("key") == src_key), None)
            if src_shot and Path(src_shot["videoPath"]).exists() and has_audio_stream(Path(src_shot["videoPath"])):
                st_a = float(audio_cfg.get("ambientExtractStart", 0.2))
                en_a = float(audio_cfg.get("ambientExtractEnd", 9.5))
                amb_wav = proc_audio / "ambient_extracted.wav"
                fade_st = max(0.0, (en_a - st_a) - 0.3)
                run(
                    [
                        "ffmpeg",
                        "-y",
                        "-v",
                        "error",
                        "-i",
                        str(src_shot["videoPath"]),
                        "-af",
                        f"atrim={st_a:.3f}:{en_a:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st={fade_st:.3f}:d=0.3,aresample=48000,aformat=channel_layouts=stereo",
                        str(amb_wav),
                    ]
                )
                amb_file = amb_wav

    bgm_file: Path | None = None
    bgm_vol = float(audio_cfg.get("bgmVolume", 0.38))
    if audio_cfg.get("bgmPath") and bgm_vol > 0:
        p = Path(audio_cfg["bgmPath"])
        if p.exists():
            bgm_file = p

    # Collect voice events
    voice_events: list[tuple[Path, float, float]] = []
    for s_key, _, _, _ in clip_list:
        s_start = starts[s_key]
        for v in processed_voices[s_key]:
            voice_events.append((v["wav"], s_start + v["offsetSec"], v["volume"]))

    # 5. Final Audio Mix
    mcmd = ["ffmpeg", "-y", "-v", "error", "-i", str(xfade_mkv)]
    next_in = 1
    bg_inputs = ["[0:a]"]
    mfc: list[str] = []

    if amb_file is not None:
        amb_dur = max(0.1, total_dur - amb_start)
        mcmd += ["-stream_loop", "-1", "-i", str(amb_file)]
        amb_ms = int(round(amb_start * 1000))
        fade_out_st = max(0.0, total_dur - 0.18)
        mfc.append(
            f"[{next_in}:a]atrim=0:{amb_dur:.3f},adelay={amb_ms}|{amb_ms},volume={amb_vol:.3f},"
            f"afade=t=in:st={amb_start:.3f}:d=0.6,afade=t=out:st={fade_out_st:.3f}:d=0.18[amb]"
        )
        bg_inputs.append("[amb]")
        next_in += 1

    if bgm_file is not None:
        mcmd += ["-stream_loop", "-1", "-i", str(bgm_file)]
        fade_out_st = max(0.0, total_dur - 0.18)
        eff_bgm_vol = bgm_vol * (0.5 if only_shot else 1.0)
        mfc.append(
            f"[{next_in}:a]atrim=0:{total_dur:.3f},asetpts=PTS-STARTPTS,aresample=48000,"
            f"aformat=channel_layouts=stereo,volume={eff_bgm_vol:.3f},"
            f"afade=t=in:d=0.4,afade=t=out:st={fade_out_st:.3f}:d=0.18[bgm]"
        )
        bg_inputs.append("[bgm]")
        next_in += 1

    if len(bg_inputs) > 1:
        mfc.append(
            f"{''.join(bg_inputs)}amix=inputs={len(bg_inputs)}:duration=first:normalize=0[bg]"
        )
    else:
        mfc.append("[0:a]anull[bg]")

    if voice_events:
        vlabels = []
        for idx, (vp, offset, vol) in enumerate(voice_events):
            mcmd += ["-i", str(vp)]
            ms = max(0, int(round(offset * 1000)))
            lbl = f"vl{idx}"
            mfc.append(f"[{next_in}:a]adelay={ms}|{ms},volume={vol:.3f}[{lbl}]")
            vlabels.append(f"[{lbl}]")
            next_in += 1

        mfc.append(
            "".join(vlabels)
            + f"amix=inputs={len(vlabels)}:duration=longest:normalize=0,"
            + f"apad=whole_dur={total_dur:.3f},"
            + "acompressor=threshold=-16dB:ratio=2.5:attack=15:release=180[speech]"
        )
        mfc.append("[speech]asplit=2[sp_sc][sp_mix]")
        duck_str = DUCKING_PRESETS.get(
            str(audio_cfg.get("duckingPreset", "standard")),
            DUCKING_PRESETS["standard"],
        )
        mfc.append(f"[bg][sp_sc]sidechaincompress={duck_str}[bg_duck]")
        mfc.append(
            "[bg_duck][sp_mix]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[aout]"
        )
    else:
        mfc.append("[bg]alimiter=limit=0.95[aout]")

    mcmd += [
        "-filter_complex",
        ";".join(mfc),
        "-map",
        "0:v:0",
        "-map",
        "[aout]",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(out_video),
    ]
    run(mcmd)

    elapsed = time.perf_counter() - t0
    summary = {
        "out": str(out_video),
        "durationSec": round(total_dur, 3),
        "sizeBytes": out_video.stat().st_size,
        "buildSec": round(elapsed, 2),
        "shotStarts": {k: round(v, 3) for k, v in starts.items()},
        "warnings": warnings,
    }
    print(f"MANIFEST_RESULT {json.dumps(summary, ensure_ascii=False)}")
    return summary


def main():
    parser = argparse.ArgumentParser(
        description="Universal stateless video assembler driven by JSON manifest."
    )
    parser.add_argument("--manifest", type=Path, required=True, help="Path to manifest.json")
    parser.add_argument("--out", type=Path, required=True, help="Output MP4 path")
    parser.add_argument(
        "--only-shot",
        type=str,
        default=None,
        help="Optional shot key/id to render a fast single-shot preview.",
    )
    parser.add_argument(
        "--keep-work",
        action="store_true",
        help="Keep intermediate work directory for debugging.",
    )
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    build_from_manifest(
        manifest=manifest,
        out_video=args.out,
        only_shot=args.only_shot,
        keep_work=args.keep_work,
    )


if __name__ == "__main__":
    main()
