/**
 * services/OdtParserService.js — Conversão ODT → HTML + preenchimento de template ODT
 * Usa PizZip (já carregado globalmente) para manipular o ZIP do ODT
 * e DOMParser para parsear o XML ODF.
 */

import { expandExtensoVariables, removeExcludedBlocks } from '../../extenso.js';

const NS = {
    office: 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    text: 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
    style: 'urn:oasis:names:tc:opendocument:xmlns:style:1.0',
    fo: 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0',
    table: 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    xlink: 'http://www.w3.org/1999/xlink',
};

export class OdtParserService {
    constructor() {
        this.styles = new Map();
    }

    /**
     * Converte um ArrayBuffer de arquivo ODT para HTML
     */
    toHtml(arrayBuffer) {
        if (!window.PizZip) {
            throw new Error('PizZip não disponível para processar ODT.');
        }

        const zip = new window.PizZip(arrayBuffer);

        this.parseStylesFromZip(zip);

        const contentXml = zip.file('content.xml')?.asText();
        if (!contentXml) {
            throw new Error('Arquivo ODT inválido: content.xml não encontrado.');
        }

        const doc = new DOMParser().parseFromString(contentXml, 'application/xml');
        this.extractStyleDefinitions(doc);

        const body = doc.getElementsByTagNameNS(NS.office, 'text')[0];
        if (!body) {
            throw new Error('Arquivo ODT inválido: corpo do texto não encontrado.');
        }

        const html = this.convertElement(body);
        return this.normalizeSplitPlaceholders(html);
    }

    parseStylesFromZip(zip) {
        const stylesXml = zip.file('styles.xml')?.asText();
        if (!stylesXml) return;
        const doc = new DOMParser().parseFromString(stylesXml, 'application/xml');
        this.extractStyleDefinitions(doc);
    }

    extractStyleDefinitions(doc) {
        const styleElements = doc.getElementsByTagNameNS(NS.style, 'style');
        for (const el of styleElements) {
            const name = el.getAttributeNS(NS.style, 'name');
            if (!name) continue;

            const props = {};
            const paraEl = el.getElementsByTagNameNS(NS.style, 'paragraph-properties')[0];
            if (paraEl) {
                this.extractParaProps(paraEl, props);
            }

            const textEl = el.getElementsByTagNameNS(NS.style, 'text-properties')[0];
            if (textEl) {
                this.extractTextProps(textEl, props);
            }

            const parentName = el.getAttributeNS(NS.style, 'parent-style-name');
            if (parentName && this.styles.has(parentName)) {
                this.styles.set(name, { ...this.styles.get(parentName), ...props });
            } else {
                this.styles.set(name, props);
            }
        }
    }

    extractParaProps(el, props) {
        const align = el.getAttributeNS(NS.fo, 'text-align');
        if (align) props.textAlign = align === 'end' ? 'right' : align === 'start' ? 'left' : align;

        const breakBefore = el.getAttributeNS(NS.fo, 'break-before');
        if (breakBefore === 'page') props.breakBefore = 'page';

        const marginLeft = el.getAttributeNS(NS.fo, 'margin-left');
        if (marginLeft) props.marginLeft = marginLeft;

        const marginRight = el.getAttributeNS(NS.fo, 'margin-right');
        if (marginRight) props.marginRight = marginRight;
    }

    extractTextProps(el, props) {
        const weight = el.getAttributeNS(NS.fo, 'font-weight');
        if (weight) props.fontWeight = weight;

        const fStyle = el.getAttributeNS(NS.fo, 'font-style');
        if (fStyle) props.fontStyle = fStyle;

        const size = el.getAttributeNS(NS.fo, 'font-size');
        if (size) props.fontSize = size;

        const color = el.getAttributeNS(NS.fo, 'color');
        if (color) props.color = color;

        const transform = el.getAttributeNS(NS.fo, 'text-transform');
        if (transform) props.textTransform = transform;

        const underline = el.getAttributeNS(NS.style, 'text-underline-style');
        if (underline && underline !== 'none') props.textDecoration = 'underline';

        const strike = el.getAttributeNS(NS.style, 'text-line-through-style');
        if (strike && strike !== 'none') {
            props.textDecoration = `${props.textDecoration || ''} line-through`.trim();
        }
    }

    convertElement(element) {
        let html = '';
        for (const child of element.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                html += this.escapeHtml(child.textContent);
                continue;
            }
            if (child.nodeType !== Node.ELEMENT_NODE) continue;

            const { localName, namespaceURI: ns } = child;

            if (ns === NS.text) html += this.convertTextElement(child, localName);
            else if (ns === NS.table) html += this.convertTableElement(child, localName);
            else html += this.convertElement(child);
        }
        return html;
    }

    convertTextElement(el, localName) {
        switch (localName) {
            case 'p': return this.convertParagraph(el);
            case 'h': return this.convertHeading(el);
            case 'span': return this.convertSpan(el);
            case 's': {
                const count = parseInt(el.getAttributeNS(NS.text, 'c') || '1', 10);
                return '&nbsp;'.repeat(count);
            }
            case 'tab': return '&emsp;&emsp;';
            case 'line-break': return '<br>';
            case 'list': return `<ul>${this.convertElement(el)}</ul>`;
            case 'list-item': return `<li>${this.convertElement(el)}</li>`;
            case 'a': {
                const href = el.getAttributeNS(NS.xlink, 'href') || '#';
                return `<a href="${this.escapeHtml(href)}">${this.convertElement(el)}</a>`;
            }
            case 'soft-page-break': return '<!-- PAGE_BREAK -->';
            default: return this.convertElement(el);
        }
    }

    convertTableElement(el, localName) {
        switch (localName) {
            case 'table': return `<table>${this.convertElement(el)}</table>`;
            case 'table-row': return `<tr>${this.convertElement(el)}</tr>`;
            case 'table-cell': return `<td>${this.convertElement(el)}</td>`;
            case 'table-header-rows': return `<thead>${this.convertElement(el)}</thead>`;
            default: return this.convertElement(el);
        }
    }

    convertParagraph(el) {
        const styleName = el.getAttributeNS(NS.text, 'style-name');
        const styleProps = this.styles.get(styleName) || {};
        const pageBreak = styleProps.breakBefore === 'page' ? '<!-- PAGE_BREAK -->' : '';
        const style = this.buildInlineStyle(styleName);
        const content = this.convertElement(el);

        if (!content.trim()) return `${pageBreak}<p>&nbsp;</p>`;
        return `${pageBreak}<p${style ? ` style="${style}"` : ''}>${content}</p>`;
    }

    convertHeading(el) {
        const level = Math.min(parseInt(el.getAttributeNS(NS.text, 'outline-level') || '1', 10), 6);
        const tag = `h${level}`;
        const styleName = el.getAttributeNS(NS.text, 'style-name');
        const style = this.buildInlineStyle(styleName);
        const content = this.convertElement(el);
        return `<${tag}${style ? ` style="${style}"` : ''}>${content}</${tag}>`;
    }

    convertSpan(el) {
        const styleName = el.getAttributeNS(NS.text, 'style-name');
        const style = this.buildInlineStyle(styleName);
        const content = this.convertElement(el);
        return style ? `<span style="${style}">${content}</span>` : content;
    }

    buildInlineStyle(styleName) {
        if (!styleName || !this.styles.has(styleName)) return '';
        const p = this.styles.get(styleName);
        const parts = [];
        if (p.textAlign) parts.push(`text-align:${p.textAlign}`);
        if (p.fontWeight) parts.push(`font-weight:${p.fontWeight}`);
        if (p.fontStyle) parts.push(`font-style:${p.fontStyle}`);
        if (p.fontSize) parts.push(`font-size:${p.fontSize}`);
        if (p.color) parts.push(`color:${p.color}`);
        if (p.textTransform) parts.push(`text-transform:${p.textTransform}`);
        if (p.textDecoration) parts.push(`text-decoration:${p.textDecoration}`);
        if (p.marginLeft) parts.push(`margin-left:${p.marginLeft}`);
        if (p.marginRight) parts.push(`margin-right:${p.marginRight}`);
        return parts.join(';');
    }

    /**
     * Preenche um template ODT substituindo {{placeholders}} pelos dados
     */
    fillTemplate(arrayBuffer, data) {
        const zip = new window.PizZip(arrayBuffer);
        const expandedData = expandExtensoVariables(data);
        const filesToProcess = ['content.xml', ...this.getHeaderFooterFiles(zip)];

        for (const fileName of filesToProcess) {
            const entry = zip.file(fileName);
            if (!entry) continue;

            let content = removeExcludedBlocks(entry.asText());
            content = this.normalizeSplitPlaceholdersInXml(content);
            for (const [key, value] of Object.entries(expandedData)) {
                if (value === undefined || value === null || value === '') continue;
                const safeValue = this.escapeXml(String(value));
                const patterns = [
                    new RegExp(`\\[\\{\\{\\s*${this.escapeRegex(key)}[^}]*\\}\\}\\]`, 'g'),
                    new RegExp(`\\{\\{\\s*${this.escapeRegex(key)}[^}]*\\}\\}`, 'g'),
                ];
                for (const pattern of patterns) {
                    content = content.replace(pattern, safeValue);
                }
            }
            zip.file(fileName, content);
        }

        return zip.generate({
            type: 'blob',
            mimeType: 'application/vnd.oasis.opendocument.text',
        });
    }

    getHeaderFooterFiles(zip) {
        return Object.keys(zip.files || {}).filter(fileName => /^styles\.xml$/i.test(fileName));
    }

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    escapeXml(text) {
        return String(text)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    normalizeSplitPlaceholdersInXml(xmlContent) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
        if (xmlDoc.getElementsByTagName('parsererror').length) {
            return xmlContent;
        }

        const walker = xmlDoc.createTreeWalker(xmlDoc, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let currentNode;
        let position = 0;

        while ((currentNode = walker.nextNode())) {
            const text = currentNode.nodeValue || '';
            textNodes.push({ node: currentNode, text, start: position, end: position + text.length });
            position += text.length;
        }

        const combinedText = textNodes.map((entry) => entry.text).join('');
        const placeholderRegex = /\[\{\{\s*[^}]+?\s*\}\}\]|\{\{\s*[^}]+?\s*\}\}/g;
        const replacements = [];
        let match;

        while ((match = placeholderRegex.exec(combinedText)) !== null) {
            replacements.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
        }

        if (!replacements.length) {
            return xmlContent;
        }

        for (let i = replacements.length - 1; i >= 0; i -= 1) {
            const { start, end, text } = replacements[i];
            const startEntry = textNodes.find((entry) => entry.start <= start && start < entry.end);
            const endEntry = textNodes.find((entry) => entry.start < end && end <= entry.end);
            if (!startEntry || !endEntry) continue;

            const range = xmlDoc.createRange();
            const startOffset = start - startEntry.start;
            const endOffset = end - endEntry.start;
            range.setStart(startEntry.node, startOffset);
            range.setEnd(endEntry.node, endOffset);
            range.deleteContents();
            range.insertNode(xmlDoc.createTextNode(text));
        }

        return new XMLSerializer().serializeToString(xmlDoc);
    }

    normalizeSplitPlaceholders(html) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;

        const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let currentNode;
        let position = 0;

        while ((currentNode = walker.nextNode())) {
            const text = currentNode.textContent || '';
            textNodes.push({ node: currentNode, text, start: position, end: position + text.length });
            position += text.length;
        }

        const combinedText = textNodes.map((entry) => entry.text).join('');
        const placeholderRegex = /\[\{\{\s*[^}]+?\s*\}\}\]|\{\{\s*[^}]+?\s*\}\}/g;
        const replacements = [];
        let match;

        while ((match = placeholderRegex.exec(combinedText)) !== null) {
            replacements.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
        }

        if (!replacements.length) {
            return html;
        }

        // Process from last to first to preserve node offsets
        for (let i = replacements.length - 1; i >= 0; i -= 1) {
            const { start, end, text } = replacements[i];
            const startEntry = textNodes.find((entry) => entry.start <= start && start < entry.end);
            const endEntry = textNodes.find((entry) => entry.start < end && end <= entry.end);
            if (!startEntry || !endEntry) continue;

            const range = document.createRange();
            const startOffset = start - startEntry.start;
            const endOffset = end - endEntry.start;
            range.setStart(startEntry.node, startOffset);
            range.setEnd(endEntry.node, endOffset);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
        }

        return wrapper.innerHTML;
    }
}
