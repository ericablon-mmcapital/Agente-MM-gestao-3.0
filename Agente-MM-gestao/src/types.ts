export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  ADMIN_API_KEY: string;
  TELEGRAM_ALLOWED_CHAT_IDS?: string;
  TELEGRAM_ADMIN_CHAT_ID?: string;
  MM_GESTAO_API_SECRET?: string;
  MM_GESTAO_BASE_URL?: string;
  ENVIRONMENT?: string;
  HERMES_NAME?: string;
  ENABLE_CRON_HEARTBEAT?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
}

export interface TelegramMessage {
  message_id: number;
  date: number;
  chat: TelegramChat;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export type HermesSeverity = "critical" | "high" | "normal" | "low";

export interface HermesEvent {
  eventType: string;
  severity: HermesSeverity;
  title: string;
  description: string;
  companyName?: string;
  moduleKey?: string;
  entityId?: string;
  deduplicationKey?: string;
  occurredAt?: string;
}
