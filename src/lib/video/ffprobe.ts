import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface MediaProbeResult {
  durationSec?: number;
  width?: number;
  height?: number;
  fps?: number;
}

export async function probeMediaFile(filePath: string): Promise<MediaProbeResult> {
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=codec_type,width,height,r_frame_rate",
        "-of",
        "json",
        filePath,
      ],
      { timeout: 15_000 }
    );

    const parsed = JSON.parse(stdout) as {
      format?: { duration?: string };
      streams?: Array<{
        codec_type?: string;
        width?: number;
        height?: number;
        r_frame_rate?: string;
      }>;
    };

    const result: MediaProbeResult = {};
    const rawDur = Number(parsed.format?.duration);
    if (Number.isFinite(rawDur) && rawDur > 0) {
      result.durationSec = Math.round(rawDur * 1000) / 1000;
    }

    const videoStream = parsed.streams?.find((s) => s.codec_type === "video");
    if (videoStream) {
      if (typeof videoStream.width === "number" && videoStream.width > 0) {
        result.width = videoStream.width;
      }
      if (typeof videoStream.height === "number" && videoStream.height > 0) {
        result.height = videoStream.height;
      }
      if (videoStream.r_frame_rate && videoStream.r_frame_rate.includes("/")) {
        const [numStr, denStr] = videoStream.r_frame_rate.split("/");
        const num = Number(numStr);
        const den = Number(denStr);
        if (Number.isFinite(num) && Number.isFinite(den) && den > 0) {
          result.fps = Math.round((num / den) * 100) / 100;
        }
      }
    }

    return result;
  } catch (err) {
    console.warn(`[ffprobe] Failed probing ${filePath}:`, err);
    return {};
  }
}
