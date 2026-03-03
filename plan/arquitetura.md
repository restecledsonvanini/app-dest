# Plano de Reestruturação e Arquitetura (Vanilla JS Moderno)

Este documento descreve o roadmap de refatoração do sistema para uma arquitetura moderna baseada em Vanilla JS (ES Modules, Event Delegation, FormData API e Web Components), visando clareza, organização e manutenibilidade para o desenvolvimento a longo prazo.

## Fase 1: Arquitetura Base e Event Delegation ✅ CONCLUÍDO
- [x] Migrar para ES Modules (`<script type="module">`).
- [x] Criar ponto de entrada único (`main.js`).
- [x] Remover eventos e funções inline (`onclick="()"`) do HTML.
- [x] Implementar Event Delegation global para botões de cópia (`data-action="copy"`) e limpeza (`data-action="clear"`).
- [x] Isolar a lógica de abas em um módulo independente (`modules/tabs.js`).
- [x] Isolar a lógica de mensagens de feedback e cópia para a área de transferência (`modules/ui.js`).
- [x] Estruturar os blocos de ferramentas HTML substituindo `<div class="tool-body">` para semântica correta usando `<form class="tool-body form-tool" data-tool="...">`.
- [x] Formatação automática Global (ex: dates.js formatando inserções DD/MM/YYYY transparentemente).

## Fase 2: Centralização de Utilitários e Lógica Central (Core Logic) ✅ CONCLUÍDO
- [x] Criar `modules/validators.js` — validações puras (isValidCNPJ), sem acesso ao DOM.
- [x] Criar `modules/formatters.js` — funções puras de formatação (formatCNPJ, formatCPF, formatEProtocolo, formatGMS, stripMask).
- [x] Criar `modules/dateUtils.js` — operações de data puras (parseBRDate, formatBRDate, calcEndDate, calcDaysStatus).
- [x] Criar `modules/inputBehaviors.js` — comportamentos de input (auto-formatação DD/MM/YYYY, sanitização numérica), centralizando os listeners que estavam em `dates.js` e `utils.js`.
- [x] Marcar `utils.js`, `masks.js`, `dates.js`, `consultas.js` como DEPRECATED com comentário de mapa de migração. Escopo global eliminado.

## Fase 3: Roteamento de Formulários Nativos e FormData API ✅ CONCLUÍDO
- [x] Criar `modules/toolHandlers.js` — mapa `data-tool → handler(FormData, resultBox)`. Todos os handlers usam `new FormData(form)` em vez de `document.getElementById`. Importam apenas módulos puros.
- [x] Adicionar `export function updateActionButtons(resultBox)` ao `modules/ui.js`.
- [x] Atualizar `main.js` — roteador `submit` via `e.target.closest('.form-tool')`, chama `toolHandlerMap[form.dataset.tool]`; importa `initInputBehaviors` e `toolHandlerMap`.
- [x] HTML `ferramentas/index.html` — `type="submit"` em todos os `btn-primary`, `type="button"` em todos os `btn-copy` e `btn-clear` para evitar submit acidental.
- [x] Delegador de clicks atualizado para aceitar `.btn-copy` por classe (sem exigir `data-action="copy"` no HTML).

## Fase 4: Web Components e UX (Opcional/Futuro) ⏳ PENDENTE
- [ ] Transformar componentes HTML muito repetitivos do `index.html` em Custom Elements do Vanilla JS (Web Components como `<result-box>`, ou `<input-group>`).
- [ ] Revisão geral do arquivo de CSS global `global.css` para utilizar escopo de variáveis CSS mais inteligente em relacão ao `ferramentas.css`.
- [ ] Checagens de acessibilidade e refinamento da navegação por teclado.

---
**Status Atual (03/03/2026):** Fases 1, 2 e 3 concluídas. Arquitetura de módulos ES completa — `validators.js`, `formatters.js`, `dateUtils.js`, `inputBehaviors.js`, `toolHandlers.js` criados; roteador FormData ativo em `main.js`. Pronto para iniciar a Fase 4 (Web Components / revisão CSS) na próxima sessão.