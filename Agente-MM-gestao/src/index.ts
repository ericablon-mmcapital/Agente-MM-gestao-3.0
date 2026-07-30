import { processTelegramUpdate } from "./agent";
import { dispatchHermesEvent, validateHermesEvent } from "./events";
import { constantTimeEqual, isValidTelegramWebhookSecret } from "./security";
import { getTelegramWebhookInfo, sendTelegramMessage, setTelegramWebhook } from "./telegram";
import type { Env, TelegramUpdate } from "./types";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function bearer(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ", 2);
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

async function readJson<T>(request: Request): Promise<T> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().includes("application/json")) throw new Error("CONTENT_TYPE_NOT_JSON");
  return (await request.json()) as T;
}

function logError(context: string, error: unknown): void {
  console.error(JSON.stringify({
    level: "error",
    context,
    message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    occurredAt: new Date().toISOString()
  }));
}

async function adminRoute(request: Request, env: Env): Promise<Response> {
  const token = bearer(request);
  if (!token || !env.ADMIN_API_KEY || !constantTimeEqual(token, env.ADMIN_API_KEY)) {
    return json({ ok: false, error: "UNAUTHORIZED" }, 401);
  }

  const url = new URL(request.url);

  if (request.method === "POST" && url.pathname === "/admin/telegram/set-webhook") {
    if (!env.TELEGRAM_WEBHOOK_SECRET || !isValidTelegramWebhookSecret(env.TELEGRAM_WEBHOOK_SECRET)) {
      return json({ ok: false, error: "TELEGRAM_WEBHOOK_SECRET_INVALID" }, 500);
    }

    let dropPendingUpdates = false;
    try {
      const body = await readJson<{ dropPendingUpdates?: boolean }>(request);
      dropPendingUpdates = body.dropPendingUpdates ?? false;
    } catch (error) {
      if (error instanceof Error && error.message !== "CONTENT_TYPE_NOT_JSON") {
        return json({ ok: false, error: "INVALID_JSON" }, 400);
      }
    }

    const webhookUrl = `${url.origin}/webhooks/telegram`;
    await setTelegramWebhook(env, webhookUrl, dropPendingUpdates);
    return json({ ok: true, webhookUrl });
  }

  if (request.method === "GET" && url.pathname === "/admin/telegram/webhook-info") {
    return json({ ok: true, info: await getTelegramWebhookInfo(env) });
  }

  if (request.method === "POST" && url.pathname === "/admin/telegram/send-test") {
    const body = await readJson<{ chatId?: string; text?: string }>(request);
    const chatId = body.chatId?.trim() || env.TELEGRAM_ADMIN_CHAT_ID?.trim();
    if (!chatId) return json({ ok: false, error: "CHAT_ID_REQUIRED" }, 400);

    await sendTelegramMessage(
      env,
      chatId,
      body.text?.trim() || `${env.HERMES_NAME || "Hermes"} conectado com sucesso ao Telegram.`
    );
    return json({ ok: true, chatId });
  }

  if (request.method === "GET" && url.pathname === "/admin/status") {
    return json({
      ok: true,
      agent: env.HERMES_NAME || "Hermes",
      environment: env.ENVIRONMENT || "development",
      telegramConfigured: Boolean(env.TELEGRAM_BOT_TOKEN),
      adminChatConfigured: Boolean(env.TELEGRAM_ADMIN_CHAT_ID),
      mmIntegrationSecretConfigured: Boolean(env.MM_GESTAO_API_SECRET)
    });
  }

  return json({ ok: false, error: "ADMIN_ROUTE_NOT_FOUND" }, 404);
}

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(`${env.HERMES_NAME || "Hermes"} — Agente MM Gestão`, {
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        service: "agente-mm-hermes",
        environment: env.ENVIRONMENT || "development",
        timestamp: new Date().toISOString()
      });
    }

    if (request.method === "POST" && url.pathname === "/webhooks/telegram") {
      const received = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
      if (!env.TELEGRAM_WEBHOOK_SECRET || !constantTimeEqual(received, env.TELEGRAM_WEBHOOK_SECRET)) {
        return json({ ok: false, error: "INVALID_WEBHOOK_SECRET" }, 401);
      }

      let update: TelegramUpdate;
      try {
        update = await readJson<TelegramUpdate>(request);
      } catch {
        return json({ ok: false, error: "INVALID_TELEGRAM_UPDATE" }, 400);
      }

      context.waitUntil(processTelegramUpdate(update, env).catch((error) => logError("telegram_update", error)));
      return json({ ok: true });
    }

    if (url.pathname.startsWith("/admin/")) {
      try {
        return await adminRoute(request, env);
      } catch (error) {
        logError("admin_route", error);
        return json({ ok: false, error: "ADMIN_OPERATION_FAILED" }, 500);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/events") {
      const token = bearer(request);
      if (!token || !env.MM_GESTAO_API_SECRET || !constantTimeEqual(token, env.MM_GESTAO_API_SECRET)) {
        return json({ ok: false, error: "UNAUTHORIZED" }, 401);
      }

      try {
        const event = validateHermesEvent(await readJson<unknown>(request));
        await dispatchHermesEvent(event, env);
        return json({ ok: true, accepted: true }, 202);
      } catch (error) {
        logError("mm_event", error);
        return json({ ok: false, error: error instanceof Error ? error.message : "EVENT_PROCESSING_FAILED" }, 400);
      }
    }

    return json({ ok: false, error: "NOT_FOUND" }, 404);
  },

  async scheduled(_controller: ScheduledController, env: Env, context: ExecutionContext): Promise<void> {
    if (env.ENABLE_CRON_HEARTBEAT !== "true") return;

    const chatId = env.TELEGRAM_ADMIN_CHAT_ID?.trim();
    if (!chatId) {
      logError("scheduled_heartbeat", new Error("TELEGRAM_ADMIN_CHAT_ID_NOT_CONFIGURED"));
      return;
    }

    context.waitUntil(
      sendTelegramMessage(
        env,
        chatId,
        `${env.HERMES_NAME || "Hermes"} está ativo. Verificação agendada concluída.`
      ).catch((error) => logError("scheduled_heartbeat", error))
    );
  }
};
