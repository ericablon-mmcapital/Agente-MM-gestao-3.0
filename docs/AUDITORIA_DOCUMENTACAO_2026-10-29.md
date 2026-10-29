# Auditoria documental — Hermes / Agente MM Gestão (29/10/2026)

**Estado: PARCIAL (repositório acessível; vínculo Lovable não encontrado como projeto separado na listagem consultada).** GitHub `ericablon-mmcapital/Agente-MM-gestao-3.0`, pasta `Agente-MM-gestao/`.

## Evidências
- `Agente-MM-gestao/README.md` documenta Cloudflare Workers, canal Telegram, webhook e futura adaptação WhatsApp; `docs/ARCHITECTURE.md` e `docs/ROADMAP.md` existem.
- `Agente-MM-gestao/package.json`: scripts `dev=wrangler dev`, `deploy=wrangler deploy`, `deploy:prod=wrangler deploy --env production`, `typecheck=tsc --noEmit`, `test=vitest run`, `check=typecheck && test`.
- `wrangler.jsonc` está presente; **não foram acessados valores de secrets, executados builds ou acionados endpoints**.
- Não há migração própria identificada no diretório principal consultado; integrações e banco devem ser conferidos junto à API do MM Gestão.

## Matriz de revisão
| Tema | Estado / próximo passo |
|---|---|
| README, stack, arquitetura | Presentes; validar adaptadores/rotas contra src |
| Instalação/build/testes | Instruções e scripts identificados; executar `npm run check` em ambiente isolado |
| Banco e migrations | Dependências da integração com MM Gestão a mapear |
| Permissões e segurança | Conferir webhook secret, assinatura, escopo de chats, rate limit e logging sem expor tokens |
| Integrações | Telegram descrito; WhatsApp é futuro conforme README, não declarar implementado |
| Deploy/rollback | Workflow Wrangler descrito; documentar rollback por versão e smoke tests |
| Changelog | Não identificado CHANGELOG.md no diretório consultado; registrar releases |

**Para Eric:** definir owner do serviço Cloudflare, plano de rollback e correspondência de agentes MM em Lovable. Revisão de arquivos sem credenciais e sem execução/deploy. **Data:** 29/10/2026.