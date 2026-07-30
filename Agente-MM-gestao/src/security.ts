export function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const maxLength = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < maxLength; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

export function parseCsvSet(value?: string): Set<string> {
  if (!value) return new Set();
  return new Set(value.split(",").map((item) => item.trim()).filter(Boolean));
}

export function isChatAuthorized(chatId: string, allowedChatIds?: string): boolean {
  return parseCsvSet(allowedChatIds).has(chatId);
}

export function isValidTelegramWebhookSecret(secret: string): boolean {
  return /^[A-Za-z0-9_-]{1,256}$/.test(secret);
}
