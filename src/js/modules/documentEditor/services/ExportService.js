import { OdtParserService } from './OdtParserService.js';

export class ExportService {
    async downloadWord({ fileName = 'documento', markup, originalFile, data = {}, settings = {} }) {
        if (originalFile && /\.odt$/iu.test(originalFile.name) && window.PizZip) {
            const blob = await this.buildOdtFromTemplate(originalFile, data);
            this.downloadBlob(blob, `${fileName}-preenchido.odt`);
            return { format: 'odt' };
        }

        if (originalFile && /\.docx$/iu.test(originalFile.name) && (window.PizZip && (window.docxtemplater || window.Docxtemplater))) {
            const blob = await this.buildDocxFromTemplate(originalFile, data, settings);
            this.downloadBlob(blob, `${fileName}-preenchido.docx`);
            return { format: 'docx' };
        }

        const blob = new Blob(['\ufeff', markup], { type: 'application/msword' });
        this.downloadBlob(blob, `${fileName}-preenchido.doc`);
        return { format: 'html-doc' };
    }

    async buildDocxFromTemplate(file, data, settings = {}) {
        const zip = new window.PizZip(await file.arrayBuffer());
        this.normalizeTemplateZip(zip);

        const DocxtemplaterCtor = window.docxtemplater || window.Docxtemplater;
        const doc = new DocxtemplaterCtor(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '{{', end: '}}' },
            nullGetter(part) {
                return part?.raw ? `{{${part.raw}}}` : '';
            }
        });

        const safeData = Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key, value ?? '']));
        doc.render(safeData);

        return doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
    }

    async buildOdtFromTemplate(file, data) {
        const arrayBuffer = await file.arrayBuffer();
        const odtParser = new OdtParserService();
        return odtParser.fillTemplate(arrayBuffer, data);
    }

    normalizeTemplateZip(zip) {
        zip.file(/word\/(document|header\d+|footer\d+|footnotes|endnotes)\.xml/).forEach((entry) => {
            const content = entry.asText()
                .replace(/\[([\s\S]*?\{\{[^}]+\}\}[\s\S]*?)\]/g, '$1')
                .replace(/\{\{\s*([^}]+?)\s*\}\}/g, '{{$1}}');
            zip.file(entry.name, content);
        });
    }

    downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    async downloadPdf({ fileName = 'documento', markup }) {
        if (window.html2pdf) {
            const host = document.createElement('div');
            host.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;background:#fff;z-index:-1;';
            host.innerHTML = this.extractPrintableBody(markup);
            document.body.appendChild(host);

            try {
                await window.html2pdf().set({
                    margin: [0, 0, 0, 0],
                    filename: `${fileName}-preenchido.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['css', 'legacy'] }
                }).from(host).save();
                return { mode: 'download' };
            } finally {
                host.remove();
            }
        }

        this.openPdfWindow(markup);
        return { mode: 'print-fallback' };
    }

    extractPrintableBody(markup) {
        return new DOMParser().parseFromString(markup, 'text/html').body.innerHTML;
    }

    openPdfWindow(markup) {
        const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=820');
        if (!printWindow) {
            throw new Error('Não foi possível abrir a janela de impressão do PDF.');
        }

        printWindow.document.write(markup);
        printWindow.document.close();
        printWindow.focus();
        printWindow.addEventListener('load', () => printWindow.print(), { once: true });
        setTimeout(() => {
            try {
                printWindow.print();
            } catch {
                /* noop */
            }
        }, 350);
    }

    addHeaderToDocx(zip, headerText, data) {
        const interpolatedText = this.interpolateText(headerText, data);
        const lines = interpolatedText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (!lines.length) return;

        const docXml = zip.file('word/document.xml').asText();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXml, 'application/xml');
        const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const body = xmlDoc.getElementsByTagNameNS(ns, 'body')[0];
        if (!body) return;

        lines.forEach(line => {
            const p = xmlDoc.createElementNS(ns, 'p');
            const pPr = xmlDoc.createElementNS(ns, 'pPr');
            const jc = xmlDoc.createElementNS(ns, 'jc');
            jc.setAttributeNS(null, 'val', 'center');
            pPr.appendChild(jc);
            p.appendChild(pPr);
            const r = xmlDoc.createElementNS(ns, 'r');
            const rPr = xmlDoc.createElementNS(ns, 'rPr');
            const b = xmlDoc.createElementNS(ns, 'b');
            rPr.appendChild(b);
            r.appendChild(rPr);
            const t = xmlDoc.createElementNS(ns, 't');
            t.textContent = line;
            r.appendChild(t);
            p.appendChild(r);
            body.insertBefore(p, body.firstChild);
        });

        const serializer = new XMLSerializer();
        zip.file('word/document.xml', serializer.serializeToString(xmlDoc));
    }

    interpolateText(template, data) {
        return String(template).replace(/\[?\{\{\s*([^}\s]+)\s*\}\}\]?/g, (_, key) => {
            const value = data[key];
            return value === undefined || value === null || value === '' ? `{{${key}}}` : value;
        });
    }

    buildPrintableHtml(pagesMarkup) {
        const normalizedMarkup = /document-editor__preview-page|class="page"/.test(pagesMarkup)
            ? pagesMarkup
            : `<section class="page"><div class="page-body">${pagesMarkup}</div></section>`;

        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Documento preenchido</title>
            <style>
                body { margin: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
                .pages { display: flex; flex-direction: column; gap: 0; padding: 0; align-items: center; background: #fff; }
                .page, .document-editor__preview-page { width: 210mm; min-height: 297mm; background: #fff; box-sizing: border-box; padding: 16mm 14mm; box-shadow: none; }
                .page-body, .document-editor__preview-page-body { line-height: 1.65; }
                .page-body h1, .page-body h2, .page-body h3, .document-editor__preview-page-body h1, .document-editor__preview-page-body h2, .document-editor__preview-page-body h3 { color: #0b3d91; }
                .document-editor__fallback-header { display: grid; justify-items: center; gap: 8px; margin-bottom: 18px; text-align: center; }
                .document-editor__fallback-logo { width: 68px; height: auto; }
                .document-editor__fallback-title p { margin: 0; font-weight: 700; text-transform: uppercase; }
                .document-editor__preamble { width: 50%; max-width: 8cm; margin: 12px 0 20px auto; text-align: justify; }
                .document-editor__preamble p { margin: 0; font-weight: 700; }
                .document-editor__document-preamble { width: 50%; margin: 12px 0 20px auto; text-align: justify; text-transform: uppercase; }
                .document-editor__document-preamble p { margin: 0; font-weight: 700; }
                .document-editor__preview-page table, .page table { width: 100%; border-collapse: collapse; margin: 12px 0; }
                .document-editor__preview-page td, .document-editor__preview-page th, .page td, .page th { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
                .document-editor__placeholder--filled { background: transparent; border-bottom: 0; padding: 0; }
                .document-editor__placeholder--empty { background: transparent; border-bottom: 0; padding: 0; }
                @media print {
                    body { background: #fff; }
                    .pages { padding: 0; }
                    .page, .document-editor__preview-page { margin: 0; page-break-after: always; }
                }
            </style>
        </head>
        <body>
            <div class="pages">${normalizedMarkup}</div>
        </body>
        </html>
    `;
    }
}
