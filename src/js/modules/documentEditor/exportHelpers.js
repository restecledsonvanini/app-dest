/**
 * modules/documentEditor/exportHelpers.js — Helpers de export para DocumentEditorPanel
 * Movidos para reduzir tamanho do painel principal
 * @author Auditoria de Código 2026-04-09
 */

/**
 * Download document as Word
 */
export async function downloadAsWord(panel) {
    const fileName = (panel.currentFile?.name || 'documento').replace(/\.[^.]+$/u, '');
    await panel.exporter.exportAsWord({
        fileName,
        markup: buildExportMarkup(panel),
        originalFile: panel.currentFile,
        data: panel.previewUpdater?.getData() || {},
        settings: panel.settingsStore.getAll()
    });
}

/**
 * Download document as PDF
 */
export async function downloadAsPdf(panel) {
    const fileName = (panel.currentFile?.name || 'documento').replace(/\.[^.]+$/u, '');
    await panel.exporter.exportAsPdf({
        fileName,
        markup: buildExportMarkup(panel)
    });
}

/**
 * Build export markup
 */
export function buildExportMarkup(panel) {
    return panel.exporter.buildExportMarkup(panel.parser, panel.previewUpdater, panel.exportService);
}