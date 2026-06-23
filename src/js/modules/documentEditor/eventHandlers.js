/**
 * modules/documentEditor/eventHandlers.js — Event handlers para DocumentEditorPanel
 * Movidos para reduzir tamanho do painel principal
 * @author Auditoria de Código 2026-04-09
 */

import { applySplitRatio } from './uiHelpers.js';
import { updateActionState, saveSettings } from './settingsHelpers.js';

export function handlePreviewEdit(panel, event) {
    if (event.target.closest('.document-editor__placeholder')) return;
    const pageBody = event.target.closest('.document-editor__preview-page-body');
    if (!pageBody) return;
    pageBody.contentEditable = pageBody.contentEditable === 'true' ? 'false' : 'true';
    pageBody.classList.toggle('document-editor__paragraph--editing', pageBody.contentEditable === 'true');
}

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

export async function handleDocumentUpload(panel, file) {
    const refs = panel.getRefs();
    if (!file) return;
    try {
        panel.currentFile = file;
        if(refs.pickFileBtn) refs.pickFileBtn.disabled = true;
        if(refs.dropzone) refs.dropzone.classList.add('is-disabled');
        await panel.controller.handleFileUpload(file);
    } catch (error) {
        if(refs.pickFileBtn) refs.pickFileBtn.disabled = false;
    } finally {
        if(refs.dropzone) refs.dropzone.classList.remove('is-disabled');
        if(refs.fileInput) refs.fileInput.value = '';
        updateActionState(panel, refs);
    }
}

export function clearUploadedFile(panel) {
    const refs = panel.getRefs();
    panel.currentFile = null;
    panel.parser = null;
    if (panel.previewUpdater) {
        try { panel.previewUpdater.clear(); } catch { }
    }
    const previewContent = refs.previewContainer?.querySelector('.document-editor__preview-content');
    if (previewContent) previewContent.innerHTML = 'Abra a pré-visualização para revisar o documento.';
    if (refs.statusBox) refs.statusBox.textContent = 'Nenhum documento carregado.';
    if (refs.dynamicForm) refs.dynamicForm.innerHTML = '';
    if (refs.pickFileBtn) refs.pickFileBtn.disabled = false;
    if (refs.dropzone) refs.dropzone.classList.remove('has-file');
    try { panel.settingsStore?.saveAll?.(panel.settingsStore.getAll()); } catch { }
    updateActionState(panel, refs);
}

export function handleDrop(panel, event) {
    event.preventDefault();
    event.stopPropagation();
    panel.getRefs().dropzone?.classList.remove('is-dragover');
    const files = event.dataTransfer?.files;
    if (files?.length) {
        handleDocumentUpload(panel, files[0]);
    }
}

export function handleGlobalKeydown(panel, event) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 's':
                event.preventDefault();
                saveSettings(panel);
                break;
            case 'o':
                event.preventDefault();
                panel.getRefs().fileInput?.click();
                break;
        }
    }
}