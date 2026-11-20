import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  deleteOrderDirectory,
  getOrderRetentionDays,
  getStoragePaths,
} from "./storage";
import type {
  Lang,
  OrderAiCost,
  OrderRecord,
  OrderStatus,
  ProductType,
  StorybookOrderPayload,
  StorybookResult,
  VideoOrderPayload,
  VideoResult,
} from "./types";

let dbInstance: DatabaseSync | null = null;

function ensureColumn(
  db: DatabaseSync,
  table: string,
  column: string,
  definition: string
): void {
  const cols = db
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;
  const { STORAGE_ROOT } = getStoragePaths();
  const dbPath = path.join(STORAGE_ROOT, "gifts.db");
  const db = new DatabaseSync(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      product_type TEXT NOT NULL,
      lang TEXT NOT NULL,
      status TEXT NOT NULL,
      progress_step TEXT NOT NULL,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      payload_json TEXT NOT NULL,
      result_json TEXT,
      ai_edits_used INTEGER NOT NULL DEFAULT 0,
      ai_edits_limit INTEGER NOT NULL DEFAULT 3,
      price_kopiykas INTEGER NOT NULL,
      mono_invoice_id TEXT,
      mono_payment_url TEXT,
      mono_status TEXT,
      receipt_url TEXT,
      customer_email TEXT,
      access_token TEXT NOT NULL DEFAULT '',
      telegram_chat_id TEXT,
      expires_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_auth_tokens (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      magic_token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_tokens (
      token TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      used_by_chat_id TEXT,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
    CREATE INDEX IF NOT EXISTS idx_orders_invoice ON orders(mono_invoice_id);
  `);

  // Safe migration for pre-existing local SQLite databases
  ensureColumn(db, "orders", "customer_email", "TEXT");
  ensureColumn(db, "orders", "access_token", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "orders", "telegram_chat_id", "TEXT");
  ensureColumn(db, "orders", "expires_at", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "orders", "ai_cost_json", "TEXT");
  ensureColumn(db, "telegram_tokens", "used_by_chat_id", "TEXT");
  ensureColumn(db, "telegram_tokens", "used_at", "TEXT");

  db.exec("CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_auth_magic ON email_auth_tokens(magic_token);");

  dbInstance = db;
  return db;
}

interface RawOrderRow {
  id: string;
  session_id: string;
  product_type: ProductType;
  lang: Lang;
  status: OrderStatus;
  progress_step: string;
  progress_percent: number;
  error_message: string | null;
  payload_json: string;
  result_json: string | null;
  ai_cost_json: string | null;
  ai_edits_used: number;
  ai_edits_limit: number;
  price_kopiykas: number;
  mono_invoice_id: string | null;
  mono_payment_url: string | null;
  mono_status: string | null;
  receipt_url: string | null;
  customer_email: string | null;
  access_token: string;
  telegram_chat_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: RawOrderRow): OrderRecord {
  const defaultExp = new Date(
    new Date(row.created_at).getTime() + getOrderRetentionDays() * 86400_000
  ).toISOString();

  return {
    id: row.id,
    sessionId: row.session_id,
    productType: row.product_type,
    lang: row.lang,
    status: row.status,
    progressStep: row.progress_step,
    progressPercent: row.progress_percent,
    errorMessage: row.error_message,
    payload: JSON.parse(row.payload_json),
    result: row.result_json ? JSON.parse(row.result_json) : null,
    aiCost: row.ai_cost_json ? (JSON.parse(row.ai_cost_json) as OrderAiCost) : null,
    aiEditsUsed: row.ai_edits_used,
    aiEditsLimit: row.ai_edits_limit,
    priceKopiykas: row.price_kopiykas,
    monoInvoiceId: row.mono_invoice_id,
    monoPaymentUrl: row.mono_payment_url,
    monoStatus: row.mono_status,
    receiptUrl: row.receipt_url,
    customerEmail: row.customer_email,
    accessToken: row.access_token || "",
    telegramChatId: row.telegram_chat_id,
    expiresAt: row.expires_at || defaultExp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function countSessionPreviewOrders(sessionId: string): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM orders WHERE session_id = ? AND status IN ('generating', 'preview_ready')"
    )
    .get(sessionId) as { cnt: number };
  return row?.cnt ?? 0;
}

export function createOrder(params: {
  sessionId: string;
  productType: ProductType;
  lang: Lang;
  payload: StorybookOrderPayload | VideoOrderPayload;
  priceKopiykas: number;
  aiEditsLimit?: number;
  retentionDays?: number;
}): OrderRecord {
  const db = getDb();
  const id = `ord_${crypto.randomBytes(8).toString("hex")}`;
  const accessToken = crypto.randomBytes(20).toString("hex");
  const now = new Date();
  const retentionDays = Math.max(1, params.retentionDays ?? getOrderRetentionDays());
  const expiresAt = new Date(
    now.getTime() + retentionDays * 24 * 60 * 60 * 1000
  ).toISOString();
  const aiEditsLimit = params.aiEditsLimit ?? Number(process.env.MAX_AI_EDITS_PER_BOOK || "3");

  db.prepare(
    `INSERT INTO orders (
      id, session_id, product_type, lang, status, progress_step, progress_percent,
      payload_json, ai_edits_used, ai_edits_limit, price_kopiykas,
      access_token, expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'generating', 'queued', 5, ?, 0, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.sessionId,
    params.productType,
    params.lang,
    JSON.stringify(params.payload),
    aiEditsLimit,
    params.priceKopiykas,
    accessToken,
    expiresAt,
    now.toISOString(),
    now.toISOString()
  );

  const created = getOrderById(id);
  if (!created) throw new Error("Failed to read created order");
  return created;
}

export function getOrderById(id: string): OrderRecord | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(id) as unknown as RawOrderRow | undefined;
  return row ? mapRow(row) : null;
}

export function getOrderByInvoiceId(invoiceId: string): OrderRecord | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM orders WHERE mono_invoice_id = ?")
    .get(invoiceId) as unknown as RawOrderRow | undefined;
  return row ? mapRow(row) : null;
}

export function getOrdersByEmail(email: string): OrderRecord[] {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const rows = db
    .prepare(
      `SELECT * FROM orders
       WHERE LOWER(customer_email) = ? AND (expires_at = '' OR expires_at > ?)
       ORDER BY created_at DESC`
    )
    .all(normalized, nowIso) as unknown as RawOrderRow[];
  return rows.map(mapRow);
}

export function setOrderCustomerEmail(id: string, email: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE orders SET customer_email = ?, updated_at = ? WHERE id = ?"
  ).run(email.trim().toLowerCase(), now, id);
}

export function updateOrderProgress(
  id: string,
  progressStep: string,
  progressPercent: number,
  status?: OrderStatus
): void {
  const db = getDb();
  const now = new Date().toISOString();
  if (status) {
    db.prepare(
      "UPDATE orders SET progress_step = ?, progress_percent = ?, status = ?, updated_at = ? WHERE id = ?"
    ).run(progressStep, progressPercent, status, now, id);
  } else {
    db.prepare(
      "UPDATE orders SET progress_step = ?, progress_percent = ?, updated_at = ? WHERE id = ?"
    ).run(progressStep, progressPercent, now, id);
  }
}

export function completeOrderGeneration(
  id: string,
  result: StorybookResult | VideoResult
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders
     SET status = 'preview_ready', progress_step = 'preview_ready', progress_percent = 100,
         result_json = ?, error_message = NULL, updated_at = ?
     WHERE id = ?`
  ).run(JSON.stringify(result), now, id);
}

export function failOrderGeneration(id: string, errorMessage: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders
     SET status = 'failed', progress_step = 'failed', error_message = ?, updated_at = ?
     WHERE id = ?`
  ).run(errorMessage, now, id);
}

export function updateOrderResultAndEdits(
  id: string,
  result: StorybookResult | VideoResult,
  incrementAiEdit: boolean
): OrderRecord | null {
  const db = getDb();
  const now = new Date().toISOString();
  if (incrementAiEdit) {
    db.prepare(
      "UPDATE orders SET result_json = ?, ai_edits_used = ai_edits_used + 1, updated_at = ? WHERE id = ?"
    ).run(JSON.stringify(result), now, id);
  } else {
    db.prepare(
      "UPDATE orders SET result_json = ?, updated_at = ? WHERE id = ?"
    ).run(JSON.stringify(result), now, id);
  }
  return getOrderById(id);
}

export function setOrderMonoInvoice(
  id: string,
  invoiceId: string,
  paymentUrl: string,
  monoStatus: string
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders
     SET mono_invoice_id = ?, mono_payment_url = ?, mono_status = ?, updated_at = ?
     WHERE id = ?`
  ).run(invoiceId, paymentUrl, monoStatus, now, id);
}

export function markOrderPaid(
  id: string,
  monoStatus: string,
  receiptUrl?: string | null
): OrderRecord | null {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + getOrderRetentionDays() * 24 * 60 * 60 * 1000
  ).toISOString();
  db.prepare(
    `UPDATE orders
     SET status = 'paid', progress_step = 'preview_ready', progress_percent = 100,
         mono_status = ?, receipt_url = COALESCE(?, receipt_url),
         error_message = NULL, expires_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(monoStatus, receiptUrl ?? null, expiresAt, now.toISOString(), id);
  return getOrderById(id);
}

/**
 * Atomically claims a paid/held order for Stage 2 post-payment page finalization.
 * Returns null if another worker already claimed it or the order cannot be finalized.
 */
export function claimOrderFinalization(
  id: string,
  monoStatus: string,
  receiptUrl?: string | null
): OrderRecord | null {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `UPDATE orders
       SET status = 'generating',
           progress_step = 'illustrations_final',
           progress_percent = MAX(55, progress_percent),
           mono_status = ?,
           receipt_url = COALESCE(?, receipt_url),
           error_message = NULL,
           updated_at = ?
       WHERE id = ? AND status IN ('preview_ready', 'failed')`
    )
    .run(monoStatus, receiptUrl ?? null, now, id);
  if (!info.changes) return null;
  return getOrderById(id);
}

/**
 * Persists incremental Stage 2 page progress so already-generated pages survive crashes/retries.
 */
export function savePartialStorybookResult(
  id: string,
  result: StorybookResult,
  progressPercent: number
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders
     SET result_json = ?, progress_percent = ?, updated_at = ?
     WHERE id = ?`
  ).run(JSON.stringify(result), progressPercent, now, id);
}

export function markOrderPaymentCancelled(
  id: string,
  monoStatus = "reversed"
): OrderRecord | null {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders
     SET status = 'failed', progress_step = 'failed', mono_status = ?, error_message = NULL, updated_at = ?
     WHERE id = ?`
  ).run(monoStatus, now, id);
  return getOrderById(id);
}

export function setOrderTelegramChat(id: string, chatId: string): void {
  const db = getDb();
  db.prepare(
    "UPDATE orders SET telegram_chat_id = ?, updated_at = ? WHERE id = ?"
  ).run(chatId, new Date().toISOString(), id);
}

/**
 * Deletes generated MP4/PDF directories for orders past their 30-day retention window,
 * keeping anonymized accounting metadata.
 */
export function cleanupExpiredOrders(): number {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const rows = db
    .prepare(
      "SELECT id FROM orders WHERE expires_at != '' AND expires_at < ? AND result_json IS NOT NULL"
    )
    .all(nowIso) as Array<{ id: string }>;

  for (const r of rows) {
    deleteOrderDirectory(r.id);
    db.prepare("UPDATE orders SET result_json = NULL, updated_at = ? WHERE id = ?").run(
      nowIso,
      r.id
    );
  }
  return rows.length;
}

/**
 * Creates BOTH a 6-digit OTP code and a one-click magic token for email verification.
 */
export function createEmailAuthChallenge(email: string): {
  otpCode: string;
  magicToken: string;
  expiresAt: string;
} {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const id = `auth_${crypto.randomBytes(8).toString("hex")}`;
  const otpCode = String(crypto.randomInt(100000, 999999));
  const magicToken = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO email_auth_tokens (id, email, otp_code, magic_token, expires_at, used, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  ).run(id, normalized, otpCode, magicToken, expiresAt, now.toISOString());

  return { otpCode, magicToken, expiresAt };
}

export function verifyEmailAuthByOtp(email: string, otpCode: string): string | null {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const row = db
    .prepare(
      `SELECT id, email FROM email_auth_tokens
       WHERE LOWER(email) = ? AND otp_code = ? AND used = 0 AND expires_at > ?
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(normalized, otpCode.trim(), nowIso) as { id: string; email: string } | undefined;

  if (!row) return null;
  db.prepare("UPDATE email_auth_tokens SET used = 1 WHERE id = ?").run(row.id);
  return row.email;
}

export function verifyEmailAuthByMagic(magicToken: string): string | null {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const row = db
    .prepare(
      `SELECT id, email FROM email_auth_tokens
       WHERE magic_token = ? AND used = 0 AND expires_at > ?
       LIMIT 1`
    )
    .get(magicToken.trim(), nowIso) as { id: string; email: string } | undefined;

  if (!row) return null;
  db.prepare("UPDATE email_auth_tokens SET used = 1 WHERE id = ?").run(row.id);
  return row.email;
}

export function createTelegramDeliveryToken(orderId: string): string {
  const db = getDb();
  const token = `dl_${crypto.randomBytes(14).toString("hex")}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  db.prepare(
    `INSERT INTO telegram_tokens (token, order_id, expires_at, used, created_at)
     VALUES (?, ?, ?, 0, ?)`
  ).run(token, orderId, expiresAt, now.toISOString());
  return token;
}

export type TelegramConsumeResult =
  | { status: "ok"; orderId: string }
  | { status: "already_delivered_recently"; orderId: string }
  | { status: "invalid" };

export function consumeTelegramDeliveryToken(
  token: string,
  chatId?: string | number
): TelegramConsumeResult {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const row = db
    .prepare(
      "SELECT token, order_id, used, used_by_chat_id, used_at, expires_at FROM telegram_tokens WHERE token = ?"
    )
    .get(token.trim()) as
    | {
        token: string;
        order_id: string;
        used: number;
        used_by_chat_id: string | null;
        used_at: string | null;
        expires_at: string;
      }
    | undefined;

  if (!row || row.expires_at <= nowIso) {
    return { status: "invalid" };
  }

  const chatStr = chatId !== undefined ? String(chatId) : null;
  if (row.used === 1) {
    const recentlyUsed =
      row.used_at && Date.now() - new Date(row.used_at).getTime() < 120_000;
    if (recentlyUsed && chatStr && row.used_by_chat_id === chatStr) {
      return { status: "already_delivered_recently", orderId: row.order_id };
    }
    return { status: "invalid" };
  }

  db.prepare(
    "UPDATE telegram_tokens SET used = 1, used_by_chat_id = ?, used_at = ? WHERE token = ?"
  ).run(chatStr, nowIso, row.token);
  return { status: "ok", orderId: row.order_id };
}

export function getAppState(key: string): string | null {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM app_state WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

export function setAppState(key: string, value: string): void {
  const db = getDb();
  db.prepare(
    "INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

export function mergeOrderAiCost(id: string, delta: OrderAiCost): OrderAiCost | null {
  const db = getDb();
  const row = db
    .prepare("SELECT ai_cost_json FROM orders WHERE id = ?")
    .get(id) as { ai_cost_json: string | null } | undefined;
  if (!row) return null;

  let merged: OrderAiCost = delta;
  if (row.ai_cost_json) {
    try {
      const prev = JSON.parse(row.ai_cost_json) as OrderAiCost;
      const breakdownMap = new Map(
        (prev.breakdown || []).map((item) => [
          `${item.provider}|${item.step}|${item.model}|${item.size || ""}|${item.quality || ""}`,
          { ...item },
        ])
      );
      for (const step of delta.breakdown || []) {
        const key = `${step.provider}|${step.step}|${step.model}|${step.size || ""}|${step.quality || ""}`;
        const existing = breakdownMap.get(key);
        if (existing) {
          existing.calls += step.calls;
          existing.inputTokens = (existing.inputTokens || 0) + (step.inputTokens || 0);
          existing.outputTokens = (existing.outputTokens || 0) + (step.outputTokens || 0);
          existing.characters = (existing.characters || 0) + (step.characters || 0);
          existing.costUsd = Number((existing.costUsd + step.costUsd).toFixed(6));
        } else {
          breakdownMap.set(key, { ...step });
        }
      }
      const totalUsd = Number(((prev.totalUsd || 0) + delta.totalUsd).toFixed(6));
      const rate = delta.usdToUahRate || prev.usdToUahRate || 41.5;
      merged = {
        currency: "USD",
        usdToUahRate: rate,
        totalUsd,
        totalUahKopiykas: Math.round(totalUsd * rate * 100),
        totalInputTokens: (prev.totalInputTokens || 0) + delta.totalInputTokens,
        totalOutputTokens: (prev.totalOutputTokens || 0) + delta.totalOutputTokens,
        totalImageCalls: (prev.totalImageCalls || 0) + delta.totalImageCalls,
        visionQaRetries: (prev.visionQaRetries || 0) + delta.visionQaRetries,
        elevenLabsChars: (prev.elevenLabsChars || 0) + delta.elevenLabsChars,
        breakdown: Array.from(breakdownMap.values()),
        updatedAt: delta.updatedAt,
      };
    } catch {
      merged = delta;
    }
  }

  db.prepare("UPDATE orders SET ai_cost_json = ?, updated_at = ? WHERE id = ?").run(
    JSON.stringify(merged),
    new Date().toISOString(),
    id
  );
  return merged;
}

export function listOrdersAdmin(params: {
  status?: string;
  productType?: string;
  lang?: string;
  search?: string;
  fromIso?: string;
  toIso?: string;
  limit?: number;
  offset?: number;
}): { orders: OrderRecord[]; total: number } {
  const db = getDb();
  const clauses: string[] = [];
  const args: Array<string | number> = [];

  if (params.status && params.status !== "all") {
    clauses.push("status = ?");
    args.push(params.status);
  }
  if (params.productType && params.productType !== "all") {
    clauses.push("product_type = ?");
    args.push(params.productType);
  }
  if (params.lang && params.lang !== "all") {
    clauses.push("lang = ?");
    args.push(params.lang);
  }
  if (params.fromIso) {
    clauses.push("created_at >= ?");
    args.push(params.fromIso);
  }
  if (params.toIso) {
    clauses.push("created_at <= ?");
    args.push(params.toIso);
  }
  if (params.search?.trim()) {
    const q = `%${params.search.trim().toLowerCase()}%`;
    clauses.push(
      "(LOWER(id) LIKE ? OR LOWER(COALESCE(customer_email, '')) LIKE ? OR LOWER(COALESCE(mono_invoice_id, '')) LIKE ? OR LOWER(payload_json) LIKE ?)"
    );
    args.push(q, q, q, q);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const countRow = db
    .prepare(`SELECT COUNT(*) as cnt FROM orders ${where}`)
    .get(...args) as { cnt: number };

  const limit = Math.min(200, Math.max(1, params.limit ?? 50));
  const offset = Math.max(0, params.offset ?? 0);

  const rows = db
    .prepare(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...args, limit, offset) as unknown as RawOrderRow[];

  return {
    orders: rows.map(mapRow),
    total: countRow?.cnt ?? 0,
  };
}

export interface AnonymizedAnalyticsRow {
  id: string;
  productType: ProductType;
  lang: Lang;
  status: OrderStatus;
  progressStep: string;
  priceKopiykas: number;
  monoInvoiceId: string | null;
  monoStatus: string | null;
  payload: StorybookOrderPayload | VideoOrderPayload;
  resultSummary: {
    generationStage?: string;
    modeUsed?: string;
  } | null;
  aiCost: OrderAiCost | null;
  createdAt: string;
  updatedAt: string;
}

export function getOrdersForAnalytics(params: {
  fromIso?: string;
  productType?: ProductType | "all";
}): AnonymizedAnalyticsRow[] {
  const db = getDb();
  const clauses: string[] = [];
  const args: string[] = [];

  if (params.fromIso) {
    clauses.push("created_at >= ?");
    args.push(params.fromIso);
  }
  if (params.productType && params.productType !== "all") {
    clauses.push("product_type = ?");
    args.push(params.productType);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT id, product_type, lang, status, progress_step, price_kopiykas,
              mono_invoice_id, mono_status, payload_json, result_json, ai_cost_json,
              created_at, updated_at
       FROM orders ${where}
       ORDER BY created_at ASC`
    )
    .all(...args) as Array<{
    id: string;
    product_type: ProductType;
    lang: Lang;
    status: OrderStatus;
    progress_step: string;
    price_kopiykas: number;
    mono_invoice_id: string | null;
    mono_status: string | null;
    payload_json: string;
    result_json: string | null;
    ai_cost_json: string | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((r) => {
    let resultSummary: AnonymizedAnalyticsRow["resultSummary"] = null;
    if (r.result_json) {
      try {
        const parsed = JSON.parse(r.result_json) as {
          generationStage?: string;
          modeUsed?: string;
        };
        resultSummary = {
          generationStage: parsed.generationStage,
          modeUsed: parsed.modeUsed,
        };
      } catch {
        resultSummary = null;
      }
    }
    let aiCost: OrderAiCost | null = null;
    if (r.ai_cost_json) {
      try {
        aiCost = JSON.parse(r.ai_cost_json) as OrderAiCost;
      } catch {
        aiCost = null;
      }
    }
    return {
      id: r.id,
      productType: r.product_type,
      lang: r.lang,
      status: r.status,
      progressStep: r.progress_step,
      priceKopiykas: r.price_kopiykas,
      monoInvoiceId: r.mono_invoice_id,
      monoStatus: r.mono_status,
      payload: JSON.parse(r.payload_json),
      resultSummary,
      aiCost,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

export function updateOrderAiEditsLimit(id: string, newLimit: number): OrderRecord | null {
  const db = getDb();
  const safeLimit = Math.max(0, Math.min(50, Math.round(newLimit)));
  db.prepare("UPDATE orders SET ai_edits_limit = ?, updated_at = ? WHERE id = ?").run(
    safeLimit,
    new Date().toISOString(),
    id
  );
  return getOrderById(id);
}

export function resetOrderForResume(id: string): OrderRecord | null {
  const db = getDb();
  db.prepare(
    `UPDATE orders
     SET status = 'failed', progress_step = 'failed', updated_at = ?
     WHERE id = ? AND status = 'generating'`
  ).run(new Date().toISOString(), id);
  return getOrderById(id);
}
