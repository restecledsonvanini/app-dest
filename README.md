<div align="center">

<img src="./src/images/logo-sesp-dest.png" alt="Logo SESP DEST" width="90" />

# Ferramentas DEST

**Painel interno de produtividade para a equipe DEST · SESP**

[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES_Modules-f7df1e?logo=javascript&logoColor=yellow)](#)
[![Zero deps](https://img.shields.io/badge/dependências-zero-brightgreen)](#)
[![Zero build](https://img.shields.io/badge/build_step-nenhum-blue)](#)
[![Status](https://img.shields.io/badge/fases_1--3-concluídas-success)](#roadmap)

</div>

---

## Visão Geral

Dois painéis acessíveis diretamente pelo browser, sem instalação, servidor ou build:

| Página | Caminho | Função |
|---|---|---|
| **Links Úteis** | `index.html` | Acesso rápido a planilhas e documentos do setor |
| **Ferramentas** | `ferramentas/index.html` | Máscaras, cálculos de datas e consulta de CNPJ |

---

## Ferramentas Disponíveis

### 🔧 Máscaras
| Ferramenta | `data-tool` | Descrição |
|---|---|---|
| Remover Máscara | `removeMask` | Remove qualquer máscara de um valor — retorna apenas dígitos |
| Aplicar eProtocolo | `addMaskEprotocolo` | Formata 9 dígitos no padrão `NNNNN/NNNN` |
| Aplicar N.GMS | `addMaskGMS` | Formata número GMS no padrão `NNNNN/AAAA` |
| Aplicar CPF | `addMaskCPF` | Formata 11 dígitos no padrão `NNN.NNN.NNN-NN` |
| Aplicar CNPJ | `addMaskCNPJ` | Formata 14 dígitos no padrão `NN.NNN.NNN/NNNN-NN` |

### 📅 Datas
| Ferramenta | `data-tool` | Descrição |
|---|---|---|
| Calcular Data Final | `calculateDateValidity` | Data início + quantidade de dias → data de vencimento |
| Dias Restantes | `calculateDaysRemaining` | Intervalo entre duas datas com status de vigência |

### 🔍 Consultas
| Ferramenta | `data-tool` | Descrição |
|---|---|---|
| Consultar CNPJ | `searchCNPJ` | Busca dados da empresa via API pública (BrasilAPI) |

---

## Como Usar

**Pré-requisito:** qualquer browser moderno. Nenhuma instalação necessária.

```
# Clone o repositório (ou abra a pasta diretamente)
git clone <url-do-repo>

# Abra no browser
ferramentas/index.html   ← painel de ferramentas
index.html               ← painel de links
```

> Tudo funciona via `file://` ou qualquer servidor HTTP estático (Live Server, etc.).

---

## Arquitetura

O sistema segue uma arquitetura em **4 camadas desacopladas**, sem frameworks e sem bundler.

```
ferramentas/index.html          ← Camada 1: View (zero lógica)
        │
        │  <script type="module">
        ▼
    main.js                     ← Camada 2: Orquestrador
    ├── initTabs()
    ├── initInputBehaviors()
    ├── Event Delegation: click  → ui.js (copy / clear)
    └── Event Delegation: submit → toolHandlers.js[data-tool]
                │
                ▼
    modules/toolHandlers.js     ← Camada 3: Handlers
    ├── handleRemoveMask
    ├── handleAddMaskEprotocolo
    ├── handleAddMaskGMS
    ├── handleAddMaskCPF
    ├── handleAddMaskCNPJ
    ├── handleCalculateDateValidity
    ├── handleCalculateDaysRemaining
    └── handleSearchCNPJ
                │
                ▼
    modules/                    ← Camada 4: Utilitários Puros (sem DOM)
    ├── validators.js    isValidCNPJ()
    ├── formatters.js    formatCNPJ · formatCPF · formatGMS · stripMask …
    ├── dateUtils.js     parseBRDate · formatBRDate · calcEndDate · calcDaysStatus
    ├── inputBehaviors.js   autoFormatDate · sanitizeNumeric
    ├── ui.js            handleCopyAction · handleClearAction · updateActionButtons
    └── tabs.js          initTabs (abas principais + subabas + hamburguer mobile)
```

### Princípios aplicados

- **ES Modules nativos** — `import/export` direto no browser, sem Webpack/Vite
- **Event Delegation** — um único listener gerencia todos os botões de cópia e limpeza
- **FormData API** — handlers leem o formulário via `new FormData(form)`, sem `getElementById`
- **Funções puras na camada 4** — sem DOM, sem efeitos colaterais, testáveis em Node.js/Vitest
- **Zero variáveis globais** — escopo completamente isolado via `<script type="module">`

---

## Estrutura de Arquivos

```
app-dest/
├── index.html                  ← Painel de links úteis
├── ferramentas/
│   └── index.html              ← Painel de ferramentas
├── src/
│   ├── images/
│   │   └── logo-sesp-dest.png
│   ├── js/
│   │   ├── links.js            ← openLink / copyLink (usado por index.html)
│   │   ├── main.js             ← Ponto de entrada das ferramentas
│   │   └── modules/
│   │       ├── dateUtils.js
│   │       ├── formatters.js
│   │       ├── inputBehaviors.js
│   │       ├── tabs.js
│   │       ├── toolHandlers.js
│   │       ├── ui.js
│   │       └── validators.js
│   └── styles/
│       ├── global.css          ← Tokens, reset, header, cards — escopo global
│       └── ferramentas.css     ← Layout de abas, tool-panel, result-box
├── plan/
│   ├── arquitetura.md          ← Roadmap de refatoração (Fases 1–4)
│   └── arquitetura-mapa.md     ← Diagrama completo de módulos e dependências
└── bkp/                        ← Snapshots manuais (não utilizar em produção)
```

---

## Como Adicionar uma Nova Ferramenta

São necessárias **apenas 2 alterações**. O `main.js` não precisa de nenhuma modificação.

**1 — HTML** (`ferramentas/index.html`): adicione um bloco dentro da aba correta

```html
<form class="tool-body form-tool" data-tool="minhaNova">
    <div class="input-row">
        <input name="valor" type="text" placeholder="..." />
    </div>
    <div class="button-group">
        <button type="submit"  class="btn btn-primary">Calcular</button>
        <button type="button"  class="btn btn-copy"  disabled>Copiar</button>
        <button type="button"  class="btn btn-clear" data-action="clear" disabled>Limpar</button>
    </div>
    <div class="result-box"></div>
</form>
```

**2 — Handler** (`modules/toolHandlers.js`): implemente e registre

```js
function handleMinhaNova(data, resultBox) {
    const valor = data.get('valor')?.trim();
    if (!valor) return err(resultBox, 'Campo obrigatório');
    ok(resultBox, ioHtml(valor, /* resultado */), /* texto para copiar */);
}

export const toolHandlerMap = {
    // ...handlers existentes...
    minhaNova: handleMinhaNova,   // ← adicionar aqui
};
```

---

## Roadmap

### ✅ Concluído

- **Fase 1** — Arquitetura base: ES Modules, Event Delegation, `<form>` semântico, ponto de entrada único
- **Fase 2** — Utilitários puros: `validators.js`, `formatters.js`, `dateUtils.js`, `inputBehaviors.js`
- **Fase 3** — Roteador FormData: `toolHandlerMap`, `main.js` totalmente desacoplado, zero `onclick` inline

### ⏳ Pendente

- **Fase 4** — Web Components: `<tool-panel>` encapsulando form + result-box + botões
- **CSS** — Consolidar `global.css` + `ferramentas.css` com design tokens (variáveis CSS)
- **Acessibilidade** — `aria-live` no `.result-box`, foco gerenciado após submit
- **Testes** — `validators.js`, `formatters.js` e `dateUtils.js` são 100% testáveis sem DOM (Vitest / Node.js puro)
- **Persistência** — `sessionStorage` para recuperar último resultado ao trocar de aba

---

## Stack

| Camada | Tecnologia |
|---|---|
| Markup | HTML5 semântico |
| Estilo | CSS3 com Custom Properties + Flexbox |
| Script | JavaScript ES2020+ (Módulos nativos) |
| Ícones | Bootstrap Icons 1.10 (CDN) |
| API externa | [BrasilAPI](https://brasilapi.com.br) — consulta CNPJ |
| Build | **nenhum** |
| Dependências | **zero** |

---

<div align="center">
<sub>SESP · Diretoria de Estratégia e Tecnologia — DEST · 2026</sub>
</div>
