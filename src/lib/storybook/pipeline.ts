import path from "node:path";
import {
  claimOrderFinalization,
  completeOrderGeneration,
  failOrderGeneration,
  markOrderPaid,
  savePartialStorybookResult,
  updateOrderProgress,
} from "@/lib/db";
import { sendPaidOrderEmail } from "@/lib/email/mailer";
import { finalizeMonoInvoice, isMonoSandboxMode } from "@/lib/payments/mono";
import { deleteUploadFile, getOrderDirs } from "@/lib/storage";
import { AiCostTracker } from "@/lib/ai-cost";
import type { OrderRecord, StorybookOrderPayload, StorybookResult } from "@/lib/types";
import { generateThreeStepStory } from "./writer";
import { extractPhotoVisualPassports } from "./vision";
import {
  generateCanonicalAnchor,
  generateCompanionAnchor,
  generatePreviewBookIllustrations,
  generateRemainingBookIllustrations,
} from "./illustrator";
import { buildStorybookPdf } from "./pdf";

const activeFinalizations = new Set<string>();

/**
 * Stage 1 (pre-payment preview): extracts factual Vision traits from any uploaded photos,
 * builds full story text + VisualBible + directed scene briefs, generates canonical anchor(s),
 * cover, and the first 2 preview pages, then builds the watermarked preview PDF.
 */
export async function runStorybookPipeline(
  orderId: string,
  payload: StorybookOrderPayload
): Promise<void> {
  const costTracker = new AiCostTracker();
  try {
    const { clean, preview } = getOrderDirs(orderId);

    await updateOrderProgress(orderId, "photo_vision", 8);
    const visionPassports = await extractPhotoVisualPassports(payload, costTracker);

    const written = await generateThreeStepStory(
      payload,
      (step, pct) => {
        void updateOrderProgress(orderId, step, pct).catch(() => undefined);
      },
      visionPassports,
      costTracker
    );

    await updateOrderProgress(orderId, "anchor_portrait", 45);
    const anchorPath = await generateCanonicalAnchor({
      payload,
      visualBible: written.visualBible,
      cleanDir: clean,
      costTracker,
    });
    // Child photo is no longer needed once canonical portrait anchor is created
    deleteUploadFile(payload.photoUploadId);

    const companionAnchorPath = await generateCompanionAnchor({
      payload,
      visualBible: written.visualBible,
      cleanDir: clean,
      costTracker,
    });
    // Family/pet photo is no longer needed once companion anchor is created
    deleteUploadFile(payload.companionPhotoUploadId);

    await updateOrderProgress(orderId, "illustrations_preview", 52);
    const art = await generatePreviewBookIllustrations({
      payload,
      visualBible: written.visualBible,
      coverPrompt: written.coverPrompt,
      pages: written.pages,
      anchorPath,
      companionAnchorPath,
      cleanDir: clean,
      previewDir: preview,
      costTracker,
      onProgress: (done, total) => {
        const pct = 52 + Math.round((done / Math.max(1, total)) * 36);
        void updateOrderProgress(orderId, "illustrations_preview", pct).catch(
          () => undefined
        );
      },
    });

    await updateOrderProgress(orderId, "pdf_compile", 92);
    const previewPdfFile = "book_preview.pdf";
    const cleanPdfFile = "book_clean.pdf";

    const result: StorybookResult = {
      generationStage: "preview_partial",
      title: written.title,
      subtitle: written.subtitle,
      dedication: payload.dedication?.trim() || undefined,
      visualBible: written.visualBible,
      anchorImageFile: path.basename(anchorPath),
      companionAnchorFile: companionAnchorPath ? path.basename(companionAnchorPath) : undefined,
      coverPrompt: written.coverPrompt,
      coverCleanFile: art.coverCleanFile,
      coverPreviewFile: art.coverPreviewFile,
      pages: art.pages,
      previewPdfFile,
      cleanPdfFile,
      modeUsed: written.modeUsed,
      writerNotes: written.writerNotes,
    };

    await buildStorybookPdf({
      result,
      layoutMode: payload.layoutMode,
      lang: payload.lang,
      cleanDir: clean,
      previewDir: preview,
      mode: "preview",
      outPath: path.join(preview, previewPdfFile),
    });

    await completeOrderGeneration(orderId, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storybook generation failed";
    console.error(`[storybook:${orderId}]`, err);
    await failOrderGeneration(orderId, message);
  } finally {
    await costTracker.flushToOrder(orderId).catch((e) => {
      console.error(`[storybook:${orderId}] cost flush error:`, e);
    });
    deleteUploadFile(payload.photoUploadId);
    deleteUploadFile(payload.companionPhotoUploadId);
  }
}

async function runStorybookFinalizationWorker(
  order: OrderRecord,
  baseUrl: string
): Promise<void> {
  const costTracker = new AiCostTracker();
  try {
    const payload = order.payload as StorybookOrderPayload;
    const current = order.result as StorybookResult | null;
    if (!current) {
      throw new Error("Missing Stage 1 storybook draft");
    }

    const { clean, preview } = getOrderDirs(order.id);
    const anchorPath = path.join(clean, current.anchorImageFile || "anchor.png");
    const companionAnchorPath = current.companionAnchorFile
      ? path.join(clean, current.companionAnchorFile)
      : null;

    let workingResult: StorybookResult = {
      ...current,
      generationStage: "finalizing",
    };

    const completedPages = await generateRemainingBookIllustrations({
      payload,
      visualBible: current.visualBible,
      pages: current.pages,
      anchorPath,
      companionAnchorPath,
      cleanDir: clean,
      previewDir: preview,
      costTracker,
      onPageComplete: (updatedPages, done, totalRemaining) => {
        const pct = 55 + Math.round((done / Math.max(1, totalRemaining)) * 33);
        workingResult = {
          ...workingResult,
          pages: updatedPages,
        };
        void savePartialStorybookResult(order.id, workingResult, pct).catch(
          () => undefined
        );
        void costTracker.flushToOrder(order.id).catch(() => undefined);
      },
    });

    await updateOrderProgress(order.id, "pdf_compile", 92);

    const finalResult: StorybookResult = {
      ...workingResult,
      generationStage: "complete",
      pages: completedPages,
    };

    await buildStorybookPdf({
      result: finalResult,
      layoutMode: payload.layoutMode,
      lang: payload.lang,
      cleanDir: clean,
      previewDir: preview,
      mode: "preview",
      outPath: path.join(preview, finalResult.previewPdfFile),
    });

    await buildStorybookPdf({
      result: finalResult,
      layoutMode: payload.layoutMode,
      lang: payload.lang,
      cleanDir: clean,
      previewDir: preview,
      mode: "clean",
      outPath: path.join(clean, finalResult.cleanPdfFile),
    });

    await savePartialStorybookResult(order.id, finalResult, 97);

    // Capture the Plata by mono hold only AFTER the complete clean PDF is safely built
    if (
      !isMonoSandboxMode() &&
      order.monoInvoiceId &&
      !order.monoInvoiceId.startsWith("sandbox_") &&
      order.monoStatus === "hold"
    ) {
      await finalizeMonoInvoice(order.monoInvoiceId, order.priceKopiykas);
    }

    const paidOrder = await markOrderPaid(
      order.id,
      "success",
      order.receiptUrl || null
    );
    if (paidOrder) {
      try {
        await sendPaidOrderEmail({ order: paidOrder, baseUrl });
      } catch (mailErr) {
        console.error(`[storybook-finalize:${order.id}] email error:`, mailErr);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Post-payment finalization failed";
    console.error(`[storybook-finalize:${order.id}]`, err);
    await failOrderGeneration(order.id, message);
  } finally {
    await costTracker.flushToOrder(order.id).catch((e) => {
      console.error(`[storybook-finalize:${order.id}] cost flush error:`, e);
    });
    activeFinalizations.delete(order.id);
  }
}

export function isStorybookFinalizationActive(orderId: string): boolean {
  return activeFinalizations.has(orderId);
}

/**
 * Triggers idempotent Stage 2 post-payment generation (for remaining storybook pages)
 * and captures the Plata by mono hold once the clean PDF succeeds.
 */
export async function triggerStorybookFinalization(
  orderId: string,
  baseUrl: string,
  monoStatus: string,
  receiptUrl?: string | null
): Promise<OrderRecord | null> {
  if (activeFinalizations.has(orderId)) {
    return null;
  }

  const claimed = await claimOrderFinalization(orderId, monoStatus, receiptUrl);
  if (!claimed) {
    return null;
  }

  activeFinalizations.add(orderId);
  void runStorybookFinalizationWorker(claimed, baseUrl);
  return claimed;
}
