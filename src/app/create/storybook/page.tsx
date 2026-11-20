"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  BookOpen,
  Check,
  Compass,
  Cpu,
  Footprints,
  Glasses,
  Heart,
  Home,
  Loader2,
  Map,
  Moon,
  PawPrint,
  Pencil,
  Rocket,
  Shield,
  ShieldAlert,
  Shuffle,
  SlidersHorizontal,
  Smile,
  Snowflake,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  Wand2,
  Waves,
  X,
  ZoomIn,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { usePricing } from "@/components/PricingContext";
import {
  AgeBadgeVisual,
  GenderAvatar,
  ImageLightbox,
  LanguageGlyph,
  type LightboxItem,
} from "@/components/VisualOptionCards";
import {
  ART_STYLE_META,
  EYE_SWATCHES,
  FAMILY_RELATION_OPTIONS,
  HAIR_SWATCHES,
  LAYOUT_META,
  PET_SPECIES_OPTIONS,
  PLOT_OPTIONS,
  SETTING_OPTIONS,
  STORYBOOK_PRESETS,
  TONE_LABELS,
  TONE_SUBTITLES,
  TOY_PRESETS,
  type CuratedOption,
} from "@/lib/i18n";
import type {
  AgeGroup,
  ArtStyle,
  ChildGender,
  CompanionGender,
  CompanionType,
  Lang,
  LayoutMode,
  StoryTone,
} from "@/lib/types";

function renderOptionIcon(icon: CuratedOption["icon"]) {
  const cls = "h-5 w-5 text-amber-300 shrink-0";
  switch (icon) {
    case "wand":
      return <Wand2 className={cls} />;
    case "rocket":
      return <Rocket className={cls} />;
    case "waves":
      return <Waves className={cls} />;
    case "paw":
      return <Footprints className={cls} />;
    case "cpu":
      return <Cpu className={cls} />;
    case "home":
      return <Home className={cls} />;
    case "snowflake":
      return <Snowflake className={cls} />;
    case "compass":
      return <Compass className={cls} />;
    case "heart":
      return <Heart className={cls} />;
    case "shield":
      return <Shield className={cls} />;
    case "map":
      return <Map className={cls} />;
    case "sparkles":
    default:
      return <Sparkles className={cls} />;
  }
}

function renderToneIcon(tone: StoryTone) {
  const cls = "h-5 w-5 text-amber-300 shrink-0";
  switch (tone) {
    case "cozy":
      return <Moon className={cls} />;
    case "magical":
      return <Sparkles className={cls} />;
    case "adventure":
      return <Compass className={cls} />;
    case "funny":
      return <Smile className={cls} />;
  }
}

function SectionHeading({
  title,
  badge,
}: {
  title: string;
  badge?: string;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-2 border-l-2 border-amber-400 pl-3">
      <h3 className="text-sm font-bold tracking-wide text-amber-100 sm:text-base">
        {title}
      </h3>
      {badge && (
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300">
          {badge}
        </span>
      )}
    </div>
  );
}

export default function CreateStorybookPage() {
  const router = useRouter();
  const { lang, setLang, l, setAssistantContext, setAssistantOpen } = useLanguage();
  const { pricing, getStorybookPrice } = usePricing();
  const isUk = lang === "uk";
  const sbEnabled = pricing.services.storybook?.enabled ?? true;

  useEffect(() => {
    setAssistantContext("storybook");
  }, [setAssistantContext]);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingChild, setUploadingChild] = useState(false);
  const [uploadingCompanion, setUploadingCompanion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<
    | "gender"
    | "childName"
    | "consent"
    | "companionSpecies"
    | "companionRelation"
    | "companionGender"
    | "companionConsent"
    | "customSetting"
    | "customPlot"
    | null
  >(null);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  // Step 1 (gender unselected by default and required!)
  const [bookLang, setBookLang] = useState<Lang>(lang);
  const [childName, setChildName] = useState("");
  const [childNameVocative, setChildNameVocative] = useState("");
  const [gender, setGender] = useState<ChildGender | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("6-8");
  const [photoUploadId, setPhotoUploadId] = useState<string | undefined>();
  const [photoName, setPhotoName] = useState<string>("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [parentalConsent, setParentalConsent] = useState(false);
  const [hairColor, setHairColor] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [hasGlasses, setHasGlasses] = useState(false);

  // Step 2 (both preselected!)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("classic");
  const [artStyle, setArtStyle] = useState<ArtStyle>("watercolor");

  // Step 3 (card selection + custom only when chosen)
  const [presetIdx, setPresetIdx] = useState(0);
  const [tone, setTone] = useState<StoryTone>(STORYBOOK_PRESETS[0].tone);
  const [settingChoice, setSettingChoice] = useState<string>(SETTING_OPTIONS[0].id);
  const [customSetting, setCustomSetting] = useState<string>("");
  const [plotChoice, setPlotChoice] = useState<string>(PLOT_OPTIONS[0].id);
  const [customPlot, setCustomPlot] = useState<string>("");
  const [pageCount, setPageCount] = useState<number>(6);

  // Step 4 (optional)
  const [companionType, setCompanionType] = useState<CompanionType>("none");
  const [petSpeciesChoice, setPetSpeciesChoice] = useState<string>("");
  const [customPetSpecies, setCustomPetSpecies] = useState<string>("");
  const [familyRelationChoice, setFamilyRelationChoice] = useState<string>("");
  const [customFamilyRelation, setCustomFamilyRelation] = useState<string>("");
  const [companionGender, setCompanionGender] = useState<CompanionGender | null>(null);
  const [companionName, setCompanionName] = useState("");
  const [companionDescription, setCompanionDescription] = useState("");
  const [companionPhotoUploadId, setCompanionPhotoUploadId] = useState<string | undefined>();
  const [companionPhotoName, setCompanionPhotoName] = useState("");
  const [companionPreviewUrl, setCompanionPreviewUrl] = useState<string | null>(null);
  const [companionConsent, setCompanionConsent] = useState(false);

  // Step 5 (optional)
  const [toyChoice, setToyChoice] = useState<"none" | "preset" | "custom">("none");
  const [favoriteToy, setFavoriteToy] = useState("");
  const [dedication, setDedication] = useState("");

  const resolvedSetting =
    settingChoice === "custom"
      ? customSetting.trim()
      : SETTING_OPTIONS.find((s) => s.id === settingChoice)?.value[bookLang] ||
        SETTING_OPTIONS[0].value[bookLang];

  const resolvedPlot =
    plotChoice === "custom"
      ? customPlot.trim()
      : PLOT_OPTIONS.find((p) => p.id === plotChoice)?.value[bookLang] ||
        PLOT_OPTIONS[0].value[bookLang];

  const applyPreset = (idx: number) => {
    const p = STORYBOOK_PRESETS[idx % STORYBOOK_PRESETS.length];
    setPresetIdx(idx % STORYBOOK_PRESETS.length);
    setTone(p.tone);
    setSettingChoice(p.settingId);
    setPlotChoice(p.plotId);
  };

  const handleBookLangChange = (next: Lang) => {
    setBookLang(next);
    setLang(next, { replaceUrlOnly: true });
  };

  const handlePhotoUpload = async (
    file: File | undefined,
    purpose: "child" | "companion"
  ) => {
    if (!file) return;
    setError(null);
    const localUrl = URL.createObjectURL(file);
    if (purpose === "child") setUploadingChild(true);
    else setUploadingCompanion(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", purpose);
      fd.append("companionType", companionType);
      const prevId = purpose === "child" ? photoUploadId : companionPhotoUploadId;
      if (prevId) fd.append("replaceUploadId", prevId);

      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (purpose === "child") {
        setPhotoUploadId(data.uploadId);
        setPhotoName(file.name);
        setPhotoPreviewUrl(localUrl);
      } else {
        setCompanionPhotoUploadId(data.uploadId);
        setCompanionPhotoName(file.name);
        setCompanionPreviewUrl(localUrl);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingChild(false);
      setUploadingCompanion(false);
    }
  };

  const clearChildPhoto = () => {
    if (photoUploadId) {
      void fetch(`/api/uploads?uploadId=${encodeURIComponent(photoUploadId)}`, {
        method: "DELETE",
      });
    }
    setPhotoUploadId(undefined);
    setPhotoName("");
    setPhotoPreviewUrl(null);
    setParentalConsent(false);
  };

  const clearCompanionPhoto = () => {
    if (companionPhotoUploadId) {
      void fetch(`/api/uploads?uploadId=${encodeURIComponent(companionPhotoUploadId)}`, {
        method: "DELETE",
      });
    }
    setCompanionPhotoUploadId(undefined);
    setCompanionPhotoName("");
    setCompanionPreviewUrl(null);
    setCompanionConsent(false);
    if (errorField === "companionConsent") {
      setErrorField(null);
      setError(null);
    }
  };

  const validateStep1 = (): boolean => {
    setError(null);
    setErrorField(null);
    if (!gender) {
      setErrorField("gender");
      setError(
        isUk
          ? "Оберіть стать дитини (хлопчик або дівчинка)."
          : "Выберите пол ребёнка (мальчик или девочка)."
      );
      return false;
    }
    if (childName.trim().length < 2) {
      setErrorField("childName");
      setError(isUk ? "Введіть ім'я дитини (від 2 літер)." : "Введите имя ребёнка (от 2 букв).");
      return false;
    }
    if (photoUploadId && !parentalConsent) {
      setErrorField("consent");
      setError(
        isUk
          ? "Підтвердіть згоду батьків на обробку фото."
          : "Подтвердите согласие родителей на обработку фото."
      );
      return false;
    }
    return true;
  };

  const resolvedPetSpecies =
    companionType === "pet"
      ? petSpeciesChoice === "custom"
        ? customPetSpecies.trim()
        : PET_SPECIES_OPTIONS.find((p) => p.id === petSpeciesChoice)?.en || ""
      : "";

  const resolvedFamilyRelation =
    companionType === "family"
      ? familyRelationChoice === "custom"
        ? customFamilyRelation.trim()
        : FAMILY_RELATION_OPTIONS.find((f) => f.id === familyRelationChoice)?.en || ""
      : "";

  const resolvedCompanionGender: CompanionGender | undefined =
    companionType === "none"
      ? undefined
      : companionType === "family" && familyRelationChoice !== "custom"
      ? FAMILY_RELATION_OPTIONS.find((f) => f.id === familyRelationChoice)?.impliedGender
      : companionGender || undefined;

  const validateStep4 = (): boolean => {
    setError(null);
    setErrorField(null);

    if (companionType === "pet") {
      if (!petSpeciesChoice || (petSpeciesChoice === "custom" && !customPetSpecies.trim())) {
        setErrorField("companionSpecies");
        setError(
          isUk
            ? "Оберіть або впишіть вид домашнього улюбленця."
            : "Выберите или впишите вид домашнего питомца."
        );
        return false;
      }
      if (!companionGender) {
        setErrorField("companionGender");
        setError(
          isUk
            ? "Оберіть стать улюбленця (хлопчик або дівчинка)."
            : "Выберите пол питомца (мальчик или девочка)."
        );
        return false;
      }
    }

    if (companionType === "family") {
      if (
        !familyRelationChoice ||
        (familyRelationChoice === "custom" && !customFamilyRelation.trim())
      ) {
        setErrorField("companionRelation");
        setError(
          isUk
            ? "Оберіть або впишіть, хто саме з рідних буде в казці."
            : "Выберите или впишите, кто именно из родных будет в сказке."
        );
        return false;
      }
      if (familyRelationChoice === "custom" && !companionGender) {
        setErrorField("companionGender");
        setError(
          isUk
            ? "Оберіть стать члена сім'ї."
            : "Выберите пол члена семьи."
        );
        return false;
      }
      if (companionPhotoUploadId && !companionConsent) {
        setErrorField("companionConsent");
        setError(
          isUk
            ? "Підтвердіть згоду члена сім'ї на обробку його фото."
            : "Подтвердите согласие члена семьи на обработку его фото."
        );
        return false;
      }
    }

    if (companionType === "friend" && !companionGender) {
      setErrorField("companionGender");
      setError(
        isUk
          ? "Оберіть стать друга або подруги."
          : "Выберите пол друга или подруги."
      );
      return false;
    }

    return true;
  };

  const skipStep4 = () => {
    setCompanionType("none");
    setPetSpeciesChoice("");
    setCustomPetSpecies("");
    setFamilyRelationChoice("");
    setCustomFamilyRelation("");
    setCompanionGender(null);
    setCompanionName("");
    setCompanionDescription("");
    clearCompanionPhoto();
    setErrorField(null);
    setError(null);
    setStep(5);
  };

  const handleCreateStorybook = async (skipStep5 = false) => {
    if (!validateStep1()) return;
    if (settingChoice === "custom" && !customSetting.trim()) {
      setErrorField("customSetting");
      setError(
        isUk
          ? "Опишіть місце дії або оберіть готовий варіант."
          : "Опишите место действия или выберите готовый вариант."
      );
      return;
    }
    if (plotChoice === "custom" && !customPlot.trim()) {
      setErrorField("customPlot");
      setError(
        isUk
          ? "Опишіть свій сюжет або оберіть готовий варіант."
          : "Опишите свой сюжет или выберите готовый вариант."
      );
      return;
    }
    if (!validateStep4()) {
      setStep(4);
      return;
    }
    if (
      !skipStep5 &&
      step === 5 &&
      toyChoice === "none" &&
      !favoriteToy.trim() &&
      !dedication.trim()
    ) {
      setError(
        isUk
          ? "Оберіть предмет чи додайте присвяту, або натисніть «Пропустити крок»."
          : "Выберите предмет или добавьте посвящение, либо нажмите «Пропустить шаг»."
      );
      return;
    }

    const effectiveToy = skipStep5 || toyChoice === "none" ? undefined : favoriteToy.trim() || undefined;
    const effectiveDedication = skipStep5 ? undefined : dedication.trim() || undefined;

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/storybook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: bookLang,
          childName: childName.trim(),
          childNameVocative: childNameVocative.trim() || undefined,
          gender,
          ageGroup,
          photoUploadId,
          parentalConsent,
          hairColor: hairColor.trim() || undefined,
          eyeColor: eyeColor.trim() || undefined,
          hasGlasses,
          layoutMode,
          artStyle,
          tone,
          setting: resolvedSetting,
          plotIdea: resolvedPlot,
          pageCount,
          companionType,
          companionSpecies: companionType === "pet" ? resolvedPetSpecies : undefined,
          companionRelation: companionType === "family" ? resolvedFamilyRelation : undefined,
          companionGender: resolvedCompanionGender,
          companionName: companionType === "none" ? undefined : companionName.trim() || undefined,
          companionDescription:
            companionType === "none" ? undefined : companionDescription.trim() || undefined,
          companionPhotoUploadId:
            companionType === "family" || companionType === "pet"
              ? companionPhotoUploadId
              : undefined,
          companionConsent:
            companionType === "family" && companionPhotoUploadId ? companionConsent : false,
          favoriteToy: effectiveToy,
          dedication: effectiveDedication,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed creating order");
      router.push(l(`/orders/${data.orderId}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setSubmitting(false);
    }
  };

  if (!sbEnabled) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <div className="rounded-2xl border border-amber-300/25 bg-[#121a30]/95 p-8 text-center space-y-4 shadow-xl">
          <h1 className="font-serif-book text-2xl font-bold text-white">
            {isUk ? "Послуга тимчасово вимкнена" : "Услуга временно отключена"}
          </h1>
          <p className="text-sm text-slate-300">
            {isUk
              ? "Створення нових казок зараз призупинено адміністратором. Завітайте трохи згодом."
              : "Создание новых сказок сейчас приостановлено администратором. Загляните чуть позже."}
          </p>
          <button
            type="button"
            onClick={() => router.push(l("/"))}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-[#0b1020] hover:bg-amber-300"
          >
            <ArrowLeft className="h-4 w-4" />
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
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <BookOpen className="h-3.5 w-3.5" />
            {isUk ? "Конструктор казки PDF" : "Конструктор сказки PDF"}
          </span>
          <h1 className="font-serif-book text-2xl font-bold text-white sm:text-3xl">
            {isUk ? "Створіть персональну книгу" : "Создайте персональную книгу"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-400/20"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isUk ? "Ідея від ІІ-помічника" : "Идея от ИИ-помощника"}
        </button>
      </div>

      {/* Visual Stepper */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { n: 1, uk: "1. Герой та фото", ru: "1. Герой и фото" },
          { n: 2, uk: "2. Верстка і стиль", ru: "2. Вёрстка и стиль" },
          { n: 3, uk: "3. Світ і сюжет", ru: "3. Мир и сюжет" },
        ].map((item) => (
          <button
            key={item.n}
            type="button"
            onClick={() => {
              if (item.n <= step) setStep(item.n as 1 | 2 | 3);
            }}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-left font-semibold transition ${
              step === item.n
                ? "border-amber-400 bg-amber-400/15 text-amber-200"
                : step > item.n
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/5 text-slate-400"
            }`}
          >
            {isUk ? item.uk : item.ru}
          </button>
        ))}
        {step >= 4 && (
          <div className="rounded-xl border border-amber-400 bg-amber-400/15 px-3 py-2.5 font-semibold text-amber-200">
            {isUk ? `Опц. ${step}/5` : `Доп. ${step}/5`}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#121a30]/95 p-6 shadow-xl sm:p-8 space-y-7">
        {/* STEP 1: Symmetrical rows */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-serif-book text-xl font-bold text-amber-100">
              {isUk
                ? "Крок 1. Мова, дитина та фото (фото — опціонально)"
                : "Шаг 1. Язык, ребёнок и фото (фото — опционально)"}
            </h2>

            {/* Row 1: Language (50%) + Gender (50%, Boy first & default) — matched height */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <SectionHeading title={isUk ? "Мова книги" : "Язык книги"} />
                <div className="grid grid-cols-2 gap-3">
                  {(["uk", "ru"] as const).map((l) => {
                    const active = bookLang === l;
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => handleBookLangChange(l)}
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
                          <div className="text-[11px] text-slate-400">
                            {l === "uk" ? "Текст і коректор" : "Текст и корректор"}
                          </div>
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
                        onClick={() => {
                          setGender(g);
                          if (errorField === "gender") {
                            setErrorField(null);
                            setError(null);
                          }
                        }}
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
                                ? "він • його"
                                : "он • его"
                              : isUk
                              ? "вона • її"
                              : "она • её"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 2: Always balanced 2-column Name row */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-amber-100">
                  {isUk ? "Ім'я дитини *" : "Имя ребёнка *"}
                </label>
                <input
                  value={childName}
                  onChange={(e) => {
                    setChildName(e.target.value);
                    if (errorField === "childName") {
                      setErrorField(null);
                      setError(null);
                    }
                  }}
                  placeholder={isUk ? "Наприклад: Михайлик або Міла" : "Например: Артём или Мила"}
                  className={`h-11 w-full rounded-xl border px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none ${
                    errorField === "childName"
                      ? "border-rose-400 bg-rose-500/10 ring-1 ring-rose-400/40"
                      : "border-white/15 bg-white/5 focus:border-amber-400"
                  }`}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-amber-100">
                  {bookLang === "uk"
                    ? "Кличний відмінок (опціонально)"
                    : "Звательная / ласковая форма (опц.)"}
                </label>
                <input
                  value={childNameVocative}
                  onChange={(e) => setChildNameVocative(e.target.value)}
                  placeholder={
                    bookLang === "uk" ? "Напр.: Михайлику, Міло" : "Напр.: Тёма, Милуша"
                  }
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3: Full-width symmetric 3-column Age Group */}
            <div>
              <SectionHeading title={isUk ? "Вікова група" : "Возрастная группа"} />
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    {
                      age: "2-3",
                      uk: "Малюк",
                      ru: "Малыш",
                      hintUk: "Короткі речення",
                      hintRu: "Короткие фразы",
                    },
                    {
                      age: "4-5",
                      uk: "Дошкільня",
                      ru: "Дошкольник",
                      hintUk: "Яскрава історія",
                      hintRu: "Яркая история",
                    },
                    {
                      age: "6-8",
                      uk: "Школяр",
                      ru: "Школьник",
                      hintUk: "Розгорнута казка",
                      hintRu: "Развёрнутая сказка",
                    },
                  ] as const
                ).map((item) => {
                  const active = ageGroup === item.age;
                  return (
                    <button
                      key={item.age}
                      type="button"
                      onClick={() => setAgeGroup(item.age)}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                        active
                          ? "border-amber-400 bg-amber-400/15 text-amber-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                      }`}
                    >
                      <AgeBadgeVisual age={item.age} />
                      <div>
                        <div className="text-sm font-bold">
                          {item.age} {isUk ? "р." : "л."} • {isUk ? item.uk : item.ru}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {isUk ? item.hintUk : item.hintRu}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Photo + Symmetrical 3-column appearance grid (2x2 swatches, zero awkward wrapping) */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {photoPreviewUrl ? (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-amber-300/40">
                      <img
                        src={photoPreviewUrl}
                        alt="Uploaded child preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={clearChildPhoto}
                        title={isUk ? "Видалити фото" : "Удалить фото"}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white hover:bg-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-slate-400">
                      <Upload className="h-6 w-6" />
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-bold text-amber-100">
                      {isUk
                        ? "Фото дитини для схожості героя (опціонально)"
                        : "Фото ребёнка для портретного сходства (опционально)"}
                    </div>
                    <p className="text-xs text-slate-400">
                      {isUk
                        ? "EXIF-метадані видаляються автоматично, фото зберігається лише на час генерації."
                        : "EXIF-метаданные удаляются автоматически, фото хранится только на время генерации."}
                    </p>
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-300/35 bg-amber-400/15 px-4 py-2.5 text-xs font-semibold text-amber-200 hover:bg-amber-400/25">
                  {uploadingChild ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {photoName || (isUk ? "Завантажити фото" : "Загрузить фото")}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => void handlePhotoUpload(e.target.files?.[0], "child")}
                  />
                </label>
              </div>

              {photoUploadId ? (
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
                      ? "Я є батьком/законним представником дитини і даю згоду на тимчасову обробку фото для створення ілюстрацій казки."
                      : "Я являюсь родителем/законным представителем ребёнка и даю согласие на временную обработку фото для создания иллюстраций сказки."}
                  </span>
                </label>
              ) : (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="text-xs font-semibold text-slate-300">
                    {isUk ? "Або оберіть зовнішність без фото:" : "Или выберите внешность без фото:"}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Col 1: 2x2 Hair swatches */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-300">
                        {isUk ? "Колір волосся" : "Цвет волос"}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {HAIR_SWATCHES.map((s) => {
                          const label = isUk ? s.uk : s.ru;
                          const active = hairColor === label;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setHairColor(active ? "" : label)}
                              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium transition ${
                                active
                                  ? "border-amber-400 bg-amber-400/20 text-amber-100"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                              }`}
                            >
                              <span
                                className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30"
                                style={{ backgroundColor: s.color }}
                              />
                              <span className="truncate">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Col 2: 2x2 Eye swatches */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-300">
                        {isUk ? "Колір очей" : "Цвет глаз"}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {EYE_SWATCHES.map((s) => {
                          const label = isUk ? s.uk : s.ru;
                          const active = eyeColor === label;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setEyeColor(active ? "" : label)}
                              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium transition ${
                                active
                                  ? "border-amber-400 bg-amber-400/20 text-amber-100"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                              }`}
                            >
                              <span
                                className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30"
                                style={{ backgroundColor: s.color }}
                              />
                              <span className="truncate">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Col 3: Details matching 2-row height */}
                    <div className="flex flex-col space-y-2">
                      <div className="text-xs font-medium text-slate-300">
                        {isUk ? "Додатково" : "Детали"}
                      </div>
                      <button
                        type="button"
                        onClick={() => setHasGlasses((v) => !v)}
                        className={`flex flex-1 min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          hasGlasses
                            ? "border-amber-400 bg-amber-400/20 text-amber-100"
                            : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                        }`}
                      >
                        <Glasses className="h-5 w-5 text-amber-300" />
                        <span>{isUk ? "Дитина в окулярах" : "Ребёнок в очках"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#0b1020] hover:bg-amber-300"
              >
                {isUk ? "Далі: верстка та стиль" : "Далее: вёрстка и стиль"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Generated Layout Photos + Distinct Art Styles + Magnifier Lightbox */}
        {step === 2 && (
          <div className="space-y-8">
            <h2 className="font-serif-book text-xl font-bold text-amber-100">
              {isUk
                ? "Крок 2. Режим верстки та стиль ілюстрацій"
                : "Шаг 2. Режим вёрстки и стиль иллюстраций"}
            </h2>

            <div>
              <SectionHeading
                title={isUk ? "Режим верстки" : "Режим вёрстки"}
                badge={isUk ? "1 з 2" : "1 из 2"}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {(["classic", "panorama"] as const).map((mode) => {
                  const meta = LAYOUT_META[mode];
                  const selected = layoutMode === mode;
                  return (
                    <div
                      key={mode}
                      role="button"
                      tabIndex={0}
                      onClick={() => setLayoutMode(mode)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setLayoutMode(mode);
                      }}
                      className={`group cursor-pointer overflow-hidden rounded-2xl border text-left transition-colors duration-200 ${
                        selected
                          ? "border-amber-400 bg-amber-400/15 shadow-lg shadow-amber-500/10"
                          : "border-white/10 bg-white/5 hover:border-amber-300/50 hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                        <img
                          src={meta.previewImage}
                          alt={meta.label[lang]}
                          className="h-full w-full object-cover scale-[1.01] transform-gpu will-change-transform transition-transform duration-300 ease-out group-hover:scale-[1.1]"
                        />
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-[#0b1020] shadow-md">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={isUk ? "Збільшити приклад" : "Увеличить пример"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightbox({
                              src: meta.previewImage,
                              title: meta.label[lang],
                              desc: meta.desc[lang],
                            });
                          }}
                          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-xs transition hover:bg-amber-400 hover:text-[#0b1020]"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white">{meta.label[lang]}</span>
                          {meta.badge && (
                            <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-200">
                              {meta.badge[lang]}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                          {meta.desc[lang]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionHeading
                title={isUk ? "Художній стиль" : "Художественный стиль"}
                badge={isUk ? "1 з 6" : "1 из 6"}
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(ART_STYLE_META) as ArtStyle[]).map((styleKey) => {
                  const meta = ART_STYLE_META[styleKey];
                  const selected = artStyle === styleKey;
                  return (
                    <div
                      key={styleKey}
                      role="button"
                      tabIndex={0}
                      onClick={() => setArtStyle(styleKey)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setArtStyle(styleKey);
                      }}
                      className={`group cursor-pointer overflow-hidden rounded-2xl border text-left transition-colors duration-200 ${
                        selected
                          ? "border-amber-400 bg-amber-400/15 shadow-lg shadow-amber-500/10"
                          : "border-white/10 bg-white/5 hover:border-amber-300/50 hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                        <img
                          src={meta.previewImage}
                          alt={meta.label[lang]}
                          className="h-full w-full object-cover scale-[1.01] transform-gpu will-change-transform transition-transform duration-300 ease-out group-hover:scale-[1.1]"
                        />
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-[#0b1020] shadow-md">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={isUk ? "Збільшити стиль" : "Увеличить стиль"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightbox({
                              src: meta.previewImage,
                              title: meta.label[lang],
                              desc: meta.desc[lang],
                            });
                          }}
                          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-xs transition hover:bg-amber-400 hover:text-[#0b1020]"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <div className="font-bold text-white">{meta.label[lang]}</div>
                        <p className="mt-1 text-xs text-slate-300">{meta.desc[lang]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" />
                {isUk ? "Назад" : "Назад"}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#0b1020] hover:bg-amber-300"
              >
                {isUk ? "Далі: світ і сюжет" : "Далее: мир и сюжет"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Tone (4x1) + General Worlds (4x2 = 8) + Universal Plot Arcs (3x2 = 6) + Volume (3x1) */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif-book text-xl font-bold text-amber-100">
                {isUk
                  ? "Крок 3. Оберіть настрій, світ та сюжет"
                  : "Шаг 3. Выберите настроение, мир и сюжет"}
              </h2>
              <button
                type="button"
                onClick={() => applyPreset(presetIdx + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/35 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-400/20"
              >
                <Shuffle className="h-3.5 w-3.5" />
                {isUk ? "Випадкова комбінація" : "Случайная комбинация"}
              </button>
            </div>

            {/* 1. Tone: 4x1 */}
            <div>
              <SectionHeading
                title={isUk ? "Настрій та ритм читання" : "Настроение и ритм чтения"}
                badge={isUk ? "1 з 4" : "1 из 4"}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(Object.keys(TONE_LABELS) as StoryTone[]).map((tKey) => {
                  const active = tone === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setTone(tKey)}
                      className={`flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition ${
                        active
                          ? "border-amber-400 bg-amber-400/15 text-amber-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                      }`}
                    >
                      {renderToneIcon(tKey)}
                      <div className="text-xs font-bold">{TONE_LABELS[tKey][lang]}</div>
                      <div className="text-[11px] leading-snug text-slate-400">
                        {TONE_SUBTITLES[tKey][lang]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. World / Genre Setting: balanced 4x2 = 8 cards */}
            <div>
              <SectionHeading
                title={isUk ? "Світ та жанр казки" : "Мир и жанр сказки"}
                badge={isUk ? "7 світів або свій" : "7 миров или свой"}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SETTING_OPTIONS.map((opt) => {
                  const active = settingChoice === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSettingChoice(opt.id)}
                      className={`flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition ${
                        active
                          ? "border-amber-400 bg-amber-400/15 text-amber-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                      }`}
                    >
                      {renderOptionIcon(opt.icon)}
                      <div className="text-xs font-bold leading-snug">
                        {opt.title[lang]}
                      </div>
                      <div className="text-[11px] leading-snug text-slate-400">
                        {opt.desc[lang]}
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setSettingChoice("custom")}
                  className={`flex flex-col items-start gap-2 rounded-xl border border-dashed p-3.5 text-left transition ${
                    settingChoice === "custom"
                      ? "border-amber-400 bg-amber-400/15 text-amber-100"
                      : "border-white/20 bg-white/[0.02] text-slate-300 hover:border-white/35"
                  }`}
                >
                  <Pencil className="h-5 w-5 text-amber-300 shrink-0" />
                  <div className="text-xs font-bold">
                    {isUk ? "Свій світ" : "Свой мир"}
                  </div>
                  <div className="text-[11px] leading-snug text-slate-400">
                    {isUk ? "Вказати власне місце" : "Описать своё место"}
                  </div>
                </button>
              </div>

              {settingChoice === "custom" && (
                <input
                  value={customSetting}
                  onChange={(e) => {
                    setCustomSetting(e.target.value);
                    if (errorField === "customSetting") {
                      setErrorField(null);
                      setError(null);
                    }
                  }}
                  placeholder={
                    isUk
                      ? "Наприклад: чарівна школа магії на вершині старої гори..."
                      : "Например: волшебная школа магии на вершине старой горы..."
                  }
                  className={`mt-3 w-full rounded-xl border px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                    errorField === "customSetting"
                      ? "border-rose-400 bg-rose-500/10 ring-1 ring-rose-400/40"
                      : "border-amber-300/40 bg-white/5 focus:border-amber-400"
                  }`}
                />
              )}
            </div>

            {/* 3. Universal Plot Arcs: balanced 3x2 = 6 cards */}
            <div>
              <SectionHeading
                title={isUk ? "Головна сюжетна лінія" : "Главная сюжетная линия"}
                badge={isUk ? "5 ідей або своя" : "5 идей или своя"}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                {PLOT_OPTIONS.map((opt) => {
                  const active = plotChoice === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPlotChoice(opt.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                        active
                          ? "border-amber-400 bg-amber-400/15 text-amber-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                      }`}
                    >
                      <span className="mt-0.5">{renderOptionIcon(opt.icon)}</span>
                      <div>
                        <div className="text-xs font-bold">{opt.title[lang]}</div>
                        <div className="mt-1 text-[11px] leading-snug text-slate-400">
                          {opt.desc[lang]}
                        </div>
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPlotChoice("custom")}
                  className={`flex items-start gap-3 rounded-xl border border-dashed p-3.5 text-left transition ${
                    plotChoice === "custom"
                      ? "border-amber-400 bg-amber-400/15 text-amber-100"
                      : "border-white/20 bg-white/[0.02] text-slate-300 hover:border-white/35"
                  }`}
                >
                  <Pencil className="mt-0.5 h-5 w-5 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {isUk ? "Свій сюжет" : "Свой сюжет"}
                    </div>
                    <div className="mt-1 text-[11px] leading-snug text-slate-400">
                      {isUk ? "Написати власну задумку" : "Написать свою задумку"}
                    </div>
                  </div>
                </button>
              </div>

              {plotChoice === "custom" && (
                <textarea
                  rows={3}
                  value={customPlot}
                  onChange={(e) => {
                    setCustomPlot(e.target.value);
                    if (errorField === "customPlot") {
                      setErrorField(null);
                      setError(null);
                    }
                  }}
                  placeholder={
                    isUk
                      ? "Опишіть у 1–2 реченнях, що має статися в казці..."
                      : "Опишите в 1–2 предложениях, что должно произойти в сказке..."
                  }
                  className={`mt-3 w-full rounded-xl border px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                    errorField === "customPlot"
                      ? "border-rose-400 bg-rose-500/10 ring-1 ring-rose-400/40"
                      : "border-amber-300/40 bg-white/5 focus:border-amber-400"
                  }`}
                />
              )}
            </div>

            {/* 4. Volume: 3x1 symmetric */}
            <div>
              <SectionHeading title={isUk ? "Обсяг книги" : "Объём книги"} />
              <div className="grid grid-cols-3 gap-3">
                {[
                  { n: 4, price: getStorybookPrice(4), uk: "~3 хв читання", ru: "~3 мин чтения" },
                  { n: 6, price: getStorybookPrice(6), uk: "~5 хв (оптимум)", ru: "~5 мин (оптимум)" },
                  { n: 8, price: getStorybookPrice(8), uk: "~7 хв (довга)", ru: "~7 мин (длинная)" },
                ].map((item) => (
                  <button
                    key={item.n}
                    type="button"
                    onClick={() => setPageCount(item.n)}
                    className={`rounded-xl border px-3 py-3 text-center transition ${
                      pageCount === item.n
                        ? "border-amber-400 bg-amber-400/20 text-amber-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                    }`}
                  >
                    <div className="text-sm font-bold">
                      {item.n} {isUk ? "стор." : "стр."} · {item.price} ₴
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      {isUk ? item.uk : item.ru}
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {isUk
                  ? "Спочатку безкоштовне прев'ю (обкладинка, перші 2 сторінки з ілюстраціями та весь текст). Решта ілюстрацій домальовується після оплати (безпечний холд Plata by mono)."
                  : "Сначала бесплатное превью (обложка, первые 2 страницы с иллюстрациями и весь текст). Остальные иллюстрации дорисовываются после оплаты (безопасный холд Plata by mono)."}
              </p>
            </div>

            {/* Main Fork */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" />
                {isUk ? "Назад" : "Назад"}
              </button>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  <SlidersHorizontal className="h-4 w-4 text-amber-300" />
                  {isUk ? "Налаштувати далі" : "Настроить дальше"}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleCreateStorybook()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 hover:brightness-105 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isUk
                    ? `Створити казку · ${getStorybookPrice(pageCount)} ₴`
                    : `Создать сказку · ${getStorybookPrice(pageCount)} ₴`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 (Optional): Companion */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-serif-book text-xl font-bold text-amber-100">
              {isUk
                ? "Крок 4 (опціонально). Другий персонаж"
                : "Шаг 4 (опционально). Второй персонаж"}
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  { k: "none", uk: "Без супутника", ru: "Без спутника", icon: Ban },
                  { k: "pet", uk: "Улюбленець", ru: "Питомец", icon: PawPrint },
                  { k: "family", uk: "Член сім'ї", ru: "Член семьи", icon: Users },
                  { k: "friend", uk: "Друг / подруга", ru: "Друг / подруга", icon: UserCheck },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.k}
                    type="button"
                    onClick={() => {
                      setCompanionType(item.k);
                      setErrorField(null);
                      setError(null);
                      if (item.k !== "family") {
                        setCompanionConsent(false);
                        setFamilyRelationChoice("");
                        setCustomFamilyRelation("");
                      }
                      if (item.k !== "pet") {
                        setPetSpeciesChoice("");
                        setCustomPetSpecies("");
                      }
                      setCompanionGender(null);
                      if (item.k === "friend" || item.k === "none") {
                        clearCompanionPhoto();
                      }
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3.5 text-xs font-semibold transition ${
                      companionType === item.k
                        ? "border-amber-400 bg-amber-400/20 text-amber-100"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-amber-300" />
                    <span>{isUk ? item.uk : item.ru}</span>
                    {item.k === "none" && (
                      <span className="text-[10px] font-normal text-slate-400">
                        {isUk ? "за замовчуванням" : "по умолчанию"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {companionType !== "none" && (
              <div className="space-y-4">
                {/* Pet species + gender (always shown for pet) */}
                {companionType === "pet" && (
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div
                      className={
                        errorField === "companionSpecies"
                          ? "rounded-xl border border-rose-400/70 bg-rose-500/10 p-2.5 -m-2.5 ring-1 ring-rose-400/40"
                          : ""
                      }
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-amber-100">
                        <span>{isUk ? "Хто це? (вид улюбленця) *" : "Кто это? (вид питомца) *"}</span>
                        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                          {isUk ? "обов'язково" : "обязательно"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {PET_SPECIES_OPTIONS.map((sp) => {
                          const active = petSpeciesChoice === sp.id;
                          return (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => {
                                setPetSpeciesChoice(sp.id);
                                if (errorField === "companionSpecies") {
                                  setErrorField(null);
                                  setError(null);
                                }
                              }}
                              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                active
                                  ? "border-amber-400 bg-amber-400/20 text-amber-100"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                              }`}
                            >
                              {isUk ? sp.uk : sp.ru}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            setPetSpeciesChoice("custom");
                            if (errorField === "companionSpecies") {
                              setErrorField(null);
                              setError(null);
                            }
                          }}
                          className={`rounded-xl border border-dashed px-3 py-2 text-xs font-semibold transition ${
                            petSpeciesChoice === "custom"
                              ? "border-amber-400 bg-amber-400/20 text-amber-100"
                              : "border-white/20 bg-white/[0.02] text-slate-300 hover:border-white/35"
                          }`}
                        >
                          {isUk ? "Свій варіант" : "Свой вариант"}
                        </button>
                      </div>
                      {petSpeciesChoice === "custom" && (
                        <input
                          value={customPetSpecies}
                          onChange={(e) => {
                            setCustomPetSpecies(e.target.value);
                            if (errorField === "companionSpecies") {
                              setErrorField(null);
                              setError(null);
                            }
                          }}
                          placeholder={
                            isUk
                              ? "Наприклад: хамелеон, шиншила, тхір..."
                              : "Например: хамелеон, шиншилла, хорёк..."
                          }
                          className="mt-2.5 w-full rounded-xl border border-amber-300/40 bg-white/5 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                        />
                      )}
                    </div>

                    <div
                      className={
                        errorField === "companionGender"
                          ? "rounded-xl border border-rose-400/70 bg-rose-500/10 p-2.5 -m-2.5 ring-1 ring-rose-400/40"
                          : ""
                      }
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-amber-100">
                        <span>{isUk ? "Стать улюбленця *" : "Пол питомца *"}</span>
                        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                          {isUk ? "обов'язково" : "обязательно"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(
                          [
                            {
                              k: "male" as const,
                              uk: "Хлопчик (він)",
                              ru: "Мальчик (он)",
                            },
                            {
                              k: "female" as const,
                              uk: "Дівчинка (вона)",
                              ru: "Девочка (она)",
                            },
                          ] as const
                        ).map((g) => (
                          <button
                            key={g.k}
                            type="button"
                            onClick={() => {
                              setCompanionGender(g.k);
                              if (errorField === "companionGender") {
                                setErrorField(null);
                                setError(null);
                              }
                            }}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                              companionGender === g.k
                                ? "border-amber-400 bg-amber-400/20 text-amber-100"
                                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                            }`}
                          >
                            {isUk ? g.uk : g.ru}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Family relation + gender ONLY when custom */}
                {companionType === "family" && (
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div
                      className={
                        errorField === "companionRelation"
                          ? "rounded-xl border border-rose-400/70 bg-rose-500/10 p-2.5 -m-2.5 ring-1 ring-rose-400/40"
                          : ""
                      }
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-amber-100">
                        <span>{isUk ? "Хто з рідних? *" : "Кто из родных? *"}</span>
                        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                          {isUk ? "обов'язково" : "обязательно"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {FAMILY_RELATION_OPTIONS.map((rel) => {
                          const active = familyRelationChoice === rel.id;
                          return (
                            <button
                              key={rel.id}
                              type="button"
                              onClick={() => {
                                setFamilyRelationChoice(rel.id);
                                setCompanionGender(rel.impliedGender);
                                if (
                                  errorField === "companionRelation" ||
                                  errorField === "companionGender"
                                ) {
                                  setErrorField(null);
                                  setError(null);
                                }
                              }}
                              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                active
                                  ? "border-amber-400 bg-amber-400/20 text-amber-100"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                              }`}
                            >
                              {isUk ? rel.uk : rel.ru}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            if (familyRelationChoice !== "custom") {
                              setFamilyRelationChoice("custom");
                              setCompanionGender(null);
                            }
                            if (errorField === "companionRelation") {
                              setErrorField(null);
                              setError(null);
                            }
                          }}
                          className={`rounded-xl border border-dashed px-3 py-2 text-xs font-semibold transition ${
                            familyRelationChoice === "custom"
                              ? "border-amber-400 bg-amber-400/20 text-amber-100"
                              : "border-white/20 bg-white/[0.02] text-slate-300 hover:border-white/35"
                          }`}
                        >
                          {isUk ? "Свій варіант" : "Свой вариант"}
                        </button>
                      </div>

                      {familyRelationChoice === "custom" && (
                        <input
                          value={customFamilyRelation}
                          onChange={(e) => {
                            setCustomFamilyRelation(e.target.value);
                            if (errorField === "companionRelation") {
                              setErrorField(null);
                              setError(null);
                            }
                          }}
                          placeholder={
                            isUk
                              ? "Наприклад: вітчим, мачуха, хрещений, кузина..."
                              : "Например: отчим, мачеха, крёстный, двоюродная сестра..."
                          }
                          className="mt-2.5 w-full rounded-xl border border-amber-300/40 bg-white/5 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                        />
                      )}
                    </div>

                    {familyRelationChoice === "custom" && (
                      <div
                        className={
                          errorField === "companionGender"
                            ? "rounded-xl border border-rose-400/70 bg-rose-500/10 p-2.5 -m-2.5 ring-1 ring-rose-400/40"
                            : ""
                        }
                      >
                        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-amber-100">
                          <span>{isUk ? "Стать *" : "Пол *"}</span>
                          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                            {isUk ? "обов'язково" : "обязательно"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          {(
                            [
                              {
                                k: "male" as const,
                                uk: "Чоловіча (він)",
                                ru: "Мужской (он)",
                              },
                              {
                                k: "female" as const,
                                uk: "Жіноча (вона)",
                                ru: "Женский (она)",
                              },
                            ] as const
                          ).map((g) => (
                            <button
                              key={g.k}
                              type="button"
                              onClick={() => {
                                setCompanionGender(g.k);
                                if (errorField === "companionGender") {
                                  setErrorField(null);
                                  setError(null);
                                }
                              }}
                              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                companionGender === g.k
                                  ? "border-amber-400 bg-amber-400/20 text-amber-100"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                              }`}
                            >
                              {isUk ? g.uk : g.ru}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Friend gender */}
                {companionType === "friend" && (
                  <div
                    className={`rounded-2xl border p-4 ${
                      errorField === "companionGender"
                        ? "border-rose-400/70 bg-rose-500/10 ring-1 ring-rose-400/40"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-amber-100">
                      <span>{isUk ? "Стать друга / подруги *" : "Пол друга / подруги *"}</span>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                        {isUk ? "обов'язково" : "обязательно"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(
                        [
                          { k: "male" as const, uk: "Хлопчик (він)", ru: "Мальчик (он)" },
                          { k: "female" as const, uk: "Дівчинка (вона)", ru: "Девочка (она)" },
                        ] as const
                      ).map((g) => (
                        <button
                          key={g.k}
                          type="button"
                          onClick={() => {
                            setCompanionGender(g.k);
                            if (errorField === "companionGender") {
                              setErrorField(null);
                              setError(null);
                            }
                          }}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                            companionGender === g.k
                              ? "border-amber-400 bg-amber-400/20 text-amber-100"
                              : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                          }`}
                        >
                          {isUk ? g.uk : g.ru}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  value={companionName}
                  onChange={(e) => setCompanionName(e.target.value)}
                  placeholder={
                    isUk
                      ? "Ім'я (напр. Рекс або тато Сергій)"
                      : "Имя (напр. Рекс или папа Сергей)"
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white"
                />
                <textarea
                  rows={2}
                  value={companionDescription}
                  onChange={(e) => setCompanionDescription(e.target.value)}
                  placeholder={
                    isUk
                      ? "Зовнішність і характер у 1–2 реченнях"
                      : "Внешность и характер в 1–2 предложениях"
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white"
                />

                {companionType === "friend" ? (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/25 bg-amber-400/5 p-3.5 text-xs text-amber-200">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {isUk
                        ? "З міркувань захисту персональних даних (ЗУ «Про захист персональних даних» / GDPR) для друга дозволено лише текстовий опис — фото можна завантажувати тільки для своєї сім'ї або улюбленця."
                        : "По соображениям защиты персональных данных (GDPR / защита данных детей) для друга доступно только текстовое описание — фото можно загружать только для своей семьи или питомца."}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {companionPreviewUrl && (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-amber-300/40">
                          <img
                            src={companionPreviewUrl}
                            alt="Companion preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={clearCompanionPhoto}
                            aria-label={isUk ? "Видалити фото" : "Удалить фото"}
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white hover:bg-rose-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-300/35 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-200">
                        {uploadingCompanion ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {companionPhotoName ||
                          (isUk
                            ? "Фото сім'ї / улюбленця (опц.)"
                            : "Фото семьи / питомца (опц.)")}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) =>
                            void handlePhotoUpload(e.target.files?.[0], "companion")
                          }
                        />
                      </label>
                    </div>

                    {companionType === "family" && companionPhotoUploadId && (
                      <label
                        className={`flex items-start gap-2.5 rounded-xl p-2.5 text-xs transition ${
                          errorField === "companionConsent"
                            ? "border border-rose-400/70 bg-rose-500/10 text-rose-100"
                            : "border border-white/10 bg-white/[0.03] text-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={companionConsent}
                          onChange={(e) => {
                            setCompanionConsent(e.target.checked);
                            if (errorField === "companionConsent") {
                              setErrorField(null);
                              setError(null);
                            }
                          }}
                          className="mt-0.5"
                        />
                        <span>
                          {isUk
                            ? "Підтверджую, що член сім'ї дав згоду на тимчасову обробку свого фото для створення ілюстрацій казки (фото видаляється одразу після генерації)."
                            : "Подтверждаю, что член семьи дал согласие на временную обработку его фото для создания иллюстраций сказки (фото удаляется сразу после генерации)."}
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                {isUk ? "Назад" : "Назад"}
              </button>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={skipStep4}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10"
                >
                  {isUk ? "Пропустити крок" : "Пропустить шаг"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (companionType === "none") {
                      setError(
                        isUk
                          ? "Оберіть супутника (улюбленця, рідних чи друга) або натисніть «Пропустити крок»."
                          : "Выберите спутника (питомца, родных или друга) или нажмите «Пропустить шаг»."
                      );
                      return;
                    }
                    if (!validateStep4()) return;
                    setStep(5);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#0b1020]"
                >
                  {isUk ? "Далі: іграшка й присвята" : "Далее: игрушка и посвящение"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 (Optional): Favorite Toy + Dedication */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="font-serif-book text-xl font-bold text-amber-100">
              {isUk
                ? "Крок 5 (опціонально). Улюблена іграшка та присвята"
                : "Шаг 5 (опционально). Любимая игрушка и посвящение"}
            </h2>

            <div className="space-y-3">
              <SectionHeading
                title={
                  isUk
                    ? "Улюблена іграшка або предмет (опціонально)"
                    : "Любимая игрушка или предмет (опционально)"
                }
              />
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setToyChoice("none");
                    setFavoriteToy("");
                  }}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    toyChoice === "none"
                      ? "border-amber-400 bg-amber-400/20 text-amber-100"
                      : "border-white/15 bg-white/5 text-slate-300 hover:border-white/30"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Ban className="h-3.5 w-3.5 text-amber-300" />
                    {isUk ? "Без предмета" : "Без предмета"}
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">
                    {isUk ? "за замовчуванням" : "по умолчанию"}
                  </span>
                </button>

                {TOY_PRESETS.map((tp) => {
                  const val = isUk ? tp.uk : tp.ru;
                  const active = toyChoice === "preset" && favoriteToy === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        if (active) {
                          setToyChoice("none");
                          setFavoriteToy("");
                        } else {
                          setToyChoice("preset");
                          setFavoriteToy(val);
                        }
                      }}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                        active
                          ? "border-amber-400 bg-amber-400/20 text-amber-100"
                          : "border-white/15 bg-white/5 text-slate-300 hover:border-white/30"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    if (toyChoice !== "custom") {
                      setToyChoice("custom");
                      if (TOY_PRESETS.some((tp) => tp.uk === favoriteToy || tp.ru === favoriteToy)) {
                        setFavoriteToy("");
                      }
                    }
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2.5 text-xs font-semibold transition ${
                    toyChoice === "custom"
                      ? "border-amber-400 bg-amber-400/20 text-amber-100"
                      : "border-white/20 bg-white/[0.02] text-slate-300 hover:border-white/35"
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5 text-amber-300" />
                  {isUk ? "Свій предмет" : "Свой предмет"}
                </button>
              </div>

              {toyChoice === "custom" && (
                <input
                  value={favoriteToy}
                  onChange={(e) => setFavoriteToy(e.target.value)}
                  placeholder={
                    isUk
                      ? "Введіть свій предмет (напр.: плюшевий жираф у синьому светрі)"
                      : "Введите свой предмет (напр.: плюшевый жираф в синем свитере)"
                  }
                  className="w-full rounded-xl border border-amber-300/40 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              )}
            </div>

            <div>
              <SectionHeading
                title={
                  isUk
                    ? "Присвята на титульній сторінці"
                    : "Посвящение на титульной странице"
                }
              />
              <textarea
                rows={2}
                value={dedication}
                onChange={(e) => setDedication(e.target.value)}
                placeholder={
                  isUk
                    ? "Напр.: Любому Михайлику на шостий день народження від мами й тата!"
                    : "Напр.: Любимому Артёму на шестой день рождения от мамы и папы!"
                }
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                {isUk ? "Назад" : "Назад"}
              </button>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setToyChoice("none");
                    setFavoriteToy("");
                    setDedication("");
                    void handleCreateStorybook(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50"
                >
                  {isUk ? "Пропустити крок" : "Пропустить шаг"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleCreateStorybook(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3 text-sm font-bold text-[#0b1020] shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isUk
                    ? `Створити казку · ${getStorybookPrice(pageCount)} ₴`
                    : `Создать сказку · ${getStorybookPrice(pageCount)} ₴`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
