import type { Env } from "./types";

/**
 * Adaptador reservado para a WhatsApp Business Platform.
 * O núcleo do Hermes continuará o mesmo quando esse canal for ativado.
 */
export async function sendWhatsAppMessage(
  _env: Env,
  _recipient: string,
  _text: string
): Promise<never> {
  throw new Error("WHATSAPP_CHANNEL_NOT_IMPLEMENTED");
}
