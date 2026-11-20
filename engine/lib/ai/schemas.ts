import { z } from "zod";

export const SeoSchema = z.object({
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(165),
});

export const PostCategorizationSchema = z.object({
  category: z.string(),
  isNew: z.boolean(),
});

export const TranslationResultSchema = z.object({
  translated: z.record(z.string(), z.string()),
});

export type SeoResult = z.infer<typeof SeoSchema>;
export type PostCategorization = z.infer<typeof PostCategorizationSchema>;
export type TranslationResult = z.infer<typeof TranslationResultSchema>;
