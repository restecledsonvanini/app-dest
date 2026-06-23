import { OdtParserService } from './OdtParserService.js';
import { FileLoader } from '../utils/FileLoader.js';
import { HtmlNormalizer } from '../utils/HtmlNormalizer.js';

export class TemplateFileService {
    getExtension(fileName = '') {
        return fileName.split('.').pop()?.toLowerCase() || '';
    }

    async parseFile(file, signal) {
        if (!file) {
            throw new Error('Selecione um arquivo .docx para continuar.');
        }

        if (signal?.aborted) {
            throw new Error('Processamento abortado pelo usuário ou timeout.');
        }

        const extension = this.getExtension(file.name);

        if (extension === 'odt') {
            return this.parseOdtFile(file, signal);
        }

        if (extension !== 'docx') {
            throw new Error('Formato não suportado. Use .docx ou .odt.');
        }

        return this.parseDocxFile(file, signal);
    }

    async parseDocxFile(file, signal) {
        const arrayBuffer = await FileLoader.readAsArrayBuffer(file, signal);
        let html = '';

        if (typeof window.mammoth?.convertToHtml === 'function') {
            try {
                const result = await window.mammoth.convertToHtml(
                    { arrayBuffer },
                    this.getMammothOptions()
                );

                html = result?.value?.trim() || '';
                if (result?.messages?.length) {
                    console.warn('[TemplateFileService] Mensagens do Mammoth:', result.messages);
                }

                if (!html) {
                    console.warn('[TemplateFileService] Mammoth retornou HTML vazio, aplicando fallback.');
                }
            } catch (error) {
                console.warn('[TemplateFileService] Falha ao converter DOCX com Mammoth:', error);
            }
        } else {
            console.warn('[TemplateFileService] Mammoth não disponível (window.mammoth ou convertToHtml ausentes). Usando template de fallback.');
        }

        if (!html) {
            html = this.getFallbackTemplate();
        }

        const normalized = HtmlNormalizer.preserveDocxFormatting(html);
        return this.appendHiddenPlaceholderMarkers(normalized, arrayBuffer);
    }

    async parseOdtFile(file, signal) {
        if (signal?.aborted) {
            throw new Error('Processamento abortado pelo usuário ou timeout.');
        }

        const arrayBuffer = await FileLoader.readAsArrayBuffer(file, signal);
        const odtParser = new OdtParserService();
        const html = odtParser.toHtml(arrayBuffer);

        if (!html?.trim()) {
            throw new Error('Não foi possível processar o arquivo ODT.');
        }

        const normalized = HtmlNormalizer.normalizeForPreview(html, 'odt');
        return this.appendHiddenPlaceholderMarkers(normalized, arrayBuffer);
    }

    getFallbackTemplate() {
        return `
            <h1>Modelo de Documento</h1>
            <p>Protocolo: {{protocolo}}</p>
            <p>Nº do Apostilamento: {{apostilamento}}</p>
            <p>Nº GMS: {{gms}}</p>
            <p>Unidade: [{{unidade}}]</p>
            <p>Observações: {{observacoes?}}</p>
        `;
    }

    getMammothOptions() {
        return {
            convertImage: window.mammoth.images.inline(async (element) => {
                const contentType = element.contentType || 'image/png';
                const buffer = await element.read('base64');
                return { src: `data:${contentType};base64,${buffer}` };
            }),
            styleMap: [
                // Headings
                'p[style-name="Heading 1"] => h1:fresh',
                'p[style-name="Heading 2"] => h2:fresh',
                'p[style-name="Heading 3"] => h3:fresh',
                'p[style-name="Title"] => h1:fresh',
                'p[style-name="Subtitle"] => h2:fresh',
                // Text formatting
                'b => strong',
                'i => em',
                'u => u',
                'strike => s',
                // Paragraphs (preserva estilos inline)
                'p[style-name="Normal"] => p:fresh',
                'p => p:fresh',
                // Tables
                'table => table',
                'tbody => tbody',
                'tr => tr',
                'tc => td'
            ],
            includeDefaultStyleMap: true,
            preserveEmptyParagraphs: false
        };
    }

    appendHiddenPlaceholderMarkers(htmlContent, arrayBuffer) {
        if (!htmlContent || typeof htmlContent !== 'string') {
            console.warn('[TemplateFileService] htmlContent inválido em appendHiddenPlaceholderMarkers:', typeof htmlContent);
            return htmlContent || '';
        }

        try {
            const hiddenPlaceholders = this.extractDocxHeaderPlaceholders(arrayBuffer);
            const allPlaceholders = hiddenPlaceholders.map((n) => `{{${n}}}`);

            // Se houver placeholders de header, pré-pendemos marcadores invisíveis
            // no topo do HTML. Isso permite que o layoutComposer encontre os
            // tokens (ex.: termo_extenso) no local esperado para montar o
            // preâmbulo sem alterar o conteúdo visual do documento.
            if (hiddenPlaceholders.length > 0) {
                // Inserir parágrafos ocultos contendo os tokens ({{nome}})
                // no topo do documento. Assim o DocumentParser consegue
                // detectar os placeholders como se estivessem presentes no
                // corpo, sem afetar a renderização visual.
                const markers = allPlaceholders.map((token) => {
                    const nameMatch = token.match(/\{\{\s*([^}]+)\s*\}\}/);
                    const name = nameMatch ? nameMatch[1] : token;
                    return `<p aria-hidden="true" style="display:none;margin:0;padding:0;">{{${name}}}</p>`;
                }).join('');

                return `<div class="document-editor__docx-header-markers" aria-hidden="true" style="display:none">${markers}</div>\n${htmlContent}`;
            }

            return htmlContent;
        } catch (error) {
            console.warn('[TemplateFileService] Erro em appendHiddenPlaceholderMarkers:', error);
            return htmlContent;
        }
    }

    extractDocxHeaderPlaceholders(arrayBuffer) {
        if (!window.PizZip) return [];

        try {
            const zip = new window.PizZip(arrayBuffer);
            const headerMatches = zip.file(/word\/header\d+\.xml$/i);
            const footerMatches = zip.file(/word\/footer\d+\.xml$/i);

            const files = [
                ...(Array.isArray(headerMatches) ? headerMatches : headerMatches ? [headerMatches] : []),
                ...(Array.isArray(footerMatches) ? footerMatches : footerMatches ? [footerMatches] : [])
            ];

            const placeholders = new Set();
            const regex = /\{\{\s*([^}\s]+)\s*\}\}/g;

            files.forEach((entry) => {
                try {
                    const content = entry?.asText?.();
                    if (content) {
                        let match;
                        while ((match = regex.exec(content)) !== null) {
                            placeholders.add(match[1]);
                        }
                    }
                } catch (e) {
                    console.warn('[TemplateFileService] Erro ao processar entrada de header/footer:', e);
                }
            });

            return Array.from(placeholders);
        } catch (error) {
            console.warn('[TemplateFileService] Erro ao extrair placeholders de headers/footers:', error);
            return [];
        }
    }
}
