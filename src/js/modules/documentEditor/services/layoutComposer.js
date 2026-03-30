const DEFAULT_HEADER_TEXT = `SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA
CENTRO DE CONTRATOS E CONVÊNIOS – TERMO DE APOSTILAMENTO Nº {{num_termo}}`;
const DEFAULT_LOGO_URL = '/src/images/brasao_do_Parana.svg.png';

export function composePreviewPages(html, options = {}) {
    const { data = {}, settings = {} } = options;
    const pages = html.split('<!-- PAGE_BREAK -->');

    return pages
        .map((pageHtml, index) => buildPageMarkup(pageHtml, index, { data, settings }))
        .join('');
}

function buildPageMarkup(pageHtml, index, context) {
    let enrichedHtml = pageHtml;

    if (!hasHeader(enrichedHtml)) {
        enrichedHtml = `${buildHeaderHtml(context)}${enrichedHtml}`;
    }

    if (index === 0) {
        enrichedHtml = applyPreambleLayout(enrichedHtml, context);
    }

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
    const logoUrl = headerConfig.logoUrl || DEFAULT_LOGO_URL;
    const headerText = interpolateText(headerConfig.headerText || DEFAULT_HEADER_TEXT, data);
    const lines = headerText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p style="margin:0;font-weight:700;text-transform:uppercase;text-align:center;">${line}</p>`)
        .join('');

    return `
        <header class="document-editor__fallback-header" style="display:grid;justify-items:center;gap:8px;margin:0 0 18px;text-align:center;">
            <img class="document-editor__fallback-logo" src="${logoUrl}" alt="Brasão do Paraná" style="width:68px;height:auto;object-fit:contain;">
            <div class="document-editor__fallback-title">${lines}</div>
        </header>
    `;
}

function applyPreambleLayout(html, { data, settings }) {
    if (html.includes('document-editor__preamble')) return html;

    const regex = /<p[^>]*>(?=[\s\S]{20,})(?=[\s\S]*(CONTRATO\s*Nº|REFERENTE|PRIMEIRO\s+TERMO))[\s\S]*?<\/p>/i;
    if (regex.test(html)) {
        return html.replace(regex, (match) => `<div class="document-editor__preamble" style="width:50%;max-width:8cm;margin:12px 0 20px auto;text-align:justify;">${match}</div>`);
    }

    const preambleText = interpolateText(settings.headerFallback?.preambleText || '', data).trim();
    if (!preambleText) return html;

    return `${buildHeaderSpacer()}<div class="document-editor__preamble" style="width:50%;max-width:8cm;margin:12px 0 20px auto;text-align:justify;"><p style="margin:0;font-weight:700;">${preambleText}</p></div>${html}`;
}

function buildHeaderSpacer() {
    return '<div class="document-editor__preamble-spacer" aria-hidden="true"></div>';
}

function interpolateText(template, data) {
    return String(template).replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, key) => {
        const value = data[key];
        return value === undefined || value === null || value === '' ? `{{${key}}}` : value;
    });
}
