import { answerCallbackQuery, sendTelegramMessage } from "./telegram";
import type { Env, TelegramMessage, TelegramUpdate } from "./types";
import { isChatAuthorized } from "./security";

export interface ParsedCommand {
  name: string;
  args: string;
}

export function parseCommand(text: string): ParsedCommand | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return null;

  const firstSpace = trimmed.indexOf(" ");
  const rawCommand = firstSpace === -1 ? trimmed.slice(1) : trimmed.slice(1, firstSpace);
  const args = firstSpace === -1 ? "" : trimmed.slice(firstSpace + 1).trim();
  const name = rawCommand.split("@", 1)[0]?.toLowerCase();

  return name ? { name, args } : null;
}

function help(agentName: string): string {
  return [
    `${agentName} — Assistente do MM Gestão`,
    "",
    "Comandos disponíveis:",
    "/start — iniciar e mostrar o chat_id",
    "/ajuda — exibir esta ajuda",
    "/status — verificar o agente",
    "/minhas_empresas — listar empresas autorizadas",
    "/alertas — consultar alertas",
    "/relatorios — consultar relatórios",
    "",
    "Empresas, alertas e relatórios serão conectados ao MM Gestão na próxima fase."
  ].join("\n");
}

async function handleMessage(message: TelegramMessage, env: Env): Promise<void> {
  const chatId = String(message.chat.id);
  const text = message.text?.trim();
  const agentName = env.HERMES_NAME?.trim() || "Hermes";

  if (!text) {
    await sendTelegramMessage(env, chatId, "Envie uma mensagem de texto ou use /ajuda.");
    return;
  }

  const command = parseCommand(text);

  if (command?.name === "start") {
    await sendTelegramMessage(
      env,
      chatId,
      [
        `Olá! Eu sou o ${agentName}, assistente do MM Gestão.`,
        "",
        `Seu chat_id é: ${chatId}`,
        "Envie esse número ao TI para autorizar seu acesso.",
        "Use /ajuda para consultar os comandos."
      ].join("\n")
    );
    return;
  }

  if (command?.name === "ajuda" || command?.name === "help") {
    await sendTelegramMessage(env, chatId, help(agentName));
    return;
  }

  if (!isChatAuthorized(chatId, env.TELEGRAM_ALLOWED_CHAT_IDS)) {
    await sendTelegramMessage(
      env,
      chatId,
      [
        "Este chat ainda não está autorizado para consultar dados do MM Gestão.",
        "",
        `Chat ID: ${chatId}`,
        "Solicite a liberação ao setor de TI."
      ].join("\n")
    );
    return;
  }

  switch (command?.name) {
    case "status":
      await sendTelegramMessage(
        env,
        chatId,
        [
          `${agentName} está online.`,
          `Ambiente: ${env.ENVIRONMENT || "development"}`,
          `Horário UTC: ${new Date().toISOString()}`,
          "Canal: Telegram"
        ].join("\n")
      );
      return;
    case "minhas_empresas":
      await sendTelegramMessage(env, chatId, "A consulta de empresas será habilitada com o conector do MM Gestão.");
      return;
    case "alertas":
      await sendTelegramMessage(env, chatId, "O catálogo de alertas será ativado na próxima fase.");
      return;
    case "relatorios":
      await sendTelegramMessage(env, chatId, "O catálogo de relatórios será conectado ao MM Gestão na próxima fase.");
      return;
    default:
      await sendTelegramMessage(
        env,
        chatId,
        "Mensagem recebida. Nesta primeira versão, use /ajuda para consultar os comandos disponíveis."
      );
  }
}

export async function processTelegramUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  if (update.callback_query) {
    await answerCallbackQuery(env, update.callback_query.id, "Função em implantação.");
    return;
  }

  const message = update.message ?? update.edited_message;
  if (message) await handleMessage(message, env);
}
