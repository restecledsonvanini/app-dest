import { INSTITUTION } from '../../../config/institution.js';

const DEFAULT_HEADER_TEXT = `${INSTITUTION.defaultHeader.mainText}
${INSTITUTION.defaultHeader.subtitle.replace('{{tipo_termo}}', 'DE APOSTILAMENTO')}`;

export function composePreviewPages(html, options = {}) {
    if (!html || typeof html !== 'string') {
        throw new Error('HTML inválido para composição de páginas');
    }

    const pages = html.split('<!-- PAGE_BREAK -->');
    return pages
        .map((pageHtml, index) => buildPageMarkup(pageHtml, index, options))
        .join('');
}

function buildPageMarkup(pageHtml, index, context) {
    let enrichedHtml = pageHtml;

    if (!hasHeader(enrichedHtml)) {
        enrichedHtml = `${buildHeaderHtml(context)}${enrichedHtml}`;
    }

    if (index === 0) {
        enrichedHtml = applyDocumentPreambleLayout(enrichedHtml);
        enrichedHtml = applyPreambleLayout(enrichedHtml, context);
    }

    enrichedHtml = `${enrichedHtml}${buildFooterHtml(context)}`;

    return `
        <section class="document-editor__preview-page">
            <div class="document-editor__preview-page-body">${enrichedHtml}</div>
        </section>
    `;
}

function hasHeader(html) {
    return /SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA|document-editor__fallback-header/i.test(html);
}

function buildHeaderHtml({ data, settings }) {
    const headerConfig = settings.headerFallback || {};
    const headerText = interpolateText(headerConfig.headerText || DEFAULT_HEADER_TEXT, data);
    const lines = headerText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p style="margin:0;font-weight:700;text-transform:uppercase;text-align:center;">${line}</p>`)
        .join('');

    return `
        <header class="document-editor__fallback-header" style="display:grid;justify-items:center;gap:8px;margin:0 0 18px;text-align:center;">
            <div class="document-editor__fallback-title">${lines}</div>
        </header>
    `;
}

function buildFooterHtml({ data }) {
    const footerText = `Protocolo nº [{{protocolo_termo}}] – Contrato nº {{num_contrato}} – GMS {{num_gms}} – [{{termo_extenso}}] Termo Aditivo`;
    const interpolated = interpolateText(footerText, data);
    return `
        <footer class="document-editor__fallback-footer" style="margin-top: auto; padding-top: 18px; border-top: 1px solid #cbd5e1; text-align: center; font-size: 0.85rem; color: #64748b;">
            <p style="margin:0;font-weight:600;text-transform:uppercase;">${interpolated}</p>
        </footer>
    `;
}

/**
 * Envolve o bloco do preâmbulo do DOCUMENTO (de {{termo_extenso}} até antes de {{protocolo_termo}})
 * com a classe .document-editor__document-preamble.
 *
 * Funciona tanto com placeholders vazios (--empty) quanto preenchidos (--filled)
 * porque usa data-field ao invés de procurar {{...}} como texto literal.
 */
function applyDocumentPreambleLayout(html) {
    if (html.includes('document-editor__document-preamble')) return html;

    const temp = document.createElement('div');
    temp.innerHTML = html;

    const startField = temp.querySelector('[data-field="termo_extenso"]');
    if (!startField) return html;

    const startBlock = startField.closest('p') || startField.parentElement;
    if (!startBlock?.parentNode) return html;

    const endField = temp.querySelector('[data-field="protocolo_termo"]');
    const endBlock = endField ? (endField.closest('p') || endField.parentElement) : null;

    const wrapper = document.createElement('div');
    wrapper.className = 'document-editor__document-preamble';

    if (!endBlock) {
        // Sem marcador final: envolve apenas o bloco de início
        startBlock.parentNode.insertBefore(wrapper, startBlock);
        wrapper.appendChild(startBlock);
    } else if (startBlock === endBlock) {
        // Ambos no mesmo parágrafo
        startBlock.parentNode.insertBefore(wrapper, startBlock);
        wrapper.appendChild(startBlock);
    } else {
        // Intervalo: envolve do startBlock até antes do endBlock
        startBlock.parentNode.insertBefore(wrapper, startBlock);
        let current = wrapper.nextSibling;
        while (current && current !== endBlock) {
            const next = current.nextSibling;
            wrapper.appendChild(current);
            current = next;
        }
    }

    if (!wrapper.hasChildNodes()) {
        wrapper.remove();
        return html;
    }

    return temp.innerHTML;
}

function applyPreambleLayout(html, { data, settings }) {
    html = html.replace(/<div class="document-editor__preamble"[^>]*>[\s\S]*?<\/div>/g, '');

    const preambleText = interpolateText(settings.headerFallback?.preambleText || '', data).trim();
    if (!preambleText) return html;

    const preambleHtml = `<div class="document-editor__preamble" style="width:50%;max-width:8cm;margin:0 0 16px auto;float:right;text-align:justify;clear:both;"><p style="margin:0;font-weight:700;">${preambleText}</p></div>`;

    if (html.includes('</header>')) {
        return html.replace('</header>', `</header>${preambleHtml}`);
    }

    return `${preambleHtml}${html}`;
}

function interpolateText(template, data) {
    return String(template).replace(/\[?\{\{\s*([^}\s]+)\s*\}\}\]?/g, (_, key) => {
        const value = data[key];
        return value === undefined || value === null || value === '' ? `{{${key}}}` : value;
    });
}
