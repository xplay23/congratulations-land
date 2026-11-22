"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Edit3,
  FileText,
  Gift,
  Image as ImageIcon,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import type { Lang, OrderStatus, ProductType } from "@/lib/types";

interface SafeStoryPage {
  pageNumber: number;
  heading: string;
  text: string;
  textZone?: "left" | "right";
  imageRevision: number;
  previewImageUrl: string | null;
}

interface OrderView {
  id: string;
  productType: ProductType;
  lang: Lang;
  status: OrderStatus;
  progressStep: string;
  progressLabel: string;
  progressPercent: number;
  errorMessage?: string | null;
  payload: Record<string, unknown>;
  result: {
    generationStage?: "preview_partial" | "finalizing" | "complete";
    title?: string;
    subtitle?: string;
    dedication?: string;
    modeUsed?: string;
    writerNotes?: string[];
    coverPreviewUrl?: string;
    previewPdfUrl?: string;
    pages?: SafeStoryPage[];
    scriptLines?: Record<string, string>;
    previewVideoUrl?: string;
    parentAdviceTitle?: string;
    parentAdviceText?: string;
  } | null;
  aiEditsUsed: number;
  aiEditsLimit: number;
  priceKopiykas: number;
  monoStatus?: string | null;
  receiptUrl?: string | null;
  customerEmail?: string | null;
  expiresAt?: string;
  isExpired?: boolean;
  isSandboxPayment: boolean;
  telegramBotEnabled: boolean;
  downloadUrl: string | null;
}

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const orderId = params.id;
  const accessToken = searchParams.get("token") || "";
  const { lang, l } = useLanguage();
  const isUk = lang === "uk";

  const [order, setOrder] = useState<OrderView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [draftHeading, setDraftHeading] = useState("");
  const [draftText, setDraftText] = useState("");
  const [aiTextPrompt, setAiTextPrompt] = useState("");
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sandboxInvoiceId, setSandboxInvoiceId] = useState<string | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState<string>("");
  const [telegramInfo, setTelegramInfo] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const qs = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
      const res = await fetch(`/api/orders/${orderId}${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order not found");
      setOrder(data);
      if (data.customerEmail && !checkoutEmail) {
        setCheckoutEmail(data.customerEmail);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed loading order");
    }
  }, [orderId, accessToken, checkoutEmail]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!order || order.status !== "generating") return;
    const timer = setInterval(() => {
      void fetchOrder();
    }, 2000);
    return () => clearInterval(timer);
  }, [order, fetchOrder]);

  const startEditPage = (p: SafeStoryPage) => {
    setEditingPage(p.pageNumber);
    setDraftHeading(p.heading);
    setDraftText(p.text);
    setAiTextPrompt("");
    setAiImagePrompt("");
    setActionError(null);
  };

  const runEditAction = async (
    action: "manual_text" | "ai_rewrite_text" | "ai_regenerate_image",
    pageNumber: number
  ) => {
    setBusyAction(`${action}_${pageNumber}`);
    setActionError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          pageNumber,
          heading: draftHeading,
          text: draftText,
          instruction: action === "ai_rewrite_text" ? aiTextPrompt : aiImagePrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Edit failed");
      await fetchOrder();
      setEditingPage(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Edit error");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCheckout = async () => {
    setActionError(null);
    const trimmedEmail = checkoutEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setActionError(
        isUk
          ? "Введіть коректний Email перед оплатою — туди надійде посилання на 30 днів та чек."
          : "Введите корректный Email перед оплатой — туда придёт ссылка на 30 дней и чек."
      );
      return;
    }

    setBusyAction("checkout");
    try {
      const res = await fetch(`/api/orders/${orderId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout error");

      if (data.alreadyPaid) {
        await fetchOrder();
        return;
      }

      if (data.sandbox) {
        setSandboxInvoiceId(data.invoiceId);
      } else if (data.pageUrl) {
        window.location.href = data.pageUrl;
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Payment error");
    } finally {
      setBusyAction(null);
    }
  };

  const handleSandboxConfirm = async () => {
    setBusyAction("sandbox_pay");
    setActionError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/sandbox-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: checkoutEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sandbox pay failed");
      setSandboxInvoiceId(null);
      await fetchOrder();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Sandbox pay failed");
    } finally {
      setBusyAction(null);
    }
  };

  const handleResumeFinalization = async () => {
    setBusyAction("resume_final");
    setActionError(null);
    try {
      const qs = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
      const res = await fetch(`/api/orders/${orderId}/resume${qs}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resume failed");
      await fetchOrder();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Resume failed");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCancelHeldPayment = async () => {
    setBusyAction("cancel_payment");
    setActionError(null);
    try {
      const qs = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
      const res = await fetch(`/api/orders/${orderId}/cancel-payment${qs}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancel failed");
      await fetchOrder();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusyAction(null);
    }
  };

  const handleSendToTelegram = async () => {
    setBusyAction("telegram");
    setTelegramInfo(null);
    setActionError(null);
    try {
      const qs = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
      const res = await fetch(`/api/orders/${orderId}/telegram-link${qs}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Telegram error");

      if (data.configured && data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
        setTelegramInfo(
          isUk
            ? "Відкрито Telegram-бот. Натисніть Start у боті — ми автоматично надішлемо файл у ваш чат."
            : "Открыт Telegram-бот. Нажмите Start в боте — мы автоматически отправим файл в ваш чат."
        );
        // Local dev fallback: sequential polling so slow file uploads don't pile up
        let cancelled = false;
        const pollSequential = async (attempt: number) => {
          if (cancelled || attempt > 15) return;
          try {
            const syncRes = await fetch("/api/telegram/sync", { method: "POST" });
            const syncData = (await syncRes.json()) as {
              mode?: string;
              deliveredOrderIds?: string[];
            };
            if (syncData.mode === "webhook") {
              cancelled = true;
              return;
            }
            if (syncData.deliveredOrderIds?.includes(orderId)) {
              cancelled = true;
              setTelegramInfo(
                isUk
                  ? "Готово! Подарунок уже надіслано у ваш чат Telegram."
                  : "Готово! Подарок уже отправлен в ваш чат Telegram."
              );
              return;
            }
          } catch {
            // Ignore transient poll errors
          }
          if (!cancelled && attempt < 15) {
            setTimeout(() => void pollSequential(attempt + 1), 2000);
          }
        };
        setTimeout(() => void pollSequential(1), 1500);
      } else {
        setTelegramInfo(
          isUk
            ? "Telegram-бот ще не підключений у .env.local (додайте TELEGRAM_BOT_TOKEN та TELEGRAM_BOT_USERNAME). Посилання вже згенероване, а при перевищенні 50 МБ бот автоматично надішле кнопку прямого завантаження."
            : "Telegram-бот ещё не подключён в .env.local (добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_BOT_USERNAME). При размере файла > 50 МБ бот автоматически пришлёт прямую кнопку скачивания."
        );
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Telegram error");
    } finally {
      setBusyAction(null);
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-200">
        {loadError}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-300" />
        {isUk ? "Завантаження замовлення..." : "Загрузка заказа..."}
      </div>
    );
  }

  const priceUah = Math.round(order.priceKopiykas / 100);
  const aiEditsRemaining = Math.max(0, order.aiEditsLimit - order.aiEditsUsed);
  const expiresLabel = order.expiresAt
    ? new Date(order.expiresAt).toLocaleDateString(isUk ? "uk-UA" : "ru-RU")
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Header status bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121a30]/95 p-5 shadow-xl">
        <div>
          <div className="text-xs font-mono text-slate-400">#{order.id}</div>
          <h1 className="font-serif-book text-2xl font-bold text-white">
            {order.result?.title ||
              (order.productType === "storybook"
                ? isUk
                  ? "Персональна казка PDF"
                  : "Персональная сказка PDF"
                : isUk
                ? "Персональне відеопривітання"
                : "Персональное видеопоздравление")}
          </h1>
          {expiresLabel && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/5 px-2.5 py-0.5 text-[11px] text-amber-200">
                <Clock className="h-3 w-3" />
                {isUk ? `Зберігається до ${expiresLabel}` : `Хранится до ${expiresLabel}`}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {order.status === "preview_ready" && order.productType === "storybook" && (
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                editMode
                  ? "border-amber-400 bg-amber-400/20 text-amber-100"
                  : "border-white/20 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              <Edit3 className="h-4 w-4 text-amber-300" />
              {isUk
                ? "Редагувати текст або ілюстрації"
                : "Редактировать текст или иллюстрации"}
            </button>
          )}

          {order.status === "paid" && order.downloadUrl && (
            <>
              {order.telegramBotEnabled && (
                <button
                  type="button"
                  disabled={busyAction === "telegram"}
                  onClick={() => void handleSendToTelegram()}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/15 px-4 py-3 text-xs font-bold text-sky-200 hover:bg-sky-400/25"
                >
                  <Send className="h-4 w-4" />
                  {isUk ? "Надіслати в Telegram" : "Отправить в Telegram"}
                </button>
              )}

              <a
                href={order.downloadUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#071510] shadow-lg shadow-emerald-500/25 hover:bg-emerald-300"
              >
                <Download className="h-4 w-4" />
                {order.productType === "storybook"
                  ? isUk
                    ? "Завантажити чистий PDF"
                    : "Скачать чистый PDF"
                  : isUk
                  ? "Завантажити чистий HD MP4"
                  : "Скачать чистый HD MP4"}
              </a>
            </>
          )}
        </div>
      </div>

      {/* Email + Checkout bar when preview is ready */}
      {order.status === "preview_ready" && (
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-amber-300/30 bg-gradient-to-r from-[#162040] to-[#121a30] p-5 shadow-lg">
          <div className="flex-1 min-w-[240px] space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
              <Mail className="h-4 w-4" />
              {isUk
                ? "Email для отримання подарунка, чеку та повернення протягом 30 днів *"
                : "Email для получения подарка, чека и возврата в течение 30 дней *"}
            </label>
            <input
              type="email"
              value={checkoutEmail}
              onChange={(e) => setCheckoutEmail(e.target.value)}
              placeholder="name@example.com"
              className="h-11 w-full rounded-xl border border-white/20 bg-white/5 px-3.5 text-sm text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              disabled={busyAction === "checkout"}
              onClick={() => void handleCheckout()}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 hover:brightness-105 disabled:opacity-50"
            >
              {busyAction === "checkout" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {isUk
                ? `Оплатити ${priceUah} ₴ (Plata by mono)`
                : `Оплатить ${priceUah} ₴ (Plata by mono)`}
            </button>
            {order.productType === "storybook" &&
              order.result?.generationStage === "preview_partial" && (
                <span className="text-[11px] text-amber-200/80">
                  {isUk
                    ? "Холд: остаточне списання лише після готовності всіх сторінок"
                    : "Холд: окончательное списание только после готовности всех страниц"}
                </span>
              )}
          </div>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {actionError}
        </div>
      )}

      {telegramInfo && (
        <div className="rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
          {telegramInfo}
        </div>
      )}

      {/* Sandbox payment confirmation modal box */}
      {sandboxInvoiceId && (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-200 font-bold">
            <Sparkles className="h-5 w-5" />
            Plata by mono — Sandbox Checkout ({sandboxInvoiceId})
          </div>
          <p className="text-sm text-slate-200">
            {isUk
              ? `Тестовий режим оплати. Натисніть кнопку нижче, щоб зімітувати успішний платіж ${priceUah} ₴, фіскальний чек Checkbox, надіслати посилання на ${checkoutEmail} та розблокувати чистий файл.`
              : `Тестовый режим оплаты. Нажмите кнопку ниже, чтобы сымитировать успешный платёж ${priceUah} ₴, фискальный чек Checkbox, отправить ссылку на ${checkoutEmail} и разблокировать чистый файл.`}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busyAction === "sandbox_pay"}
              onClick={() => void handleSandboxConfirm()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#071510] hover:bg-emerald-300"
            >
              {busyAction === "sandbox_pay" && <Loader2 className="h-4 w-4 animate-spin" />}
              {isUk ? "Підтвердити тестову оплату" : "Подтвердить тестовую оплату"}
            </button>
            <button
              type="button"
              onClick={() => setSandboxInvoiceId(null)}
              className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-slate-300"
            >
              {isUk ? "Скасувати" : "Отмена"}
            </button>
          </div>
        </div>
      )}

      {/* Generating progress */}
      {order.status === "generating" && (
        <div className="rounded-2xl border border-amber-200/20 bg-[#121a30] p-8 text-center space-y-4">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-300" />
          <div className="text-lg font-semibold text-amber-100">{order.progressLabel}</div>
          <div className="mx-auto h-3 max-w-md overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.max(8, order.progressPercent)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400">{order.progressPercent}%</div>
        </div>
      )}

      {/* Failed state */}
      {order.status === "failed" && order.monoStatus === "reversed" ? (
        <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-6 space-y-4 text-emerald-100">
          <div className="space-y-1.5">
            <div className="text-base font-bold text-emerald-200">
              {isUk
                ? "Замовлення скасовано, кошти розблоковано"
                : "Заказ отменён, средства разблокированы"}
            </div>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              {isUk
                ? "Холд/оплату за цим замовленням скасовано — кошти повернуться на вашу картку автоматично. Ви можете створити нову казку будь-коли."
                : "Холд/оплата по этому заказу отменены — средства автоматически вернутся на вашу карту. Вы можете создать новую сказку в любой момент."}
            </p>
          </div>
          <Link
            href={l(order.productType === "storybook" ? "/create/storybook" : "/create/video")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-2.5 text-sm font-bold text-[#0b1020]"
          >
            <RefreshCw className="h-4 w-4" />
            {isUk ? "Створити нове замовлення" : "Создать новый заказ"}
          </Link>
        </div>
      ) : order.status === "failed" &&
        (order.monoStatus === "hold" || order.monoStatus === "success") ? (
        <div className="rounded-2xl border border-amber-400/45 bg-amber-500/10 p-6 space-y-4 text-amber-100">
          <div className="space-y-1.5">
            <div className="text-base font-bold text-amber-200">
              {isUk
                ? "Ваші кошти у безпеці — догенерацію можна завершити в один клік"
                : "Ваши средства в безопасности — догенерацию можно завершить в один клик"}
            </div>
            <p className="text-sm text-amber-100/90 leading-relaxed">
              {order.monoStatus === "hold"
                ? isUk
                  ? "Під час домальовування решти сторінок сервіс ШІ тимчасово не відповів. Кошти НЕ списані (лише зарезервовані на картці), а вже готові сторінки збережено."
                  : "Во время дорисовывания оставшихся страниц ИИ-сервис временно не ответил. Средства НЕ списаны (лишь зарезервированы на карте), а уже готовые страницы сохранены."
                : isUk
                ? "Ми бачимо вашу оплату, але частина сторінок ще не завершилася через тимчасовий збій ШІ. Вже готові сторінки збережено — можна продовжити з місця зупинки або оформити повернення."
                : "Мы видим вашу оплату, но часть страниц не завершилась из-за временного сбоя ИИ. Уже готовые страницы сохранены — можно продолжить с места остановки или вернуть средства."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() => void handleResumeFinalization()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-2.5 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 hover:brightness-105 disabled:opacity-50"
            >
              {busyAction === "resume_final" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isUk ? "Догенерувати решту сторінок" : "Догенерировать оставшиеся страницы"}
            </button>

            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() => void handleCancelHeldPayment()}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300/40 bg-rose-500/15 px-4 py-2.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/25 disabled:opacity-50"
            >
              {busyAction === "cancel_payment" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isUk
                ? "Скасувати і розблокувати кошти"
                : "Отменить и разблокировать средства"}
            </button>
          </div>

          {order.errorMessage && (
            <details className="text-xs text-amber-200/70">
              <summary className="cursor-pointer select-none hover:text-amber-100">
                {isUk ? "Технічні деталі" : "Технические детали"}
              </summary>
              <p className="mt-1 font-mono">{order.errorMessage}</p>
            </details>
          )}
        </div>
      ) : order.status === "failed" && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-6 space-y-4 text-rose-100">
          <div className="space-y-1.5">
            <div className="text-base font-bold text-rose-200">
              {isUk
                ? "Перепрошуємо, сталася тимчасова технічна помилка"
                : "Извините, произошла временная техническая ошибка"}
            </div>
            <p className="text-sm text-rose-100/90 leading-relaxed">
              {order.productType === "storybook"
                ? isUk
                  ? "Під час створення казки сервіс ШІ тимчасово не відповів. Будь ласка, спробуйте створити казку ще раз — зазвичай повторна спроба проходить успішно."
                  : "Во время создания сказки ИИ-сервис временно не ответил. Пожалуйста, попробуйте создать сказку ещё раз — обычно повторная попытка проходит успешно."
                : isUk
                ? "Під час створення відеопривітання сталася тимчасова помилка. Будь ласка, спробуйте оформити замовлення ще раз."
                : "Во время создания видеопоздравления произошла временная ошибка. Пожалуйста, попробуйте оформить заказ ещё раз."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={l(order.productType === "storybook" ? "/create/storybook" : "/create/video")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-2.5 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 hover:brightness-105"
            >
              <RefreshCw className="h-4 w-4" />
              {order.productType === "storybook"
                ? isUk
                  ? "Спробувати створити казку ще раз"
                  : "Попробовать создать сказку ещё раз"
                : isUk
                ? "Спробувати ще раз"
                : "Попробовать ещё раз"}
            </Link>
            <Link
              href={l("/")}
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              {isUk ? "На головну" : "На главную"}
            </Link>
          </div>

          {order.errorMessage && (
            <details className="text-xs text-rose-200/70">
              <summary className="cursor-pointer select-none hover:text-rose-100">
                {isUk ? "Технічні деталі" : "Технические детали"}
              </summary>
              <p className="mt-1 font-mono">{order.errorMessage}</p>
            </details>
          )}
        </div>
      )}

      {/* Paid banner */}
      {order.status === "paid" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <div>
              <div className="font-bold text-emerald-200">
                {isUk ? "Оплату підтверджено!" : "Оплата подтверждена!"}
              </div>
              <div className="text-xs text-slate-300">
                {order.customerEmail
                  ? isUk
                    ? `Копію посилання надіслано на ${order.customerEmail}. Файл зберігається 30 днів.`
                    : `Копия ссылки отправлена на ${order.customerEmail}. Файл хранится 30 дней.`
                  : isUk
                  ? "Чистий файл без водяних знаків готовий до завантаження."
                  : "Чистый файл без водяных знаков готов к скачиванию."}
              </div>
            </div>
          </div>
          {order.receiptUrl && (
            <span className="text-xs text-emerald-300">
              {isUk ? "Чек ПРРО:" : "Чек ПРРО:"} {order.receiptUrl}
            </span>
          )}
        </div>
      )}

      {/* STORYBOOK PREVIEW & EDITOR */}
      {(order.status === "preview_ready" || order.status === "paid") &&
        order.productType === "storybook" &&
        order.result && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-300" />
                <span>
                  {order.status === "paid"
                    ? isUk
                      ? "Замовлення оплачено — ви можете завантажити чистий PDF вище."
                      : "Заказ оплачен — вы можете скачать чистый PDF выше."
                    : order.result.generationStage === "preview_partial"
                    ? isUk
                      ? `Прев'ю: обкладинка, перші 2 сторінки з ілюстраціями та весь текст. Інші ілюстрації домалюються після оплати. ІІ-правок: ${aiEditsRemaining}/${order.aiEditsLimit}.`
                      : `Превью: обложка, первые 2 страницы с иллюстрациями и весь текст. Остальные иллюстрации дорисовываются после оплаты. ИИ-правок: ${aiEditsRemaining}/${order.aiEditsLimit}.`
                    : isUk
                    ? `Це прев'ю зі зниженою якістю та водяним знаком. Залишилось ІІ-правок: ${aiEditsRemaining} із ${order.aiEditsLimit}.`
                    : `Это превью со сниженным качеством и водяным знаком. Осталось ИИ-правок: ${aiEditsRemaining} из ${order.aiEditsLimit}.`}
                </span>
              </div>

              {order.result.previewPdfUrl && (
                <a
                  href={order.result.previewPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 font-semibold text-amber-200 hover:bg-amber-400/20"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {isUk ? "Відкрити прев'ю PDF" : "Открыть превью PDF"}
                </a>
              )}
            </div>

            {order.result.coverPreviewUrl && (
              <div className="grid gap-6 rounded-2xl border border-white/10 bg-[#121a30]/90 p-5 sm:grid-cols-[240px_1fr] items-center">
                <img
                  src={order.result.coverPreviewUrl}
                  alt="Cover preview"
                  className="w-full rounded-xl border border-amber-200/20 object-cover shadow-lg"
                />
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                    {isUk ? "Обкладинка" : "Обложка"}
                  </span>
                  <h2 className="font-serif-book text-2xl font-bold text-white">
                    {order.result.title}
                  </h2>
                  <p className="text-sm text-slate-300">{order.result.subtitle}</p>
                  {order.result.dedication && (
                    <p className="pt-2 text-xs italic text-amber-200/90">
                      «{order.result.dedication}»
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-5">
              {order.result.pages?.map((p) => {
                const isEditingThis = editingPage === p.pageNumber;
                return (
                  <div
                    key={p.pageNumber}
                    className="rounded-2xl border border-white/10 bg-[#121a30]/90 p-5 shadow-lg space-y-4"
                  >
                    <div className="grid gap-5 md:grid-cols-2 items-center">
                      {p.previewImageUrl ? (
                        <img
                          src={`${p.previewImageUrl}&r=${p.imageRevision}`}
                          alt={`Page ${p.pageNumber}`}
                          className="w-full rounded-xl border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300/30 bg-white/[0.02] p-6 text-center">
                          <Lock className="h-6 w-6 text-amber-300/80" />
                          <div className="text-sm font-semibold text-amber-100">
                            {isUk
                              ? `Ілюстрація сторінки ${p.pageNumber}`
                              : `Иллюстрация страницы ${p.pageNumber}`}
                          </div>
                          <p className="max-w-xs text-xs text-slate-400">
                            {isUk
                              ? "Відкриється та домалюється одразу після оплати (зараз ви можете прочитати і підправити текст)."
                              : "Откроется и дорисуется сразу после оплаты (сейчас вы можете прочитать и подправить текст)."}
                          </p>
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-amber-300">
                            {isUk ? `Сторінка ${p.pageNumber}` : `Страница ${p.pageNumber}`}
                          </span>
                          {editMode && order.status === "preview_ready" && (
                            <button
                              type="button"
                              onClick={() =>
                                isEditingThis ? setEditingPage(null) : startEditPage(p)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300/35 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              {isEditingThis
                                ? isUk
                                  ? "Закрити"
                                  : "Закрыть"
                                : isUk
                                ? "Змінити"
                                : "Изменить"}
                            </button>
                          )}
                        </div>
                        <h3 className="font-serif-book text-xl font-bold text-amber-50">
                          {p.heading}
                        </h3>
                        <p className="font-serif-book text-sm leading-relaxed text-slate-200">
                          {p.text}
                        </p>
                      </div>
                    </div>

                    {isEditingThis && order.status === "preview_ready" && (
                      <div className="border-t border-white/10 pt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                            <div className="text-xs font-bold text-white">
                              {isUk
                                ? "Ручне редагування тексту (безкоштовно)"
                                : "Ручное редактирование текста (бесплатно)"}
                            </div>
                            <input
                              value={draftHeading}
                              onChange={(e) => setDraftHeading(e.target.value)}
                              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white"
                            />
                            <textarea
                              rows={4}
                              value={draftText}
                              onChange={(e) => setDraftText(e.target.value)}
                              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white"
                            />
                            <button
                              type="button"
                              disabled={busyAction !== null}
                              onClick={() => void runEditAction("manual_text", p.pageNumber)}
                              className="rounded-lg bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                            >
                              {busyAction === `manual_text_${p.pageNumber}`
                                ? "..."
                                : isUk
                                ? "Зберегти текст"
                                : "Сохранить текст"}
                            </button>
                          </div>

                          <div className="space-y-3 rounded-xl border border-amber-300/20 bg-amber-400/5 p-3.5">
                            <div className="text-xs font-bold text-amber-200">
                              {isUk
                                ? `ІІ-правки (залишилось ${aiEditsRemaining}/${order.aiEditsLimit})`
                                : `ИИ-правки (осталось ${aiEditsRemaining}/${order.aiEditsLimit})`}
                            </div>

                            <div className="space-y-1.5">
                              <input
                                value={aiTextPrompt}
                                onChange={(e) => setAiTextPrompt(e.target.value)}
                                placeholder={
                                  isUk
                                    ? "Що змінити в тексті? (напр. зроби смішніше)"
                                    : "Что изменить в тексте? (напр. сделай смешнее)"
                                }
                                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white"
                              />
                              <button
                                type="button"
                                disabled={aiEditsRemaining <= 0 || busyAction !== null}
                                onClick={() =>
                                  void runEditAction("ai_rewrite_text", p.pageNumber)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-400/30 disabled:opacity-40"
                              >
                                <Wand2 className="h-3.5 w-3.5" />
                                {busyAction === `ai_rewrite_text_${p.pageNumber}`
                                  ? "..."
                                  : isUk
                                  ? "Переписати через ІІ"
                                  : "Переписать через ИИ"}
                              </button>
                            </div>

                            {p.previewImageUrl ? (
                              <div className="space-y-1.5 pt-2 border-t border-white/10">
                                <input
                                  value={aiImagePrompt}
                                  onChange={(e) => setAiImagePrompt(e.target.value)}
                                  placeholder={
                                    isUk
                                      ? "Що виправити на малюнку? (напр. прибери шапку)"
                                      : "Что поправить на рисунке? (напр. убери шапку)"
                                  }
                                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white"
                                />
                                <button
                                  type="button"
                                  disabled={aiEditsRemaining <= 0 || busyAction !== null}
                                  onClick={() =>
                                    void runEditAction("ai_regenerate_image", p.pageNumber)
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-400/30 disabled:opacity-40"
                                >
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  {busyAction === `ai_regenerate_image_${p.pageNumber}` ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : isUk ? (
                                    "Перегенерувати ілюстрацію"
                                  ) : (
                                    "Перегенерировать иллюстрацию"
                                  )}
                                </button>
                              </div>
                            ) : (
                              <p className="pt-2 border-t border-white/10 text-[11px] text-slate-400">
                                {isUk
                                  ? "Малюнок цієї сторінки згенерується після оплати; зараз можна правити текст."
                                  : "Рисунок этой страницы сгенерируется после оплаты; сейчас можно править текст."}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Standalone gift advice block — between payment/paid block and video block */}
      {(order.status === "preview_ready" || order.status === "paid") &&
        order.productType === "video" && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-xs text-amber-100 shadow-lg">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <span>
              <strong className="font-semibold text-amber-200">
                {order.result?.parentAdviceTitle ||
                  (isUk ? "Порада перед показом дитині:" : "Совет перед показом ребёнку:")}
              </strong>{" "}
              {order.result?.parentAdviceText ||
                (isUk
                  ? "у відео Миколай показує подарунок у коробці. Рекомендуємо заздалегідь підготувати сюрприз і вручити його дитині одразу після перегляду зі словами, що цей подарунок передав Святий Миколай."
                  : "в видео Николай показывает подарок в коробке. Рекомендуем заранее подготовить сюрприз и вручить его ребёнку сразу после просмотра видео со словами, что этот подарок передал Святой Николай.")}
            </span>
          </div>
        )}

      {/* VIDEO PREVIEW */}
      {(order.status === "preview_ready" || order.status === "paid") &&
        order.productType === "video" &&
        order.result &&
        (() => {
          const isPaidVideo = order.status === "paid" && Boolean(order.downloadUrl);
          const videoSrc = isPaidVideo
            ? `${order.downloadUrl}&inline=1`
            : order.result.previewVideoUrl;

          const rawLines = order.result.scriptLines || {};
          const displayLines = (() => {
            // Backward compatibility for orders that stored all 9 lines from Nicholas template
            if (
              rawLines.line_01 &&
              (rawLines.line_03 || rawLines.line_04b || rawLines.line_07_1)
            ) {
              return [rawLines.line_03, rawLines.line_04b, rawLines.line_07_1].filter(
                (v): v is string => typeof v === "string" && v.trim().length > 0
              );
            }
            return Object.values(rawLines).filter(
              (v): v is string => typeof v === "string" && v.trim().length > 0
            );
          })();

          return (
            <div className="space-y-5 rounded-2xl border border-white/10 bg-[#121a30]/95 p-6 shadow-xl">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                {isPaidVideo ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-amber-300" />
                )}
                {isPaidVideo
                  ? isUk
                    ? "Повна HD 720p версія без водяних знаків. Ви можете переглянути її тут або завантажити кнопкою вище."
                    : "Полная HD 720p версия без водяных знаков. Вы можете посмотреть её здесь или скачать кнопкой выше."
                  : isUk
                  ? "Це 360p-прев'ю з водяним знаком. Після оплати ви отримаєте чистий 720p MP4."
                  : "Это 360p-превью с водяным знаком. После оплаты вы получите чистый 720p MP4."}
              </div>

              {videoSrc && (
                <video
                  key={videoSrc}
                  controls
                  playsInline
                  preload="metadata"
                  src={videoSrc}
                  className="w-full rounded-xl border border-amber-200/20 bg-black"
                />
              )}

              {displayLines.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-300 space-y-1.5">
                  <div className="font-bold text-amber-200">
                    {isUk ? "Персоналізовані репліки:" : "Персонализированные реплики:"}
                  </div>
                  {displayLines.map((line, i) => (
                    <p key={i}>• {line}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}
