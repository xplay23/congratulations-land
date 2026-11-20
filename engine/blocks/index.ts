import type { Block } from "payload";
import {
  CTABlock,
  FAQBlock,
  PrivacyTrustBlock,
  ReviewsBlock,
  SpacerBlock,
  StepsBlock,
  TextBlock,
} from "./content";
import {
  BlogGridBlock,
  HeroBlock,
  LiveDemosBlock,
  PricingTableBlock,
  ServicesCatalogBlock,
} from "./catalog";

import {
  BannerBlock,
  FeaturesBlock,
  IconListBlock,
  LogosBlock,
  ManifestoBlock,
  PaymentLogosBlock,
  PricingCardsBlock,
  StatsBlock,
  TextImageBlock,
  VideoBlock,
} from "./extra";

/** Blocks available on standard CMS Pages and Services extra builder areas */
export const pageBuilderBlocks: Block[] = [
  BannerBlock,
  ManifestoBlock,
  FeaturesBlock,
  IconListBlock,
  StatsBlock,
  TextImageBlock,
  VideoBlock,
  LogosBlock,
  PricingCardsBlock,
  PaymentLogosBlock,
  FAQBlock,
  ReviewsBlock,
  TextBlock,
  StepsBlock,
  PrivacyTrustBlock,
  PricingTableBlock,
  LiveDemosBlock,
  ServicesCatalogBlock,
  BlogGridBlock,
  CTABlock,
  SpacerBlock,
];

/** Full set of blocks for HomeTemplate (includes HeroBlock) */
export const homeBuilderBlocks: Block[] = [
  HeroBlock,
  ...pageBuilderBlocks,
];

export {
  HeroBlock,
  LiveDemosBlock,
  ServicesCatalogBlock,
  PricingTableBlock,
  StepsBlock,
  PrivacyTrustBlock,
  ReviewsBlock,
  FAQBlock,
  TextBlock,
  BlogGridBlock,
  CTABlock,
  SpacerBlock,
};
