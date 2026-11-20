import crypto from "node:crypto";
import type { Lang } from "@/lib/types";

const MONO_API_BASE = "https://api.monobank.ua/api/merchant";

let cachedPublicKeyPem: string | null = null;

export function isMonoSandboxMode(): boolean {
  const token = process.env.MONO_TOKEN?.trim();
  const sandboxFlag = process.env.MONO_SANDBOX?.trim();
  return !token || sandboxFlag === "true";
}

export async function createMonoInvoice(params: {
  orderId: string;
  amountKopiykas: number;
  productName: string;
  lang: Lang;
  baseUrl: string;
  paymentType?: "debit" | "hold";
}): Promise<{ invoiceId: string; pageUrl: string; sandbox: boolean }> {
  const token = process.env.MONO_TOKEN?.trim();

  if (!token || process.env.MONO_SANDBOX === "true") {
    const invoiceId = `sandbox_inv_${crypto.randomBytes(8).toString("hex")}`;
    return {
      invoiceId,
      pageUrl: `${params.baseUrl}/orders/${params.orderId}?sandboxPay=${invoiceId}`,
      sandbox: true,
    };
  }

  const res = await fetch(`${MONO_API_BASE}/invoice/create`, {
    method: "POST",
    headers: {
      "X-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountKopiykas,
      ccy: 980,
      merchantPaymInfo: {
        reference: params.orderId,
        destination: params.productName,
      },
      redirectUrl: `${params.baseUrl}/orders/${params.orderId}`,
      webHookUrl: `${params.baseUrl}/api/payments/mono/webhook`,
      validity: 3600,
      paymentType: params.paymentType || "debit",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Plata by mono error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { invoiceId: string; pageUrl: string };
  return {
    invoiceId: data.invoiceId,
    pageUrl: data.pageUrl,
    sandbox: false,
  };
}

async function getMonoPublicKeyPem(): Promise<string> {
  if (cachedPublicKeyPem) return cachedPublicKeyPem;
  const token = process.env.MONO_TOKEN?.trim();
  if (!token) throw new Error("MONO_TOKEN is missing");

  const res = await fetch(`${MONO_API_BASE}/pubkey`, {
    headers: { "X-Token": token },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch mono pubkey (${res.status})`);
  }
  const data = (await res.json()) as { key: string };
  cachedPublicKeyPem = Buffer.from(data.key, "base64").toString("utf-8");
  return cachedPublicKeyPem;
}

export async function verifyMonoWebhookSignature(
  rawBody: string,
  xSignHeader: string | null
): Promise<boolean> {
  if (!xSignHeader) return false;
  const pubKeyPem = await getMonoPublicKeyPem();
  const signature = Buffer.from(xSignHeader, "base64");
  const verifier = crypto.createVerify("SHA256");
  verifier.update(rawBody);
  verifier.end();
  return verifier.verify(pubKeyPem, signature);
}

export async function fetchMonoInvoiceStatus(invoiceId: string): Promise<{
  status: string;
  receiptUrl?: string;
}> {
  const token = process.env.MONO_TOKEN?.trim();
  if (!token) {
    return { status: "created" };
  }

  const res = await fetch(
    `${MONO_API_BASE}/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`,
    { headers: { "X-Token": token } }
  );
  if (!res.ok) {
    throw new Error(`Failed checking mono invoice status: ${res.status}`);
  }
  const data = (await res.json()) as { status: string; receiptUrl?: string };
  return data;
}

/**
 * Captures (writes off) previously held funds once final storybook assets succeed.
 */
export async function finalizeMonoInvoice(
  invoiceId: string,
  amountKopiykas?: number
): Promise<void> {
  const token = process.env.MONO_TOKEN?.trim();
  if (!token || isMonoSandboxMode() || invoiceId.startsWith("sandbox_")) return;

  const res = await fetch(`${MONO_API_BASE}/invoice/finalize`, {
    method: "POST",
    headers: {
      "X-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoiceId,
      ...(typeof amountKopiykas === "number" ? { amount: amountKopiykas } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Plata finalize error (${res.status}): ${errText}`);
  }
}

/**
 * Cancels an active hold (releasing blocked funds) or refunds a debited payment.
 */
export async function cancelMonoInvoice(
  invoiceId: string,
  extRef?: string
): Promise<void> {
  const token = process.env.MONO_TOKEN?.trim();
  if (!token || isMonoSandboxMode() || invoiceId.startsWith("sandbox_")) return;

  const res = await fetch(`${MONO_API_BASE}/invoice/cancel`, {
    method: "POST",
    headers: {
      "X-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoiceId,
      ...(extRef ? { extRef } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Plata cancel error (${res.status}): ${errText}`);
  }
}
