export class TemplateFileService {
    getExtension(fileName = '') {
        return fileName.split('.').pop()?.toLowerCase() || '';
    }

    async parseFile(file) {
        const extension = this.getExtension(file?.name);

        if (!file) {
            throw new Error('Selecione um arquivo .docx para continuar.');
        }

        if (extension === 'odt') {
            throw new Error('Suporte a .odt ainda está em avaliação. Para melhor fidelidade, use .docx.');
        }

        if (extension !== 'docx') {
            throw new Error('Formato não suportado. Use preferencialmente .docx.');
        }

        if (window.mammoth?.convertToHtml) {
            const result = await window.mammoth.convertToHtml({
                arrayBuffer: await file.arrayBuffer()
            });

            return this.normalizeHtml(result.value);
        }

        return this.getFallbackTemplate();
    }

    normalizeHtml(htmlContent = '') {
        return htmlContent
            .replace(/<p[^>]*style="[^"]*page-break-before\s*:\s*always;?[^"]*"[^>]*>\s*<\/p>/gi, '<!-- PAGE_BREAK -->')
            .replace(/<p[^>]*>\s*<\/p>/gi, '<p>&nbsp;</p>')
            .trim();
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
}
