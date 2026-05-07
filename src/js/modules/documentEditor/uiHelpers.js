/**
 * modules/documentEditor/uiHelpers.js — Helpers de UI para DocumentEditorPanel
 * Movidos para reduzir tamanho do painel principal
 * @author Auditoria de Código 2026-04-09
 */

/**
 * Toggle preview panel
 */
export function togglePreview(panel, refs, force) {
    if (!panel.parser) return;
    const { root, previewDrawer } = refs;
    if (!root || !previewDrawer) {
        console.warn('[uiHelpers.togglePreview] Elementos críticos ausentes:', { root: !!root, previewDrawer: !!previewDrawer });
        return;
    }
    panel.isPreviewOpen = typeof force === 'boolean' ? force : !panel.isPreviewOpen;
    root.classList.toggle('document-editor--preview-open', panel.isPreviewOpen);
    previewDrawer.classList.toggle('document-editor__sidepanel--hidden', !panel.isPreviewOpen);
    previewDrawer.setAttribute('aria-hidden', String(!panel.isPreviewOpen));
    if (panel.isPreviewOpen) {
        applySplitRatio(panel, refs);
        refs.previewSplitter?.removeAttribute('hidden');
    } else {
        root.style.removeProperty('--preview-panel-width');
    }
}

/**
 * Toggle expanded state
 */
export function toggleExpanded(panel, refs, force) {
    const { root } = refs;
    if (!root) {
        console.warn('[uiHelpers.toggleExpanded] root element não encontrado');
        return;
    }
    panel.isExpanded = typeof force === 'boolean' ? force : !panel.isExpanded;
    root.classList.toggle('document-editor--expanded', panel.isExpanded);
    document.documentElement.style.overflow = panel.isExpanded ? 'hidden' : '';
}

/**
 * Apply split ratio
 */
export function applySplitRatio(panel, refs) {
    const { root } = refs;
    if (!root) {
        console.warn('[uiHelpers.applySplitRatio] root element não encontrado');
        return;
    }
    // A unidade % é obrigatória para que flex/width usem a var corretamente
    root.style.setProperty('--preview-panel-width', `${(panel.splitRatio * 100).toFixed(1)}%`);
}

/**
 * Set zoom level
 */
export function setZoom(panel, refs, value) {
    panel.zoom = Math.max(25, Math.min(200, value));
    if (!refs.zoomValue) {
        console.warn('[uiHelpers.setZoom] zoomValue element não encontrado');
    } else {
        refs.zoomValue.textContent = `${panel.zoom}%`;
    }
    if (!refs.previewContainer) {
        console.warn('[uiHelpers.setZoom] previewContainer element não encontrado');
    } else {
        refs.previewContainer.style.setProperty('--zoom-factor', panel.zoom / 100);
    }
}