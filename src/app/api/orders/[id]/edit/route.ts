import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderResultAndEdits } from "@/lib/db";
import { assertSafeId, getOrderDirs } from "@/lib/storage";
import { AiCostTracker } from "@/lib/ai-cost";
import { rewriteSinglePageText } from "@/lib/storybook/writer";
import { regenerateSinglePageIllustration } from "@/lib/storybook/illustrator";
import { buildStorybookPdf } from "@/lib/storybook/pdf";
import type { StorybookOrderPayload, StorybookResult } from "@/lib/types";

interface EditRequestBody {
  action: "manual_text" | "ai_rewrite_text" | "ai_regenerate_image";
  pageNumber: number;
  heading?: string;
  text?: string;
  instruction?: string;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const order = getOrderById(assertSafeId(id));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.productType !== "storybook" || !order.result) {
      return NextResponse.json(
        { error: "Page editing is currently supported for ready storybooks." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as EditRequestBody;
    const payload = order.payload as StorybookOrderPayload;
    const result = order.result as StorybookResult;
    const pageIndex = result.pages.findIndex((p) => p.pageNumber === body.pageNumber);
    if (pageIndex === -1) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const isAiAction = body.action !== "manual_text";
    if (isAiAction && order.aiEditsUsed >= order.aiEditsLimit) {
      return NextResponse.json(
        { error: "AI edit quota reached for this book." },
        { status: 429 }
      );
    }

    const { clean, preview } = getOrderDirs(order.id);
    const updatedPages = [...result.pages];
    const targetPage = updatedPages[pageIndex];
    const costTracker = new AiCostTracker();

    if (body.action === "manual_text") {
      updatedPages[pageIndex] = {
        ...targetPage,
        heading: body.heading?.trim() || targetPage.heading,
        text: body.text?.trim() || targetPage.text,
      };
    } else if (body.action === "ai_rewrite_text") {
      const instruction = String(body.instruction || "").trim();
      if (!instruction) {
        return NextResponse.json({ error: "Instruction is required" }, { status: 400 });
      }
      const rewritten = await rewriteSinglePageText({
        lang: payload.lang,
        childName: payload.childName,
        gender: payload.gender,
        ageGroup: payload.ageGroup,
        bookTitle: result.title,
        currentHeading: targetPage.heading,
        currentText: targetPage.text,
        instruction,
        costTracker,
      });
      updatedPages[pageIndex] = {
        ...targetPage,
        heading: rewritten.heading,
        text: rewritten.text,
      };
    } else if (body.action === "ai_regenerate_image") {
      if (!targetPage.cleanImageFile) {
        return NextResponse.json(
          {
            error:
              order.lang === "uk"
                ? "Ілюстрація цієї сторінки створюється одразу після оплати; зараз можна правити текст будь-якої сторінки або малюнок стор. 1–2."
                : "Иллюстрация этой страницы создаётся сразу после оплаты; сейчас можно править текст любой страницы или рисунок стр. 1–2.",
          },
          { status: 400 }
        );
      }
      const instruction = String(body.instruction || "").trim();
      if (!instruction) {
        return NextResponse.json({ error: "Visual instruction is required" }, { status: 400 });
      }
      const anchorPath = path.join(clean, result.anchorImageFile || "anchor.png");
      const companionAnchorPath = result.companionAnchorFile
        ? path.join(clean, result.companionAnchorFile)
        : null;
      const newPage = await regenerateSinglePageIllustration({
        payload,
        visualBible: result.visualBible,
        page: targetPage,
        instruction,
        anchorPath,
        companionAnchorPath,
        cleanDir: clean,
        previewDir: preview,
        costTracker,
      });
      updatedPages[pageIndex] = newPage;
    } else {
      return NextResponse.json({ error: "Unknown edit action" }, { status: 400 });
    }

    costTracker.flushToOrder(order.id);

    const updatedResult: StorybookResult = {
      ...result,
      pages: updatedPages,
    };

    // Recompile preview PDF (and clean PDF if Stage 2 is already complete)
    await buildStorybookPdf({
      result: updatedResult,
      layoutMode: payload.layoutMode,
      lang: payload.lang,
      cleanDir: clean,
      previewDir: preview,
      mode: "preview",
      outPath: path.join(preview, updatedResult.previewPdfFile),
    });

    if (updatedResult.generationStage !== "preview_partial") {
      await buildStorybookPdf({
        result: updatedResult,
        layoutMode: payload.layoutMode,
        lang: payload.lang,
        cleanDir: clean,
        previewDir: preview,
        mode: "clean",
        outPath: path.join(clean, updatedResult.cleanPdfFile),
      });
    }

    const saved = updateOrderResultAndEdits(order.id, updatedResult, isAiAction);

    return NextResponse.json({
      ok: true,
      aiEditsUsed: saved?.aiEditsUsed ?? order.aiEditsUsed,
      aiEditsLimit: saved?.aiEditsLimit ?? order.aiEditsLimit,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed editing order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
