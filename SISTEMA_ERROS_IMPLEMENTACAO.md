# Sistema Robusto de Tratamento de Erros - Guia de Implementação

## 📋 Visão Geral

Sistema completo para detectar, validar e reportar erros em:
- **Placeholders malformados**: `{{campo` (sem fechar), `}}` orfão
- **Uploads de arquivo**: formato inválido, arquivo corrupto, tamanho excessivo
- **Templates**: parsing incorreto, campos obrigatórios não preenchidos
- **Exportação**: falha na renderização, dados inválidos

## 🏗️ Arquitetura

### Serviços Criados

```
src/js/services/
├── DiagnosticsService.js      ← Gerenciador central de diagnósticos
├── TemplateValidator.js       ← Validação de templates e placeholders
├── UploadValidator.js         ← Validação de upload de arquivos
```

### Módulos do Document Editor

```
src/js/modules/documentEditor/
├── EnhancedDocumentParser.js  ← Parser com diagnósticos integrados
├── DocumentEditorWithDiagnostics.js ← Controller com validação completa
└── ui/
    └── DiagnosticsUI.js       ← Interface visual para erros
```

---

## 🚀 Como Usar

### 1️⃣ Inicializar com Diagnósticos

```javascript
import { DocumentEditorWithDiagnostics } from './modules/documentEditor/DocumentEditorWithDiagnostics.js';

// Criar controlador com diagnósticos
const editor = new DocumentEditorWithDiagnostics({
    maxFileSize: 52428800, // 50MB
    parseTimeout: 30000    // 30 segundos
});

// Inicializar UI de diagnósticos
editor.initDiagnosticsUI(document.body);

// Listeners
editor.on('onDocumentLoaded', (data) => {
    console.log('Documento carregado com sucesso', data);
});

editor.on('onDocumentError', (error) => {
    console.error('Erro no documento:', error);
});

editor.on('onValidationComplete', (summary) => {
    console.log('Diagnósticos:', summary);
    // summary = { total: 3, errors: 1, warnings: 2, infos: 0 }
});
```

### 2️⃣ Processar Upload com Validação

```javascript
// No handler de input type="file"
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    await editor.handleFileUpload(file);
});
```

**O que acontece automaticamente:**
1. ✅ Valida formato de arquivo (DOCX, ODT, HTML)
2. ✅ Verifica tamanho e integridade
3. ✅ Detecta placeholders malformados
4. ✅ Mostra avisos em vermelho na interface
5. ✅ Registra todos os problemas

### 3️⃣ Renderizar com Destaque de Erros

```javascript
// Dados do usuário
const formData = {
    tipo_termo: 'APOSTILAMENTO',
    num_termo: '12345',
    // outros campos...
};

// Validar antes de exportar
if (editor.validateDataForExport(formData)) {
    // Renderizar
    const html = editor.render(formData);
    document.getElementById('preview').innerHTML = html;
}
```

**Resultado visual:**
- ✅ Campos preenchidos: texto normal
- ⚠️ Campos vazios: `{{campo}}` destacado em amarelo
- 🔴 Placeholders malformados: `{{campo...` em vermelho com `[⚠️ REVISE]`

---

## 📊 Diagnósticos

### Tipos de Erro Detectados

| Tipo | Nível | Exemplo | Solução |
|------|-------|---------|---------|
| `UNCLOSED_PLACEHOLDER` | ERROR | `{{campo` | Feche com: `}}` |
| `EMPTY_PLACEHOLDER` | WARNING | `{{}}` | Adicione nome do campo |
| `INVALID_FILE_FORMAT` | ERROR | `.pdf` | Use: `.docx`, `.odt`, `.html` |
| `FILE_TOO_LARGE` | ERROR | >50MB | Comprima ou remova conteúdo |
| `FILE_CORRUPTED` | WARNING | ZIP inválido | Salve novamente |
| `MISSING_REQUIRED_FIELD` | WARNING | `{{campo?}}` não preenchido | Preencha o campo |
| `PLACEHOLDER_TYPE_MISMATCH` | WARNING | `{{campo<script>}}` | Use caracteres válidos |

### Acessar Diagnósticos

```javascript
// Resumo
const summary = editor.getDiagnosticsSummary();
console.log(summary);
// { total: 3, errors: 1, warnings: 2, infos: 0, byType: {...} }

// Todos os diagnósticos
const all = editor.getDiagnostics();
all.forEach(diag => {
    console.log(`${diag.level}: ${diag.message}`);
    console.log(`  💡 Sugestão: ${diag.suggestion}`);
});

// Por nível
const errors = editor.diagnostics.getByLevel('error');
const warnings = editor.diagnostics.getByLevel('warning');

// Por tipo
const unclosedFields = editor.diagnostics.getByType('unclosed_placeholder');
```

---

## 🎨 Interface Visual

A UI de diagnósticos aparece **automaticamente** quando há erros:

```
┌─────────────────────────────────────┐
│ ⚠️ Diagnósticos              ✕      │
├─────────────────────────────────────┤
│ Erros: 1   Avisos: 2   Info: 0    │
├─────────────────────────────────────┤
│ 🔴 ERROR: unclosed_placeholder      │
│ Placeholder malformado: {{campo...  │
│ 📍 Linha 15, coluna 42              │
│ 💡 Feche o placeholder: {{campo}}   │
│                                     │
│ 🟠 WARNING: empty_placeholder       │
│ Placeholder vazio encontrado: {{}} │
│ 📍 Linha 23                         │
│ 💡 Remova ou adicione um nome      │
└─────────────────────────────────────┘
```

### Controlar UI

```javascript
// Mostrar/ocultar
editor.diagnosticsUI.show();
editor.diagnosticsUI.hide();
editor.diagnosticsUI.toggle();

// Limpar
editor.diagnosticsUI.clear();

// Destacar campo com erro
editor.diagnosticsUI.highlightFieldError('nome_campo', 'error');

// Exportar relatório
editor.diagnosticsUI.exportReport('json');   // → diagnosticos.json
editor.diagnosticsUI.exportReport('html');   // → diagnosticos.html
editor.diagnosticsUI.exportReport('text');   // → diagnosticos.txt
```

---

## 🔍 Validar Template Manualmente

```javascript
import { TemplateValidator } from './services/TemplateValidator.js';
import { DiagnosticsService } from './services/DiagnosticsService.js';

const diagnostics = new DiagnosticsService();
const validator = new TemplateValidator(diagnostics);

// Validar HTML
const html = `<p>{{nome}}</p><p>{{sobrenome</p>`;
const result = validator.validateTemplate(html);

console.log(result);
/*
{
    isValid: false,
    errors: [
        {
            type: 'unclosed_placeholder',
            line: 2,
            position: 15,
            field: 'sobrenome',
            message: 'Placeholder não-fechado encontrado: {{sobrenome...',
            suggestion: 'Feche com }}: {{sobrenome}}'
        }
    ],
    warnings: [],
    placeholders: [
        { name: 'nome', count: 1 },
        { name: 'sobrenome', count: 1 }
    ]
}
*/

// Extrair placeholders
const placeholders = validator.extractPlaceholders(html);
console.log(placeholders);
/*
[
    { name: 'nome', type: 'text', required: true, kind: 'input', count: 1, positions: [5] },
    { name: 'sobrenome', type: 'text', required: true, kind: 'input', count: 1, positions: [25] }
]
*/

// Validar dados contra placeholders
const validation = validator.validateData(
    { nome: 'João', sobrenome: '' },  // dados fornecidos
    placeholders
);
console.log(validation);
/*
{
    missingRequired: ['sobrenome'],
    extraFields: [],
    typeErrors: []
}
*/
```

---

## 📤 Validar Upload Manualmente

```javascript
import { UploadValidator } from './services/UploadValidator.js';

const uploadValidator = new UploadValidator();

// Validar arquivo completo
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const result = await uploadValidator.validateFile(file);
    
    console.log(result);
    /*
    {
        isValid: true,
        errors: [],
        warnings: [],
        format: 'docx',
        size: 245000,
        name: 'template.docx'
    }
    */
});
```

---

## ⚙️ Exemplos Práticos

### ✅ Exemplo Completo: Editor com Validação

```javascript
import { DocumentEditorWithDiagnostics } from './modules/documentEditor/DocumentEditorWithDiagnostics.js';

// 1. Criar editor
const editor = new DocumentEditorWithDiagnostics();
editor.initDiagnosticsUI(document.body);

// 2. Listeners
editor.on('onDocumentLoaded', (data) => {
    console.log(`✅ ${data.parser.getPlaceholders().length} placeholders encontrados`);
    if (data.parser.hasErrors()) {
        console.log(`⚠️ ${data.parser.getMalformedPlaceholders().length} malformados`);
    }
});

editor.on('onValidationComplete', (summary) => {
    if (summary.errors > 0) {
        document.getElementById('submit-btn').disabled = true;
    }
});

// 3. Upload
document.getElementById('file-input').addEventListener('change', async (e) => {
    await editor.handleFileUpload(e.target.files[0]);
});

// 4. Preencher dados
const form = document.getElementById('form');
form.addEventListener('input', (e) => {
    const data = new FormData(form);
    const obj = Object.fromEntries(data);
    
    if (editor.currentParser) {
        const html = editor.render(obj);
        document.getElementById('preview').innerHTML = html;
    }
});

// 5. Exportar
document.getElementById('export-btn').addEventListener('click', () => {
    const data = Object.fromEntries(new FormData(form));
    
    if (!editor.validateDataForExport(data)) {
        alert('Corrija os erros antes de exportar');
        return;
    }
    
    // Exportar DOCX, HTML, PDF...
    console.log('Exportando...');
});
```

### ❌ Exemplo: Detectar Placeholders Malformados

```javascript
const html = `
    <p>Termo {{tipo_termo}} Nº {{num_termo}}</p>
    <p>Data: {{data_inicio</p>  <!-- ❌ Não fechado -->
    <p>Valor: {{}} Reais</p>     <!-- ❌ Vazio -->
    <p>{{observacoes}} {{</p>    <!-- ❌ Múltiplos problemas -->
`;

const validator = new TemplateValidator();
const result = validator.validateTemplate(html);

console.log('Válido?', result.isValid);          // false
console.log('Erros:', result.errors.length);    // 3
console.log('Avisos:', result.warnings.length); // 1

// Cada erro mostra localização e sugestão
result.errors.forEach(err => {
    console.log(`\nLinha ${err.line}:`);
    console.log(`  ❌ ${err.message}`);
    console.log(`  💡 ${err.suggestion}`);
});
```

---

## 🎯 Casos de Uso

### 1. Validar template ao carregar

```javascript
const html = await fetch('template.html').then(r => r.text());
const validator = new TemplateValidator();
const result = validator.validateTemplate(html);

if (!result.isValid) {
    throw new Error('Template inválido: ' + result.errors[0].message);
}
```

### 2. Avisar usuário sobre campos faltando

```javascript
const placeholders = validator.extractPlaceholders(html);
const missingFields = placeholders.filter(p => !(p.name in userData));

if (missingFields.length > 0) {
    alert(`Preencha: ${missingFields.map(p => p.name).join(', ')}`);
}
```

### 3. Mostrar em tempo real qual campo está vazio

```javascript
form.addEventListener('change', () => {
    const data = new FormData(form);
    const validation = validator.validateData(
        Object.fromEntries(data),
        placeholders
    );
    
    validation.missingRequired.forEach(fieldName => {
        document.getElementById(fieldName).classList.add('error');
    });
});
```

### 4. Exportar relatório de problemas

```javascript
const report = editor.diagnostics.generateReport('html');
const blob = new Blob([report], { type: 'text/html' });

// Salvar ou enviar servidor
const url = URL.createObjectURL(blob);
window.open(url);
```

---

## 🔧 Configuração

### DiagnosticsService

```javascript
const diagnostics = new DiagnosticsService({
    maxDiagnostics: 100,      // Máximo de diagnósticos mantidos
    enableAutoSave: true       // Salvar automaticamente
});

// Callback quando novo diagnóstico é adicionado
diagnostics.onDiagnosticAdded = (diagnostic) => {
    console.log('Novo diagnóstico:', diagnostic);
};
```

### UploadValidator

```javascript
const uploadValidator = new UploadValidator(diagnostics);
uploadValidator.maxFileSize = 104857600;  // 100MB
uploadValidator.allowedExtensions = ['docx', 'doc', 'odt', 'html', 'htm'];
```

---

## 📝 Estilos CSS

A UI de diagnósticos inclui estilos automáticos. Para customizar:

```css
/* Painel de diagnósticos */
.diagnostics-panel {
    right: 20px;
    bottom: 20px;
    width: 400px;
}

/* Itens de erro */
.diagnostic-item.error {
    border-left-color: #d32f2f;
    background: #ffebee;
}

.diagnostic-item.warning {
    border-left-color: #f57c00;
    background: #fff3e0;
}

/* Campos com erro */
.field-with-diagnostic-error {
    border-color: #d32f2f !important;
    background-color: #ffebee !important;
}

/* Placeholders malformados no preview */
.document-editor__placeholder--malformed {
    color: red;
    font-weight: bold;
    text-decoration: underline;
}
```

---

## 🐛 Debugging

### Ativar logs detalhados

```javascript
// Todos os diagnósticos no console
diagnostics.logToConsole();

// Resultado formatado
console.log(diagnostics.generateReport('text'));

// JSON estruturado
console.log(diagnostics.generateReport('json'));
```

### Inspecionar parser

```javascript
const parser = editor.currentParser;

// Placeholders encontrados
console.table(parser.getPlaceholders());

// Malformados
console.table(parser.getMalformedPlaceholders());

// Relatório
console.log(parser.getErrorReport());
```

---

## ✨ Próximas Melhorias

- [ ] Auto-corrigir placeholders malformados
- [ ] Sugestões inteligentes de campos
- [ ] Histórico de diagnósticos
- [ ] Sincronização com servidor
- [ ] Cache de validações
- [ ] Análise de performance

---

## 📚 Referência Rápida

```javascript
// Criar diagnostics
const diagnostics = new DiagnosticsService();

// Validar template
const validator = new TemplateValidator(diagnostics);
const result = validator.validateTemplate(html);

// Validar upload
const uploadValidator = new UploadValidator(diagnostics);
const uploadResult = await uploadValidator.validateFile(file);

// Parser com diagnósticos
const parser = new EnhancedDocumentParser(html, diagnostics);
const renderedHtml = parser.render(data);

// Editor completo
const editor = new DocumentEditorWithDiagnostics();
await editor.handleFileUpload(file);
const html = editor.render(data);

// UI
editor.initDiagnosticsUI(container);
editor.diagnosticsUI.show();
editor.diagnosticsUI.exportReport('html');

// Acessar diagnósticos
diagnostics.getByLevel('error');
diagnostics.getByType('unclosed_placeholder');
diagnostics.generateReport('json');
```
