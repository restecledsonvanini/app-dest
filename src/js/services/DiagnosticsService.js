/**
 * services/DiagnosticsService.js — Serviço centralizado de diagnósticos
 * Registra e gerencia todos os problemas encontrados durante parsing/renderização
 * Fornece relatórios estruturados para UI
 * @author 2026-04-17
 */

export const DIAGNOSTIC_LEVEL = {
    ERROR: 'error',       // Quebra funcionalidade
    WARNING: 'warning',   // Aviso para revisar
    INFO: 'info',         // Informação
};

export const DIAGNOSTIC_TYPE = {
    // Placeholders
    MALFORMED_PLACEHOLDER: 'malformed_placeholder',
    UNCLOSED_PLACEHOLDER: 'unclosed_placeholder',
    EMPTY_PLACEHOLDER: 'empty_placeholder',
    INVALID_PLACEHOLDER_NAME: 'invalid_placeholder_name',
    PLACEHOLDER_TYPE_MISMATCH: 'placeholder_type_mismatch',

    // Upload
    INVALID_FILE_FORMAT: 'invalid_file_format',
    FILE_TOO_LARGE: 'file_too_large',
    FILE_CORRUPTED: 'file_corrupted',
    UNSUPPORTED_ENCODING: 'unsupported_encoding',

    // Template
    TEMPLATE_PARSE_ERROR: 'template_parse_error',
    TEMPLATE_RENDER_ERROR: 'template_render_error',
    MISSING_REQUIRED_FIELD: 'missing_required_field',

    // Export
    EXPORT_FORMAT_ERROR: 'export_format_error',
    EXPORT_RENDER_ERROR: 'export_render_error',
};

/**
 * Diagnóstico individual
 */
export class Diagnostic {
    constructor(type, level, message, details = {}) {
        this.id = `diag_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        this.type = type;
        this.level = level;
        this.message = message;
        this.details = details;
        this.timestamp = new Date();
        this.location = details.location || null;
        this.suggestion = details.suggestion || null;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            level: this.level,
            message: this.message,
            location: this.location,
            suggestion: this.suggestion,
            details: this.details,
            timestamp: this.timestamp.toISOString(),
        };
    }
}

/**
 * Gerenciador centralizado de diagnósticos
 */
export class DiagnosticsService {
    constructor(options = {}) {
        this.diagnostics = [];
        this.maxDiagnostics = options.maxDiagnostics || 100;
        this.onDiagnosticAdded = null;
        this.enableAutoSave = options.enableAutoSave ?? true;
    }

    /**
     * Adicionar um diagnóstico
     */
    add(type, level, message, details = {}) {
        if (this.diagnostics.length >= this.maxDiagnostics) {
            this.diagnostics.shift(); // Remove o mais antigo
        }

        const diagnostic = new Diagnostic(type, level, message, details);
        this.diagnostics.push(diagnostic);

        if (this.onDiagnosticAdded) {
            this.onDiagnosticAdded(diagnostic);
        }

        return diagnostic;
    }

    /**
     * Atalho: adicionar erro
     */
    addError(type, message, details = {}) {
        return this.add(type, DIAGNOSTIC_LEVEL.ERROR, message, details);
    }

    /**
     * Atalho: adicionar aviso
     */
    addWarning(type, message, details = {}) {
        return this.add(type, DIAGNOSTIC_LEVEL.WARNING, message, details);
    }

    /**
     * Atalho: adicionar informação
     */
    addInfo(type, message, details = {}) {
        return this.add(type, DIAGNOSTIC_LEVEL.INFO, message, details);
    }

    /**
     * Obter diagnósticos por tipo
     */
    getByType(type) {
        return this.diagnostics.filter(d => d.type === type);
    }

    /**
     * Obter diagnósticos por nível
     */
    getByLevel(level) {
        return this.diagnostics.filter(d => d.level === level);
    }

    /**
     * Obter diagnósticos por localização (ex: campo específico)
     */
    getByLocation(location) {
        return this.diagnostics.filter(d => d.location === location);
    }

    /**
     * Verificar se há erros críticos
     */
    hasErrors() {
        return this.diagnostics.some(d => d.level === DIAGNOSTIC_LEVEL.ERROR);
    }

    /**
     * Verificar se há avisos
     */
    hasWarnings() {
        return this.diagnostics.some(d => d.level === DIAGNOSTIC_LEVEL.WARNING);
    }

    /**
     * Obter resumo dos diagnósticos
     */
    getSummary() {
        const summary = {
            total: this.diagnostics.length,
            errors: 0,
            warnings: 0,
            infos: 0,
            byType: {},
        };

        this.diagnostics.forEach(d => {
            if (d.level === DIAGNOSTIC_LEVEL.ERROR) summary.errors++;
            else if (d.level === DIAGNOSTIC_LEVEL.WARNING) summary.warnings++;
            else if (d.level === DIAGNOSTIC_LEVEL.INFO) summary.infos++;

            if (!summary.byType[d.type]) {
                summary.byType[d.type] = 0;
            }
            summary.byType[d.type]++;
        });

        return summary;
    }

    /**
     * Limpar todos os diagnósticos
     */
    clear() {
        this.diagnostics = [];
    }

    /**
     * Limpar diagnósticos de um tipo específico
     */
    clearType(type) {
        this.diagnostics = this.diagnostics.filter(d => d.type !== type);
    }

    /**
     * Exportar relatório em formato estruturado
     */
    generateReport(format = 'json') {
        if (format === 'json') {
            return {
                timestamp: new Date().toISOString(),
                summary: this.getSummary(),
                diagnostics: this.diagnostics.map(d => d.toJSON()),
            };
        }

        if (format === 'html') {
            return this._generateHtmlReport();
        }

        if (format === 'text') {
            return this._generateTextReport();
        }

        return JSON.stringify(this.diagnostics);
    }

    /**
     * Gerar relatório em HTML
     */
    _generateHtmlReport() {
        const summary = this.getSummary();
        let html = `
            <div class="diagnostics-report">
                <h3>Relatório de Diagnósticos</h3>
                <div class="diagnostics-summary">
                    <p><strong>Total:</strong> ${summary.total}</p>
                    <p style="color: red;"><strong>Erros:</strong> ${summary.errors}</p>
                    <p style="color: orange;"><strong>Avisos:</strong> ${summary.warnings}</p>
                    <p style="color: blue;"><strong>Info:</strong> ${summary.infos}</p>
                </div>
                <div class="diagnostics-list">
        `;

        this.diagnostics.forEach(d => {
            const levelColor = d.level === DIAGNOSTIC_LEVEL.ERROR ? 'red' : d.level === DIAGNOSTIC_LEVEL.WARNING ? 'orange' : 'blue';
            html += `
                <div class="diagnostic-item" style="border-left: 4px solid ${levelColor}; padding: 10px; margin: 5px 0; background: #f5f5f5;">
                    <strong style="color: ${levelColor};">${d.level.toUpperCase()}: ${d.type}</strong>
                    <p>${d.message}</p>
                    ${d.location ? `<p><small>Localização: ${d.location}</small></p>` : ''}
                    ${d.suggestion ? `<p><small style="color: green;">💡 Sugestão: ${d.suggestion}</small></p>` : ''}
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Gerar relatório em texto plano
     */
    _generateTextReport() {
        const summary = this.getSummary();
        let text = `RELATÓRIO DE DIAGNÓSTICOS
========================
Data: ${new Date().toISOString()}
Total: ${summary.total}
Erros: ${summary.errors}
Avisos: ${summary.warnings}
Info: ${summary.infos}

DETALHES:
--------
`;

        this.diagnostics.forEach(d => {
            text += `\n[${d.level.toUpperCase()}] ${d.type}\nMensagem: ${d.message}\n`;
            if (d.location) text += `Localização: ${d.location}\n`;
            if (d.suggestion) text += `Sugestão: ${d.suggestion}\n`;
        });

        return text;
    }

    /**
     * Log estruturado para console
     */
    logToConsole() {
        const summary = this.getSummary();
        console.group('📊 Diagnósticos');
        console.log('Resumo:', summary);
        console.table(this.diagnostics);
        console.groupEnd();
    }
}

/**
 * Instância global (singleton-like para convenência)
 */
export const globalDiagnostics = new DiagnosticsService();
