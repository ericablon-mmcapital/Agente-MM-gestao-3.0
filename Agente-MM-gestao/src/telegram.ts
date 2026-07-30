import type { Env } from "./types";

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

async function telegramApi<T>(
  env: Env,
  method: string,
  payload: Record<string, unknown>
): Promise<T> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN_NOT_CONFIGURED");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  const result = (await response.json()) as TelegramApiResponse<T>;
  if (!response.ok || !result.ok || result.result === undefined) {
    const code = result.error_code ?? response.status;
    const description = result.description ?? "Telegram API request failed";
    throw new Error(`TELEGRAM_API_ERROR_${code}: ${description}`);
  }

  return result.result;
}

export async function sendTelegramMessage(
  env: Env,
  chatId: string,
  text: string
): Promise<unknown> {
  return telegramApi(env, "sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true
  });
}

export async function answerCallbackQuery(
  env: Env,
  callbackQueryId: string,
  text?: string
): Promise<boolean> {
  return telegramApi<boolean>(env, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {})
  });
}

export async function setTelegramWebhook(
  env: Env,
  webhookUrl: string,
  dropPendingUpdates = false
): Promise<boolean> {
  return telegramApi<boolean>(env, "setWebhook", {
    url: webhookUrl,
    secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message", "edited_message", "callback_query"],
    drop_pending_updates: dropPendingUpdates
  });
}

export async function getTelegramWebhookInfo(env: Env): Promise<unknown> {
  return telegramApi(env, "getWebhookInfo", {});
}
