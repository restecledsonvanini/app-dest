/**
 * config/patterns.js — Regex e patterns centralizados
 * Evita magic numbers/strings espalhadas pelo código
 * @author Auditoria de Código 2026-04-09
 */

/**
 * Detecta placeholders: {{nome}} ou [{{nome}}]
 * Grupos:
 *   [1] = nome inside [{{ }}] (select/dropdown fields)
 *   [2] = nome inside {{ }} (text input fields)
 */
export const PATTERNS = {
    placeholder: /\[\{\{([^}]+)\}\}\]|\{\{([^}]+)\}\}/g,

    /**
     * Extraia um token: `{{fieldName:date?}}`
     * Retorna: {name, type, required}
     */
    tokenContent: {
        withModifier: /^([^:]+):(.+)$/, // fieldName:type
        optional: /\?$/, // ends with ?
    },

    // Detecção de quebra de página em docx
    pageBreak: /<p[^>]*style="[^"]*page-break-before\s*:\s*always;?[^"]*"[^>]*>\s*<\/p>/gi,

    // Para limpar vazios quando renderizar
    emptyParagraph: /<p[^>]*>\s*<\/p>/gi,

    // Validação básica
    cnpj: /^\d{14}$/, // 14 dígitos sem máscara
    date: /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
};

/**
 * Factory para criar regex com escape automático
 * @param {string} fieldName - nome do campo para substituir
 * @returns {RegExp} regex escapada
 */
export function createPlaceholderRegex(fieldName) {
    const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:\\[)?\\{\\{${escaped}[^}]*\\}\\}(?:\\])?`, 'g');
}
