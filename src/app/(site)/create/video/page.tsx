"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bike,
  BookOpen,
  Bot,
  Check,
  Gift,
  Heart,
  Home,
  Loader2,
  Minus,
  Palette,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  Video,
  X,
  ZoomIn,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { usePricing } from "@/components/PricingContext";
import { DynamicVideoForm } from "@/components/DynamicVideoForm";
import type { PublicVideoTemplateConfig } from "@/lib/video/form-config";
import {
  GenderAvatar,
  ImageLightbox,
  LanguageGlyph,
  SectionHeading,
  type LightboxItem,
} from "@/components/VisualOptionCards";
import {
  formatAgeWithUnit,
  VIDEO_PRAISE_OPTIONS,
  type VideoPraiseOption,
} from "@/lib/i18n";
import type { ChildGender, Lang } from "@/lib/types";

function renderPraiseIcon(icon: VideoPraiseOption["icon"]) {
  const cls = "h-5 w-5 text-amber-300 shrink-0";
  switch (icon) {
    case "bike":
      return <Bike className={cls} />;
    case "book":
      return <BookOpen className={cls} />;
    case "home":
      return <Home className={cls} />;
    case "palette":
      return <Palette className={cls} />;
    case "heart":
    default:
      return <Heart className={cls} />;
  }
}

interface VideoVariationOption {
  variationSlug: string;
  title: string;
  shortBadge: string;
  description: string;
  posterUrl: string;
  demoVideoUrl: string;
  isDefault: boolean;
  priceOverrideUah: number | null;
  template?: PublicVideoTemplateConfig | null;
}

export default function CreateVideoPage() {
  const router = useRouter();
  const { lang, setLang, l, setAssistantContext, setAssistantOpen } = useLanguage();
  const { pricing, getVideoPrice } = usePricing();
  const isUk = lang === "uk";
  const baseVideoPrice = getVideoPrice();
  const videoEnabled = pricing.services.video?.enabled ?? true;

  const [variations, setVariations] = useState<VideoVariationOption[]>([]);
  const [selectedVariationSlug, setSelectedVariationSlug] = useState<string>("");
  const [serviceTitle, setServiceTitle] = useState<string | null>(null);
  const [serviceBasePriceUah, setServiceBasePriceUah] = useState<number | null>(null);

  useEffect(() => {
    setAssistantContext("video");
  }, [setAssistantContext]);

  useEffect(() => {
    let active = true;
    const urlVariation =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("variation") || ""
        : "";
    const urlService =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("service") || ""
        : "";
    const qs = new URLSearchParams({ lang });
    if (urlService) qs.set("service", urlService);
    fetch(`/api/config/video-variations?${qs.toString()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { variations: [] }))
      .then(
        (data: {
          serviceTitle?: string | null;
          serviceBasePriceUah?: number | null;
          variations?: VideoVariationOption[];
        }) => {
          if (!active) return;
          setServiceTitle(data.serviceTitle || null);
          setServiceBasePriceUah(
            typeof data.serviceBasePriceUah === "number" &&
              data.serviceBasePriceUah > 0
              ? data.serviceBasePriceUah
              : null
          );
          const list = Array.isArray(data.variations) ? data.variations : [];
          setVariations(list);
        if (list.length > 0) {
          const matched =
            (urlVariation &&
              list.find((v) => v.variationSlug === urlVariation)) ||
            list.find((v) => v.isDefault) ||
            list[0];
          setSelectedVariationSlug((prev) =>
            prev && list.some((v) => v.variationSlug === prev)
              ? prev
              : matched.variationSlug
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [lang]);

  const selectedVariation = variations.find(
    (v) => v.variationSlug === selectedVariationSlug
  );
  const effectiveBasePrice = serviceBasePriceUah ?? baseVideoPrice;
  const videoPrice =
    selectedVariation?.priceOverrideUah && selectedVariation.priceOverrideUah > 0
      ? selectedVariation.priceOverrideUah
      : effectiveBasePrice;

  // Gender is unselected by default and required before submitting
  const [videoLang, setVideoLang] = useState<Lang>(lang);
  const [gender, setGender] = useState<ChildGender | null>(null);
  const [childName, setChildName] = useState("");
  const [childNameVocative, setChildNameVocative] = useState("");

  // Numeric age stepper + optional omit toggle
  const [ageNum, setAgeNum] = useState<number>(6);
  const [omitAge, setOmitAge] = useState<boolean>(false);

  // Praise: "custom" selected by default; text fills automatically once gender is chosen
  const [praiseChoice, setPraiseChoice] = useState<string>("custom");
  const [achievement, setAchievement] = useState<string>("");
  const [userTouchedText, setUserTouchedText] = useState<boolean>(false);

  const [photoUploadId, setPhotoUploadId] = useState<string>("");
  const [photoName, setPhotoName] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [parentalConsent, setParentalConsent] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<
    "gender" | "childName" | "achievement" | "photo" | "consent" | null
  >(null);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  const achLen = achievement.trim().length;
  const achOptimal = achLen >= 25 && achLen <= 75;
  const achValid = achLen >= 10 && achLen <= 90;

  const formattedAge = omitAge ? "" : formatAgeWithUnit(ageNum, videoLang);

  const spokenLinePreview = (() => {
    const ach = achievement.trim() || "…";
    if (videoLang === "uk") {
      if (omitAge) return `«Цього року ти ${ach}…»`;
      return ageNum === 1
        ? `«У свій ${formattedAge} ти ${ach}…»`
        : `«У свої ${formattedAge} ти ${ach}…»`;
    }
    if (omitAge) return `«В этом году ты ${ach}…»`;
    return ageNum === 1
      ? `«В свой ${formattedAge} ты ${ach}…»`
      : `«В свои ${formattedAge} ты ${ach}…»`;
  })();

  const handleLangSwitch = (next: Lang) => {
    setVideoLang(next);
    setLang(next, { replaceUrlOnly: true });
    if (!gender) return;
    if (praiseChoice !== "custom") {
      const found = VIDEO_PRAISE_OPTIONS.find((o) => o.id === praiseChoice);
      if (found) setAchievement(found.phrase[next][gender]);
    } else if (!userTouchedText) {
      setAchievement(VIDEO_PRAISE_OPTIONS[0].phrase[next][gender]);
    }
  };

  const handleGenderSwitch = (next: ChildGender) => {
    setGender(next);
    if (errorField === "gender") {
      setErrorField(null);
      setError(null);
    }
    if (praiseChoice !== "custom") {
      const found = VIDEO_PRAISE_OPTIONS.find((o) => o.id === praiseChoice);
      if (found) setAchievement(found.phrase[videoLang][next]);
    } else if (!userTouchedText) {
      setAchievement(VIDEO_PRAISE_OPTIONS[0].phrase[videoLang][next]);
    }
  };

  const selectPraiseCard = (optId: string) => {
    setPraiseChoice(optId);
    if (optId !== "custom") {
      const found = VIDEO_PRAISE_OPTIONS.find((o) => o.id === optId);
      if (found) {
        setAchievement(found.phrase[videoLang][gender || "boy"]);
        setUserTouchedText(false);
      }
    }
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const localUrl = URL.createObjectURL(file);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "child");
      if (photoUploadId) fd.append("replaceUploadId", photoUploadId);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPhotoUploadId(data.uploadId);
      setPhotoName(file.name);
      setPhotoPreviewUrl(localUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorField(null);
    if (!gender) {
      setErrorField("gender");
      setError(
        isUk
          ? "Оберіть стать дитини (хлопчик або дівчинка)."
          : "Выберите пол ребёнка (мальчик или девочка)."
      );
      return;
    }
    if (childName.trim().length < 2 || childName.trim().length > 15) {
      setErrorField("childName");
      setError(
        isUk
          ? "Ім'я має бути від 2 до 15 символів для точного збігу з губами."
          : "Имя должно быть от 2 до 15 символов для точного совпадения с губами."
      );
      return;
    }
    if (!achValid) {
      setErrorField("achievement");
      setError(
        isUk
          ? "Досягнення має містити від 10 до 90 символів (оптимально 25–75)."
          : "Достижение должно содержать от 10 до 90 символов (оптимально 25–75)."
      );
      return;
    }
    if (!photoUploadId) {
      setErrorField("photo");
      setError(
        isUk
          ? "Завантажте фото дитини для Книги добрих справ."
          : "Загрузите фото ребёнка для Книги добрых дел."
      );
      return;
    }
    if (!parentalConsent) {
      setErrorField("consent");
      setError(
        isUk
          ? "Підтвердіть згоду батьків на тимчасову обробку фото."
          : "Подтвердите согласие родителей на временную обработку фото."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: videoLang,
          character: "st_nicholas",
          variationSlug: selectedVariationSlug || undefined,
          childName: childName.trim(),
          childNameVocative: childNameVocative.trim() || undefined,
          gender,
          age: formattedAge,
          achievement: achievement.trim(),
          photoUploadId,
          parentalConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed creating video order");
      router.push(l(`/orders/${data.orderId}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setSubmitting(false);
    }
  };

  const displayBookName =
    childName.trim() || (isUk ? "Ім'я" : "Имя");

  if (!videoEnabled) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <div className="rounded-2xl border border-amber-300/25 bg-[#121a30]/95 p-8 text-center space-y-4 shadow-xl">
          <h1 className="font-serif-book text-2xl font-bold text-white">
            {isUk ? "Послуга тимчасово вимкнена" : "Услуга временно отключена"}
          </h1>
          <p className="text-sm text-slate-300">
            {isUk
              ? "Замовлення нових відеопривітань зараз призупинено адміністратором. Завітайте трохи згодом."
              : "Заказ новых видеопоздравлений сейчас приостановлен администратором. Загляните чуть позже."}
          </p>
          <button
            type="button"
            onClick={() => router.push(l("/"))}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-[#0b1020] hover:bg-amber-300"
          >
            {isUk ? "На головну" : "На главную"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-14">
      <ImageLightbox item={lightbox} onClose={() => setLightbox(null)} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-300">
            <Video className="h-3.5 w-3.5" />
            {isUk ? "Персональне відео • HD 720p" : "Персональное видео • HD 720p"}
          </span>
          <h1 className="font-serif-book text-2xl font-bold text-white sm:text-3xl">
            {serviceTitle ||
              (isUk ? "Персональне відеопривітання" : "Персональное видеопоздравление")}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-400/20"
        >
          <Bot className="h-4 w-4" />
          {isUk ? "Допомога з текстом" : "Помощь с текстом"}
        </button>
      </div>

      {/* Variation Picker (shown automatically when >1 enabled variations exist in CMS) */}
      {variations.length > 1 && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#121a30]/80 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            {isUk ? "Оберіть сюжет / локацію відео" : "Выберите сюжет / локацию видео"}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {variations.map((v) => {
              const active = v.variationSlug === selectedVariationSlug;
              const vPrice = v.priceOverrideUah ?? effectiveBasePrice;
              return (
                <button
                  key={v.variationSlug}
                  type="button"
                  onClick={() => setSelectedVariationSlug(v.variationSlug)}
                  className={`flex flex-col overflow-hidden rounded-xl border text-left transition ${
                    active
                      ? "border-amber-300 bg-amber-400/10 ring-1 ring-amber-300/40"
                      : "border-white/10 bg-white/[0.03] hover:border-amber-300/35"
                  }`}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={v.posterUrl}
                      alt={v.title}
                      className="h-full w-full object-cover"
                    />
                    {active && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[#0b1020]">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">
                        {v.title}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-200">
                        {vPrice} ₴
                      </span>
                    </div>
                    {v.description && (
                      <p className="line-clamp-2 text-[11px] text-slate-400">
                        {v.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic CMS-driven VideoTemplate form when linked (default for all new templates) */}
      {selectedVariation?.template &&
      selectedVariation.template.formFields.length > 0 ? (
        <DynamicVideoForm
          key={`${selectedVariation.variationSlug}:${selectedVariation.template.slug}`}
          template={selectedVariation.template}
          variationSlug={selectedVariation.variationSlug}
          videoPrice={videoPrice}
          videoLang={videoLang}
          onLangSwitch={(next) => {
            setVideoLang(next);
            setLang(next, { replaceUrlOnly: true });
          }}
        />
      ) : (
        <>
      {/* Character Selection Showcase (legacy fallback) */}
      <div className="grid gap-4 rounded-2xl border border-amber-300/35 bg-[#121a30]/95 p-4 sm:grid-cols-[240px_1fr] items-center shadow-lg">
        <div className="group relative aspect-video overflow-hidden rounded-xl border border-amber-300/30 bg-slate-900">
          <img
            src="/samples/nicholas_preview.jpg"
            alt={isUk ? "Святий Миколай" : "Святой Николай"}
            className="h-full w-full object-cover object-top scale-[1.01] transform-gpu will-change-transform transition-transform duration-300 ease-out group-hover:scale-[1.1]"
          />
          <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-[#0b1020]">
            <Check className="h-3.5 w-3.5" />
          </span>
          <button
            type="button"
            aria-label={isUk ? "Збільшити кадр" : "Увеличить кадр"}
            onClick={() =>
              setLightbox({
                src: "/samples/nicholas_preview.jpg",
                title: isUk ? "Святий Миколай" : "Святой Николай",
                desc: isUk
                  ? "Сцена в теплій резиденції (~49 сек, жива озвучка ElevenLabs та врізка фото у Книгу добрих справ)."
                  : "Сцена в тёплой резиденции (~49 сек, живая озвучка ElevenLabs и врезка фото в Книгу добрых дел).",
              })
            }
            className="icon-button absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-xs transition hover:bg-amber-400 hover:text-[#0b1020]"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-0.5 text-[11px] font-semibold text-amber-200">
              {isUk ? "Персонаж • ~49 секунд" : "Персонаж • ~49 секунд"}
            </div>
            <div className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-0.5 text-[11px] font-bold text-amber-200">
              {videoPrice} ₴
            </div>
          </div>
          <h2 className="font-serif-book text-xl font-bold text-white">
            {isUk
              ? "Святий Миколай — «Тепла резиденція та Книга добрих справ»"
              : "Святой Николай — «Тёплая резиденция и Книга добрых дел»"}
          </h2>
          <p className="text-xs leading-relaxed text-slate-300">
            {isUk
              ? "Звертається до дитини по імені, показує її фото та ім'я у старовинній книзі, хвалить за успіхи й запалює іскри на подарунку."
              : "Обращается к ребёнку по имени, показывает его фото и имя в старинной книге, хвалит за успехи и зажигает искры на подарке."}
          </p>
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-100">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <span>
              <strong className="font-semibold text-amber-200">
                {isUk ? "Порада батькам:" : "Совет родителям:"}
              </strong>{" "}
              {isUk
                ? "у ролику Миколай показує чарівну коробку з подарунком. Після перегляду відео радимо вручити дитині підготовлений сюрприз і сказати, що це передав Святий Миколай — так у дитини не виникне питання «а де ж подарунок?»."
                : "в ролике Николай показывает волшебную коробку с подарком. После показа видео рекомендуем вручить ребёнку подготовленный подарок и сказать, что его передал Святой Николай — тогда у ребёнка не возникнет вопроса «а где же подарок?»."}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-7 rounded-2xl border border-white/10 bg-[#121a30]/95 p-6 shadow-xl sm:p-8"
      >
        {/* Row 1: Language (50%) + Gender (50%, Boy first & default) */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <SectionHeading title={isUk ? "Мова озвучки" : "Язык озвучки"} />
            <div className="grid grid-cols-2 gap-3">
              {(["uk", "ru"] as const).map((l) => {
                const active = videoLang === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => handleLangSwitch(l)}
                    className={`flex h-[68px] items-center gap-3 rounded-xl border px-3.5 text-left transition ${
                      active
                        ? "border-amber-400 bg-amber-400/15 text-amber-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                    }`}
                  >
                    <LanguageGlyph lang={l} active={active} />
                    <div>
                      <div className="text-sm font-bold">
                        {l === "uk" ? "Українська" : "Русский"}
                      </div>
                      <div className="text-[11px] text-slate-400">ElevenLabs</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={
              errorField === "gender"
                ? "rounded-2xl border border-rose-400/80 bg-rose-500/10 p-3 -m-3 ring-1 ring-rose-400/40 transition"
                : ""
            }
          >
            <SectionHeading
              title={isUk ? "Стать дитини *" : "Пол ребёнка *"}
              badge={isUk ? "обов'язково" : "обязательно"}
            />
            <div className="grid grid-cols-2 gap-3">
              {(["boy", "girl"] as const).map((g) => {
                const active = gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGenderSwitch(g)}
                    className={`flex h-[68px] items-center gap-3 rounded-xl border px-3.5 text-left transition ${
                      active
                        ? "border-amber-400 bg-amber-400/15 text-amber-100"
                        : errorField === "gender"
                        ? "border-rose-400/60 bg-rose-500/10 text-rose-100 hover:border-rose-300"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                    }`}
                  >
                    <GenderAvatar gender={g} active={active} />
                    <div>
                      <div className="text-sm font-bold">
                        {g === "boy"
                          ? isUk
                            ? "Хлопчик"
                            : "Мальчик"
                          : isUk
                          ? "Дівчинка"
                          : "Девочка"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {g === "boy"
                          ? isUk
                            ? "він • молодчина"
                            : "он • молодец"
                          : isUk
                          ? "вона • розумниця"
                          : "она • умница"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Symmetrical Name/Vocative (50%) + Numeric Age Stepper (50%) */}
        <div className="grid gap-5 md:grid-cols-2 items-start">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-amber-100">
                {isUk ? "Ім'я (2–15 симв.) *" : "Имя (2–15 симв.) *"}
              </label>
              <input
                maxLength={15}
                value={childName}
                onChange={(e) => {
                  setChildName(e.target.value);
                  if (errorField === "childName") {
                    setErrorField(null);
                    setError(null);
                  }
                }}
                placeholder={videoLang === "uk" ? "Андрійко" : "Михаил"}
                className={`h-11 w-full rounded-xl border px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                  errorField === "childName"
                    ? "border-rose-400 bg-rose-500/10 ring-1 ring-rose-400/40"
                    : "border-white/15 bg-white/5 focus:border-amber-400"
                }`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-amber-100">
                {videoLang === "uk"
                  ? "Кличний відмінок"
                  : "Обращение в речи (опц.)"}
              </label>
              <input
                maxLength={17}
                value={childNameVocative}
                onChange={(e) => setChildNameVocative(e.target.value)}
                placeholder={videoLang === "uk" ? "Андрійку" : "Миша"}
                className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="text-sm font-semibold text-amber-100">
                {isUk ? "Вік дитини" : "Возраст ребёнка"}
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={omitAge}
                  onChange={(e) => setOmitAge(e.target.checked)}
                />
                {isUk ? "Не озвучувати вік" : "Не озвучивать возраст"}
              </label>
            </div>

            <div
              className={`flex h-11 items-center justify-between rounded-xl border px-2 transition ${
                omitAge
                  ? "border-white/10 bg-white/[0.02] opacity-50"
                  : "border-white/15 bg-white/5"
              }`}
            >
              <button
                type="button"
                disabled={omitAge || ageNum <= 1}
                onClick={() => setAgeNum((n) => Math.max(1, n - 1))}
                aria-label="Decrease age"
                className="icon-button flex h-8 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={14}
                  disabled={omitAge}
                  value={ageNum}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v)) setAgeNum(Math.min(14, Math.max(1, v)));
                  }}
                  className="w-10 bg-transparent text-center text-base font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-sm font-medium text-amber-200">
                  {omitAge
                    ? isUk
                      ? "без віку"
                      : "без возраста"
                    : formatAgeWithUnit(ageNum, videoLang).replace(/^\d+\s*/, "")}
                </span>
              </div>

              <button
                type="button"
                disabled={omitAge || ageNum >= 14}
                onClick={() => setAgeNum((n) => Math.min(14, n + 1))}
                aria-label="Increase age"
                className="icon-button flex h-8 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Praise 3x2 cards + "Custom" selected by default with pre-filled text */}
        <div className="space-y-4">
          <SectionHeading
            title={isUk ? "За що похвалити у ролику" : "За что похвалить в ролике"}
            badge={`${achLen}/90`}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            {VIDEO_PRAISE_OPTIONS.map((opt) => {
              const active = praiseChoice === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectPraiseCard(opt.id)}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                    active
                      ? "border-amber-400 bg-amber-400/15 text-amber-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                  }`}
                >
                  <span className="mt-0.5">{renderPraiseIcon(opt.icon)}</span>
                  <div>
                    <div className="text-xs font-bold">{opt.title[lang]}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      {opt.desc[lang]}
                    </div>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => selectPraiseCard("custom")}
              className={`flex items-start gap-3 rounded-xl border border-dashed p-3.5 text-left transition ${
                praiseChoice === "custom"
                  ? "border-amber-400 bg-amber-400/15 text-amber-100"
                  : "border-white/20 bg-white/[0.02] text-slate-300 hover:border-white/35"
              }`}
            >
              <Pencil className="mt-0.5 h-5 w-5 text-amber-300 shrink-0" />
              <div>
                <div className="text-xs font-bold">
                  {isUk ? "Свій варіант" : "Свой вариант"}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {isUk ? "Вписати чи підправити" : "Вписать или поправить"}
                </div>
              </div>
            </button>
          </div>

          {praiseChoice === "custom" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  {isUk
                    ? "Текст досягнення (оптимум 25–75 символів, макс. 90):"
                    : "Текст достижения (оптимум 25–75 символов, макс. 90):"}
                </span>
                <span
                  className={`font-mono font-bold ${
                    achOptimal
                      ? "text-emerald-400"
                      : achValid
                      ? "text-amber-300"
                      : "text-rose-400"
                  }`}
                >
                  {achLen}/90
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={90}
                value={achievement}
                onChange={(e) => {
                  setAchievement(e.target.value);
                  setUserTouchedText(true);
                  if (errorField === "achievement") {
                    setErrorField(null);
                    setError(null);
                  }
                }}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                  errorField === "achievement"
                    ? "border-rose-400 bg-rose-500/10 ring-1 ring-rose-400/40"
                    : "border-amber-300/40 bg-white/5 focus:border-amber-400"
                }`}
              />
            </div>
          )}

          {/* Live spoken sentence preview */}
          <div className="rounded-xl border border-amber-300/20 bg-amber-400/5 px-4 py-3 text-xs text-slate-200">
            <span className="font-semibold text-amber-300">
              {isUk ? "Так звучатиме в озвучці:" : "Так прозвучит в озвучке:"}
            </span>{" "}
            <span className="italic text-amber-50">{spokenLinePreview}</span>
          </div>
        </div>

        {/* Row 4: Photo Upload + Live Book-of-Good-Deeds visual mockup */}
        <div className="space-y-3">
          <SectionHeading
            title={
              isUk
                ? "Фото у «Книзі добрих справ»"
                : "Фото в «Книге добрых дел»"
            }
            badge={isUk ? "обов'язково" : "обязательно"}
          />

          <div className="grid gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[1fr_290px] items-center">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {photoPreviewUrl && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-amber-300/40">
                    <img
                      src={photoPreviewUrl}
                      alt="Uploaded child preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (photoUploadId) {
                          void fetch(`/api/uploads?uploadId=${encodeURIComponent(photoUploadId)}`, {
                            method: "DELETE",
                          });
                        }
                        setPhotoUploadId("");
                        setPhotoName("");
                        setPhotoPreviewUrl(null);
                      }}
                      className="icon-button absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white hover:bg-rose-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <label
                  className={`site-button inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                    errorField === "photo"
                      ? "border-rose-400 bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/40"
                      : "border-amber-300/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {photoName || (isUk ? "Завантажити фото дитини" : "Загрузить фото ребёнка")}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (errorField === "photo") {
                        setErrorField(null);
                        setError(null);
                      }
                      void handleUpload(e.target.files?.[0]);
                    }}
                  />
                </label>
              </div>

              <p className="text-xs leading-relaxed text-slate-400">
                {isUk
                  ? "Праворуч — макет того, як фото та ім'я автоматично вріжуться на сторінку книги (EXIF видаляється перед обробкою)."
                  : "Справа — макет того, как фото и имя автоматически врежутся на страницу книги (EXIF удаляется перед обработкой)."}
              </p>

              <label
                className={`flex items-start gap-2.5 rounded-xl p-2 -mx-2 text-xs transition ${
                  errorField === "consent"
                    ? "border border-rose-400/70 bg-rose-500/10 text-rose-100"
                    : "text-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={parentalConsent}
                  onChange={(e) => {
                    setParentalConsent(e.target.checked);
                    if (errorField === "consent") {
                      setErrorField(null);
                      setError(null);
                    }
                  }}
                  className="mt-0.5"
                />
                <span>
                  {isUk
                    ? "Підтверджую згоду батьків на тимчасову обробку фото для створення відеопривітання."
                    : "Подтверждаю согласие родителей на временную обработку фото для создания видеопоздравления."}
                </span>
              </label>
            </div>

            {/* Live Book of Good Deeds Mockup matching assemble_pilot.py coordinates */}
            <div className="space-y-1.5">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-amber-200/30 shadow-lg">
                <img
                  src="/samples/book_04b_bg.jpg"
                  alt="Book of good deeds preview"
                  className="h-full w-full object-cover"
                />
                {/* Golden photo frame positioned at cx=64.2%, cy=39.7%, w=19.1% */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-sm border border-[#91662a] bg-[#ebd4a8] p-[2px] shadow-md"
                  style={{ left: "64.2%", top: "39.7%", width: "20%", aspectRatio: "1 / 1" }}
                >
                  {photoPreviewUrl ? (
                    <img
                      src={photoPreviewUrl}
                      alt="Child in book"
                      className="h-full w-full rounded-[2px] object-cover sepia-[0.12] contrast-95"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#dcc08e] text-[9px] font-semibold text-[#5a3b18]">
                      Фото
                    </div>
                  )}
                </div>

                {/* Child name under the frame */}
                <div
                  className="absolute -translate-x-1/2 text-center font-serif-book text-[11px] font-bold italic text-[#442610] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]"
                  style={{ left: "64.2%", top: "60%", maxWidth: "30%" }}
                >
                  <span className="block truncate border-b border-[#a07630]/70 px-1.5">
                    {displayBookName}
                  </span>
                </div>
              </div>
              <div className="text-center text-[11px] text-slate-400">
                {isUk ? "Живий попередній вигляд сторінки" : "Живой предпросмотр страницы"}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3.5 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 hover:brightness-105 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isUk
            ? `Зібрати відео-прев'ю · ${videoPrice} ₴`
            : `Собрать видео-превью · ${videoPrice} ₴`}
        </button>
      </form>
        </>
      )}
    </div>
  );
}
