/**
 * components/index.js — Registro central de Custom Elements.
 * Chamar registerComponents() uma vez em main.js antes do DOMContentLoaded.
 */
import { SheetCard } from './SheetCard.js';
import { FolderCard } from './FolderCard.js';
import { ToolResult } from './ToolResult.js';
import { ToolPanel } from './ToolPanel.js';
// import { DocumentEditorPanel } from '../documentEditor/DocumentEditorPanel.js';

export function registerComponents() {
    if (!customElements.get('sheet-card')) {
        customElements.define('sheet-card', SheetCard);
    }
    if (!customElements.get('folder-card')) {
        customElements.define('folder-card', FolderCard);
    }
    if (!customElements.get('tool-result')) {
        customElements.define('tool-result', ToolResult);
    }
    if (!customElements.get('tool-panel')) {
        customElements.define('tool-panel', ToolPanel);
    }
    // Desativado temporariamente: impede acesso ao editor via DOM injection
    // if (!customElements.get('document-editor-panel')) {
    //     customElements.define('document-editor-panel', DocumentEditorPanel);
    // }
}
