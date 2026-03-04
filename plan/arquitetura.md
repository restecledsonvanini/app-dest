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

## Fase 4: Web Components e UX ✅ CONCLUÍDO
- [x] Criar `modules/components/SheetCard.js` — Custom Element `<sheet-card>` (substitui 19 `<a class="sheet-card">` com SVG inline repetido nas 3 subtabs de planilhas).
- [x] Criar `modules/components/ToolResult.js` — Custom Element `<tool-result>` (encapsula button-group com botões copiar/limpar + `.result-box` com `aria-live="polite"`). Sem Shadow DOM: event delegation e lógica de `ui.js` inalterados.
- [x] Criar `modules/components/ToolPanel.js` — Custom Element `<tool-panel>` (insere `.tool-header` via `prepend`, preservando filhos existentes; adiciona classe `.tool-panel` ao host). Sem Shadow DOM: `closest('.tool-panel')` em `ui.js` continua funcional.
- [x] Criar `modules/components/index.js` — barrel `registerComponents()`, chamado em `main.js` antes do `DOMContentLoaded`.
- [x] Aplicar os 3 componentes em `ferramentas/index.html` — 19 `<sheet-card>`, 8 `<tool-panel>`, 7 `<tool-result>`. HTML reduzido de 716 para ~420 linhas.
- [x] CSS: `ferramentas.css` passa a importar `global.css` via `@import`; duplicatas de `--ctrl-bar-*` / `--ctrl-group-bg` removidas de `ferramentas.css` (12 linhas eliminadas).
- [x] A11y — `tabs.js` reescrito: inicializa `role="tablist/tab/tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby` programaticamente para todas as abas e subabas; navegação por teclado (←/→/Home/End) no tablist principal (WAI-ARIA Tabs Pattern).

---
**Status Atual (04/03/2026):** Todas as 4 fases concluídas. Arquitetura Vanilla JS ES Modules completa com Web Components (light DOM), CSS compartilhado via `@import`, e suporte ARIA/teclado nas abas.

---

## Fase 5: Modernização Profunda (ESNext · CSS 2024-26 · HTML Semântico) ⏳ PLANEJADO

> Objetivo: usar o projeto como laboratório explícito de plataforma web moderna. Cada item é rastreável a uma feature específica da plataforma com Baseline definido.

### 5A — HTML Semântico

| Item | Feature | Baseline | Arquivos | Impacto |
|---|---|---|---|---|
| `5A-1` | Substituir `.result-box` por `<output form="…">` em todos os forms | Amplo | `ferramentas/index.html`, `ToolResult.js`, `ui.js`, `toolHandlers.js` | Leitores de tela anunciam o resultado automaticamente; `aria-live` deixa de ser necessário |
| `5A-2` | Envolver form de searchCNPJ em `<search>` | Baseline 2023 | `ferramentas/index.html` | Semântica correta de landmark de busca |
| `5A-3` | Substituir hamburguer JS toggle por `<details>/<summary>` nativo | Amplo | `ferramentas/index.html`, `tabs.js`, `ferramentas.css` | Elimina o bloco hamburguer de `tabs.js`; open/close nativo sem JS |
| `5A-4` | Adicionar `inert` a todos os `.tab-content` não ativos e `.subtab-content` não ativos | Baseline 2023 | `tabs.js` | Bloqueia foco e screen readers em painéis ocultos sem CSS tricks |
| `5A-5` | `<fieldset>/<legend>` no grupo número GMS + ano | Amplo | `ferramentas/index.html` | Agrupa semanticamente inputs relacionados; melhora navegação por teclado e leitores |
| `5A-6` | ✅ Substituir toast de feedback JS por `<div popover="manual" id="feedback-toast">` nativo + `showPopover()` | Baseline 2024 | `ferramentas/index.html`, `ui.js` | Elimina criação/remoção dinâmica de elemento; `::backdrop` e positioning nativos; zero JS de layout |
| `5A-7` | `autocomplete="off"` explícito nos campos de data; `autocomplete` semântico nos demais | Amplo | `ferramentas/index.html` | Evita sugestões incorretas do browser em campos de formato BR |

### 5B — CSS Moderno

| Item | Feature | Baseline | Arquivos | Impacto |
|---|---|---|---|---|
| `5B-1` | ✅ `@layer reset, tokens, base, layout, navigation, components, responsive` em `ferramentas.css` | Baseline 2022 | `ferramentas.css` | Resolve conflitos de especificidade estruturalmente; elimina necessidade de `!important` |
| `5B-2` | ✅ `@property` para tipar `--primary`, `--bg`, `--text`, `--panel-bg` e outros como `<color>` + `transition` em `:root` | Baseline 2023 | `ferramentas.css` | Habilita `transition` suave em variáveis de cor ao trocar tema (dark/light); hoje a troca é instantânea |
| `5B-3` | ✅ CSS Nesting em `.tab-btn`, `.tab-content`, `.subtab-btn`, `.tool-panel`, `.input-field`, `.result-box`, `.btn-copy/.btn-clear`, `.sheet-card` | Baseline 2024 | `ferramentas.css` | Reduz duplicação de seletores; legibilidade próxima de SCSS sem pré-processador |
| `5B-4` | `:has()` para habilitar botões de ação sem JS: `tool-panel:has(output.info) .btn-copy` | Baseline 2023 | `ferramentas.css`, `ui.js` | Reduz ou elimina `updateActionButtons()`; estado de UI dirigido por CSS |
| `5B-5` | `@starting-style` + `transition-behavior: allow-discrete` no `.result-box` / `output` | Baseline 2024 | `ferramentas.css` | Anima a aparição do resultado (`display: none → block`) sem adicionar/remover classes via JS |
| `5B-6` | `@container` queries em `tool-panel` | Baseline 2023 | `ferramentas.css`, `ToolPanel.js` | Responsividade do componente por seu próprio tamanho, não pelo viewport; demonstra como WCs se beneficiam de container queries |
| `5B-7` | `clamp()` nos `font-size` fixos de `.tab-btn`, `.tool-desc`, `.btn` | Baseline 2020 | `ferramentas.css` | Substitui algumas media queries de tipografia por fluido contínuo |
| `5B-8` | `interpolate-size: allow-keywords` no `.tab-content` para animar `height: auto` | Baseline 2025 | `ferramentas.css` | Substituir `fadeIn` (opacity+transform) por abertura com altura real; sem JS |
| `5B-9` | `field-sizing: content` em possíveis `<textarea>` futuros | Baseline 2024 | `ferramentas.css` | Demonstração; aplica quando o campo de resultado for promovido a textarea |
| `5B-10` | `color-mix()` para gerar tons hover/active sem criar novas variáveis | Baseline 2023 — em uso parcial | `ferramentas.css` | Uso já iniciado no `5A-6`; expandir para `.btn-copy:hover`, `.sheet-card:hover` |

### 5C — JavaScript ESNext

| Item | Feature | ES / API | Arquivos | Impacto |
|---|---|---|---|---|
| `5C-1` | `AbortController` + cancelar request duplicada em `handleSearchCNPJ` | ES2015 API (Fetch) | `toolHandlers.js` | Impede race condition se usuário submete o form duas vezes rapidamente |
| `5C-2` | Named capture groups em `formatCNPJ`, `formatCPF`, `formatEProtocolo` | ES2018 | `formatters.js` | `(?<block1>\d{2})` em vez de `$1`; intenção explícita nos padrões |
| `5C-3` | `Array.at()` em `parseBRDate` e qualquer acesso por índice de array | ES2022 | `dateUtils.js` | `parts.at(0)` vs `parts[0]`; `at(-1)` para último elemento sem `length - 1` |
| `5C-4` | Logical assignment (`??=`, `&&=`) em `setResult` e `initUIControls` | ES2021 | `toolHandlers.js`, `uiControls.js` | `dataResult ??= null`; `savedTheme ??= 'light'` |
| `5C-5` | ✅ `showPopover()` / `hidePopover()` no toast de feedback (substitui `ui.js` DOM creation) | Baseline 2024 | `ui.js`, `ferramentas/index.html` | Elimina `createElement`, `appendChild`, `setTimeout remove`; sincronia com 5A-6 |
| `5C-6` | Dynamic `import()` lazy para `toolHandlers.js` no roteador de submit | ESM nativo | `main.js` | Demonstra code-splitting manual: o módulo pesado só carrega quando o primeiro form é submetido |
| `5C-7` | `Object.groupBy()` para organizar resultados futuros (ex: agrupar planilhas por categoria) | ES2024 | `toolHandlers.js` ou novo módulo | Demonstração de API de agrupamento nativa sem `reduce` |
| `5C-8` | Substituir `for` de validação CNPJ por `Array.from` + `reduceRight` com intenção declarativa | ESNext style | `validators.js` | Mantém lógica; muda de imperativo para funcional |
| `5C-9` | `structuredClone()` como substituição explícita de spread shallow-copy (demonstrativo) | ES2022 | Comentário em `dateUtils.js` / doc | Documenta o padrão moderno de deep clone |
| `5C-10` | `queueMicrotask()` vs `setTimeout(fn, 0)` — refatorar o delay de remoção do toast | ES2019 | `ui.js` | `queueMicrotask` para microtask queue; `setTimeout` para macro; demonstra diferença de event loop |

### Ordem de execução sugerida

```
5A-6 + 5C-5   → popover nativo (HTML + JS juntos — dependência mútua)
5A-3           → details/summary hamburguer (isola mudança em tabs.js)
5B-1           → @layer (refactor estrutural do CSS; deve vir antes dos outros CSS)
5B-2           → @property (habilita os transitions de tema)
5B-3           → CSS Nesting (cosmético; pode ser feito em paralelo com 5B-2)
5B-4 + 5A-1   → :has() + <output> (dependência: output precisa estar no HTML para o seletor funcionar)
5B-5           → @starting-style (depende de output/display já correto)
5A-4           → inert em tabs.js (isolado, sem dependência)
5C-1           → AbortController (isolado em toolHandlers.js)
5C-2 + 5C-3   → formatters + dateUtils (puramente nos módulos puros, sem tocar no DOM)
5C-4           → logical assignment (cosmético, qualquer ordem)
5C-6           → dynamic import (main.js, independente)
5A-5 + 5A-7   → fieldset/autocomplete (HTML puro, sem JS)
5B-6           → @container (depende de tool-panel já estável)
5B-7 + 5B-10  → clamp + color-mix (cosmético CSS)
5C-7 + 5C-8   → Object.groupBy + validators refactor (demonstrativo, sem urgência)
5B-8 + 5B-9   → interpolate-size + field-sizing (experimental/demonstrativo por último)
```

---
**Status Atual (04/03/2026):** Todas as 4 fases concluídas. Fase 5 em andamento — `5B-1`, `5A-6`, `5C-5`, `5A-3`, `5B-2`, `5B-3` ✅ concluídos (23 itens planejados, 6 concluídos).