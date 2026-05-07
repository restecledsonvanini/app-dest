/**
 * modules/documentEditor/utils/HtmlNormalizer.js — Normalização inteligente de HTML
 * Preserva estilos inline críticos (indentação, alinhamento, margens)
 * @author Refatoração 2026-05-04
 */

export class HtmlNormalizer {
    /**
     * Normaliza HTML removendo apenas quebras de página e parágrafo vazios
     * MAS preservando estilos inline críticos para formatação
     * @param {string} htmlContent - HTML bruto
     * @param {string} [format='docx'] - Formato original (docx | odt) para tratamento específico
     * @returns {string} HTML normalizado
     */
    static normalize(htmlContent = '', format = 'docx') {
        if (!htmlContent) return '';

        let html = htmlContent;

        // Remove quebras de página (universal)
        html = html.replace(/<p[^>]*style="[^"]*page-break-before\s*:\s*always;?[^"]*"[^>]*>[\s]*<\/p>/gi, '<!-- PAGE_BREAK -->');

        // Preservar estilos inline críticos em parágrafos
        // Replace <p style="" empty> → <p>&nbsp;</p> APENAS se não tiver estilos
        html = html.replace(/<p(?!\s+style)[^>]*>[\s]*<\/p>/gi, '<p>&nbsp;</p>');

        return html.trim();
    }

    /**
     * Extrai estilos críticos de um elemento <p> para preservação
     * @param {string} styleStr - String de style HTML
     * @returns {Object} Estilos críticos {textAlign, marginLeft, marginRight, indent}
     */
    static extractCriticalStyles(styleStr = '') {
        const styles = {
            textAlign: null,
            marginLeft: null,
            marginRight: null,
            indent: null,
        };

        if (!styleStr) return styles;

        const alignMatch = styleStr.match(/text-align\s*:\s*(left|center|right|justify)/i);
        if (alignMatch) styles.textAlign = alignMatch[1];

        const marginLeftMatch = styleStr.match(/margin-left\s*:\s*([\d.]+(?:cm|mm|px|pt)?)/i);
        if (marginLeftMatch) styles.marginLeft = marginLeftMatch[1];

        const marginRightMatch = styleStr.match(/margin-right\s*:\s*([\d.]+(?:cm|mm|px|pt)?)/i);
        if (marginRightMatch) styles.marginRight = marginRightMatch[1];

        const indentMatch = styleStr.match(/text-indent\s*:\s*([\d.]+(?:cm|mm|px|pt)?)/i);
        if (indentMatch) styles.indent = indentMatch[1];

        return styles;
    }

    /**
     * Preserva formatação ao converter DOCX mantendo estilos inline
     * @param {string} htmlContent - HTML do Mammoth
     * @returns {string} HTML com estilos preservados
     */
    static preserveDocxFormatting(htmlContent = '') {
        if (!htmlContent) return '';

        // Remove apenas estilos de página, mantém tudo mais
        return htmlContent
            .replace(/<p[^>]*style="[^"]*page-break-before\s*:\s*always;?[^"]*"[^>]*>[\s]*<\/p>/gi, '<!-- PAGE_BREAK -->')
            .replace(/<p[^>]*>[\s]*<\/p>/gi, '<p>&nbsp;</p>')
            .trim();
    }

    /**
     * Garante consistência entre DOCX e ODT
     * @param {string} htmlContent - HTML convertido
     * @param {string} format - Formato original
     * @returns {string} HTML normalizado e consistente
     */
    static normalizeForPreview(htmlContent = '', format = 'docx') {
        if (format === 'odt') {
            // ODT já respeita bem a formatação
            return htmlContent.trim();
        }

        // DOCX precisa de normalização suave
        return this.preserveDocxFormatting(htmlContent);
    }
}