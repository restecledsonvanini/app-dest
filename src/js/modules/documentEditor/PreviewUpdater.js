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
        if (!contentElement) return;

        const html = this.parser.render(this.currentData, {
            highlightEmpty: true,
            escapeHtml: true
        });

        const pagesMarkup = composePreviewPages(html, {
            data: this.currentData,
            settings: this.getLayoutSettings()
        });

        contentElement.innerHTML = `<div class="document-editor__preview-pages">${pagesMarkup}</div>`;
        this.isInitialized = true;
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
