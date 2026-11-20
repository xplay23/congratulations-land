import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { getOrderRetentionDays, getStoragePaths } from "@/lib/storage";
import type { Lang, OrderRecord } from "@/lib/types";

export interface SendMailResult {
  channel: "resend" | "smtp" | "dev_outbox";
  devFile?: string;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendMailResult> {
  const from = process.env.EMAIL_FROM?.trim() || "VideoVitannya <noreply@videovitannya.com.ua>";
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend failed (${res.status}): ${err}`);
    }
    return { channel: "resend" };
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (smtpHost && smtpUser && smtpPass) {
    const port = Number(process.env.SMTP_PORT || "587");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: port === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    return { channel: "smtp" };
  }

  // Local dev outbox fallback so OTP code & Magic Link can be tested offline
  const { DEV_EMAILS_DIR } = getStoragePaths();
  const filename = `${Date.now()}_${params.to.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`;
  const outPath = path.join(DEV_EMAILS_DIR, filename);
  fs.writeFileSync(
    outPath,
    JSON.stringify({ to: params.to, subject: params.subject, text: params.text, html: params.html }, null, 2),
    "utf-8"
  );
  return { channel: "dev_outbox", devFile: outPath };
}

export async function sendAuthCodeAndMagicLinkEmail(params: {
  email: string;
  lang: Lang;
  otpCode: string;
  magicLink: string;
}): Promise<SendMailResult> {
  const isUk = params.lang === "uk";
  const subject = isUk
    ? `VideoVitannya: ваш код входу ${params.otpCode} та посилання на замовлення`
    : `VideoVitannya: ваш код входа ${params.otpCode} и ссылка на заказы`;

  const text = isUk
    ? `Ваш код доступу до «Мої замовлення»: ${params.otpCode} (дійсний 15 хвилин).\n\nАбо увійдіть в один клік за магічним посиланням:\n${params.magicLink}`
    : `Ваш код доступа к «Мои заказы»: ${params.otpCode} (действителен 15 минут).\n\nИли войдите в один клик по магической ссылке:\n${params.magicLink}`;

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0b1020;color:#f4f1ea;border-radius:16px;">
      <h2 style="color:#e8b86d;margin-top:0;">${isUk ? "Доступ до ваших подарунків" : "Доступ к вашим подаркам"}</h2>
      <p style="font-size:14px;line-height:1.5;">${
        isUk
          ? "Введіть цей 6-значний код на сайті (дійсний 15 хвилин):"
          : "Введите этот 6-значный код на сайте (действителен 15 минут):"
      }</p>
      <div style="font-size:28px;font-weight:bold;letter-spacing:6px;background:#121a30;border:1px solid #e8b86d;border-radius:12px;padding:14px;text-align:center;color:#f5d8a8;">
        ${params.otpCode}
      </div>
      <p style="font-size:14px;margin-top:20px;">${
        isUk ? "Або відкрийте замовлення в один клік:" : "Или откройте заказы в один клик:"
      }</p>
      <p style="text-align:center;margin:20px 0;">
        <a href="${params.magicLink}" style="display:inline-block;background:#e8b86d;color:#0b1020;font-weight:bold;padding:12px 24px;border-radius:10px;text-decoration:none;">
          ${isUk ? "Увійти за посиланням" : "Войти по ссылке"}
        </a>
      </p>
    </div>
  `;

  return sendEmail({ to: params.email, subject, html, text });
}

export async function sendPaidOrderEmail(params: {
  order: OrderRecord;
  baseUrl: string;
}): Promise<SendMailResult | null> {
  const email = params.order.customerEmail?.trim();
  if (!email) return null;

  const isUk = params.order.lang === "uk";
  const retentionDays = getOrderRetentionDays();
  const orderLink = `${params.baseUrl}/orders/${params.order.id}?token=${encodeURIComponent(
    params.order.accessToken
  )}`;
  const downloadLink = `${params.baseUrl}/api/orders/${params.order.id}/download?token=${encodeURIComponent(
    params.order.accessToken
  )}`;
  const expiresFormatted = new Date(params.order.expiresAt).toLocaleDateString(
    isUk ? "uk-UA" : "ru-RU"
  );

  const productLabel =
    params.order.productType === "storybook"
      ? isUk
        ? "Персональна ілюстрована казка PDF"
        : "Персональная иллюстрированная сказка PDF"
      : isUk
      ? "Персональне HD-відеопривітання"
      : "Персональное HD-видеопоздравление";

  const subject = isUk
    ? `Ваш подарунок готовий! (${productLabel} • #${params.order.id})`
    : `Ваш подарок готов! (${productLabel} • #${params.order.id})`;

  const text = isUk
    ? `Дякуємо за замовлення!\n\nПродукт: ${productLabel}\nЗавантажити чистий файл: ${downloadLink}\nСторінка замовлення: ${orderLink}\nЧек ПРРО: ${
        params.order.receiptUrl || "-"
      }\n\nФайл зберігається ${retentionDays} днів (до ${expiresFormatted}). Ви також можете будь-коли повернутися через «Мої замовлення» за вашим Email.`
    : `Спасибо за заказ!\n\nПродукт: ${productLabel}\nСкачать чистый файл: ${downloadLink}\nСтраница заказа: ${orderLink}\nЧек ПРРО: ${
        params.order.receiptUrl || "-"
      }\n\nФайл хранится ${retentionDays} дней (до ${expiresFormatted}). Вы также всегда можете вернуться через «Мои заказы» по вашему Email.`;

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0b1020;color:#f4f1ea;border-radius:16px;">
      <h2 style="color:#e8b86d;margin-top:0;">${isUk ? "Подарунок готовий до завантаження!" : "Подарок готов к скачиванию!"}</h2>
      <p style="font-size:14px;color:#cbd5e1;">${productLabel} (#${params.order.id})</p>
      <p style="margin:22px 0;">
        <a href="${downloadLink}" style="display:inline-block;background:#34d399;color:#071510;font-weight:bold;padding:13px 24px;border-radius:10px;text-decoration:none;">
          ${isUk ? "Завантажити чистий файл" : "Скачать чистый файл"}
        </a>
      </p>
      <p style="font-size:13px;color:#94a3b8;">
        ${isUk ? "Сторінка замовлення:" : "Страница заказа:"} <a href="${orderLink}" style="color:#e8b86d;">${orderLink}</a><br/>
        ${
          params.order.receiptUrl
            ? `${isUk ? "Фіскальний чек ПРРО:" : "Фискальный чек ПРРО:"} <a href="${params.order.receiptUrl}" style="color:#e8b86d;">${params.order.receiptUrl}</a><br/>`
            : ""
        }
        ${isUk ? `Зберігається ${retentionDays} днів (до ${expiresFormatted}).` : `Хранится ${retentionDays} дней (до ${expiresFormatted}).`}
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, html, text });
}
