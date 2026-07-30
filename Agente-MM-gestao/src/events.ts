import { sendTelegramMessage } from "./telegram";
import type { Env, HermesEvent, HermesSeverity } from "./types";

const SEVERITIES = new Set<HermesSeverity>(["critical", "high", "normal", "low"]);

export function validateHermesEvent(input: unknown): HermesEvent {
  if (!input || typeof input !== "object") throw new Error("INVALID_EVENT_BODY");
  const event = input as Partial<HermesEvent>;

  if (!event.eventType?.trim()) throw new Error("EVENT_TYPE_REQUIRED");
  if (!event.title?.trim()) throw new Error("EVENT_TITLE_REQUIRED");
  if (!event.description?.trim()) throw new Error("EVENT_DESCRIPTION_REQUIRED");
  if (!event.severity || !SEVERITIES.has(event.severity)) throw new Error("EVENT_SEVERITY_INVALID");

  return {
    eventType: event.eventType.trim(),
    severity: event.severity,
    title: event.title.trim(),
    description: event.description.trim(),
    ...(event.companyName?.trim() ? { companyName: event.companyName.trim() } : {}),
    ...(event.moduleKey?.trim() ? { moduleKey: event.moduleKey.trim() } : {}),
    ...(event.entityId?.trim() ? { entityId: event.entityId.trim() } : {}),
    ...(event.deduplicationKey?.trim() ? { deduplicationKey: event.deduplicationKey.trim() } : {}),
    ...(event.occurredAt?.trim() ? { occurredAt: event.occurredAt.trim() } : {})
  };
}

function severityLabel(severity: HermesSeverity): string {
  return ({ critical: "CRÍTICO", high: "ALTO", normal: "NORMAL", low: "BAIXO" })[severity];
}

export function formatHermesEvent(event: HermesEvent): string {
  return [
    `Alerta ${severityLabel(event.severity)}`,
    event.companyName ? `Empresa: ${event.companyName}` : null,
    event.moduleKey ? `Módulo: ${event.moduleKey}` : null,
    "",
    event.title,
    event.description,
    "",
    `Evento: ${event.eventType}`,
    event.occurredAt ? `Ocorrido em: ${event.occurredAt}` : null
  ].filter((line): line is string => line !== null).join("\n");
}

export async function dispatchHermesEvent(event: HermesEvent, env: Env): Promise<void> {
  const chatId = env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (!chatId) throw new Error("TELEGRAM_ADMIN_CHAT_ID_NOT_CONFIGURED");
  await sendTelegramMessage(env, chatId, formatHermesEvent(event));
}
