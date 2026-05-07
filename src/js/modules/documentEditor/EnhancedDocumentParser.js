/**
 * modules/documentEditor/EnhancedDocumentParser.js — Parser com diagnósticos integrados
 * Estende DocumentParser com validação e detecção de erros
 * Mostra placeholders malformados como campos com aviso em vermelho
 * @author 2026-04-17
 */

import { TemplateValidator } from '../../services/TemplateValidator.js';
import { DiagnosticsService, DIAGNOSTIC_TYPE, DIAGNOSTIC_LEVEL } from '../../services/DiagnosticsService.js';

/**
 * Padrão para detectar tokens
 */
const TOKEN_REGEX = /\[\s*\{\{\s*([^}]+)\s*\}\}\s*\]|\{\{\s*([^}]+)\s*\}\}/g;

/**
 * Parser melhorado com suporte a diagnósticos
 */
export class EnhancedDocumentParser {
    constructor(htmlContent, diagnostics = null) {
        this.originalHtml = htmlContent;
        this.diagnostics = diagnostics || new DiagnosticsService();
        this.validator = new TemplateValidator(this.diagnostics);
        this.placeholders = [];
        this.malformedPlaceholders = [];

        this._parse();
    }

    /**
     * Executar parsing com validação
     */
    _parse() {
        // Validar template
        const validationResult = this.validator.validateTemplate(this.originalHtml);

        if (!validationResult.isValid) {
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.TEMPLATE_PARSE_ERROR,
                'Template contém placeholders malformados',
                { suggestion: 'Revise os placeholders indicados abaixo' }
            );
        }

        // Extrair placeholders (válidos e inválidos)
        this.placeholders = this.validator.extractPlaceholders(this.originalHtml);
        this._detectMalformedPlaceholders();
    }

    /**
     * Detectar placeholders não-fechados e malformados
     * Ex: {{campo (sem }}
     */
    _detectMalformedPlaceholders() {
        const lines = this.originalHtml.split('\n');
        const malformed = [];

        lines.forEach((line, lineIndex) => {
            // Procurar por {{ não-fechados
            const unclosedMatches = [...line.matchAll(/\{\{([^}]*?)(?=[^}]|$)/g)];

            unclosedMatches.forEach(match => {
                const content = match[1] || '';
                const isClosedLater = line.substring(match.index + match[0].length).includes('}}');

                if (!isClosedLater && !content.includes('}}')) {
                    malformed.push({
                        line: lineIndex + 1,
                        column: match.index,
                        content: content.trim(),
                        fullMatch: match[0],
                        type: 'unclosed'
                    });
                }
            });

            // Procurar por }} sem {{
            const closingMatches = [...line.matchAll(/\}\}(?!\})/g)];
            closingMatches.forEach(match => {
                const beforeMatch = line.substring(0, match.index);
                if (!beforeMatch.includes('{{')) {
                    malformed.push({
                        line: lineIndex + 1,
                        column: match.index,
                        fullMatch: '}}',
                        type: 'orphan_closing'
                    });
                }
            });
        });

        this.malformedPlaceholders = malformed;

        // Registrar cada malformação como diagnóstico
        malformed.forEach(mal => {
            const suggestion = this._suggestFix(mal.content, mal.type);

            this.diagnostics.addWarning(
                DIAGNOSTIC_TYPE.UNCLOSED_PLACEHOLDER,
                `Placeholder malformado: ${mal.fullMatch}${mal.type === 'unclosed' ? '... → Falta fechar com }}' : ''}`,
                {
                    location: `Linha ${mal.line}, coluna ${mal.column}`,
                    suggestion: suggestion,
                    field: mal.content
                }
            );
        });
    }

    /**
     * Sugerir correção para placeholder malformado
     */
    _suggestFix(content, type) {
        if (type === 'unclosed') {
            return `Feche o placeholder: {{${content}}}`;
        }
        if (type === 'orphan_closing') {
            return 'Remova o }} orfão ou adicione {{ antes';
        }
        return 'Revise a sintaxe do placeholder';
    }

    /**
     * Renderizar com destaque de erros
     * Placeholders malformados aparecem com aviso em vermelho
     */
    render(data, options = {}) {
        const { highlightEmpty = true, escapeHtml = true, highlightMalformed = true } = options;
        let html = this.originalHtml;

        try {
            // Primeiro, substituir placeholders bem-formados
            this.placeholders.forEach(({ name }) => {
                const value = data[name] ?? '';
                const safeValue = escapeHtml ? this._escapeHtml(value) : value;

                try {
                    const escapedName = escapeRegExp(name);
                    const pattern = new RegExp(`(?:\\[\\s*)?\\{\\{${escapedName}[^}]*\\}\\}(?:\\s*\\])?`, 'g');

                    if (String(value).trim()) {
                        html = html.replace(
                            pattern,
                            `<span class="document-editor__placeholder document-editor__placeholder--filled" data-field="${name}">${safeValue}</span>`
                        );
                    } else if (highlightEmpty) {
                        html = html.replace(
                            pattern,
                            `<span class="document-editor__placeholder document-editor__placeholder--empty" data-field="${name}">{{${name}}}</span>`
                        );
                    }
                } catch (regexError) {
                    console.error(`[EnhancedDocumentParser.render] Erro na regex para placeholder "${name}":`, regexError);
                }
            });

            // Depois, marcar placeholders malformados se habilitado
            if (highlightMalformed) {
                html = this._highlightMalformedPlaceholders(html);
            }

            return this._cleanupRenderedBrackets(html);
        } catch (error) {
            console.error('[EnhancedDocumentParser.render] Erro geral no render:', error);
            throw error;
        }
    }

    /**
     * Destacar placeholders malformados em vermelho
     */
    _highlightMalformedPlaceholders(html) {
        let modified = html;

        this.malformedPlaceholders.forEach(mal => {
            if (mal.type === 'unclosed') {
                // {{campo... → <span class="error">Placeholder malformado</span>
                const pattern = new RegExp(
                    escapeRegExp(mal.fullMatch).replace(/\s+/g, '\\s+') + '.*?(?=</|\\n|$)',
                    'g'
                );
                modified = modified.replace(pattern, (match) => {
                    const truncated = match.substring(0, 40);
                    return `<span class="document-editor__placeholder document-editor__placeholder--malformed" title="Placeholder malformado - revise a fonte">${truncated}</span><span style="color: red; font-weight: bold; text-decoration: underline;" title="Este campo não está bem-formado. Use: {{campo}}">[⚠️ REVISE]</span>`;
                });
            }
        });

        return modified;
    }

    /**
     * Escapar HTML
     */
    _escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, (char) => map[char]);
    }

    /**
     * Limpar colchetes renderizados
     */
    _cleanupRenderedBrackets(html) {
        return html.replace(/\[(\s*<span class="document-editor__placeholder[\s\S]*?<\/span>\s*)\]/g, '$1');
    }

    /**
     * Obter placeholders
     */
    getPlaceholders() {
        return this.placeholders;
    }

    /**
     * Obter placeholders malformados
     */
    getMalformedPlaceholders() {
        return this.malformedPlaceholders;
    }

    /**
     * Verificar se há erros
     */
    hasErrors() {
        return this.malformedPlaceholders.length > 0;
    }

    /**
     * Obter relatório de erros
     */
    getErrorReport() {
        return {
            total: this.malformedPlaceholders.length,
            placeholders: this.placeholders.length,
            malformed: this.malformedPlaceholders.map(m => ({
                line: m.line,
                content: m.content,
                type: m.type,
                suggestion: this._suggestFix(m.content, m.type)
            }))
        };
    }
}

/**
 * Escapar string para regex
 */
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
