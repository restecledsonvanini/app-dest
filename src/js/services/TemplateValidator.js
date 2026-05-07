/**
 * services/TemplateValidator.js — Validação robusta de templates e placeholders
 * Detecta:
 * - Placeholders malformados: {{campo (sem fechar)
 * - Placeholders vazios: {{}}
 * - Nomes inválidos de campos
 * - Placeholders duplicados
 * @author 2026-04-17
 */

import { DiagnosticsService, DIAGNOSTIC_TYPE, DIAGNOSTIC_LEVEL } from './DiagnosticsService.js';

/**
 * Padrões para detectar placeholders
 */
const PLACEHOLDER_PATTERNS = {
    // Bem-formado: {{campo}} ou [{{campo}}]
    valid: /\[\{\{([^}]+)\}\}\]|\{\{([^}]+)\}\}/g,

    // Malformado: {{campo (sem fechar as chaves)
    unclosed: /\{\{(?![^}]*\}\})/g,

    // Vazio: {{}} ou [{{}}]
    empty: /\[\{\{\s*\}\}\]|\{\{\s*\}\}/g,

    // Operadores inválidos dentro do placeholder
    invalidContent: /\{\{([^}]*[<>|&;`$'"]+[^}]*)\}\}/g,
};

/**
 * Validador centralizado de templates
 */
export class TemplateValidator {
    constructor(diagnostics = null) {
        this.diagnostics = diagnostics || new DiagnosticsService();
    }

    /**
     * Validar um template HTML completo
     * @returns {ValidationResult} resultado com erros encontrados
     */
    validateTemplate(html) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            placeholders: [],
        };

        if (!html || typeof html !== 'string') {
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.TEMPLATE_PARSE_ERROR,
                'Template HTML é inválido ou vazio',
                { suggestion: 'Verifique se o arquivo foi carregado corretamente' }
            );
            result.isValid = false;
            return result;
        }

        // Validações
        this._checkForUnclosedPlaceholders(html, result);
        this._checkForEmptyPlaceholders(html, result);
        this._checkForInvalidPlaceholders(html, result);
        this._checkForDuplicatePlaceholders(html, result);
        this._validatePlaceholderNames(html, result);

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Detectar placeholders não-fechados: {{campo
     */
    _checkForUnclosedPlaceholders(html, result) {
        const lines = html.split('\n');
        lines.forEach((line, lineIndex) => {
            // Procura por {{ seguido por } (não }}), ou {{ no final da linha
            const unclosedMatches = [...line.matchAll(/\{\{([^}]*?)(?:$|[^}]$)/g)];

            unclosedMatches.forEach(match => {
                // Verificar se é realmente não-fechado (não tem }} depois)
                const afterMatch = line.substring(match.index + match[0].length);
                if (!afterMatch.includes('}}') && !line.includes('}}')) {
                    const content = match[1] || '';
                    const error = {
                        type: DIAGNOSTIC_TYPE.UNCLOSED_PLACEHOLDER,
                        line: lineIndex + 1,
                        position: match.index,
                        field: content.trim(),
                        message: `Placeholder não-fechado encontrado: {{${content}...`,
                        suggestion: `Feche com }}: {{${content}}}`
                    };
                    result.errors.push(error);

                    this.diagnostics.addError(
                        DIAGNOSTIC_TYPE.UNCLOSED_PLACEHOLDER,
                        error.message,
                        {
                            location: `Linha ${error.line}, posição ${error.position}`,
                            suggestion: error.suggestion,
                            field: error.field
                        }
                    );
                }
            });
        });
    }

    /**
     * Detectar placeholders vazios: {{}} ou [{{}}]
     */
    _checkForEmptyPlaceholders(html, result) {
        const matches = [...html.matchAll(PLACEHOLDER_PATTERNS.empty)];
        matches.forEach(match => {
            const lineNum = html.substring(0, match.index).split('\n').length;
            const error = {
                type: DIAGNOSTIC_TYPE.EMPTY_PLACEHOLDER,
                line: lineNum,
                position: match.index,
                message: 'Placeholder vazio encontrado: {{}}',
                suggestion: 'Remova ou adicione um nome de campo válido'
            };
            result.warnings.push(error);

            this.diagnostics.addWarning(
                DIAGNOSTIC_TYPE.EMPTY_PLACEHOLDER,
                error.message,
                {
                    location: `Linha ${error.line}`,
                    suggestion: error.suggestion
                }
            );
        });
    }

    /**
     * Detectar placeholders com conteúdo inválido
     */
    _checkForInvalidPlaceholders(html, result) {
        const matches = [...html.matchAll(PLACEHOLDER_PATTERNS.invalidContent)];
        matches.forEach(match => {
            const content = match[1];
            if (/<|>|;|\||&|`|\$|'|"/.test(content)) {
                const lineNum = html.substring(0, match.index).split('\n').length;
                const error = {
                    type: DIAGNOSTIC_TYPE.PLACEHOLDER_TYPE_MISMATCH,
                    line: lineNum,
                    field: content.substring(0, 50), // truncar se muito longo
                    message: `Placeholder contém caracteres inválidos: {{${content}}}`,
                    suggestion: 'Use apenas letras, números, underscore e dois-pontos para nomes de campos'
                };
                result.warnings.push(error);

                this.diagnostics.addWarning(
                    DIAGNOSTIC_TYPE.PLACEHOLDER_TYPE_MISMATCH,
                    error.message,
                    {
                        location: `Linha ${error.line}`,
                        suggestion: error.suggestion
                    }
                );
            }
        });
    }

    /**
     * Detectar placeholders duplicados
     */
    _checkForDuplicatePlaceholders(html, result) {
        const placeholderMap = new Map();
        let match;
        const regex = new RegExp(PLACEHOLDER_PATTERNS.valid.source, 'g');

        while ((match = regex.exec(html)) !== null) {
            const name = match[1] || match[2];
            if (!placeholderMap.has(name)) {
                placeholderMap.set(name, []);
            }
            placeholderMap.get(name).push(match.index);
        }

        // Avisar sobre duplicatas
        placeholderMap.forEach((positions, name) => {
            result.placeholders.push({ name, count: positions.length });
            if (positions.length > 1) {
                this.diagnostics.addInfo(
                    DIAGNOSTIC_TYPE.PLACEHOLDER_TYPE_MISMATCH,
                    `Campo "{{${name}}}" aparece ${positions.length} vezes no template`,
                    { suggestion: 'Verifique se é intencional ou se deve-se remover duplicatas' }
                );
            }
        });
    }

    /**
     * Validar nomes de campos
     */
    _validatePlaceholderNames(html, result) {
        const validNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*(:[\w]+)?(\?)?$/;

        let match;
        const regex = new RegExp(PLACEHOLDER_PATTERNS.valid.source, 'g');

        while ((match = regex.exec(html)) !== null) {
            const name = match[1] || match[2];
            if (!validNamePattern.test(name.trim())) {
                const lineNum = html.substring(0, match.index).split('\n').length;
                const error = {
                    type: DIAGNOSTIC_TYPE.INVALID_PLACEHOLDER_NAME,
                    line: lineNum,
                    field: name,
                    message: `Nome de campo inválido: {{${name}}}`,
                    suggestion: 'Use: letras, números, underscore. Ex: {{campo}}, {{campo:date}}, {{campo:text?}}'
                };
                result.warnings.push(error);

                this.diagnostics.addWarning(
                    DIAGNOSTIC_TYPE.INVALID_PLACEHOLDER_NAME,
                    error.message,
                    {
                        location: `Linha ${lineNum}`,
                        suggestion: error.suggestion,
                        field: name
                    }
                );
            }
        }
    }

    /**
     * Extrair todos os placeholders do template
     */
    extractPlaceholders(html) {
        const placeholders = new Map();
        let match;
        const regex = new RegExp(PLACEHOLDER_PATTERNS.valid.source, 'g');

        while ((match = regex.exec(html)) !== null) {
            const fullMatch = match[0];
            const content = match[1] || match[2];
            const isSelect = Boolean(match[1]);

            // Parsing de tipo
            let name = content.trim();
            let type = 'text';
            let required = true;

            if (name.endsWith('?')) {
                required = false;
                name = name.slice(0, -1).trim();
            }

            if (name.includes(':')) {
                const [fieldName, fieldType] = name.split(':').map(s => s.trim());
                name = fieldName;
                type = fieldType;
            }

            if (!placeholders.has(name)) {
                placeholders.set(name, {
                    name,
                    type,
                    required,
                    kind: isSelect ? 'select' : 'input',
                    count: 0,
                    positions: []
                });
            }

            const entry = placeholders.get(name);
            entry.count++;
            entry.positions.push(match.index);

            if (isSelect) {
                entry.kind = 'select';
            }
        }

        return Array.from(placeholders.values());
    }

    /**
     * Validar dados contra placeholders do template
     */
    validateData(data, placeholders) {
        const result = {
            missingRequired: [],
            extraFields: [],
            typeErrors: [],
        };

        // Verificar campos obrigatórios
        placeholders.forEach(placeholder => {
            if (placeholder.required && !(placeholder.name in data)) {
                result.missingRequired.push(placeholder.name);
                this.diagnostics.addWarning(
                    DIAGNOSTIC_TYPE.MISSING_REQUIRED_FIELD,
                    `Campo obrigatório não preenchido: {{${placeholder.name}}}`,
                    { suggestion: 'Preencha todos os campos obrigatórios antes de exportar' }
                );
            }
        });

        // Verificar campos extras (não declarados no template)
        const placeholderNames = new Set(placeholders.map(p => p.name));
        Object.keys(data).forEach(key => {
            if (!placeholderNames.has(key)) {
                result.extraFields.push(key);
            }
        });

        return result;
    }

    /**
     * Sugerir correções para placeholders malformados
     */
    suggestFix(malformedPlaceholder) {
        // {{campo -> {{campo}}
        if (malformedPlaceholder.match(/^\{\{[^}]+$/)) {
            return malformedPlaceholder + '}}';
        }

        // campo}} -> {{campo}}
        if (malformedPlaceholder.match(/^[^{]+\}\}$/)) {
            return '{{' + malformedPlaceholder;
        }

        // Espaços extras
        if (malformedPlaceholder.includes('{{ ') || malformedPlaceholder.includes(' }}')) {
            return malformedPlaceholder.replace(/\{\{\s+/g, '{{').replace(/\s+\}\}/g, '}}');
        }

        return null;
    }
}
