/**
 * modules/documentEditor/ExportOrchestrator.js — Orquestração de Export
 * Extrai lógica de export de DocumentEditorPanel
 * Simplifica o painel principal, centraliza export
 * @author Auditoria de Código 2026-04-09
 */

import { ExportService } from './services/ExportService.js';
import { AppError, ERROR_TYPE, logError } from '../../services/ErrorHandler.js';
import { MSG } from '../../config/messages.js';

/**
 * Orquestra export de documentos: Word, PDF
 * Responsável por:
 * - Decidir qual formato exportar
 * - Tratar sucesso/erro
 * - Feedback ao usuário
 */
export class ExportOrchestrator {
    constructor(options = {}) {
        this.exportService = options.exportService || new ExportService();
        this.onExportComplete = options.onExportComplete || null;
        this.onExportError = options.onExportError || null;
    }

    /**
     * Exporta como Word (DOCX)
     */
    async exportAsWord(options) {
        const { fileName, markup, originalFile, data = {}, settings = {} } = options;

        try {
            const result = await this.exportService.downloadWord({
                fileName,
                markup,
                originalFile,
                data,
                settings
            });

            this._emitComplete(MSG.export.wordDownloaded);
            return result;
        } catch (error) {
            this._emitError(error);
            throw error;
        }
    }

    /**
     * Constrói markup para export
     */
    buildExportMarkup(parser, previewUpdater, exportService) {
        const pagesMarkup = previewUpdater?.render?.() || parser.render(previewUpdater?.getData() || {}, { highlightEmpty: true, escapeHtml: true });
        return exportService.buildPrintableHtml(pagesMarkup);
    }
    async exportAsPdf(options) {
        const { fileName, markup } = options;

        try {
            const result = await this.exportService.downloadPdf({ fileName, markup });

            const message = result.mode === 'download'
                ? MSG.export.pdfError
                : MSG.export.printFallback;

            this._emitComplete(message);
            return result;
        } catch (error) {
            if (error.message.includes('popup')) {
                this._emitError(new AppError(ERROR_TYPE.FILE, MSG.export.windowBlocked));
            } else {
                this._emitError(error);
            }
            throw error;
        }
    }

    /**
     * Constrói markup exportável
     */
    buildExportMarkup(previewPages, parser, data) {
        if (!previewPages && parser) {
            return parser.render(data, {
                highlightEmpty: false,
                escapeHtml: true
            });
        }
        return previewPages;
    }

    _emitComplete(message) {
        if (this.onExportComplete) {
            this.onExportComplete(message);
        }
    }

    _emitError(error) {
        const appError = error instanceof AppError ? error : new AppError(ERROR_TYPE.FILE, error.message);
        if (this.onExportError) {
            this.onExportError(appError);
        }
        logError(appError, { source: 'ExportOrchestrator' });
    }
}
