# Mapa de Arquitetura — Vanilla JS Moderno

> Atualizado em 04/03/2026 — Fases 1–5B-3 concluídas.

---

## Estrutura de Módulos (JS)

```
ferramentas/index.html
        │
        │  <script type="module" src="../src/js/main.js">
        │  (defer implícito — executa após o parse completo)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                          main.js                                │
│                     (ponto de entrada único)                    │
│                                                                 │
│  registerComponents()   ← ANTES do DOMContentLoaded            │
│  (upgrade de Custom Elements já no DOM)                         │
│                                                                 │
│  DOMContentLoaded                                               │
│  ├── initTabs()           ← módulo tabs.js                      │
│  ├── initInputBehaviors() ← módulo inputBehaviors.js            │
│  ├── initUIControls()     ← uiControls.js (font-size, tema)     │
│  │                                                              │
│  ├── Event Delegation ─ click                                   │
│  │     ├── button[data-action] / .btn-copy                      │
│  │     │     → handleCopyAction()    ← ui.js                    │
│  │     └────── data-action="clear"                              │
│  │             → handleClearAction() ← ui.js                    │
│  │                                                              │
│  └── Event Delegation ─ submit (.form-tool)                     │
│        │  const tool    = form.dataset.tool                     │
│        │  const data    = new FormData(form)   ← FormData API   │
│        │  const resultBox = form.querySelector('.result-box')   │
│        └──▶  toolHandlerMap[tool](data, resultBox)              │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
   │  ui.js      │    │toolHandlers  │    │  tabs.js     │
   │             │    │    .js       │    │              │
   │ handleCopy  │    │              │    │ initTabs()   │
   │ handleClear │    │ removeMask   │    │ initTabARIA()│
   │ updateAction│    │ addMaskEprot.│    │              │
   │  Buttons()  │    │ addMaskGMS   │    │ WAI-ARIA     │
   │             │    │ addMaskCPF   │    │ role=tablist │
   │ showGeneric │    │ addMaskCNPJ  │    │ role=tab     │
   │  Feedback() │    │ calcDate     │    │ aria-selected│
   │ (Popover    │    │ calcDays     │    │ aria-controls│
   │  API toast) │    │ searchCNPJ   │    │ ←→ teclado   │
   └──────┬──────┘    └──────┬───────┘    │              │
          │                  │            │ <details>    │
          │    ┌─────────────┼──────┐     │ hamburger    │
          │    ▼             ▼      ▼     │ (CSS sibling)│
          │ ┌──────────┐ ┌──────┐ ┌────┐ └──────────────┘
          │ │validators│ │form- │ │date│
          │ │  .js     │ │ters  │ │Util│
          │ │          │ │ .js  │ │s   │
          │ │isValid   │ │      │ │.js │
          │ │  CNPJ()  │ │strip │ │    │
          │ │          │ │Mask  │ │pars│
          │ │          │ │fmtCNP│ │eDate│
          │ │          │ │fmtCPF│ │calc│
          │ │          │ │fmtEPr│ │Days│
          │ └──────────┘ └──────┘ └────┘
          ▼
   ┌────────────────────┐   ┌─────────────────────────────┐
   │ inputBehaviors.js  │   │ components/                 │
   │                    │   │                             │
   │ auto DD/MM/YYYY    │   │ index.js  registerComponents│
   │ sanitize numeric   │   │ SheetCard.js  <sheet-card>  │
   │ (input events)     │   │ ToolPanel.js  <tool-panel>  │
   └────────────────────┘   │ ToolResult.js <tool-result> │
                            └─────────────────────────────┘
```

---

## Custom Elements (Web Components — Fase 4)

Todos usam **Light DOM** propositalmente — `event delegation` e `closest()` em
`ui.js` e `main.js` continuam funcionando sem nenhuma alteração.

```
┌─────────────────────────────────────────────────────────────┐
│  <sheet-card>  (SheetCard.js)                               │
│                                                             │
│  Atributos: href, label, title                              │
│  Renderiza: <a class="sheet-card" target="_blank"> + SVG    │
│  Eliminados: 19 blocos SVG repetidos nas 3 subtabs          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  <tool-panel>  (ToolPanel.js)                               │
│                                                             │
│  Atributos: heading, desc                                   │
│  Ação:      adiciona .tool-panel ao host                    │
│             injeta <div.tool-header> com <h3> + <p> via     │
│             prepend() (preserva filhos existentes)          │
│  Importante: ui.js usa closest('.tool-panel') — funciona    │
│             porque o host recebe a classe no connectedCallback│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  <tool-result>  (ToolResult.js)                             │
│                                                             │
│  Atributos: primary-icon, primary-label, result-id          │
│  Renderiza: .button-group (btn-primary + btn-copy + btn-    │
│             clear) + .result-box[aria-live="polite"]        │
│  Eliminados: ~20 linhas de HTML repetido por ferramenta     │
└─────────────────────────────────────────────────────────────┘
```

---

## Camadas de Responsabilidade (JS)

```
┌────────────────────────────────────────────────────────────┐
│  CAMADA 1 — VIEW                                           │
│  ferramentas/index.html                                    │
│                                                            │
│  • Semântica: <form data-tool>, inputs name=, Custom       │
│    Elements <tool-panel>, <tool-result>, <sheet-card>      │
│  • Acessibilidade declarativa: aria-label, inputmode,      │
│    role=dialog nos popovers, aria-live no .result-box      │
│  • ZERO lógica — apenas estrutura e contratos de dados     │
└────────────────────────────────────────────────────────────┘
              │ eventos DOM (submit / click)
              ▼
┌────────────────────────────────────────────────────────────┐
│  CAMADA 2 — ORQUESTRADOR                                   │
│  main.js                                                   │
│                                                            │
│  • Único ponto de entrada; registra Custom Elements antes  │
│    do DOMContentLoaded para upgrade imediato               │
│  • Roteador de eventos: data-tool → toolHandlerMap         │
│  • Não contém lógica de negócio; apenas conecta camadas    │
└────────────────────────────────────────────────────────────┘
              │ delega para
              ▼
┌────────────────────────────────────────────────────────────┐
│  CAMADA 3 — HANDLERS E UI                                  │
│  toolHandlers.js / ui.js / tabs.js / inputBehaviors.js     │
│                                                            │
│  • toolHandlers: lê FormData, valida, chama utilitários,   │
│    escreve no resultBox — desacoplado do DOM por completo  │
│  • ui.js: Popover API toast, copy/clear via clipboard API  │
│  • tabs.js: WAI-ARIA completo (tablist/tab/tabpanel),      │
│    navegação ←→ por teclado, hamburger <details>           │
└────────────────────────────────────────────────────────────┘
              │ importa
              ▼
┌────────────────────────────────────────────────────────────┐
│  CAMADA 4 — UTILITÁRIOS PUROS                              │
│  validators.js / formatters.js / dateUtils.js              │
│                                                            │
│  • Funções puras: entram primitivos, saem primitivos       │
│  • ZERO dependência de DOM, ZERO efeitos colaterais        │
│  • 100% testáveis em Node.js puro (Vitest / sem jsdom)     │
└────────────────────────────────────────────────────────────┘
```

---

## Arquitetura CSS — @layer (Fase 5B-1)

A cascata é declarada explicitamente. Camadas posteriores têm maior prioridade.
`global.css` foi encapsulado em `@layer global` para nunca sobrescrever as
camadas do arquivo principal.

```
@layer  global      ← global.css inteiro (menor prioridade)
        reset       ← box-sizing, tap-highlight, :focus-visible
        tokens      ← @property + :root + [data-theme="dark"]
        base        ← html, body, :root { transition }
        layout      ← header, .container, .card
        navigation  ← tabs, subtabs, hamburger, Custom Elements display
        components  ← inputs, botões, result-box, popovers, help-note
        responsive  ← @media 768px e 600px          (maior prioridade)
```

### Por que isso importa

```
ANTES (sem @layer)                DEPOIS (com @layer)
────────────────────────────────────────────────────────
global.css não encapsulado →      global.css em @layer global →
sobrescrevia max-width: 1100px    @layer layout vence sempre
sobrescrevia gradiente do header  gradiente correto sem !important
qualquer regra "lá fora" ganhava  ordem explícita, sem surpresas
```

---

## @property — Tokens Tipados (Fase 5B-2)

9 tokens de cor registrados com sintaxe completa. Isso habilita:

```css
@property --bg {
    syntax: '<color>';     /* tipo real — não string */
    inherits: true;
    initial-value: #f3f4f6;
}
```

```
Ganho concreto: transição suave ao trocar de tema (light ↔ dark)
─────────────────────────────────────────────────────────────────
:root {
    transition:
        --bg 0.25s ease,
        --card-bg 0.25s ease,
        --text 0.25s ease,
        ... 8 tokens no total;
}

Sem @property: custom properties são strings — o browser não sabe
interpolar entre "#ffffff" e "#1e293b", então a mudança seria abrupta.
Com @property: o browser interpola como cor real → fade suave.
```

---

## CSS Nesting (Fase 5B-3)

Modificadores de componente são declarados dentro do seletor-pai,
eliminando repetição e deixando claro o escopo de cada variante.

```css
/* Exemplo: .tab-btn e seus estados */
.tab-btn {
    /* estilos base */

    &:hover         { background: var(--tab-hover-bg); }
    &.active        { color: var(--tab-active); }
    & svg           { width: 20px; }
}

/* Exemplo: .result-box e seus estados */
.result-box {
    /* estilos base */

    &:empty         { display: none; }          /* oculta quando vazio */
    &.info          { background: var(--info-bg); }
    &.error         { background: var(--error-bg); }
}
```

Aplicado em: `.tab-btn`, `.tab-content`, `.subtab-btn`, `.tool-panel`,
`.tool-header`, `.input-field`, `.result-box`, `.btn-copy/.btn-clear`,
`.sheet-card`, `.info-popover`.

---

## Hamburger Mobile — <details>/<summary> (Fase 5A-3)

O menu mobile usa o elemento nativo `<details>` em vez de JS + `aria-expanded`.
O estado aberto/fechado é gerenciado pelo próprio browser.

### Estrutura HTML (simplificada)

```html
<!-- <details> e <nav> são IRMÃOS — nunca pai/filho -->
<details id="mobile-tab-details">
    <summary>☰ Menu de Ferramentas</summary>
    <!-- sem filhos além do summary -->
</details>
<div id="main-tab-nav" role="tablist">
    <!-- botões de aba -->
</div>
```

### CSS — Adjacent Sibling Combinator (+)

```css
/* Desktop: details oculto, nav sempre visível */
#mobile-tab-details { display: none; }

/* Mobile (≤768px) */
@media (max-width: 768px) {
    #mobile-tab-details  { display: block; }
    #main-tab-nav        { display: none; }   /* oculto por padrão */

    /* quando details[open], o irmão imediato aparece */
    #mobile-tab-details[open] + #main-tab-nav {
        display: flex;
        flex-direction: column;
        /* ... */
    }
}
```

### Por que tab-nav não pode estar DENTRO do <details>

```
O browser esconde todos os filhos não-<summary> de um <details> fechado
diretamente no mecanismo de renderização (não via UA stylesheet).
Nenhum CSS — nem display:flex com !important — consegue exibir esses
filhos. A única solução correta é manter os dois elementos como irmãos
e usar o combinador + para reagir ao atributo [open].
```

### JS (tabs.js) — continua funcionando sem alteração de lógica

```javascript
const detailsEl = document.getElementById('mobile-tab-details');
const tabNav    = document.getElementById('main-tab-nav');

// Fecha o menu ao selecionar uma aba
detailsEl?.removeAttribute('open');

// ARIA no nav (getElementById encontra o elemento mesmo sendo irmão)
tabNav.setAttribute('role', 'tablist');
```

---

## Popover API — Toast e Modais (Fase 5A-6 + 5C-5)

### Toast de feedback

```html
<div id="feedback-toast" popover="manual" role="status" aria-live="polite"></div>
```

```javascript
// ui.js — sem biblioteca, sem setTimeout visual
toast.showPopover();
setTimeout(() => toast.hidePopover(), 1800);
```

```css
/* Animação de entrada com @starting-style (Baseline 2024) */
#feedback-toast {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.25s, transform 0.25s,
                display 0.25s allow-discrete,   /* anima display:none */
                overlay 0.25s allow-discrete;   /* assegura top-layer */
}
#feedback-toast:not(:popover-open) { opacity: 0; transform: translateY(-6px); }

@starting-style {
    #feedback-toast:popover-open { opacity: 0; transform: translateY(-6px); }
}
```

### Popovers centrados (Regras / Ajuda)

```html
<!-- Declarativo — sem JS, só o atributo popovertarget -->
<button popovertarget="regras-popover">Regras de cálculo</button>

<div id="regras-popover" popover class="info-popover" role="dialog">
    <button popovertarget="regras-popover" popovertargetaction="hide">✕</button>
    <!-- conteúdo -->
</div>
```

```
Ganhos da Popover API vs. modal manual:
• Gerenciamento de foco automático (browser)
• Tecla Esc fecha por padrão (sem listener)
• Renderizado no top-layer — acima de qualquer z-index
• ::backdrop nativo para overlay escurecida
• Abertura/fechamento com display:none animável via allow-discrete
• Botão "fechar" sem nenhum JS — só popovertargetaction="hide"
```

---

## WAI-ARIA — Tabs Acessíveis (Fase 5A-3 + tabs.js)

```
Pattern: WAI-ARIA Authoring Practices — Tabs
─────────────────────────────────────────────────────────────
Element             Role         Key attributes
─────────────────────────────────────────────────────────────
#main-tab-nav       tablist      —
.tab-btn            tab          aria-selected, aria-controls
#planilhas etc.     tabpanel     tabindex=0, aria-labelledby
.subtab-nav         tablist      aria-label
.subtab-btn         tab          aria-selected, aria-controls
.subtab-content     tabpanel     tabindex=0
─────────────────────────────────────────────────────────────
Navegação por teclado (main tabs):
  ←/→   move foco entre abas + ativa
  Home  vai para a primeira aba
  End   vai para a última aba
─────────────────────────────────────────────────────────────
.result-box     aria-live="polite"  aria-atomic="true"
                → leitor de tela anuncia resultado após submit
```

---

## Focus / Outline — Hard Reset Acessível (Fase 5)

```css
@layer reset {
    /* Remove o flash azul do tap em mobile */
    *, *::before, *::after {
        -webkit-tap-highlight-color: transparent;
    }

    /* Remove outline padrão do browser em cliques com mouse —
       bordas "estranhas" que apareciam em tabpanels e botões */
    :focus:not(:focus-visible) { outline: none; }

    /* Restaura outline com estilo próprio para navegação por teclado —
       acessibilidade preservada onde importa */
    :focus-visible {
        outline: 2px solid var(--primary, #0b3d91);
        outline-offset: 2px;
        border-radius: 3px;
    }
}
```

```
Regra: :focus-visible é ativado pelo browser apenas quando o foco
chegou via teclado ou método programático — nunca por clique com mouse.
Resultado: zero bordas "estranhas" ao clicar, outline limpo ao tabular.
```

---

## Como Adicionar uma Nova Ferramenta

```
Precisa de uma nova ferramenta "Calcular Prazo Recurso"?
São necessárias apenas 2 alterações. main.js não muda.

1. HTML — ferramentas/index.html (dentro da aba correta):
   ┌──────────────────────────────────────────────────────┐
   │ <tool-panel heading="Prazo Recurso"                  │
   │             desc="Calcula prazo a partir da decisão">│
   │   <form class="tool-body form-tool"                  │
   │         data-tool="calcPrazoRecurso">                │
   │     <div class="input-group">                        │
   │       <label for="...">Data da Decisão:</label>      │
   │       <input name="data_decisao" class="input-field">│
   │     </div>                                           │
   │     <tool-result primary-icon="bi bi-calendar-check" │
   │                  primary-label="Calcular"            │
   │                  result-id="prazo-result">           │
   │     </tool-result>                                   │
   │   </form>                                            │
   │ </tool-panel>                                        │
   └──────────────────────────────────────────────────────┘

2. Handler — toolHandlers.js:
   ┌──────────────────────────────────────────────────────┐
   │ function handleCalcPrazoRecurso(data, resultBox) {   │
   │   const dataDecisao = parseBRDate(                   │
   │       data.get('data_decisao'));                      │
   │   if (!dataDecisao) return err(resultBox, '...');    │
   │   const result = /* lógica pura */;                  │
   │   ok(resultBox, ioHtml(input, result), result);      │
   │ }                                                    │
   │                                                      │
   │ export const toolHandlerMap = {                      │
   │   ...handlers existentes,                            │
   │   calcPrazoRecurso: handleCalcPrazoRecurso,  ← aqui  │
   │ };                                                   │
   └──────────────────────────────────────────────────────┘
```

---

## Antes vs. Depois — Fases 1–5

```
ANTES (app original)               DEPOIS (Fases 1–5B-3)
─────────────────────────────────────────────────────────────────────
onclick="removeMask()"             <form data-tool="removeMask">
onclick="clearResult('id')"        data-action="clear"
                                   → Event Delegation (zero inline JS)

document.getElementById('x').value new FormData(form).get('name')
                                   → sem acoplamento por ID

isValidCNPJ() em consultas.js      modules/validators.js  (pura, testável)
formatCNPJ()  em consultas.js      modules/formatters.js  (pura, testável)
parseBRDate() em utils.js          modules/dateUtils.js   (pura, testável)
autoFormatDate() em dates.js       modules/inputBehaviors.js

<div class="tool-panel"> ×8        <tool-panel heading="..."> ×8
  + <div.tool-header> h3 p           connectedCallback injeta o header
  + <div.button-group>             <tool-result primary-label="...">
  + botões copy/clear                connectedCallback injeta botões + result-box
  + <div.result-box>

5 arquivos com escopo global       0 variáveis globais
<script src="..."> ×5              <script type="module"> ×1

CSS sem hierarquia clara           @layer com 8 camadas explícitas
global.css sobrescrevia tudo       global.css em @layer global (menor prioridade)
custom properties como strings     @property tipado — transições suaves
bordas em todos os cliques         :focus-visible — outline só no teclado
modal de ajuda inexistente         Popover API — foco + Esc + backdrop nativos
hamburguer com JS toggle           <details> nativo + CSS sibling combinator
aria-* inconsistente               WAI-ARIA Tabs completo + nav por teclado
```

---

## Próximas Etapas — Fase 5 (pendentes)

```
5B-4   :has() selector
         Ex: .tool-panel:has(.result-box.info) → destacar painel com resultado

5A-1   <output> element
         Substituir .result-box por <output> semântico onde aplicável

5A-4   inert attribute
         Campos desabilitados via inert em vez de disabled para
         bloquear interação durante carregamento do CNPJ

5C-1   AbortController
         Cancelar fetch do CNPJ se o usuário submeter novamente
         const ac = new AbortController(); fetch(url, { signal: ac.signal })

5C-2   Named capture groups (RegExp)
         /(?<dia>\d{2})\/(?<mes>\d{2})\/(?<ano>\d{4})/
         em dateUtils.js — mais legível que índices numéricos

5C-3   Array.at()
         tabs.at(-1) em vez de tabs[tabs.length - 1]
         em navegação por teclado no tabs.js
```

