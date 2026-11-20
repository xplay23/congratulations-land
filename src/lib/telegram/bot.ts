import fs from "node:fs";
import path from "node:path";
import {
  consumeTelegramDeliveryToken,
  getOrderById,
  getRuntimeState,
  setOrderTelegramChat,
  setRuntimeState,
} from "@/lib/db";
import { getOrderRetentionDays, getOrderDirs } from "@/lib/storage";
import type { OrderRecord, StorybookResult, VideoResult } from "@/lib/types";

const TELEGRAM_SAFE_UPLOAD_BYTES = 48 * 1024 * 1024; // Safety margin under 50 MB Bot API limit

export interface TelegramUpdate {
  update_id?: number;
  message?: {
    chat?: { id: number };
    text?: string;
  };
}

let cachedWebhookActive: { checkedAt: number; active: boolean } | null = null;
let syncPromise: Promise<{ mode: "webhook" | "polling" | "disabled"; processed: number; deliveredOrderIds: string[] }> | null = null;

async function sendTelegramChatAction(
  chatId: string | number,
  action: "upload_document" | "upload_video" | "typing"
): Promise<void> {
  try {
    await tgApi(
      "sendChatAction",
      JSON.stringify({ chat_id: chatId, action }),
      true
    );
  } catch {
    // Non-fatal cosmetic indicator
  }
}

export function getTelegramBotUsername(): string | null {
  return process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "") || null;
}

export function getTelegramBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

async function tgApi(method: string, body?: BodyInit, isJson = false): Promise<unknown> {
  const token = getTelegramBotToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: isJson ? { "Content-Type": "application/json" } : undefined,
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Telegram API ${method} failed (${res.status}): ${errText}`);
  }
  return res.json();
}

function isLocalhostUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url);
}

export async function sendTelegramTextMessage(
  chatId: string | number,
  text: string,
  button?: { label: string; url: string }
): Promise<void> {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (button) {
    if (isLocalhostUrl(button.url)) {
      payload.text = `${text}\n\n${button.label}: ${button.url}`;
    } else {
      payload.reply_markup = {
        inline_keyboard: [[{ text: button.label, url: button.url }]],
      };
    }
  }
  await tgApi("sendMessage", JSON.stringify(payload), true);
}

/**
 * Delivers an order's clean artifact to Telegram chat:
 * - If file <= 48 MB, uploads directly via sendDocument (PDF) or sendVideo (MP4).
 * - If file > 48 MB (safely avoiding 50 MB Bot API 413 error), sends a direct download button.
 */
export async function deliverOrderToTelegramChat(params: {
  order: OrderRecord;
  chatId: string | number;
  baseUrl: string;
}): Promise<{ delivered: "file" | "link"; sizeBytes: number }> {
  const { order, chatId, baseUrl } = params;
  const isUk = order.lang === "uk";
  const { clean } = getOrderDirs(order.id);

  let filePath = "";
  let fileName = "";
  let isVideo = false;

  if (order.productType === "storybook") {
    const sr = order.result as StorybookResult;
    filePath = path.join(clean, sr.cleanPdfFile);
    fileName = `videovitannya-storybook-${order.id}.pdf`;
  } else {
    const vr = order.result as VideoResult;
    filePath = path.join(clean, vr.cleanVideoFile);
    fileName = `videovitannya-video-${order.id}.mp4`;
    isVideo = true;
  }

  if (!fs.existsSync(filePath)) {
    throw new Error("Order file is missing or expired");
  }

  const stat = fs.statSync(filePath);
  const downloadUrl = `${baseUrl}/api/orders/${order.id}/download?token=${encodeURIComponent(
    order.accessToken
  )}`;
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(1);
  const retentionDays = getOrderRetentionDays();

  if (stat.size > TELEGRAM_SAFE_UPLOAD_BYTES) {
    const msg = isUk
      ? `🎁 <b>Ваш подарунок готовий!</b>\n\nФайл має високу якість (${sizeMb} МБ — перевищує ліміт 50 МБ для прямої пересилки в Telegram).\nНатисніть кнопку нижче, щоб завантажити оригінал напряму (посилання дійсне ${retentionDays} днів):`
      : `🎁 <b>Ваш подарок готов!</b>\n\nФайл в высоком качестве (${sizeMb} МБ — превышает лимит 50 МБ для прямой пересылки в Telegram).\nНажмите кнопку ниже, чтобы скачать оригинал напрямую (ссылка действует ${retentionDays} дней):`;

    await sendTelegramTextMessage(chatId, msg, {
      label: isUk ? `⬇️ Завантажити (${sizeMb} МБ)` : `⬇️ Скачать (${sizeMb} МБ)`,
      url: downloadUrl,
    });
    return { delivered: "link", sizeBytes: stat.size };
  }

  const fileBuf = fs.readFileSync(filePath);
  const fd = new FormData();
  fd.append("chat_id", String(chatId));
  fd.append(
    "caption",
    isUk
      ? `🎁 Ваш подарунок VideoVitannya (#${order.id}). Також доступний на сайті протягом ${retentionDays} днів.`
      : `🎁 Ваш подарок VideoVitannya (#${order.id}). Также доступен на сайте в течение ${retentionDays} дней.`
  );

  if (isVideo) {
    fd.append("video", new Blob([fileBuf], { type: "video/mp4" }), fileName);
    fd.append("supports_streaming", "true");
    await tgApi("sendVideo", fd);
  } else {
    fd.append("document", new Blob([fileBuf], { type: "application/pdf" }), fileName);
    await tgApi("sendDocument", fd);
  }

  return { delivered: "file", sizeBytes: stat.size };
}

export async function processTelegramUpdate(
  update: TelegramUpdate,
  baseUrl: string
): Promise<{ handled: boolean; deliveredOrderId?: string }> {
  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim() || "";

  if (!chatId || !text.startsWith("/start")) {
    return { handled: false };
  }

  const parts = text.split(/\s+/);
  const startToken = parts[1] || "";
  if (!startToken.startsWith("dl_")) {
    await sendTelegramTextMessage(
      chatId,
      "Вітаємо у VideoVitannya! Щоб отримати свій подарунок, натисніть кнопку «Надіслати в Telegram» на сторінці оплаченого замовлення."
    );
    return { handled: true };
  }

  const consumed = await consumeTelegramDeliveryToken(startToken, chatId);
  if (consumed.status === "already_delivered_recently") {
    return { handled: true };
  }
  if (consumed.status === "invalid") {
    await sendTelegramTextMessage(
      chatId,
      "Посилання для отримання файлу вже використане або застаріло. Згенеруйте нове на сторінці замовлення."
    );
    return { handled: true };
  }

  const order = await getOrderById(consumed.orderId);
  if (!order || order.status !== "paid" || !order.result) {
    await sendTelegramTextMessage(chatId, "Замовлення не знайдено або ще не оплачене.");
    return { handled: true };
  }

  await setOrderTelegramChat(order.id, String(chatId));

  // Give instant feedback before uploading a potentially large (20-48 MB) file
  const isUk = order.lang === "uk";
  await sendTelegramChatAction(
    chatId,
    order.productType === "video" ? "upload_video" : "upload_document"
  );
  await sendTelegramTextMessage(
    chatId,
    isUk
      ? "⏳ Завантажуємо ваш подарунок у Telegram, зачекайте кілька секунд…"
      : "⏳ Загружаем ваш подарок в Telegram, подождите несколько секунд…"
  );

  await deliverOrderToTelegramChat({ order, chatId, baseUrl });
  return { handled: true, deliveredOrderId: order.id };
}

async function isTelegramWebhookConfigured(): Promise<boolean> {
  const now = Date.now();
  if (cachedWebhookActive && now - cachedWebhookActive.checkedAt < 60_000) {
    return cachedWebhookActive.active;
  }
  const info = (await tgApi("getWebhookInfo")) as { result?: { url?: string } };
  const active = Boolean(info.result?.url?.trim());
  cachedWebhookActive = { checkedAt: now, active };
  return active;
}

/**
 * Local dev helper: when Telegram webhook is not configured (e.g. localhost),
 * pulls pending /start updates via getUpdates and delivers paid orders.
 */
export async function syncPendingTelegramUpdates(baseUrl: string): Promise<{
  mode: "webhook" | "polling" | "disabled";
  processed: number;
  deliveredOrderIds: string[];
}> {
  if (!getTelegramBotToken()) {
    return { mode: "disabled", processed: 0, deliveredOrderIds: [] };
  }
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      if (await isTelegramWebhookConfigured()) {
        return { mode: "webhook" as const, processed: 0, deliveredOrderIds: [] };
      }

      const storedOffset = Number((await getRuntimeState("telegram_last_offset")) || "0");
      const currentOffset = Number.isFinite(storedOffset) && storedOffset > 0 ? storedOffset : 0;
      const qs = currentOffset > 0 ? `?offset=${currentOffset}&timeout=0` : "?timeout=0";
      const data = (await tgApi(`getUpdates${qs}`)) as { result?: TelegramUpdate[] };
      const updates = data.result || [];

      if (updates.length === 0) {
        return { mode: "polling" as const, processed: 0, deliveredOrderIds: [] };
      }

      let maxUpdateId = currentOffset - 1;
      for (const upd of updates) {
        if (typeof upd.update_id === "number" && upd.update_id > maxUpdateId) {
          maxUpdateId = upd.update_id;
        }
      }

      // Persist and acknowledge offset BEFORE uploading large files so hot-reloads or
      // concurrent polls never re-process the same Telegram update.
      if (maxUpdateId >= currentOffset) {
        const nextOffset = maxUpdateId + 1;
        await setRuntimeState("telegram_last_offset", String(nextOffset));
        await tgApi(`getUpdates?offset=${nextOffset}&limit=1&timeout=0`);
      }

      const deliveredOrderIds: string[] = [];
      for (const upd of updates) {
        try {
          const res = await processTelegramUpdate(upd, baseUrl);
          if (res.deliveredOrderId) {
            deliveredOrderIds.push(res.deliveredOrderId);
          }
        } catch (err) {
          console.error("[telegram-sync] update error:", err);
        }
      }

      return {
        mode: "polling" as const,
        processed: updates.length,
        deliveredOrderIds,
      };
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}
