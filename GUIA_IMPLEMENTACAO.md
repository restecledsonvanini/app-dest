# 📋 GUIA DE IMPLEMENTAÇÃO – Refatorações Críticas

## Fase 1: Crítico (2-3 dias) — Implementar AGORA

### 1. Centralizar Hard-coded Strings ✅ (Arquivos criados)

**Arquivos criados:**
- `src/js/config/messages.js` — Todas as mensagens de usuário
- `src/js/config/institution.js` — Dados institucionais
- `src/js/config/patterns.js` — Regex e patterns

**Checklist de rollout:**
1. ✅ Importar `MSG` em todos os handlers
2. ✅ Substituir strings hardcoded por `MSG.categoria.chave`
3. ✅ Testar que nenhuma mensagem muda visualmente
4. ✅ Git commit: "refactor: centralize hardcoded strings"

**Exemplo de migração:**

```javascript
// ANTES (toolHandlers.js, linha 60)
err(resultBox, 'Digite um valor para remover a máscara');

// DEPOIS
import { MSG } from '../config/messages.js';
err(resultBox, MSG.mask.removeError);
```

---

### 2. Implementar ErrorHandler + BrasilAPIService ✅ (Arquivos criados)

**Arquivos criados:**
- `src/js/services/ErrorHandler.js` — Classe AppError centralizada
- `src/js/services/BrasilAPIService.js` — API com timeout + retry

**Checklist de rollout:**

1. ✅ Substituir `handleSearchCNPJ` em `toolHandlers.js`:

```javascript
// ANTES (linha 180-220)
async function handleSearchCNPJ(data, resultBox) {
    // ... sem timeout, sem retry, sem erro estruturado
}

// DEPOIS
import { BrasilAPIService } from '../services/BrasilAPIService.js';
const brasilAPI = new BrasilAPIService({ timeout: 10000 });

async function handleSearchCNPJ(data, resultBox) {
    try {
        const d = await brasilAPI.search(cleanCNPJ);
        ok(resultBox, ...);
    } catch (error) {
        if (error instanceof AppError) {
            err(resultBox, error.getUserMessage());
        }
    }
}
```

2. ✅ Adicionar ImportError:
   - Teste chamadas timeout simulando rede lenta
   - Teste retry mechanism
   - Teste GetMessage() retorna texto amigável

---

### 3. Reduzir toolHandlers.js com Factory Pattern ✅ (Arquivo criado)

**Arquivos criados:**
- `src/js/handlers/MaskHandlerFactory.js` — Factory reutilizável
- `src/js/handlers/toolHandlersRefactored.js` — Nova versão reduzida

**Checklist de rollout:**

1. ✅ Usar novo arquivo `toolHandlersRefactored.js`:

```javascript
// ANTES (main.js linha 5)
import { toolHandlerMap } from './modules/toolHandlers.js'; // 246 linhas

// DEPOIS
import { toolHandlerMap } from './handlers/toolHandlersRefactored.js'; // ~150 linhas
```

2. ✅ Testar todos os 8 handlers funcionam identicamente
3. ✅ Confirmar novo arquivo < 250 linhas
4. ✅ DELETAR arquivo antigo somente após testes passando

---

### 4. Dividir DocumentEditorPanel (329 linhas) ✅ (Fase 1 iniciada)

**Arquivos criados (Fase 1):**
- `src/js/modules/documentEditor/DocumentEditorController.js` — Upload + parsing
- `src/js/modules/documentEditor/ExportOrchestrator.js` — Export orchestration

**Checklist de rollout (Sprint próximo):**

1. ✅ Importar controllers em DocumentEditorPanel:

```javascript
// ANTES
export class DocumentEditorPanel extends HTMLElement {
    async handleDocumentUpload(file) { /* 50 linhas */ }
    async downloadAsWord() { /* 35 linhas */ }
}

// DEPOIS
import { DocumentEditorController } from './DocumentEditorController.js';
import { ExportOrchestrator } from './ExportOrchestrator.js';

export class DocumentEditorPanel extends HTMLElement {
    constructor() {
        this.controller = new DocumentEditorController();
        this.exporter = new ExportOrchestrator();
        
        this.controller.on('onDocumentLoaded', (data) => {
            this.onDocumentLoaded(data);
        });
    }
    
    connectedCallback() {
        this.dom.fileInput.addEventListener('change', (e) => {
            this.controller.handleFileUpload(e.target.files?.[0])
                .catch(err => this.showFeedback(err.getUserMessage()));
        });
    }
}
```

2. ✅ Testar upload, parsing, feedback funcionam
3. ✅ Converter DocumentEditorPanel para principalmente coordenação
4. ✅ Verificar que DocumentEditorPanel agora < 250 linhas

---

## Fase 2: Alto (1-2 dias) — Sprint Próxima

### 1. Refatorar formFactory.js

**Problema:** 128 linhas, função `renderDynamicForm()` faz muito

**Solução:**

```javascript
// Dividir em:
// - createField() → FieldFactory.js
// - createSelect() → SelectFieldBuilder.js
// - renderDynamicForm() → FormRenderer.js (30 linhas)
```

### 2. Implementar Dependency Injection

```javascript
// ANTES
class DocumentEditorPanel {
    constructor() {
        this.fileService = new TemplateFileService();
        this.settingsStore = new SettingsStore();
    }
}

// DEPOIS (DI)
class DocumentEditorPanel {
    constructor(deps = {}) {
        this.fileService = deps.fileService || new TemplateFileService();
        this.settingsStore = deps.settingsStore || new SettingsStore();
    }
}

// No main.js
const panel = new DocumentEditorPanel({
    fileService: mockFileService, // para testes
});
```

### 3. Tratamento consistente de erro

```javascript
// Centralizar em handlers/ErrorHandler.js
export async function withErrorHandling(fn, context) {
    try {
        return await fn();
    } catch (error) {
        const appError = error instanceof AppError 
            ? error 
            : new AppError(ERROR_TYPE.UNKNOWN, error.message);
        logError(appError, context);
        return { error: appError };
    }
}

// Uso
const { error, data } = await withErrorHandling(
    () => brasilAPI.search(cnpj),
    { handler: 'searchCNPJ' }
);
if (error) return err(resultBox, error.getUserMessage());
ok(resultBox, ...);
```

---

## Fase 3: Médio (Backlog)

### 1. Adicionar JSDoc com tipos

```javascript
// ANTES
export function formatCNPJ(cnpj) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// DEPOIS
/**
 * Formata CNPJ com máscara XX.XXX.XXX/XXXX-XX
 * @param {string} cnpj - 14 dígitos sem máscara
 * @returns {string} CNPJ formatado
 * @throws {Error} se não tiver exatamente 14 dígitos
 */
export function formatCNPJ(cnpj) {
    if (!/^\d{14}$/.test(cnpj)) {
        throw new Error('CNPJ must have 14 digits');
    }
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
```

### 2. Testes Unitários

```javascript
// tests/formatters.test.js (Jest/Vitest)
import { formatCNPJ } from '../src/js/modules/formatters.js';

describe('formatCNPJ', () => {
    it('should format valid CNPJ', () => {
        expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90');
    });

    it('should throw on invalid CNPJ', () => {
        expect(() => formatCNPJ('12345')).toThrow();
    });
});
```

---

## 📊 Checklist de Implementação

### Día 1 (hoje)
- [ ] Ler AUDITORIA_CODIGO_RIGOROSA.md
- [ ] Ler este guia
- [ ] Criar tickets para cada item crítico
- [ ] Setup: `config/`, `services/`, `handlers/` novos diretórios

### Día 2-3
- [ ] Integrar config centralizado em todos os arquivos
- [ ] Implementar ErrorHandler em toolHandlers
- [ ] Migrar para toolHandlersRefactored.js
- [ ] Testar todos os handlers

### Día 4
- [ ] Divisão de DocumentEditorPanel (Fase 1)
- [ ] Testes com novos controllers
- [ ] Git commit e code review

---

## 🧪 Teste de Validação Críticos

Antes de fazer commit pra cada refatoração:

```bash
# 1. Verificar limite de 250 linhas
find src/js -name "*.js" -exec wc -l {} + | awk '$1 > 250 {print $0}'
# Output: deve estar vazio (ou só comentários)

# 2. Verificar hard-coded strings removidas
grep -r "SECRETARIA DE ESTADO" src/js/modules/ --exclude-dir=config
# Output: deve estar vazio (ou só em config/)

# 3. Verificar timeout implementado
grep -r "AbortController\|setTimeout.*10000\|timeout" src/js/services/BrasilAPIService.js
# Output: deve ter pelo menos 3 matches

# 4. Testar cada handler manualmente no browser
# Abrir ferramenta, testar: remove máscara, formata CPF/CNPJ, calcula datas, busca CNPJ
```

---

## 🚀 Rollout Seguro

### Se erro encontrado durante teste:

1. **Rollback imediato:**
   ```bash
   git revert HEAD
   # ou
   git checkout -- src/js/handlers/toolHandlersRefactored.js
   ```

2. **Debug:**
   - [ ] Verificar import paths
   - [ ] Verificar MSG keys existem
   - [ ] Verificar ErrorHandler instância correta
   - [ ] Console.log() para debug

3. **Retry:**
   ```bash
   # Após fix
   git add .
   git commit -m "fix: correct import paths in toolHandlers"
   ```

---

## 📞 Suporte

Se encontrar problemas:
1. Consultar AUDITORIA_CODIGO_RIGOROSA.md (secção relevante)
2. Verificar se msg.js tem a key que precisa
3. Verificar se arquivo < 250 linhas
4. Fazer print de erro e anexar ao ticket

**Keep it simple, keep it modular, keep it < 250 lines!** 🎯

