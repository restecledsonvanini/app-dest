import { composePreviewPages } from './services/layoutComposer.js';

export class PreviewUpdater {
    constructor(previewElement, documentParser, options = {}) {
        const resolvedOptions = typeof options === 'number' ? { debounceMs: options } : options;
        this.previewElement = previewElement;
        this.parser = documentParser;
        this.debounceMs = resolvedOptions.debounceMs ?? 180;
        this.getLayoutSettings = resolvedOptions.getLayoutSettings ?? (() => ({}));
        this.currentData = {};
        this.updateTimer = null;
        this.isInitialized = false;
    }

    updateField(fieldName, fieldValue) {
        this.currentData[fieldName] = fieldValue;
        clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => this.render(), this.debounceMs);
    }

    render() {
        const contentElement = this.previewElement.querySelector('.document-editor__preview-content');
        if (!contentElement) {
            console.warn('[PreviewUpdater] Elemento .document-editor__preview-content não encontrado', this.previewElement);
            return;
        }

        try {
            const html = this.parser.render(this.currentData, {
                highlightEmpty: true,
                escapeHtml: true
            });

            if (!html || typeof html !== 'string') {
                console.error('[PreviewUpdater] HTML inválido recebido', html);
                contentElement.innerHTML = '<p style="color: red;">Erro: HTML de prévia inválido</p>';
                return;
            }

            const pagesMarkup = composePreviewPages(html, {
                data: this.currentData,
                settings: this.getLayoutSettings()
            });

            contentElement.innerHTML = `<div class="document-editor__preview-pages">${pagesMarkup}</div>`;
            this.isInitialized = true;
        } catch (error) {
            console.error('[PreviewUpdater] Erro geral no render:', error);
            console.error('[PreviewUpdater] Stack:', error.stack);
            contentElement.innerHTML = `<p style="color: red;">Erro na renderização da prévia: ${error.message}</p>`;
            throw error; // Re-throw para que seja capturado pelo controller
        }
    }

    clear() {
        this.currentData = {};
        this.render();
    }

    getData() {
        return { ...this.currentData };
    }

    isReady() {
        return this.isInitialized;
    }
}
