export type Lang = "uk" | "ru";
export type ProductType = "storybook" | "video";
export type ServiceId =
  | "storybook"
  | "video"
  | "photo_animation"
  | "song"
  | "postcard";
export type OrderStatus = "draft" | "generating" | "preview_ready" | "paid" | "failed";

export type ChildGender = "girl" | "boy";
export type AgeGroup = "2-3" | "4-5" | "6-8";
export type LayoutMode = "classic" | "panorama";
export type ArtStyle =
  | "watercolor"
  | "3d_pixar"
  | "folk_storybook"
  | "pencil_gouache"
  | "2d_animation"
  | "claymation";
export type StoryTone = "cozy" | "magical" | "adventure" | "funny";
export type CompanionType = "none" | "pet" | "family" | "friend";
export type CompanionGender = "male" | "female";

export interface StorybookOrderPayload {
  lang: Lang;
  childName: string;
  childNameVocative?: string;
  gender: ChildGender;
  ageGroup: AgeGroup;
  photoUploadId?: string;
  parentalConsent: boolean;
  hairColor?: string;
  eyeColor?: string;
  hasGlasses?: boolean;

  layoutMode: LayoutMode;
  artStyle: ArtStyle;

  tone: StoryTone;
  setting: string;
  plotIdea: string;
  pageCount: number;

  companionType: CompanionType;
  companionSpecies?: string;
  companionRelation?: string;
  companionGender?: CompanionGender;
  companionName?: string;
  companionDescription?: string;
  companionPhotoUploadId?: string;
  companionConsent?: boolean;

  favoriteToy?: string;
  dedication?: string;
}

export interface VideoOrderPayload {
  lang: Lang;
  character: "st_nicholas";
  variationSlug?: string;
  childName: string;
  childNameVocative?: string;
  gender: ChildGender;
  age: string;
  achievement: string;
  photoUploadId: string;
  parentalConsent: boolean;
}

export interface StoryPageItem {
  pageNumber: number;
  heading: string;
  text: string;
  imagePrompt: string;
  shotType?: string;
  cameraAngle?: string;
  subjectPoseAndGaze?: string;
  companionPresent?: boolean;
  companionInForeground?: boolean;
  textZone?: "left" | "right";
  cleanImageFile?: string;
  previewImageFile?: string;
  imageRevision?: number;
}

export interface StoryVisualBible {
  characterLock: string;
  clothingLock: string;
  companionLock?: string;
  recurringToyLock?: string;
  keyObjectsLock?: string;
  styleLock: string;
  paletteLock: string;
}

export interface StorybookResult {
  generationStage?: "preview_partial" | "finalizing" | "complete";
  title: string;
  subtitle: string;
  dedication?: string;
  visualBible: StoryVisualBible;
  anchorImageFile?: string;
  companionAnchorFile?: string;
  coverPrompt: string;
  coverCleanFile: string;
  coverPreviewFile: string;
  pages: StoryPageItem[];
  previewPdfFile: string;
  cleanPdfFile: string;
  modeUsed: "openai" | "demo";
  writerNotes?: string[];
}

export interface VideoResult {
  scriptLines: {
    line03: string;
    line04b: string;
    line07_1: string;
  };
  previewVideoFile: string;
  cleanVideoFile: string;
  durationSeconds?: number;
  modeUsed: "real_ffmpeg_elevenlabs" | "real_ffmpeg_demo_audio";
}

export interface AiUsageStep {
  step: string;
  provider: "openai_text" | "openai_vision" | "openai_image" | "elevenlabs";
  model: string;
  calls: number;
  inputTokens?: number;
  outputTokens?: number;
  size?: string;
  quality?: string;
  characters?: number;
  costUsd: number;
}

export interface OrderAiCost {
  currency: "USD";
  usdToUahRate: number;
  totalUsd: number;
  totalUahKopiykas: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalImageCalls: number;
  visionQaRetries: number;
  elevenLabsChars: number;
  breakdown: AiUsageStep[];
  updatedAt: string;
}

export interface ServicePricingItem {
  id: ServiceId;
  stage: number;
  enabled: boolean;
  comingSoon?: boolean;
  title: { uk: string; ru: string };
  description: { uk: string; ru: string };
  badgeLabel?: { uk: string; ru: string };
  ctaLabel?: { uk: string; ru: string };
  features?: { uk: string[]; ru: string[] };
  basePriceUah: number;
  tiers?: Record<string, number>;
}

export interface PricingConfig {
  currency: "UAH";
  services: Record<ServiceId, ServicePricingItem>;
  updatedAt: string;
}

export interface PlatformLimitsConfig {
  maxPreviewOrdersPerSession: number;
  maxAiEditsPerBook: number;
  maxAiEditsPerVideo: number;
  orderRetentionDays: number;
  updatedAt: string;
}

export interface AiRatesConfig {
  usdToUah: number;
  textModels: Record<string, { inputPer1M: number; outputPer1M: number }>;
  imagePerCallUsd: Record<string, number>;
  elevenLabsPer1kCharsUsd: number;
  updatedAt: string;
}

export interface OrderRecord {
  id: string;
  sessionId: string;
  productType: ProductType;
  lang: Lang;
  status: OrderStatus;
  progressStep: string;
  progressPercent: number;
  errorMessage?: string | null;
  payload: StorybookOrderPayload | VideoOrderPayload;
  result?: StorybookResult | VideoResult | null;
  aiCost?: OrderAiCost | null;
  aiEditsUsed: number;
  aiEditsLimit: number;
  priceKopiykas: number;
  monoInvoiceId?: string | null;
  monoPaymentUrl?: string | null;
  monoStatus?: string | null;
  receiptUrl?: string | null;
  customerEmail?: string | null;
  accessToken: string;
  telegramChatId?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
