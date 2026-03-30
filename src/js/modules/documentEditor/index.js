export { DocumentEditorPanel } from './DocumentEditorPanel.js';
export { DocumentParser } from './DocumentParser.js';
export { PreviewUpdater } from './PreviewUpdater.js';
export { TemplateFileService } from './services/TemplateFileService.js';
export { ExportService } from './services/ExportService.js';
export { SettingsStore } from './services/SettingsStore.js';

export const DOCUMENT_EDITOR_VERSION = '1.2.0-beta';

export function initDocumentEditor(container) {
    if (!container) throw new Error('Container element is required');
    container.querySelector('document-editor-panel')?.remove();
    const panel = document.createElement('document-editor-panel');
    container.appendChild(panel);
    return panel;
}
