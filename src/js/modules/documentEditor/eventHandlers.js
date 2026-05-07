/**
 * modules/documentEditor/eventHandlers.js — Event handlers para DocumentEditorPanel
 * Movidos para reduzir tamanho do painel principal
 * @author Auditoria de Código 2026-04-09
 */

import { applySplitRatio } from './uiHelpers.js';

/**
 * Handle preview edit on double click
 */
export function handlePreviewEdit(panel, event) {
    if (event.target.closest('.document-editor__placeholder')) return;
    const pageBody = event.target.closest('.document-editor__preview-page-body');
    if (!pageBody) return;
    pageBody.contentEditable = pageBody.contentEditable === 'true' ? 'false' : 'true';
    pageBody.classList.toggle('document-editor__paragraph--editing', pageBody.contentEditable === 'true');
}

/**
 * Handle splitter pointer down for resizing
 */
export function handleSplitterPointerDown(panel, event) {
    panel.isResizing = true;
    panel.startX = event.clientX;
    panel.startRatio = panel.splitRatio;

    const refs = panel.getRefs();
    refs.root?.classList.add('document-editor--resizing');
    event.currentTarget.setPointerCapture(event.pointerId);

    const handlePointerMove = (e) => {
        if (!panel.isResizing) return;
        const deltaX = e.clientX - panel.startX;
        const containerWidth = refs.root.offsetWidth;
        // 10% min para editor, 90% max para prévia
        const newRatio = Math.max(0.1, Math.min(0.9, panel.startRatio - deltaX / containerWidth));
        panel.splitRatio = newRatio;
        applySplitRatio(panel, refs);
    };

    const handlePointerUp = () => {
        panel.isResizing = false;
        refs.root?.classList.remove('document-editor--resizing');
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
}

/**
 * Handle drop event
 */
export function handleDrop(panel, event) {
    event.preventDefault();
    event.stopPropagation();
    panel.getRefs().dropzone.classList.remove('is-dragover');
    const files = event.dataTransfer?.files;
    if (files?.length) {
        panel.handleDocumentUpload(files[0]);
    }
}

/**
 * Handle global keydown
 */
export function handleGlobalKeydown(panel, event) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 's':
                event.preventDefault();
                panel.saveSettings();
                break;
            case 'o':
                event.preventDefault();
                panel.getRefs().fileInput.click();
                break;
        }
    }
}