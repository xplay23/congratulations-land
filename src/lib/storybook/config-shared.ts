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
} from "@/lib/i18n";
import type { CompanionGender, LayoutMode } from "@/lib/types";

export interface LocalizedPair {
  uk: string;
  ru: string;
}

export type StorybookMediumPreset =
  | "2d_illustration"
  | "3d_animation"
  | "claymation_stopmotion"
  | "custom";

export interface StorybookStyleConfig {
  slug: string;
  title: LocalizedPair;
  description: LocalizedPair;
  badge?: LocalizedPair;
  previewImageUrl: string;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
  stylePrompt: string;
  mediumPreset: StorybookMediumPreset;
  mediumRuleOverride?: string;
  negativeRulesOverride?: string;
}

export interface StorybookPublicStyle {
  slug: string;
  title: LocalizedPair;
  description: LocalizedPair;
  badge?: LocalizedPair;
  previewImageUrl: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface StorybookLayoutConfig {
  code: LayoutMode;
  enabled: boolean;
  isDefault: boolean;
  label: LocalizedPair;
  description: LocalizedPair;
  badge?: LocalizedPair;
  previewImageUrl: string;
}

export interface StorybookAgeGroupConfig {
  code: string;
  enabled: boolean;
  isDefault: boolean;
  label: LocalizedPair;
  hint: LocalizedPair;
  wordRange: string;
  writerNote?: string;
}

export interface StorybookPageVolumeConfig {
  pages: number;
  enabled: boolean;
  isDefault: boolean;
  readingTimeLabel: LocalizedPair;
}

export interface StorybookToneConfig {
  slug: string;
  enabled: boolean;
  icon: string;
  label: LocalizedPair;
  subtitle: LocalizedPair;
  promptHint?: string;
}

export interface StorybookWorldOrPlotConfig {
  slug: string;
  enabled: boolean;
  icon: string;
  title: LocalizedPair;
  description: LocalizedPair;
  promptValue: LocalizedPair;
  previewImageUrl?: string;
}

export interface StorybookPresetConfig {
  slug: string;
  label?: LocalizedPair;
  toneSlug: string;
  settingSlug: string;
  plotSlug: string;
  styleSlug?: string;
}

export interface StorybookSwatchConfig {
  slug: string;
  color: string;
  label: LocalizedPair;
  promptEn?: string;
}

export interface StorybookPetSpeciesConfig {
  slug: string;
  enabled: boolean;
  label: LocalizedPair;
  promptEn: string;
}

export interface StorybookFamilyRelationConfig {
  slug: string;
  enabled: boolean;
  label: LocalizedPair;
  promptEn: string;
  impliedGender: CompanionGender | "ask";
}

export interface StorybookToyPresetConfig {
  label: LocalizedPair;
}

export interface StorybookPipelinePrompts {
  beatsSystem: string;
  draftSystem: string;
  proofreadSystem: string;
  directorSystem: string;
  visionQa: string;
}

export interface StorybookPdfConfig {
  watermarkText: LocalizedPair;
  jpegQuality: number;
  decorCornerVignettePath?: string;
  decorDedicationWreathPath?: string;
  decorChapterDividerPath?: string;
  decorCoverCornerPath?: string;
  decorCoverBackdropPath?: string;
}

export interface StorybookRuntimeConfig {
  styles: StorybookStyleConfig[];
  layouts: StorybookLayoutConfig[];
  ageGroups: StorybookAgeGroupConfig[];
  previewPagesCount: number;
  defaultPageCount: number;
  pageVolumes: StorybookPageVolumeConfig[];
  tones: StorybookToneConfig[];
  settings: StorybookWorldOrPlotConfig[];
  plots: StorybookWorldOrPlotConfig[];
  presets: StorybookPresetConfig[];
  hairSwatches: StorybookSwatchConfig[];
  eyeSwatches: StorybookSwatchConfig[];
  petSpecies: StorybookPetSpeciesConfig[];
  familyRelations: StorybookFamilyRelationConfig[];
  toyPresets: StorybookToyPresetConfig[];
  prompts: StorybookPipelinePrompts;
  pdf: StorybookPdfConfig;
  cacheVersion: number;
}

export interface StorybookPublicConfig {
  styles: StorybookPublicStyle[];
  layouts: StorybookLayoutConfig[];
  ageGroups: Omit<StorybookAgeGroupConfig, "writerNote">[];
  previewPagesCount: number;
  defaultPageCount: number;
  pageVolumes: StorybookPageVolumeConfig[];
  tones: Omit<StorybookToneConfig, "promptHint">[];
  settings: StorybookWorldOrPlotConfig[];
  plots: StorybookWorldOrPlotConfig[];
  presets: StorybookPresetConfig[];
  hairSwatches: StorybookSwatchConfig[];
  eyeSwatches: StorybookSwatchConfig[];
  petSpecies: StorybookPetSpeciesConfig[];
  familyRelations: StorybookFamilyRelationConfig[];
  toyPresets: StorybookToyPresetConfig[];
}

export const DEFAULT_STORYBOOK_PROMPTS: StorybookPipelinePrompts = {
  beatsSystem: `You are a master children's book architect writing in {{langName}}. Build concrete, warm, sensory story beats (never preachy). Strictly respect the declared child gender and companion species/relation/gender (for example, never turn a dog into a cat or change a companion's gender).`,
  draftSystem: `You are an acclaimed children's author in {{langName}}.
Write warm, rhythmic read-aloud prose ({{wordRange}} words per page), concrete sensory details matching the chosen setting's season and world (e.g., rustle of leaves, warm bread, creak of wood — never inject snow or winter unless the setting calls for it), zero robotic AI clichés ("вдруг понял, что главное сокровище — дружба"), zero moralizing lectures.
Never put emojis, stars (★), or decorative symbols in titles, headings, or text — use plain Cyrillic prose and standard punctuation only.
Strictly preserve the child's gender and the companion's exact species/relation and gender (e.g. male dog MUST act, sound, and take masculine verbs like a dog — NEVER meow or purr!).
If layoutMode is "panorama", assign alternating "textZone": "left" or "right".`,
  proofreadSystem: `You are a meticulous native {{langName}} literary proofreader for children's books.
Check and fix:
1) Case endings and declensions of the child's name "{{childName}}" (e.g., avoid errors like "вёл Мила" -> "вёл Милу").
2) In Ukrainian: use proper кличний відмінок ({{childNameVocative}}) in direct speech.
3) Consistent verb/adjective gender for child ({{genderPronoun}}) AND for the companion ({{companionSummary}}). Fix any species mismatch (e.g. if companion is a dog, remove cat sounds like "муркоче"/"мурлычет").
4) Natural punctuation, em-dashes, and warm read-aloud rhythm without changing the plot or shortening pages below {{wordRange}} words. Remove any emojis or decorative symbols like ★/✦.`,
  directorSystem: `You are a master children's book Visual Director and Continuity Supervisor.
You receive FINAL proofread book pages and must design the VisualBible + per-page camera/composition/physics directing briefs so every illustration matches the text 1-to-1, avoids anatomical/physics glitches, keeps recurring story objects identical across pages, and NEVER repeats front-facing camera stares.

STRICT DIRECTING RULES (apply universally across any story world):
1. Camera variety & realistic scale: across pages, vary shot types and camera angles (wide over-the-shoulder three-quarter rear view, low-angle side-profile action, high-angle diagonal path view, intimate profile close-up on activity, wide environmental establishing shot). Keep foreground characters in realistic human scale relative to nearby midground paths, stalls, furniture, or bystanders, and never have characters stare blankly into the camera lens.
2. Strict spatial & character separation: match WHO is physically WHERE in the finalized page text. If a companion is far away in the background while the main child is in the foreground, set "companionPresent": true, "companionInForeground": false and place the companion strictly once at that distant spot — never duplicate them in the foreground. If absent from that page's text, set "companionPresent": false, "companionInForeground": false.
3. Permanent locks & recurring objects: keep "companionLock" and "clothingLock" free of transient one-off props. Any recurring story vehicle, vessel, creature, or landmark appearing on multiple pages MUST be locked in "keyObjectsLock" with rich silhouette, structure, and color palette so its design stays consistent across pages. Omit one-off props from earlier pages on later pages unless the current page text uses them.
4. Layered depth & strict Z-order occlusion: structure every "imagePrompt" explicitly in rich, atmospheric layers: [Shot & Camera Angle] -> [Foreground framing/details] -> [Midground subjects & actions] -> [Background scenery] -> [Constraints]. Whenever a scene looks through a window, doorway, arch, or railing, explicitly keep the frame and mullions/bars unbroken in the foreground in front of all exterior scenery so distant objects stay strictly behind glass and framing.
5. 3D perspective alignment: describe angled vehicles, sails, banners, flags, or signs aligned naturally with the object's heading and wind direction in 3D perspective — never flatten a side-viewed surface toward the viewer.
6. Isolated hands, natural creature poses & trails: never stage two characters' hands touching or handing over the same small object simultaneously (give each character an independent object or clear gesture). Non-human creatures interact naturally without extra paws or human thumbs (never force closed snouts flush against food). Any footprints, paw prints, or tracks trail strictly behind the walker with toes/tips pointing forward in the direction of travel, leaving ground ahead unmarked.
7. Style & Layout fidelity:
   - Art style is "{{styleDesc}}". Maintain rich painterly storybook detail, lighting, and atmosphere while keeping 2D illustrated proportions (never photorealistic skin pores or fabric macro).
   - For "coverPrompt": compose a warm full-body vertical cover scene (1024x1536) with boots/feet clearly visible on a firm path (~78% down from top), leaving calm sky/canopy in the top 18% and quiet foreground in bottom 20% for title typography.
   - If layoutMode is "panorama", preserve a quiet low-contrast scenic zone on each page's assigned "textZone" ("left" or "right" third) without lining characters up toward the viewer.`,
  visionQa: `Check for ANY major defect in these 4 categories:
1) Depth/Occlusion/Perspective: e.g. distant outdoor objects crossing in front of indoor window bars/frames, flattened billboard sails on angled vehicles, or footprints pointing backwards.
2) Anatomy & Hands: extra/missing limbs, fused fingers gripping one shared item, mutated animal paws.
3) Spatial/Story Mismatch: duplicate character clone in foreground when meant to be distant, wrong pet species, or missing core scene subject.
4) Format: split panels, collage borders, or visible text/letters inside the artwork.`,
};

export const MEDIUM_TRANSLATION_DEFAULTS: Record<StorybookMediumPreset, string> = {
  "2d_illustration":
    "Translate the subject 100% into a flat 2D hand-drawn storybook illustration matching the exact art style (stylized 2D illustrated face, eyes, hair, and garments — ZERO photorealistic skin, ZERO pores, ZERO photographic lighting or real-world fabric macro, ZERO canvas weave or wavy halftone ripple).",
  "3d_animation":
    "Translate the subject completely into a stylized 3D animated theatrical feature film character (smooth stylized CGI skin and proportions, expressive large eyes, sculpted hair, clean smooth render without noisy paper/canvas grain).",
  claymation_stopmotion:
    "Translate the subject completely into a charming handcrafted stop-motion claymation miniature puppet (smooth matte sculpted plasticine head and hands, glossy bead-like doll eyes, simple sculpted nose and rosy cheeks — NEVER photorealistic human skin or photo face paste).",
  custom:
    "Translate the subject completely into the target children's book art style with warm stylized character proportions and zero photorealistic photo-paste artifacts.",
};

export const NEGATIVE_RULES_DEFAULTS: Record<StorybookMediumPreset, string> = {
  "2d_illustration":
    "Clean smooth matte illustration finish: NO canvas weave, NO corduroy bump, NO diagonal wavy hatching, NO noisy halftone ripple, NO photorealistic skin or photo collage.",
  "3d_animation":
    "Clean smooth render without noisy canvas grain or wavy halftone artifacts.",
  claymation_stopmotion:
    "Clean smooth render without noisy canvas grain or wavy halftone artifacts.",
  custom:
    "Clean smooth finish without noisy canvas grain, moire, or photorealistic photo collage.",
};

export function resolveMediumTranslationRule(style: {
  mediumPreset?: StorybookMediumPreset;
  mediumRuleOverride?: string;
}): string {
  if (style.mediumRuleOverride?.trim()) return style.mediumRuleOverride.trim();
  const preset = style.mediumPreset || "2d_illustration";
  return MEDIUM_TRANSLATION_DEFAULTS[preset] || MEDIUM_TRANSLATION_DEFAULTS["2d_illustration"];
}

export function resolveNegativeRules(style: {
  mediumPreset?: StorybookMediumPreset;
  negativeRulesOverride?: string;
}): string {
  if (style.negativeRulesOverride?.trim()) return style.negativeRulesOverride.trim();
  const preset = style.mediumPreset || "2d_illustration";
  return NEGATIVE_RULES_DEFAULTS[preset] || NEGATIVE_RULES_DEFAULTS["2d_illustration"];
}

export const STORYBOOK_STYLE_TEST_SCENES: Array<{
  id: string;
  labelRu: string;
  labelUk: string;
  prompt: string;
}> = [
  {
    id: "winter_lighthouse",
    labelRu: "Зимний маяк и фонарик (классика)",
    labelUk: "Зимовий маяк і ліхтарик (класика)",
    prompt:
      "A 6-year-old child in a cozy teal wool coat and berry knitted scarf standing beside a friendly golden retriever puppy on a winding snowy pine-forest path leading toward a glowing warm lighthouse at twilight, holding a small brass lantern, natural three-quarter angle, warm golden light and twilight blue sky.",
  },
  {
    id: "dinosaurs_valley",
    labelRu: "Долина динозавров (проверка анатомии и деталей)",
    labelUk: "Долина динозаврів (перевірка анатомії й деталей)",
    prompt:
      "Over-the-shoulder three-quarter view of a curious 5-year-old child with a small canvas backpack watching a gentle leafy-green triceratops drinking from a sparkling jungle river surrounded by giant ferns, sunlit waterfalls, and warm golden rays.",
  },
  {
    id: "lakeside_fair",
    labelRu: "Ярмарка у озера и лодка (проверка мотивов и перспективы)",
    labelUk: "Ярмарок біля озера й човен (перевірка мотивів і перспективи)",
    prompt:
      "Wide scenic storybook view of a cheerful child walking along a wooden lakeside pier past cozy market stalls with baskets of apples and lanterns toward a small wooden sailboat angled gracefully on calm sunlit water.",
  },
  {
    id: "cozy_greenhouse",
    labelRu: "Солнечная теплица (окна, лейка и перекрытия)",
    labelUk: "Сонячна теплиця (вікна, лійка й перекриття)",
    prompt:
      "Warm sunlit glass conservatory interior with wooden window frames in the foreground looking out onto a blooming garden; a smiling 6-year-old child carefully watering potted herbs with a simple plain copper watering can while a fluffy tabby cat watches from a wooden bench.",
  },
];

const LEGACY_ICON_TO_LUCIDE: Record<string, string> = {
  wand: "Wand2",
  rocket: "Rocket",
  waves: "Waves",
  paw: "Footprints",
  cpu: "Cpu",
  home: "Home",
  snowflake: "Snowflake",
  compass: "Compass",
  heart: "Heart",
  shield: "Shield",
  sparkles: "Sparkles",
  map: "Map",
  moon: "Moon",
  smile: "Smile",
};

export function normalizeStorybookIconName(raw: string | undefined, fallback = "Sparkles"): string {
  if (!raw || !raw.trim()) return fallback;
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (LEGACY_ICON_TO_LUCIDE[lower]) return LEGACY_ICON_TO_LUCIDE[lower];
  return trimmed;
}

export function buildStaticStorybookRuntimeConfig(): StorybookRuntimeConfig {
  const stylesOrder: Array<{
    slug: string;
    mediumPreset: StorybookMediumPreset;
    isDefault?: boolean;
  }> = [
    { slug: "watercolor", mediumPreset: "2d_illustration", isDefault: true },
    { slug: "3d_pixar", mediumPreset: "3d_animation" },
    { slug: "folk_storybook", mediumPreset: "2d_illustration" },
    { slug: "pencil_gouache", mediumPreset: "2d_illustration" },
    { slug: "2d_animation", mediumPreset: "2d_illustration" },
    { slug: "claymation", mediumPreset: "claymation_stopmotion" },
  ];

  const styles: StorybookStyleConfig[] = stylesOrder.map((entry, idx) => {
    const meta = ART_STYLE_META[entry.slug];
    return {
      slug: entry.slug,
      title: { uk: meta.label.uk, ru: meta.label.ru },
      description: { uk: meta.desc.uk, ru: meta.desc.ru },
      previewImageUrl: meta.previewImage,
      enabled: true,
      isDefault: Boolean(entry.isDefault),
      sortOrder: (idx + 1) * 10,
      stylePrompt: meta.prompt,
      mediumPreset: entry.mediumPreset,
    };
  });

  const layouts: StorybookLayoutConfig[] = (["classic", "panorama"] as const).map((code) => {
    const meta = LAYOUT_META[code];
    return {
      code,
      enabled: true,
      isDefault: code === "classic",
      label: { uk: meta.label.uk, ru: meta.label.ru },
      description: { uk: meta.desc.uk, ru: meta.desc.ru },
      badge: meta.badge ? { uk: meta.badge.uk, ru: meta.badge.ru } : undefined,
      previewImageUrl: meta.previewImage,
    };
  });

  const ageGroups: StorybookAgeGroupConfig[] = [
    {
      code: "2-3",
      enabled: true,
      isDefault: false,
      label: { uk: "Малюк", ru: "Малыш" },
      hint: { uk: "Короткі речення", ru: "Короткие фразы" },
      wordRange: "25–40",
      writerNote: "Very gentle, rhythmic short sentences for toddlers.",
    },
    {
      code: "4-5",
      enabled: true,
      isDefault: false,
      label: { uk: "Дошкільня", ru: "Дошкольник" },
      hint: { uk: "Яскрава історія", ru: "Яркая история" },
      wordRange: "50–70",
      writerNote: "Vivid sensory imagery and playful dialogue for preschoolers.",
    },
    {
      code: "6-8",
      enabled: true,
      isDefault: true,
      label: { uk: "Школяр", ru: "Школьник" },
      hint: { uk: "Розгорнута казка", ru: "Развёрнутая сказка" },
      wordRange: "75–105",
      writerNote: "Richer narrative arc and clever curiosity for early school kids.",
    },
  ];

  const pageVolumes: StorybookPageVolumeConfig[] = [
    {
      pages: 4,
      enabled: true,
      isDefault: false,
      readingTimeLabel: { uk: "~3 хв читання", ru: "~3 мин чтения" },
    },
    {
      pages: 6,
      enabled: true,
      isDefault: true,
      readingTimeLabel: { uk: "~5 хв (оптимум)", ru: "~5 мин (оптимум)" },
    },
    {
      pages: 8,
      enabled: true,
      isDefault: false,
      readingTimeLabel: { uk: "~7 хв (довга)", ru: "~7 мин (длинная)" },
    },
  ];

  const toneIcons: Record<string, string> = {
    cozy: "Moon",
    magical: "Sparkles",
    adventure: "Compass",
    funny: "Smile",
  };

  const tones: StorybookToneConfig[] = Object.keys(TONE_LABELS).map((slug) => ({
    slug,
    enabled: true,
    icon: toneIcons[slug] || "Sparkles",
    label: { uk: TONE_LABELS[slug].uk, ru: TONE_LABELS[slug].ru },
    subtitle: { uk: TONE_SUBTITLES[slug].uk, ru: TONE_SUBTITLES[slug].ru },
  }));

  const settings: StorybookWorldOrPlotConfig[] = SETTING_OPTIONS.map((opt) => ({
    slug: opt.id,
    enabled: true,
    icon: normalizeStorybookIconName(opt.icon),
    title: { uk: opt.title.uk, ru: opt.title.ru },
    description: { uk: opt.desc.uk, ru: opt.desc.ru },
    promptValue: { uk: opt.value.uk, ru: opt.value.ru },
  }));

  const plots: StorybookWorldOrPlotConfig[] = PLOT_OPTIONS.map((opt) => ({
    slug: opt.id,
    enabled: true,
    icon: normalizeStorybookIconName(opt.icon),
    title: { uk: opt.title.uk, ru: opt.title.ru },
    description: { uk: opt.desc.uk, ru: opt.desc.ru },
    promptValue: { uk: opt.value.uk, ru: opt.value.ru },
  }));

  const presets: StorybookPresetConfig[] = STORYBOOK_PRESETS.map((p, idx) => ({
    slug: `preset-${idx + 1}`,
    toneSlug: p.tone,
    settingSlug: p.settingId,
    plotSlug: p.plotId,
  }));

  const hairPromptEn: Record<string, string> = {
    blonde: "blonde hair",
    brown: "light brown hair",
    dark: "dark brown hair",
    red: "ginger red hair",
  };
  const eyePromptEn: Record<string, string> = {
    blue: "blue eyes",
    green: "green eyes",
    brown: "brown eyes",
    gray: "gray eyes",
  };

  const hairSwatches: StorybookSwatchConfig[] = HAIR_SWATCHES.map((s) => ({
    slug: s.id,
    color: s.color,
    label: { uk: s.uk, ru: s.ru },
    promptEn: hairPromptEn[s.id] || s.id,
  }));

  const eyeSwatches: StorybookSwatchConfig[] = EYE_SWATCHES.map((s) => ({
    slug: s.id,
    color: s.color,
    label: { uk: s.uk, ru: s.ru },
    promptEn: eyePromptEn[s.id] || s.id,
  }));

  const petSpecies: StorybookPetSpeciesConfig[] = PET_SPECIES_OPTIONS.map((p) => ({
    slug: p.id,
    enabled: true,
    label: { uk: p.uk, ru: p.ru },
    promptEn: p.en,
  }));

  const familyRelations: StorybookFamilyRelationConfig[] = FAMILY_RELATION_OPTIONS.map((f) => ({
    slug: f.id,
    enabled: true,
    label: { uk: f.uk, ru: f.ru },
    promptEn: f.en,
    impliedGender: f.impliedGender,
  }));

  const toyPresets: StorybookToyPresetConfig[] = TOY_PRESETS.map((t) => ({
    label: { uk: t.uk, ru: t.ru },
  }));

  return {
    styles,
    layouts,
    ageGroups,
    previewPagesCount: 2,
    defaultPageCount: 6,
    pageVolumes,
    tones,
    settings,
    plots,
    presets,
    hairSwatches,
    eyeSwatches,
    petSpecies,
    familyRelations,
    toyPresets,
    prompts: { ...DEFAULT_STORYBOOK_PROMPTS },
    pdf: {
      watermarkText: {
        uk: "VIDEOVITANNYA • ЗРАЗОК • НЕ ДЛЯ ДРУКУ",
        ru: "VIDEOVITANNYA • ОБРАЗЕЦ • НЕ ДЛЯ ПЕЧАТИ",
      },
      jpegQuality: 92,
    },
    cacheVersion: 0,
  };
}

export function toPublicStorybookConfig(
  runtime: StorybookRuntimeConfig
): StorybookPublicConfig {
  const activeStyles = runtime.styles.filter((s) => s.enabled);
  const stylesSource = activeStyles.length > 0 ? activeStyles : runtime.styles;

  const activeLayouts = runtime.layouts.filter((l) => l.enabled);
  const layoutsSource = activeLayouts.length > 0 ? activeLayouts : runtime.layouts;

  const activeAges = runtime.ageGroups.filter((a) => a.enabled);
  const agesSource = activeAges.length > 0 ? activeAges : runtime.ageGroups;

  const activeVolumes = runtime.pageVolumes.filter((v) => v.enabled);
  const volumesSource = activeVolumes.length > 0 ? activeVolumes : runtime.pageVolumes;

  const activeTones = runtime.tones.filter((t) => t.enabled);
  const tonesSource = activeTones.length > 0 ? activeTones : runtime.tones;

  const activeSettings = runtime.settings.filter((s) => s.enabled);
  const settingsSource = activeSettings.length > 0 ? activeSettings : runtime.settings;

  const activePlots = runtime.plots.filter((p) => p.enabled);
  const plotsSource = activePlots.length > 0 ? activePlots : runtime.plots;

  const activePets = runtime.petSpecies.filter((p) => p.enabled);
  const activeFamily = runtime.familyRelations.filter((f) => f.enabled);

  return {
    styles: stylesSource.map((s) => ({
      slug: s.slug,
      title: s.title,
      description: s.description,
      badge: s.badge,
      previewImageUrl: s.previewImageUrl,
      isDefault: s.isDefault,
      sortOrder: s.sortOrder,
    })),
    layouts: layoutsSource,
    ageGroups: agesSource.map(({ writerNote: _wn, ...rest }) => rest),
    previewPagesCount: runtime.previewPagesCount,
    defaultPageCount: runtime.defaultPageCount,
    pageVolumes: volumesSource,
    tones: tonesSource.map(({ promptHint: _ph, ...rest }) => rest),
    settings: settingsSource,
    plots: plotsSource,
    presets: runtime.presets,
    hairSwatches: runtime.hairSwatches,
    eyeSwatches: runtime.eyeSwatches,
    petSpecies: activePets.length > 0 ? activePets : runtime.petSpecies,
    familyRelations: activeFamily.length > 0 ? activeFamily : runtime.familyRelations,
    toyPresets: runtime.toyPresets,
  };
}

export function buildStaticStorybookPublicConfig(): StorybookPublicConfig {
  return toPublicStorybookConfig(buildStaticStorybookRuntimeConfig());
}
