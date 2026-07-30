# Hermes — Agente MM Gestão

Fundação independente do agente central do MM Gestão.

Nesta versão, o Hermes roda em **Cloudflare Workers** e utiliza o **Telegram** como primeiro canal. A arquitetura já separa o núcleo do agente, o canal Telegram, os eventos vindos do MM Gestão e as rotas administrativas. O WhatsApp entra depois como outro adaptador, sem refazer o núcleo.

## O que já está pronto

- Webhook seguro do Telegram.
- Validação do `X-Telegram-Bot-Api-Secret-Token`.
- Lista de chats autorizados.
- Comandos `/start`, `/ajuda`, `/status`, `/minhas_empresas`, `/alertas` e `/relatorios`.
- Configuração automática do webhook.
- Envio de mensagem de teste.
- Endpoint inicial para eventos do MM Gestão.
- Cron opcional para teste de agendamento.
- Testes unitários.
- Arquivo reservado para o canal WhatsApp.

## 1. Requisitos

- Node.js LTS.
- Conta Cloudflare.
- Bot criado no Telegram pelo BotFather.

## 2. Instalar no computador

Abra o PowerShell dentro da pasta do projeto:

```powershell
npm install
Copy-Item .dev.vars.example .dev.vars
notepad .dev.vars
npm run check
npm run dev
```

O arquivo `.dev.vars` contém secrets e não deve ser enviado ao GitHub.

## 3. Criar o bot no Telegram

No Telegram:

1. Abra o **BotFather**.
2. Execute `/newbot`.
3. Escolha o nome do bot.
4. Escolha um usuário terminado em `bot`.
5. Copie o token recebido.
6. Guarde o token no secret `TELEGRAM_BOT_TOKEN`.

## 4. Entrar na Cloudflare

```powershell
npx wrangler login
```

## 5. Cadastrar secrets

Homologação:

```powershell
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put ADMIN_API_KEY
npx wrangler secret put TELEGRAM_ALLOWED_CHAT_IDS
npx wrangler secret put TELEGRAM_ADMIN_CHAT_ID
npx wrangler secret put MM_GESTAO_API_SECRET
```

Produção:

```powershell
npx wrangler secret put TELEGRAM_BOT_TOKEN --env production
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET --env production
npx wrangler secret put ADMIN_API_KEY --env production
npx wrangler secret put TELEGRAM_ALLOWED_CHAT_IDS --env production
npx wrangler secret put TELEGRAM_ADMIN_CHAT_ID --env production
npx wrangler secret put MM_GESTAO_API_SECRET --env production
```

`TELEGRAM_ALLOWED_CHAT_IDS` aceita vários IDs separados por vírgula:

```text
123456789,987654321
```

## 6. Publicar

Homologação:

```powershell
npm run deploy
```

Produção:

```powershell
npm run deploy:prod
```

Copie a URL gerada pelo Cloudflare Worker.

## 7. Configurar o webhook

```powershell
.\scripts\configure-webhook.ps1 `
  -WorkerUrl "https://agente-mm-hermes.SEUSUBDOMINIO.workers.dev" `
  -AdminApiKey "SUA_ADMIN_API_KEY"
```

O Telegram passará a enviar atualizações para:

```text
/webhooks/telegram
```

## 8. Descobrir e autorizar seu chat

1. Abra o bot no Telegram.
2. Envie `/start`.
3. O Hermes mostrará seu `chat_id`.
4. Cadastre esse ID em `TELEGRAM_ALLOWED_CHAT_IDS`.
5. Cadastre também em `TELEGRAM_ADMIN_CHAT_ID` para receber os primeiros alertas.
6. Atualize os secrets.
7. Envie `/status`.

## 9. Testar envio

```powershell
.\scripts\send-test.ps1 `
  -WorkerUrl "https://agente-mm-hermes.SEUSUBDOMINIO.workers.dev" `
  -AdminApiKey "SUA_ADMIN_API_KEY"
```

## 10. Evento inicial do MM Gestão

```http
POST /api/events
Authorization: Bearer MM_GESTAO_API_SECRET
Content-Type: application/json
```

Exemplo:

```json
{
  "eventType": "finance.account_overdue",
  "severity": "high",
  "title": "Conta vencida",
  "description": "Existe uma conta vencida há dois dias.",
  "companyName": "MM Capital",
  "moduleKey": "financial",
  "entityId": "exemplo-123",
  "deduplicationKey": "finance.account_overdue:exemplo-123"
}
```

Nesta primeira versão, o evento é enviado ao `TELEGRAM_ADMIN_CHAT_ID`. Persistência, deduplicação definitiva, matriz de responsáveis e escalonamento entram na próxima fase.

## 11. Cron

Existe um Cron Trigger às 11:00 UTC em dias úteis, equivalente a 08:00 na Bahia enquanto o fuso estiver em UTC−3.

Ele somente envia mensagem quando:

```text
ENABLE_CRON_HEARTBEAT=true
```

O valor padrão é `false`, evitando mensagens automáticas durante a implantação.

## Segurança

- Nunca coloque tokens no GitHub.
- Nunca envie o arquivo `.dev.vars`.
- Não use dados reais antes de cadastrar os chats autorizados.
- Troque imediatamente qualquer token exposto.
- O endpoint administrativo exige `ADMIN_API_KEY`.
- O webhook exige o secret configurado no Telegram.
- O endpoint de eventos exige `MM_GESTAO_API_SECRET`.
- O Hermes ainda não executa SQL livre nem ações administrativas.

## Próximas fases

1. Persistência no Supabase ou D1.
2. Usuários, empresas e destinatários.
3. Matriz de responsáveis.
4. Fila, deduplicação e retentativas.
5. Relatórios agendados.
6. Integração real com o MM Gestão.
7. Perguntas com ferramentas autorizadas.
8. WhatsApp Business Platform.
