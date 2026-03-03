# Mapa de Arquitetura — Vanilla JS Moderno

> Gerado em 03/03/2026 após conclusão das Fases 1, 2 e 3.

---

## Estrutura de Módulos

```
ferramentas/index.html
        │
        │  <script type="module" src="../src/js/main.js">
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                          main.js                                │
│                     (ponto de entrada único)                    │
│                                                                 │
│  DOMContentLoaded                                               │
│  ├── initTabs()           ← módulo tabs.js                      │
│  ├── initInputBehaviors() ← módulo inputBehaviors.js            │
│  │                                                              │
│  ├── Event Delegation ─ click                                   │
│  │     ├── .btn-copy     → handleCopyAction()   ← ui.js         │
│  │     └── data-action=clear → handleClearAction() ← ui.js     │
│  │                                                              │
│  └── Event Delegation ─ submit (.form-tool)                     │
│        │                                                        │
│        │  const tool = form.dataset.tool  ("removeMask" etc.)   │
│        │  const data = new FormData(form)                        │
│        │  const box  = form.querySelector('.result-box')         │
│        │                                                        │
│        └──▶  toolHandlerMap[tool](data, box)  ← toolHandlers.js │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
   │  ui.js      │    │toolHandlers  │    │  tabs.js     │
   │             │    │    .js       │    │              │
   │ handleCopy  │    │              │    │ initTabs()   │
   │ handleClear │    │ removeMask   │    │              │
   │ updateAction│    │ addMaskEprot.│    │ hamburguer   │
   │  Buttons()  │    │ addMaskGMS   │    │ main tabs    │
   └──────┬──────┘    │ addMaskCPF   │    │ subtabs      │
          │           │ addMaskCNPJ  │    └──────────────┘
          │           │ calcDate     │
          │           │ calcDays     │
          │           │ searchCNPJ   │
          │           └──────┬───────┘
          │                  │
          │    ┌─────────────┼──────────────────┐
          │    ▼             ▼                  ▼
          │ ┌──────────┐ ┌──────────┐ ┌──────────────────┐
          │ │validators│ │formatters│ │   dateUtils.js   │
          │ │  .js     │ │  .js     │ │                  │
          │ │          │ │          │ │ parseBRDate()    │
          │ │isValid   │ │formatCNPJ│ │ formatBRDate()   │
          │ │  CNPJ()  │ │formatCPF │ │ calcEndDate()    │
          │ │          │ │formatEPr.│ │ calcDaysStatus() │
          │ │          │ │formatGMS │ │                  │
          │ └──────────┘ │stripMask │ └──────────────────┘
          │              └──────────┘
          ▼
   ┌──────────────────┐
   │ inputBehaviors   │
   │     .js          │
   │                  │
   │ initInput        │
   │  Behaviors()     │
   │                  │
   │ auto DD/MM/YYYY  │
   │ sanitiza numeric │
   └──────────────────┘
```

---

## Camadas e Responsabilidades

```
┌────────────────────────────────────────────────────────────┐
│  CAMADA 1 — VIEW                                           │
│  ferramentas/index.html                                    │
│                                                            │
│  • Estrutura semântica: <form data-tool="...">,            │
│    inputs com name=, botões com type="submit/button"       │
│  • ZERO lógica — apenas declaração de dados e estrutura    │
└────────────────────────────────────────────────────────────┘
              │ eventos DOM (submit / click)
              ▼
┌────────────────────────────────────────────────────────────┐
│  CAMADA 2 — ORQUESTRADOR                                   │
│  main.js                                                   │
│                                                            │
│  • Único ponto de entrada, inicializa tudo                 │
│  • Roteador de eventos — não contém lógica de negócio      │
│  • Conecta View ↔ Handlers via data-tool + FormData        │
└────────────────────────────────────────────────────────────┘
              │ delega para
              ▼
┌────────────────────────────────────────────────────────────┐
│  CAMADA 3 — HANDLERS DE FERRAMENTA                         │
│  modules/toolHandlers.js                                   │
│                                                            │
│  • Lê FormData, valida, chama utilitários puros            │
│  • Escreve no resultBox via helper setResult()             │
│  • 100% desacoplado do DOM (recebe o form e o box)         │
└────────────────────────────────────────────────────────────┘
              │ importa
              ▼
┌────────────────────────────────────────────────────────────┐
│  CAMADA 4 — UTILITÁRIOS PUROS                              │
│  validators.js / formatters.js / dateUtils.js              │
│                                                            │
│  • Funções puras: entram primitivos, saem primitivos       │
│  • ZERO dependência de DOM, ZERO efeitos colaterais        │
│  • Facilmente testáveis em isolamento (Node.js, Vitest…)   │
└────────────────────────────────────────────────────────────┘
```

---

## O que Ganhamos — Antes vs. Depois

```
ANTES                              DEPOIS
─────────────────────────────────────────────────────────────
onclick="removeMask()"             <form data-tool="removeMask">
onclick="clearResult('...')"       type="button" data-action="clear"
                                   → Event Delegation global

document.getElementById('input')   new FormData(form).get('value')
  .value                           → sem acoplamento por ID

isValidCNPJ()   em consultas.js    modules/validators.js  (pura)
formatCNPJ()    em consultas.js    modules/formatters.js  (pura)
parseBRDate()   em utils.js        modules/dateUtils.js   (pura)
autoFormatDate()em dates.js        modules/inputBehaviors.js

5 arquivos com escopo global       0 variáveis globais
<script src="..."> ×5              <script type="module"> ×1
```

---

## Como Adicionar uma Nova Ferramenta

```
Precisa de uma nova ferramenta "Calcular Prazo Recurso"?

1. HTML — adicionar em ferramentas/index.html:
   ┌──────────────────────────────────────────────────────┐
   │ <form class="tool-body form-tool"                    │
   │       data-tool="calcPrazoRecurso">                  │
   │   <input name="data_decisao" ...>                    │
   │   <input name="prazo_dias" ...>                      │
   │   <button type="submit">Calcular</button>            │
   │   <button type="button" class="btn-copy" ...>        │
   │   <button type="button" class="btn-clear"            │
   │           data-action="clear" ...>                   │
   │   <div class="result-box"></div>                     │
   │ </form>                                              │
   └──────────────────────────────────────────────────────┘

2. Handler — adicionar em toolHandlers.js:
   ┌──────────────────────────────────────────────────────┐
   │ function handleCalcPrazoRecurso(data, resultBox) {   │
   │   const dataDecisao = parseBRDate(                   │
   │       data.get('data_decisao'));                      │
   │   const prazo = parseInt(data.get('prazo_dias'));     │
   │   ...                                                │
   │ }                                                    │
   └──────────────────────────────────────────────────────┘

3. Registrar no mapa — 1 linha:
   ┌──────────────────────────────────────────────────────┐
   │ export const toolHandlerMap = {                      │
   │   ...handlers existentes,                            │
   │   calcPrazoRecurso: handleCalcPrazoRecurso,  ← aqui  │
   │ };                                                   │
   └──────────────────────────────────────────────────────┘

   main.js não precisa de nenhuma alteração.
```

---

## Recursos Modernos Utilizados

```
HTML
├── <form> semântico como contêiner de ferramenta
├── name= nos inputs  →  nativo para FormData API
├── type="submit" / type="button"  →  comportamento correto no form
├── data-tool / data-action  →  contrato de comunicação sem JS inline
└── inputmode="numeric", pattern=, aria-label=  →  acessibilidade/mobile

CSS
├── Custom Properties (--primary, etc.)  →  tokens globais reutilizáveis
├── Sticky header  →  position: sticky; top: 0
├── Layout com Flexbox  →  input-row, button-group, res-col
└── Seletores de estado via classes JS (.active, .show)

JavaScript
├── ES Modules (import/export)  →  nativo no browser, zero bundler
├── <script type="module">  →  defer implícito, escopo isolado
├── FormData API  →  lê formulário inteiro via new FormData(form)
├── Event Delegation  →  um listener global para N botões
├── CustomEvent  →  tool::cleared para extensibilidade futura
├── Optional chaining (?.)  →  document.getElementById(id)?.addEventListener
├── async/await + fetch  →  searchCNPJ sem callbacks
└── Arrow functions + const/let  →  sem var, sem hoisting surpresa
```

---

## O que Ainda Dá para Melhorar — Fase 4 em Diante

```
PRIORIDADE ALTA
├── Persistência de estado
│     sessionStorage / localStorage para recuperar último resultado
│     se o usuário trocar de aba e voltar
│
└── Debounce no autoFormatDate
      requestAnimationFrame ou debounce() para evitar recálculo
      a cada keystroke em telas lentas

PRIORIDADE MÉDIA
├── CSS — Consolidar ferramentas.css + global.css
│     Migrar cores e espaçamentos para variáveis CSS
│     Separar claramente reset / tokens / componentes / layout
│
├── Acessibilidade
│     aria-live="polite" no .result-box  →  leitores de tela anunciam resultado
│     Foco gerenciado após submit  →  mover foco para result-box
│     role="alert" em mensagens de erro
│
└── Feedback de carregamento no searchCNPJ
      Botão desabilitado durante o fetch
      Spinner injetado via CSS puro (animation) em vez de <div>

PRIORIDADE BAIXA / FUTURO
├── Web Components (Fase 4 do plano)
│     <tool-panel>  →  encapsula form + result-box + botões
│     <result-display>  →  gerencia io-html, dataset.result, estado
│     Elimina HTML repetitivo (~60 linhas por ferramenta → ~8)
│
├── Testes unitários
│     validators.js, formatters.js, dateUtils.js são 100% testáveis
│     sem DOM (Node.js puro ou Vitest)
│     um único arquivo __tests__/core.test.js cobre toda camada 4
│
└── Bundler opcional (futuro distante)
      A arquitetura já é compatível com Vite/Rollup
      Se o número de módulos crescer muito, um build step
      gera um único .js minificado sem alterar nenhum módulo
```
