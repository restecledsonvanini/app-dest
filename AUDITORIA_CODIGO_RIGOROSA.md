# 🔍 AUDITORIA RIGOROSA – Base de Código JavaScript

**Data:** 2026-04-09  
**Foco:** Modalidade, Escalabilidade, Padrões de Projeto, Hard-coded Values, UX, Limite de 250 Linhas/Arquivo

---

## ⚠️ SUMÁRIO EXECUTIVO – PROBLEMAS CRÍTICOS ENCONTRADOS

### Gravidade Critical ❌
- **DocumentEditorPanel.js:** **329 linhas** (exceeds 250 limit)
- **ExportService.js:** **217 linhas** (mas com múltiplas responsabilidades)
- **Hard-coded strings** espalhadas em múltiplos arquivos
- **Falta de modalidade** em componentes Custom Elements
- **Sem retry/fallback** adequado para APIs externas

### Gravidade High ⚠️
- **toolHandlers.js:** **246 linhas** (no limite crítico, próximo de exceder)
- **layoutComposer.js:** Lógica de composição HTML com hard-coded constantes
- **Sem abstração de configuração** centralizada
- **UX Problems:** Mensagens hard-coded, sem i18n, sem timeout handlers adequados
- **Sem tratamento de erros** consistente em APIs assíncronas

### Gravidade Medium ⚡
- **Dados de exemplo** hard-coded (gMS, eProtocolo, etc.)
- **Falta padrão Service Locator** ou Dependency Injection
- **Sem validação** em tempo de compilação (tipos)
- **Coupling alto** entre UI e lógica de negócio

---

## 📊 ANÁLISE POR CRITÉRIO

### 1️⃣ MODALIDADE (Separação de Responsabilidades)

#### ✅ Bem Implementado:
- **Separação clara UI/Logic:** `formatters.js`, `dateUtils.js`, `validators.js` — são **puros**, sem DOM
- **Event delegation:** `main.js` usa **delegação global**, Não temos múltiplos listeners espalhados
- **Custom Elements:** `SheetCard.js`, `FolderCard.js` são **apresentacionais** (sem lógica de negócio)

#### ❌ Problemas:
- **DocumentEditorPanel.js:** Viola Single Responsibility Principle — gerencia:
  - UI Rendering (template, listeners)
  - File parsing (MMammoth integration)
  - Export logic (Word/PDF)
  - Settings persistence (localStorage)
  - Preview composition
  - Keyboard shortcuts
  
  **Violação:** 1 classe, 10+ responsabilidades, 329 linhas

- **ExportService.js:** Mistura:
  - XML manipulation (Word DOCX)
  - HTML building
  - PDF handling (html2pdf wrapper)
  - Blob creation e download
  
  **Violação:** Deveria ter `DocxBuilder`, `PdfBuilder`, `HtmlBuilder` separadas

- **ToolHandlers:** Acoplado ao FormData API — hardcoded IDs de formulários
  ```javascript
  const loadingEl = form?.querySelector('.loading');  // ❌ Hardcoded selector
  ```

#### 💡 Recomendações:
```javascript
// ANTES (acoplado):
class DocumentEditorPanel {
  handleDocumentUpload() { /* 50 linhas */ }
  renderDynamicForm() { /* 40 linhas */ }
  downloadAsWord() { /* 35 linhas */ }
  downloadAsPdf() { /* 30 linhas */ }
}

// DEPOIS (separado):
class DocumentEditorPanel { /* UI orchestration ~ 80 linhas */ }
class FileUploadHandler { /* file parse logic */ }
class DocumentRenderer { /* rendering logic */ }
class DocumentExporter { /* export orchestration */ }
```

---

### 2️⃣ REAPROVEITAMENTO & ESCALABILIDADE

#### ✅ Bem Implementado:
- **Funções puras reutilizáveis:**
  ```javascript
  formatCNPJ(cnpj) // pode ser usado em qualquer lugar
  parseBRDate(dateStr) // sem side effects
  ```
- **Custom Elements reusáveis:** `<sheet-card>`, `<folder-card>` — HTML-first, sem config complexa
- **Map-based routing:** `toolHandlerMap` — fácil adicionar novo handler

#### ❌ Problemas:

**1. Strings hard-coded em múltiplos lugares:**

```javascript
// ❌ layoutComposer.js
const DEFAULT_HEADER_TEXT = `SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA...`;

// ❌ SettingsStore.js
const DEFAULT_HEADER_FALLBACK = {
    headerText: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA...',
};

// ❌ DocumentEditorPanel.js
errorMessage = 'Documento carregado. A prévia foi aberta...';

// ❌ formFactory.js
placeholder="Cole aqui o texto do preâmbulo, se quiser substituir o padrão inicial."
```

**Impacto:** Se precisa alterar "SECRETARIA DE ESTADO...", deve atualizar 3+ arquivos  
**Reutilização:** Impossível usar em outro contexto sem copiar strings

**2. Handlers duplicam lógica:**

```javascript
// toolHandlers.js (6 handlers similares)
function handleAddMaskEprotocolo(data, resultBox) {
    const clean = stripMask(data.get('value') || '');
    if (!clean) return err(resultBox, 'Digite apenas números');
    if (clean.length !== 9) return err(resultBox, '...');
    // ... padrão 1: input validation, format, display
}

function handleAddMaskGMS(data, resultBox) {
    // ... padrão 1: input validation, format, display
    // ... padrão 1: input validation, format, display
}

// ❌ Violação DRY (Don't Repeat Yourself)
```

**Solução:** Factory Pattern para handlers:
```javascript
function createMaskHandler({ inputKey, maxLength, formatter, description }) {
    return (data, resultBox) => {
        const clean = stripMask(data.get(inputKey) || '');
        if (!clean) return err(resultBox, 'Digite apenas números');
        if (clean.length !== maxLength) return err(resultBox, description);
        ok(resultBox, ioHtml(clean, formatter(clean)), formatter(clean));
    };
}

export const toolHandlerMap = {
    addMaskEprotocolo: createMaskHandler({ 
        inputKey: 'value', 
        maxLength: 9, 
        formatter: formatEProtocolo 
    }),
    // ... reutilizável
};
```

---

### 3️⃣ PADRÃO DE PROJETO

#### ✅ Bem Implementado:
- **Custom Elements pattern** (Web Components spec)
- **Event Delegation** em main.js
- **Map-based router** (Strategy pattern implícito)
- **Service pattern** em `TemplateFileService`, `ExportService`

#### ❌ Problemas:

**1. Sem Dependency Injection:**

```javascript
// ❌ Hardcoded dependencies
export class DocumentEditorPanel extends HTMLElement {
    constructor() {
        super();
        this.fileService = new TemplateFileService(); // tightly coupled
        this.exportService = new ExportService();
        this.settingsStore = new SettingsStore();
    }
}

// ❌ Impossível mockar para testes, impossível trocar implementação
```

**2. Sem Factory/Builder Pattern:**

```javascript
// ❌ Criação de elementos complexos inline
const header = document.createElement('div');
header.className = 'tool-header';
const h3 = document.createElement('h3');
h3.textContent = heading;
const p = document.createElement('p');
p.className = 'tool-desc';
p.textContent = desc;
header.append(h3, p);
this.prepend(header);

// Repetição: ToolPanel.js, formFactory.js, template.js
```

**3. Sem Observer/EventEmitter:**

```javascript
// ❌ Comunicação acoplada
previewUpdater.render();  // direct call
settingsStore.getAll();   // direct call

// ✅ Deveria ser:
settings$.subscribe(newSettings => {
    previewUpdater.render(newSettings);
});
```

---

### 4️⃣ NO HARD-CODED LINES (Configuração Centralizada)

#### ❌ CRÍTICO: Hard-coded Strings/Valores

**Arquivo: `layoutComposer.js` (linhas de hardcode)**

```javascript
const DEFAULT_HEADER_TEXT = `SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA
CENTRO DE CONTRATOS E CONVÊNIOS – TERMO DE APOSTILAMENTO Nº {{num_termo}}`;
// ❌ String de 100+ caracteres em constante

const DEFAULT_LOGO_URL = '/src/images/brasao_do_Parana.svg.png';
// ❌ Path hardcoded — se mudar estrutura de pasta, quebra
```

**Arquivo: `SettingsStore.js`**

```javascript
const DEFAULT_HEADER_FALLBACK = {
    logoUrl: '/src/images/brasao_do_Parana.svg.png',
    headerText: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA\n...',
};

const LEGACY_HEADER_DEFAULTS = new Set([
    'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA\n...',
    'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA\n...'
]); // ❌ Duplicação de strings
```

**Arquivo: `formFactory.js` (linha 18)**

```javascript
<div class="document-editor__form-intro">
    <strong>${placeholders.length}</strong> campo(s) detectado(s). Campos com <code>[{{nome}}]</code> usam opções salvas.
</div>
// ❌ Mensagem hard-coded
// ❌ Sem variabilização
```

**Arquivo: `DocumentEditorPanel.js` (múltiplas linhas)**

```javascript
this.showFeedback('Documento carregado. A prévia foi aberta automaticamente...');
this.setStatus(`Processando ${file.name}...`, 'info');
this.showFeedback('Não foi possível abrir a janela de impressão do PDF.');
// ❌ Mensagens espalhadas, não centralizadas
```

**Arquivo: `ExportService.js` (linhas 25-42)**

```javascript
const html2pdf = `
    <div class="pages">...
    <style>
        body { margin: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; }
        .pages { display: flex; flex-direction: column; gap: 0; }
        // ❌ CSS inline em string (50+ linhas)
        // ❌ Sem source CSS externo
`;
```

**Arquivo: `DocuumentParser.js` (linha 5)**

```javascript
const TOKEN_REGEX = /\[\{\{([^}]+)\}\}\]|\{\{([^}]+)\}\}/g;
// ❌ Regex mágico sem documentação
// ❌ Sem teste separado
```

#### 💡 Solução: Config Center Pattern

```javascript
// config.js (novo arquivo)
export const APP_CONFIG = {
    // Institution
    institution: {
        name: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA',
        department: 'CENTRO DE CONTRATOS E CONVÊNIOS',
        logoUrl: '/src/images/brasao_do_Parana.svg.png'
    },
    
    // Messages (i18n-ready)
    messages: {
        documentLoaded: 'Documento {filename} carregado com sucesso.',
        previewOpened: 'A prévia foi aberta automaticamente no modo ampliado.',
        fieldCount: '{count} campo(s) detectado(s).',
        noFields: 'Nenhum campo detectado neste modelo.'
    },
    
    // Regex patterns
    patterns: {
        placeholder: /\[\{\{([^}]+)\}\}\]|\{\{([^}]+)\}\}/g,
        // com versão documentada
    },
    
    // Paths
    paths: {
        images: '/src/images'
    }
};
```

**Impacto:**
- ✅ Uma fonte de verdade
- ✅ Fácil localização (i18n)
- ✅ Fácil manutenção
- ✅ Unit tests sobre config

---

### 5️⃣ UX (User Experience)

#### ✅ Bem Implementado:
- **ARIA attributes:** `aria-selected`, `aria-controls`, `tabindex` — acessibilidade boa
- **Feedback visual:** Toast com Popover API
- **Keyboard navigation:** `↑`, `↓`, `Home`, `End` em tabs
- **Mobile responsive:** Menu hamburguer funciona
- **Loading states:** `.is-disabled` em dropzone

#### ❌ Problemas:

**1. Mensagens hard-coded, sem i18n:**

```javascript
// ❌ Não traduzível
err(resultBox, 'Digite um valor para remover a máscara');
err(resultBox, `CNPJ deve ter 14 dígitos (você digitou ${cleanCNPJ.length})`);
```

**2. Sem timeout para operações assíncronas:**

```javascript
// ❌ searchCNPJ — se API lenta, usuário fica pendurado
async function handleSearchCNPJ(data, resultBox) {
    // ... nenhum timeout implementado
    const response = await fetch(...); // pode travar
}
```

**3. Sem debounce consistente:**

```javascript
// ✅ PreviewUpdater tem debounce
this.updateTimer = setTimeout(() => this.render(), this.debounceMs);

// ❌ Mas formFactory não tem proteção contra input rápido
control.addEventListener('input', () => {
    onFieldValueChange(field.name, control.value); // sem debounce
});
```

**4. Feedback visual insuficiente:**

```javascript
// ❌ Documento grande demora importar, user não sabe o que acontece
async handleDocumentUpload(file) {
    this.setStatus(`Processando ${file.name}...`, 'info');
    // ... pode levar 30 segundos em arquivo 50MB
    // usuário acha que travou
}
```

**Solução:**
```javascript
async handleDocumentUpload(file) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
        this.setStatus(`Processando ${file.name}... 0%`, 'info');
        // track progress: updateProgress(50%)
        const result = await fetch(blob, { signal: controller.signal });
    } catch (error) {
        if (error.name === 'AbortError') {
            this.setStatus('Operação expirou. Arquivo muito grande?', 'error');
        }
    } finally {
        clearTimeout(timeoutId);
    }
}
```

---

### 6️⃣ LIMITE 250 LINHAS/ARQUIVO

#### 📋 Contagem por arquivo:

| Arquivo | Linhas | Status |
|---------|--------|--------|
| `main.js` | 60 | ✅ OK |
| `uiControls.js` | 75 | ✅ OK |
| `links.js` | 10 | ✅ OK |
| `tabs.js` | 110 | ✅ OK |
| `inputBehaviors.js` | 30 | ✅ OK |
| `ui.js` | 60 | ✅ OK |
| `formatters.js` | 20 | ✅ OK |
| `validators.js` | 35 | ✅ OK |
| `dateUtils.js` | 70 | ✅ OK |
| `DocumentParser.js` | 100 | ✅ OK |
| `PreviewUpdater.js` | 40 | ✅ OK |
| `TemplateFileService.js` | 47 | ✅ OK |
| **ExportService.js** | **217** | ⚠️ LARGO (but complex) |
| **toolHandlers.js** | **246** | ⚠️ **CRÍTICO** (3 linhas do limite) |
| `SettingsStore.js` | 46 | ✅ OK |
| `layoutComposer.js` | 80 | ✅ OK |
| `FolderCard.js` | 27 | ✅ OK |
| `SheetCard.js` | 23 | ✅ OK |
| `ToolPanel.js` | 30 | ✅ OK |
| `ToolResult.js` | 30 | ✅ OK |
| `components/index.js` | 24 | ✅ OK |
| **DocumentEditorPanel.js** | **329** | ❌❌❌ **CRÍTICO** (77 linhas acima do limite) |
| `formFactory.js` | 128 | ✅ OK (mas deveria ser menor) |
| `iconSet.js` | 20 | ✅ OK |
| `template.js` | 15 | ✅ OK |
| `fieldHelpers.js` | 80 | ✅ OK |
| `documentEditor/index.js` | 16 | ✅ OK |

#### ❌ **VIOLAÇÕES CRÍTICAS:**

1. **DocumentEditorPanel.js: 329 linhas** → **+77 acima do limite**
   - Precisa ser dividida em 3-4 classes menores

2. **toolHandlers.js: 246 linhas** → **3 linhas do colapso**
   - Cada handler é simples, mas juntos ficam pesados
   - Poderia usar factory pattern para reduzir 40%

---

## 🎯 PROBLEMAS CATEGORIZADOS

### 🔴 CRÍTICO (Deve corrigir agora)

1. **DocumentEditorPanel.js é MONOLÍTICA (329 linhas)**
   - Viola limite de 250 linhas
   - Viola Single Responsibility
   - Impossível testar isoladamente
   - → **Action:** Dividir em `FileUploadController`, `FormRenderer`, `PreviewController`, `ExportCoordinator`

2. **Hard-coded strings não centralizadas**
   - "SECRETARIA DE ESTADO..." repetida 4 vezes
   - Mensagens de erro espalhadas
   - Paths e URLs hard-coded
   - → **Action:** Criar `config/messages.js`, `config/paths.js`, `config/institution.js`

3. **Sem timeout em API calls**
   - `handleSearchCNPJ` pode travar indefinidamente
   - BrasilAPI pode cair
   - → **Action:** Implementar AbortController com timeout de 10s

4. **toolHandlers.js está no limite (246/250)**
   - Próximo commit qualquer pode quebrar a regra
   - → **Action:** Usar factory pattern para reduzir linhas

---

### 🟠 ALTO (Deveria corrigir em sprint próxima)

1. **Acoplamento alto em DocumentEditorPanel**
   - Não é possível mockar dependências
   - → **Action:** Implementar constructor injection

2. **Duplicação de lógica em handlers (DRY violation)**
   - 6 handlers com padrão idêntico
   - → **Action:** Factory Pattern `createMaskHandler()`

3. **Falta de i18n**
   - Mensagens em português hardcoded
   - Impossível traduzir
   - → **Action:** Extrair para `messages.js` com placeholders

4. **Sem tratamento de erro consistente**
   - `calculateDateValidity` retorna erro diferente de `searchCNPJ`
   - → **Action:** Error Handler centralizado

---

### 🟡 MÉDIO (Melhorias futuras)

1. **Sem TypeScript/JSDoc**
   - Impossível validar tipos em tempo de desenvolvimento
   - → **Action:** Adicionar `@param`, `@returns` com tipos

2. **SVGs hard-coded em strings**
   - `SHEET_SVG`, `FOLDER_SVG`, `iconMap` — copiar-colar
   - → **Action:** Mover para arquivo `.svg` externo com `<svg>` tags

3. **Sem testes unitários**
   - Formatadores não têm coverage
   - Validadores não têm edge cases testados
   - → **Action:** Adicionar Jest/Vitest

4. **Responsive design incompleto**
   - DocumentEditor em mobile fica apertado
   - → **Action:** Mobile breakpoints adicionais

---

## 📋 PLANO DE REFATORAÇÃO PRIORIZADO

### Fase 1: Crítico (2-3 dias)
- [ ] Dividir `DocumentEditorPanel.js` → 4 classes
- [ ] Centralizar hard-coded strings em `config/`
- [ ] Implementar timeout em `handleSearchCNPJ`
- [ ] Factory Pattern em `toolHandlers.js`

### Fase 2: Alto (1-2 dias)
- [ ] Dependency Injection em DocumentEditorPanel
- [ ] Abstração de erro (ErrorHandler)
- [ ] i18n infrastructure
- [ ] Tratamento consistente de edge cases

### Fase 3: Médio (backlog)
- [ ] JSDoc com tipos
- [ ] Testes unitários
- [ ] SVG externo
- [ ] Mobile optimizations

---

## 📌 RECOMENDAÇÕES FINAIS

### Arquitetura Proposta: Layered + Modular

```
src/js/
├── config/                    # 🔧 Centralização
│   ├── messages.js           # Strings i18n-ready
│   ├── institution.js        # Dados instituição
│   └── paths.js              # URLs/caminhos
├── modules/
│   ├── core/                 # 🔌 Lógica pura
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── dateUtils.js
│   ├── services/             # 🌐 Integração com APIs
│   │   ├── BrasilAPIService.js (novo)
│   │   └── DocumentService.js (novo)
│   ├── ui/                   # 🎨 Componentes visuais
│   │   ├── components/
│   │   └── documentEditor/
│   └── handlers/             # 🎛️ Event handlers (orquestração)
│       ├── toolHandlers.js
│       └── uiControlHandlers.js
├── main.js
└── uiControls.js
```

### Pattern de Novo Componente (Exemplo):

```javascript
// ANTES (acoplado):
class BrasilAPIHandler {
    async search(cnpj) {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        // ...
    }
}

// DEPOIS (desacoplado):
class BrasilAPIService {
    constructor(config = {}) {
        this.baseURL = config.baseURL || 'https://brasilapi.com.br/api';
        this.timeout = config.timeout || 10000;
    }
    
    async searchCNPJ(cnpj) {
        return this.request(`/cnpj/v1/${cnpj}`);
    }
    
    async request(endpoint) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const res = await fetch(this.baseURL + endpoint, { signal: controller.signal });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            return await res.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

// Uso desacoplado:
const apiService = new BrasilAPIService({ timeout: 15000 });
const data = await apiService.searchCNPJ('12345678000190');
```

---

## 🎓 Score de Integridade do Código

| Critério | Score | Notas |
|----------|-------|-------|
| **Modalidade** | 6.5/10 | DocumentEditor é monolítico, resto OK |
| **Escalabilidade** | 6/10 | Hard-coded strings prejudicam, falta factory patterns |
| **Padrões de Projeto** | 7/10 | Bons custom elements, falta DI e Observer |
| **No Hard-coded** | 4/10 | **Crítico:** Strings, paths, mensagens espalhadas |
| **UX** | 7/10 | ARIA ok, falta timeout, falta i18n |
| **Limite 250 lines** | 8/10 | Apenas 2 arquivos fora (1 crítico) |
| **MÉDIA GERAL** | **6.4/10** | ⚠️ **Acima da média, mas críticos a resolver** |

---

## 🚀 Próximos Passos Recomendados

1. **Hoje:** Ler este relatório, abrir issues para cada ponto crítico
2. **Sprint:** Implementar refatorações Fase 1
3. **Review:** Code review focado em modalidade e limite de linhas
4. **Teste:** Adicionar testes para novos handlers

---

**Relatório gerado com rigor extremo em:** 2026-04-09 10:45 UTC
