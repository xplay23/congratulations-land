import fs from "node:fs";
import path from "node:path";
import type { CollectionConfig } from "payload";
import { probeMediaFile } from "@/lib/video/ffprobe";

export const PIPELINE_ASSETS_DIR = path.resolve(
  process.cwd(),
  "storage",
  "pipeline-assets"
);

export const PipelineAssets: CollectionConfig = {
  slug: "pipeline-assets",
  labels: {
    singular: {
      ru: "Ассет пайплайна",
      uk: "Асет пайплайну",
      en: "Pipeline Asset",
    },
    plural: {
      ru: "Ассеты пайплайна",
      uk: "Асети пайплайну",
      en: "Pipeline Assets",
    },
  },
  admin: {
    useAsTitle: "label",
    group: { ru: "Производство", uk: "Виробництво", en: "Production" },
    defaultColumns: [
      "label",
      "assetKind",
      "lang",
      "durationSec",
      "filename",
      "updatedAt",
    ],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  upload: {
    staticDir: PIPELINE_ASSETS_DIR,
    mimeTypes: [
      "video/mp4",
      "video/quicktime",
      "video/x-matroska",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
      "image/png",
      "image/jpeg",
      "image/webp",
      "font/ttf",
      "font/otf",
      "application/octet-stream",
    ],
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;
        if (!data.label && typeof data.filename === "string" && data.filename) {
          data.label = data.filename.replace(/\.[^.]+$/, "");
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req, context }) => {
        if (context?.skipMediaProbe) return doc;
        const filename = (doc as { filename?: string }).filename;
        if (!filename) return doc;

        const filePath = path.join(PIPELINE_ASSETS_DIR, filename);
        if (!fs.existsSync(filePath)) return doc;

        const mime = String((doc as { mimeType?: string }).mimeType || "");
        const isMedia =
          mime.startsWith("video/") ||
          mime.startsWith("audio/") ||
          /\.(mp4|mov|mkv|mp3|wav|ogg)$/i.test(filename);
        if (!isMedia) return doc;

        const probed = await probeMediaFile(filePath);
        const cur = doc as {
          id: number | string;
          durationSec?: number | null;
          width?: number | null;
          height?: number | null;
          fps?: number | null;
        };

        const patch: Record<string, number> = {};
        if (
          typeof probed.durationSec === "number" &&
          probed.durationSec !== cur.durationSec
        ) {
          patch.durationSec = probed.durationSec;
        }
        if (typeof probed.width === "number" && probed.width !== cur.width) {
          patch.width = probed.width;
        }
        if (typeof probed.height === "number" && probed.height !== cur.height) {
          patch.height = probed.height;
        }
        if (typeof probed.fps === "number" && probed.fps !== cur.fps) {
          patch.fps = probed.fps;
        }

        if (Object.keys(patch).length > 0) {
          try {
            await req.payload.update({
              collection: "pipeline-assets",
              id: cur.id,
              data: patch as never,
              overrideAccess: true,
              context: { skipMediaProbe: true },
            });
          } catch (err) {
            console.warn("[pipeline-assets] Failed saving probe metadata:", err);
          }
        }
        return doc;
      },
    ],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          label: { ru: "Название", uk: "Назва", en: "Label" },
          admin: { width: "45%" },
        },
        {
          name: "assetKind",
          type: "select",
          required: true,
          defaultValue: "video",
          label: { ru: "Тип ассета", uk: "Тип асету", en: "Asset Kind" },
          options: [
            { label: { ru: "Видеоклип (шот)", uk: "Відеокліп (шот)", en: "Video Clip" }, value: "video" },
            { label: { ru: "Статичная озвучка", uk: "Статична озвучка", en: "Static Voice" }, value: "voice_static" },
            { label: { ru: "Фоновая музыка (BGM)", uk: "Фонова музика (BGM)", en: "BGM" }, value: "bgm" },
            { label: { ru: "Амбиент / SFX", uk: "Амбієнт / SFX", en: "Ambient / SFX" }, value: "ambient" },
            { label: { ru: "Изображение", uk: "Зображення", en: "Image" }, value: "image" },
            { label: { ru: "Шрифт (.ttf)", uk: "Шрифт (.ttf)", en: "Font (.ttf)" }, value: "font" },
          ],
          admin: { width: "30%" },
        },
        {
          name: "lang",
          type: "select",
          defaultValue: "any",
          label: { ru: "Язык", uk: "Мова", en: "Language" },
          options: [
            { label: { ru: "Общий (UA/RU)", uk: "Спільний (UA/RU)", en: "Any" }, value: "any" },
            { label: "Українська (UA)", value: "uk" },
            { label: "Русский (RU)", value: "ru" },
          ],
          admin: { width: "25%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "durationSec",
          type: "number",
          label: { ru: "Длительность (сек)", uk: "Тривалість (сек)", en: "Duration (sec)" },
          admin: { width: "25%", readOnly: true },
        },
        {
          name: "width",
          type: "number",
          label: { ru: "Ширина (px)", uk: "Ширина (px)", en: "Width (px)" },
          admin: { width: "25%", readOnly: true },
        },
        {
          name: "height",
          type: "number",
          label: { ru: "Высота (px)", uk: "Висота (px)", en: "Height (px)" },
          admin: { width: "25%", readOnly: true },
        },
        {
          name: "fps",
          type: "number",
          label: "FPS",
          admin: { width: "25%", readOnly: true },
        },
      ],
    },
    {
      name: "notes",
      type: "textarea",
      label: { ru: "Заметки", uk: "Нотатки", en: "Notes" },
    },
  ],
};
