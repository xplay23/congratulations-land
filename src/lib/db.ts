import crypto from "node:crypto";
import { Pool } from "pg";
import { deleteOrderDirectory, getOrderRetentionDays } from "./storage";
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

declare global {
  // eslint-disable-next-line no-var
  var __videovitannyaPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __videovitannyaOpSchemaReady: Promise<void> | undefined;
}

function getPool(): Pool {
  if (globalThis.__videovitannyaPgPool) {
    return globalThis.__videovitannyaPgPool;
  }

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured for operational PostgreSQL");
  }

  const pool = new Pool({
    connectionString,
    max: Number(process.env.OP_PG_POOL_MAX || "10"),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  globalThis.__videovitannyaPgPool = pool;
  return pool;
}

async function ensureSchema(pool: Pool): Promise<void> {
  if (!globalThis.__videovitannyaOpSchemaReady) {
    globalThis.__videovitannyaOpSchemaReady = (async () => {
      await pool.query(`
        CREATE SCHEMA IF NOT EXISTS app;

        CREATE TABLE IF NOT EXISTS app.orders (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          product_type TEXT NOT NULL,
          lang TEXT NOT NULL,
          status TEXT NOT NULL,
          progress_step TEXT NOT NULL,
          progress_percent INTEGER NOT NULL DEFAULT 0,
          error_message TEXT,
          payload_json JSONB NOT NULL,
          result_json JSONB,
          ai_cost_json JSONB,
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
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app.email_auth_tokens (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          otp_code TEXT NOT NULL,
          magic_token TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          used BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app.telegram_tokens (
          token TEXT PRIMARY KEY,
          order_id TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          used BOOLEAN NOT NULL DEFAULT FALSE,
          used_by_chat_id TEXT,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app.runtime_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_app_orders_session ON app.orders(session_id);
        CREATE INDEX IF NOT EXISTS idx_app_orders_invoice ON app.orders(mono_invoice_id);
        CREATE INDEX IF NOT EXISTS idx_app_orders_email ON app.orders(LOWER(customer_email));
        CREATE INDEX IF NOT EXISTS idx_app_orders_created_at ON app.orders(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_app_auth_magic ON app.email_auth_tokens(magic_token);
        CREATE INDEX IF NOT EXISTS idx_app_auth_email ON app.email_auth_tokens(LOWER(email));
        CREATE INDEX IF NOT EXISTS idx_app_telegram_order ON app.telegram_tokens(order_id);
      `);
    })().catch((err) => {
      globalThis.__videovitannyaOpSchemaReady = undefined;
      throw err;
    });
  }

  await globalThis.__videovitannyaOpSchemaReady;
}

async function getDb(): Promise<Pool> {
  const pool = getPool();
  await ensureSchema(pool);
  return pool;
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
  payload_json: unknown;
  result_json: unknown | null;
  ai_cost_json: unknown | null;
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
  expires_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

function toIso(val: Date | string | null | undefined, fallback?: string): string {
  if (!val) return fallback ?? new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function parseJsonValue<T>(val: unknown): T {
  if (typeof val === "string") {
    return JSON.parse(val) as T;
  }
  return val as T;
}

function mapRow(row: RawOrderRow): OrderRecord {
  const createdAt = toIso(row.created_at);
  const defaultExp = new Date(
    new Date(createdAt).getTime() + getOrderRetentionDays() * 86400_000
  ).toISOString();

  return {
    id: row.id,
    sessionId: row.session_id,
    productType: row.product_type,
    lang: row.lang,
    status: row.status,
    progressStep: row.progress_step,
    progressPercent: Number(row.progress_percent),
    errorMessage: row.error_message,
    payload: parseJsonValue<StorybookOrderPayload | VideoOrderPayload>(row.payload_json),
    result:
      row.result_json !== null && row.result_json !== undefined
        ? parseJsonValue<StorybookResult | VideoResult>(row.result_json)
        : null,
    aiCost:
      row.ai_cost_json !== null && row.ai_cost_json !== undefined
        ? parseJsonValue<OrderAiCost>(row.ai_cost_json)
        : null,
    aiEditsUsed: Number(row.ai_edits_used),
    aiEditsLimit: Number(row.ai_edits_limit),
    priceKopiykas: Number(row.price_kopiykas),
    monoInvoiceId: row.mono_invoice_id,
    monoPaymentUrl: row.mono_payment_url,
    monoStatus: row.mono_status,
    receiptUrl: row.receipt_url,
    customerEmail: row.customer_email,
    accessToken: row.access_token || "",
    telegramChatId: row.telegram_chat_id,
    expiresAt: toIso(row.expires_at, defaultExp),
    createdAt,
    updatedAt: toIso(row.updated_at, createdAt),
  };
}

export async function countSessionPreviewOrders(sessionId: string): Promise<number> {
  const pool = await getDb();
  const res = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt
     FROM app.orders
     WHERE session_id = $1 AND status IN ('generating', 'preview_ready')`,
    [sessionId]
  );
  return Number(res.rows[0]?.cnt ?? 0);
}

export async function createOrder(params: {
  sessionId: string;
  productType: ProductType;
  lang: Lang;
  payload: StorybookOrderPayload | VideoOrderPayload;
  priceKopiykas: number;
  aiEditsLimit?: number;
  retentionDays?: number;
}): Promise<OrderRecord> {
  const pool = await getDb();
  const id = `ord_${crypto.randomBytes(8).toString("hex")}`;
  const accessToken = crypto.randomBytes(20).toString("hex");
  const now = new Date();
  const retentionDays = Math.max(1, params.retentionDays ?? getOrderRetentionDays());
  const expiresAt = new Date(
    now.getTime() + retentionDays * 24 * 60 * 60 * 1000
  ).toISOString();
  const aiEditsLimit =
    params.aiEditsLimit ?? Number(process.env.MAX_AI_EDITS_PER_BOOK || "3");
  const nowIso = now.toISOString();

  const res = await pool.query<RawOrderRow>(
    `INSERT INTO app.orders (
      id, session_id, product_type, lang, status, progress_step, progress_percent,
      payload_json, ai_edits_used, ai_edits_limit, price_kopiykas,
      access_token, expires_at, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, 'generating', 'queued', 5, $5::jsonb, 0, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      id,
      params.sessionId,
      params.productType,
      params.lang,
      JSON.stringify(params.payload),
      aiEditsLimit,
      params.priceKopiykas,
      accessToken,
      expiresAt,
      nowIso,
      nowIso,
    ]
  );

  const created = res.rows[0];
  if (!created) throw new Error("Failed to read created order");
  return mapRow(created);
}

export async function getOrderById(id: string): Promise<OrderRecord | null> {
  const pool = await getDb();
  const res = await pool.query<RawOrderRow>(
    "SELECT * FROM app.orders WHERE id = $1",
    [id]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function getOrderByInvoiceId(
  invoiceId: string
): Promise<OrderRecord | null> {
  const pool = await getDb();
  const res = await pool.query<RawOrderRow>(
    "SELECT * FROM app.orders WHERE mono_invoice_id = $1",
    [invoiceId]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function getOrdersByEmail(email: string): Promise<OrderRecord[]> {
  const pool = await getDb();
  const normalized = email.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const res = await pool.query<RawOrderRow>(
    `SELECT * FROM app.orders
     WHERE LOWER(customer_email) = $1 AND expires_at > $2
     ORDER BY created_at DESC`,
    [normalized, nowIso]
  );
  return res.rows.map(mapRow);
}

export async function setOrderCustomerEmail(
  id: string,
  email: string
): Promise<void> {
  const pool = await getDb();
  await pool.query(
    "UPDATE app.orders SET customer_email = $1, updated_at = $2 WHERE id = $3",
    [email.trim().toLowerCase(), new Date().toISOString(), id]
  );
}

export async function updateOrderProgress(
  id: string,
  progressStep: string,
  progressPercent: number,
  status?: OrderStatus
): Promise<void> {
  const pool = await getDb();
  const now = new Date().toISOString();
  if (status) {
    await pool.query(
      `UPDATE app.orders
       SET progress_step = $1, progress_percent = $2, status = $3, updated_at = $4
       WHERE id = $5`,
      [progressStep, progressPercent, status, now, id]
    );
  } else {
    await pool.query(
      `UPDATE app.orders
       SET progress_step = $1, progress_percent = $2, updated_at = $3
       WHERE id = $4`,
      [progressStep, progressPercent, now, id]
    );
  }
}

export async function completeOrderGeneration(
  id: string,
  result: StorybookResult | VideoResult
): Promise<void> {
  const pool = await getDb();
  const now = new Date().toISOString();
  await pool.query(
    `UPDATE app.orders
     SET status = 'preview_ready', progress_step = 'preview_ready', progress_percent = 100,
         result_json = $1::jsonb, error_message = NULL, updated_at = $2
     WHERE id = $3`,
    [JSON.stringify(result), now, id]
  );
}

export async function failOrderGeneration(
  id: string,
  errorMessage: string
): Promise<void> {
  const pool = await getDb();
  const now = new Date().toISOString();
  await pool.query(
    `UPDATE app.orders
     SET status = 'failed', progress_step = 'failed', error_message = $1, updated_at = $2
     WHERE id = $3`,
    [errorMessage, now, id]
  );
}

export async function updateOrderResultAndEdits(
  id: string,
  result: StorybookResult | VideoResult,
  incrementAiEdit: boolean
): Promise<OrderRecord | null> {
  const pool = await getDb();
  const now = new Date().toISOString();
  const res = incrementAiEdit
    ? await pool.query<RawOrderRow>(
        `UPDATE app.orders
         SET result_json = $1::jsonb, ai_edits_used = ai_edits_used + 1, updated_at = $2
         WHERE id = $3
         RETURNING *`,
        [JSON.stringify(result), now, id]
      )
    : await pool.query<RawOrderRow>(
        `UPDATE app.orders
         SET result_json = $1::jsonb, updated_at = $2
         WHERE id = $3
         RETURNING *`,
        [JSON.stringify(result), now, id]
      );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function setOrderMonoInvoice(
  id: string,
  invoiceId: string,
  paymentUrl: string,
  monoStatus: string
): Promise<void> {
  const pool = await getDb();
  const now = new Date().toISOString();
  await pool.query(
    `UPDATE app.orders
     SET mono_invoice_id = $1, mono_payment_url = $2, mono_status = $3, updated_at = $4
     WHERE id = $5`,
    [invoiceId, paymentUrl, monoStatus, now, id]
  );
}

export async function markOrderPaid(
  id: string,
  monoStatus: string,
  receiptUrl?: string | null,
  retentionDays?: number
): Promise<OrderRecord | null> {
  const pool = await getDb();
  const now = new Date();
  const days = Math.max(1, retentionDays ?? getOrderRetentionDays());
  const expiresAt = new Date(
    now.getTime() + days * 24 * 60 * 60 * 1000
  ).toISOString();

  const res = await pool.query<RawOrderRow>(
    `UPDATE app.orders
     SET status = 'paid', progress_step = 'preview_ready', progress_percent = 100,
         mono_status = $1, receipt_url = COALESCE($2, receipt_url),
         error_message = NULL, expires_at = $3, updated_at = $4
     WHERE id = $5
     RETURNING *`,
    [monoStatus, receiptUrl ?? null, expiresAt, now.toISOString(), id]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

/**
 * Atomically claims a paid/held order for Stage 2 post-payment page finalization.
 * Returns null if another worker already claimed it or the order cannot be finalized.
 */
export async function claimOrderFinalization(
  id: string,
  monoStatus: string,
  receiptUrl?: string | null
): Promise<OrderRecord | null> {
  const pool = await getDb();
  const now = new Date().toISOString();
  const res = await pool.query<RawOrderRow>(
    `UPDATE app.orders
     SET status = 'generating',
         progress_step = 'illustrations_final',
         progress_percent = GREATEST(55, progress_percent),
         mono_status = $1,
         receipt_url = COALESCE($2, receipt_url),
         error_message = NULL,
         updated_at = $3
     WHERE id = $4 AND status IN ('preview_ready', 'failed')
     RETURNING *`,
    [monoStatus, receiptUrl ?? null, now, id]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

/**
 * Persists incremental Stage 2 page progress so already-generated pages survive crashes/retries.
 */
export async function savePartialStorybookResult(
  id: string,
  result: StorybookResult,
  progressPercent: number
): Promise<void> {
  const pool = await getDb();
  const now = new Date().toISOString();
  await pool.query(
    `UPDATE app.orders
     SET result_json = $1::jsonb, progress_percent = $2, updated_at = $3
     WHERE id = $4`,
    [JSON.stringify(result), progressPercent, now, id]
  );
}

export async function markOrderPaymentCancelled(
  id: string,
  monoStatus = "reversed"
): Promise<OrderRecord | null> {
  const pool = await getDb();
  const now = new Date().toISOString();
  const res = await pool.query<RawOrderRow>(
    `UPDATE app.orders
     SET status = 'failed', progress_step = 'failed', mono_status = $1,
         error_message = NULL, updated_at = $2
     WHERE id = $3
     RETURNING *`,
    [monoStatus, now, id]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function setOrderTelegramChat(
  id: string,
  chatId: string
): Promise<void> {
  const pool = await getDb();
  await pool.query(
    "UPDATE app.orders SET telegram_chat_id = $1, updated_at = $2 WHERE id = $3",
    [chatId, new Date().toISOString(), id]
  );
}

/**
 * Deletes generated MP4/PDF directories for orders past their retention window,
 * keeping anonymized accounting metadata.
 */
export async function cleanupExpiredOrders(): Promise<number> {
  const pool = await getDb();
  const nowIso = new Date().toISOString();
  const res = await pool.query<{ id: string }>(
    `SELECT id FROM app.orders
     WHERE expires_at < $1 AND result_json IS NOT NULL`,
    [nowIso]
  );

  for (const r of res.rows) {
    deleteOrderDirectory(r.id);
    await pool.query(
      "UPDATE app.orders SET result_json = NULL, updated_at = $1 WHERE id = $2",
      [nowIso, r.id]
    );
  }
  return res.rows.length;
}

/**
 * Creates BOTH a 6-digit OTP code and a one-click magic token for email verification.
 */
export async function createEmailAuthChallenge(email: string): Promise<{
  otpCode: string;
  magicToken: string;
  expiresAt: string;
}> {
  const pool = await getDb();
  const normalized = email.trim().toLowerCase();
  const id = `auth_${crypto.randomBytes(8).toString("hex")}`;
  const otpCode = String(crypto.randomInt(100000, 999999));
  const magicToken = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  await pool.query(
    `INSERT INTO app.email_auth_tokens (id, email, otp_code, magic_token, expires_at, used, created_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, $6)`,
    [id, normalized, otpCode, magicToken, expiresAt, now.toISOString()]
  );

  return { otpCode, magicToken, expiresAt };
}

export async function verifyEmailAuthByOtp(
  email: string,
  otpCode: string
): Promise<string | null> {
  const pool = await getDb();
  const normalized = email.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const res = await pool.query<{ email: string }>(
    `UPDATE app.email_auth_tokens
     SET used = TRUE
     WHERE id = (
       SELECT id FROM app.email_auth_tokens
       WHERE LOWER(email) = $1 AND otp_code = $2 AND used = FALSE AND expires_at > $3
       ORDER BY created_at DESC
       LIMIT 1
     )
     AND used = FALSE
     RETURNING email`,
    [normalized, otpCode.trim(), nowIso]
  );
  return res.rows[0]?.email ?? null;
}

export async function verifyEmailAuthByMagic(
  magicToken: string
): Promise<string | null> {
  const pool = await getDb();
  const nowIso = new Date().toISOString();
  const res = await pool.query<{ email: string }>(
    `UPDATE app.email_auth_tokens
     SET used = TRUE
     WHERE id = (
       SELECT id FROM app.email_auth_tokens
       WHERE magic_token = $1 AND used = FALSE AND expires_at > $2
       LIMIT 1
     )
     AND used = FALSE
     RETURNING email`,
    [magicToken.trim(), nowIso]
  );
  return res.rows[0]?.email ?? null;
}

export async function createTelegramDeliveryToken(
  orderId: string
): Promise<string> {
  const pool = await getDb();
  const token = `dl_${crypto.randomBytes(14).toString("hex")}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  await pool.query(
    `INSERT INTO app.telegram_tokens (token, order_id, expires_at, used, created_at)
     VALUES ($1, $2, $3, FALSE, $4)`,
    [token, orderId, expiresAt, now.toISOString()]
  );
  return token;
}

export type TelegramConsumeResult =
  | { status: "ok"; orderId: string }
  | { status: "already_delivered_recently"; orderId: string }
  | { status: "invalid" };

export async function consumeTelegramDeliveryToken(
  token: string,
  chatId?: string | number
): Promise<TelegramConsumeResult> {
  const pool = await getDb();
  const nowIso = new Date().toISOString();
  const trimmed = token.trim();
  const chatStr = chatId !== undefined ? String(chatId) : null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query<{
      token: string;
      order_id: string;
      used: boolean;
      used_by_chat_id: string | null;
      used_at: Date | string | null;
      expires_at: Date | string;
    }>(
      `SELECT token, order_id, used, used_by_chat_id, used_at, expires_at
       FROM app.telegram_tokens
       WHERE token = $1
       FOR UPDATE`,
      [trimmed]
    );
    const row = res.rows[0];

    if (!row || new Date(toIso(row.expires_at)).getTime() <= Date.now()) {
      await client.query("COMMIT");
      return { status: "invalid" };
    }

    if (row.used) {
      const usedAtMs = row.used_at ? new Date(toIso(row.used_at)).getTime() : 0;
      const recentlyUsed = usedAtMs > 0 && Date.now() - usedAtMs < 120_000;
      await client.query("COMMIT");
      if (recentlyUsed && chatStr && row.used_by_chat_id === chatStr) {
        return { status: "already_delivered_recently", orderId: row.order_id };
      }
      return { status: "invalid" };
    }

    await client.query(
      `UPDATE app.telegram_tokens
       SET used = TRUE, used_by_chat_id = $1, used_at = $2
       WHERE token = $3`,
      [chatStr, nowIso, row.token]
    );
    await client.query("COMMIT");
    return { status: "ok", orderId: row.order_id };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function getRuntimeState(key: string): Promise<string | null> {
  const pool = await getDb();
  const res = await pool.query<{ value: string }>(
    "SELECT value FROM app.runtime_state WHERE key = $1",
    [key]
  );
  return res.rows[0]?.value ?? null;
}

export async function setRuntimeState(
  key: string,
  value: string
): Promise<void> {
  const pool = await getDb();
  await pool.query(
    `INSERT INTO app.runtime_state (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}

export async function mergeOrderAiCost(
  id: string,
  delta: OrderAiCost
): Promise<OrderAiCost | null> {
  const pool = await getDb();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query<{ ai_cost_json: unknown | null }>(
      "SELECT ai_cost_json FROM app.orders WHERE id = $1 FOR UPDATE",
      [id]
    );
    const row = res.rows[0];
    if (!row) {
      await client.query("COMMIT");
      return null;
    }

    let merged: OrderAiCost = delta;
    if (row.ai_cost_json) {
      try {
        const prev = parseJsonValue<OrderAiCost>(row.ai_cost_json);
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
            existing.inputTokens =
              (existing.inputTokens || 0) + (step.inputTokens || 0);
            existing.outputTokens =
              (existing.outputTokens || 0) + (step.outputTokens || 0);
            existing.characters =
              (existing.characters || 0) + (step.characters || 0);
            existing.costUsd = Number((existing.costUsd + step.costUsd).toFixed(6));
          } else {
            breakdownMap.set(key, { ...step });
          }
        }
        const totalUsd = Number(
          ((prev.totalUsd || 0) + delta.totalUsd).toFixed(6)
        );
        const rate = delta.usdToUahRate || prev.usdToUahRate || 41.5;
        merged = {
          currency: "USD",
          usdToUahRate: rate,
          totalUsd,
          totalUahKopiykas: Math.round(totalUsd * rate * 100),
          totalInputTokens: (prev.totalInputTokens || 0) + delta.totalInputTokens,
          totalOutputTokens:
            (prev.totalOutputTokens || 0) + delta.totalOutputTokens,
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

    await client.query(
      "UPDATE app.orders SET ai_cost_json = $1::jsonb, updated_at = $2 WHERE id = $3",
      [JSON.stringify(merged), new Date().toISOString(), id]
    );
    await client.query("COMMIT");
    return merged;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function listOrdersAdmin(params: {
  status?: string;
  productType?: string;
  lang?: string;
  search?: string;
  fromIso?: string;
  toIso?: string;
  limit?: number;
  offset?: number;
}): Promise<{ orders: OrderRecord[]; total: number }> {
  const pool = await getDb();
  const clauses: string[] = [];
  const args: unknown[] = [];

  const pushArg = (val: unknown): string => {
    args.push(val);
    return `$${args.length}`;
  };

  if (params.status && params.status !== "all") {
    clauses.push(`status = ${pushArg(params.status)}`);
  }
  if (params.productType && params.productType !== "all") {
    clauses.push(`product_type = ${pushArg(params.productType)}`);
  }
  if (params.lang && params.lang !== "all") {
    clauses.push(`lang = ${pushArg(params.lang)}`);
  }
  if (params.fromIso) {
    clauses.push(`created_at >= ${pushArg(params.fromIso)}`);
  }
  if (params.toIso) {
    clauses.push(`created_at <= ${pushArg(params.toIso)}`);
  }
  if (params.search?.trim()) {
    const q = `%${params.search.trim().toLowerCase()}%`;
    const p = pushArg(q);
    clauses.push(
      `(LOWER(id) LIKE ${p} OR LOWER(COALESCE(customer_email, '')) LIKE ${p} OR LOWER(COALESCE(mono_invoice_id, '')) LIKE ${p} OR LOWER(payload_json::text) LIKE ${p})`
    );
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const countRes = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*)::text AS cnt FROM app.orders ${where}`,
    args
  );

  const limit = Math.min(200, Math.max(1, params.limit ?? 50));
  const offset = Math.max(0, params.offset ?? 0);
  const limitParam = `$${args.length + 1}`;
  const offsetParam = `$${args.length + 2}`;

  const rowsRes = await pool.query<RawOrderRow>(
    `SELECT * FROM app.orders ${where} ORDER BY created_at DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,
    [...args, limit, offset]
  );

  return {
    orders: rowsRes.rows.map(mapRow),
    total: Number(countRes.rows[0]?.cnt ?? 0),
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

export async function getOrdersForAnalytics(params: {
  fromIso?: string;
  productType?: ProductType | "all";
}): Promise<AnonymizedAnalyticsRow[]> {
  const pool = await getDb();
  const clauses: string[] = [];
  const args: unknown[] = [];

  const pushArg = (val: unknown): string => {
    args.push(val);
    return `$${args.length}`;
  };

  if (params.fromIso) {
    clauses.push(`created_at >= ${pushArg(params.fromIso)}`);
  }
  if (params.productType && params.productType !== "all") {
    clauses.push(`product_type = ${pushArg(params.productType)}`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const res = await pool.query<{
    id: string;
    product_type: ProductType;
    lang: Lang;
    status: OrderStatus;
    progress_step: string;
    price_kopiykas: number;
    mono_invoice_id: string | null;
    mono_status: string | null;
    payload_json: unknown;
    result_json: unknown | null;
    ai_cost_json: unknown | null;
    created_at: Date | string;
    updated_at: Date | string;
  }>(
    `SELECT id, product_type, lang, status, progress_step, price_kopiykas,
            mono_invoice_id, mono_status, payload_json, result_json, ai_cost_json,
            created_at, updated_at
     FROM app.orders ${where}
     ORDER BY created_at ASC`,
    args
  );

  return res.rows.map((r) => {
    let resultSummary: AnonymizedAnalyticsRow["resultSummary"] = null;
    if (r.result_json) {
      try {
        const parsed = parseJsonValue<{
          generationStage?: string;
          modeUsed?: string;
        }>(r.result_json);
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
        aiCost = parseJsonValue<OrderAiCost>(r.ai_cost_json);
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
      priceKopiykas: Number(r.price_kopiykas),
      monoInvoiceId: r.mono_invoice_id,
      monoStatus: r.mono_status,
      payload: parseJsonValue<StorybookOrderPayload | VideoOrderPayload>(
        r.payload_json
      ),
      resultSummary,
      aiCost,
      createdAt: toIso(r.created_at),
      updatedAt: toIso(r.updated_at),
    };
  });
}

export async function updateOrderAiEditsLimit(
  id: string,
  newLimit: number
): Promise<OrderRecord | null> {
  const pool = await getDb();
  const safeLimit = Math.max(0, Math.min(50, Math.round(newLimit)));
  const res = await pool.query<RawOrderRow>(
    `UPDATE app.orders
     SET ai_edits_limit = $1, updated_at = $2
     WHERE id = $3
     RETURNING *`,
    [safeLimit, new Date().toISOString(), id]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function resetOrderForResume(
  id: string
): Promise<OrderRecord | null> {
  const pool = await getDb();
  await pool.query(
    `UPDATE app.orders
     SET status = 'failed', progress_step = 'failed', updated_at = $1
     WHERE id = $2 AND status = 'generating'`,
    [new Date().toISOString(), id]
  );
  return getOrderById(id);
}
