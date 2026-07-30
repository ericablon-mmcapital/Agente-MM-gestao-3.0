# Arquitetura inicial

```text
MM Gestão
   ↓ eventos autenticados
Hermes — núcleo do agente
   ↓
Adaptadores de canal
   ├── Telegram
   └── WhatsApp, futuramente
```

O Hermes fica fora do frontend do MM Gestão. O sistema publica eventos em uma API autenticada, e o agente decide para qual canal e responsável enviar.

Nesta primeira versão não há banco próprio. A próxima fase definirá uma fonte canônica para usuários, empresas, responsáveis, fila e auditoria. A preferência é reutilizar o Supabase do MM Gestão por funções controladas ou usar uma base separada sem duplicar regras.
