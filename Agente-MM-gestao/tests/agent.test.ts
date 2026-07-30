import { describe, expect, it } from "vitest";
import { parseCommand } from "../src/agent";
import { constantTimeEqual, isChatAuthorized, isValidTelegramWebhookSecret } from "../src/security";
import { formatHermesEvent, validateHermesEvent } from "../src/events";

describe("parseCommand", () => {
  it("interpreta comando simples", () => {
    expect(parseCommand("/status")).toEqual({ name: "status", args: "" });
  });

  it("remove o usuário do bot", () => {
    expect(parseCommand("/alertas@HermesBot hoje")).toEqual({ name: "alertas", args: "hoje" });
  });

  it("ignora texto comum", () => {
    expect(parseCommand("olá")).toBeNull();
  });
});

describe("segurança", () => {
  it("compara secrets", () => {
    expect(constantTimeEqual("segredo", "segredo")).toBe(true);
    expect(constantTimeEqual("segredo", "outro")).toBe(false);
  });

  it("autoriza chat cadastrado", () => {
    expect(isChatAuthorized("123", "123,456")).toBe(true);
    expect(isChatAuthorized("789", "123,456")).toBe(false);
  });

  it("valida secret do webhook", () => {
    expect(isValidTelegramWebhookSecret("Abc_123-xyz")).toBe(true);
    expect(isValidTelegramWebhookSecret("segredo com espaço")).toBe(false);
  });
});

describe("eventos", () => {
  it("valida e formata evento", () => {
    const event = validateHermesEvent({
      eventType: "finance.account_overdue",
      severity: "high",
      title: "Conta vencida",
      description: "Uma conta está vencida.",
      companyName: "MM Capital"
    });

    expect(formatHermesEvent(event)).toContain("Conta vencida");
    expect(formatHermesEvent(event)).toContain("MM Capital");
  });
});
