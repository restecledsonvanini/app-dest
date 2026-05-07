/**
 * modules/documentEditor/DocumentEditorController.js — Orquestração separada
 * Extrai lógica de upload e parsing de DocumentEditorPanel
 * FASE 1 de refatoração para reduzir 329 → 80 linhas
 * @author Auditoria de Código 2026-04-09
 */

import { DocumentParser } from './DocumentParser.js';
import { TemplateFileService } from './services/TemplateFileService.js';
import { AppError, ERROR_TYPE, logError } from '../../services/ErrorHandler.js';
import { CONSTANTS } from '../../config/constants.js';
import { MSG } from '../../config/messages.js';

/**
 * Responsabilidades:
 * - File upload
 * - Parsing com TemplateFileService
 * - Emissão de eventos
 * 
 * NÃO faz:
 * - Renderização (UI)
 * - Export (ExportService)
 * - Settings (SettingsStore)
 */
export class DocumentEditorController {
    constructor(options = {}) {
        this.fileService = options.fileService || new TemplateFileService();
        this.maxFileSize = options.maxFileSize || CONSTANTS.sizes.maxFileSize;
        this.parseTimeout = options.parseTimeout || CONSTANTS.timeouts.parseDocument;

        // Listeners
        this.listeners = {
            onDocumentLoaded: null,
            onDocumentError: null,
            onParsingStart: null,
        };
    }

    /**
     * Processa upload de arquivo
     * @throws {AppError} se arquivo inválido ou muito grande
     */
    async handleFileUpload(file) {
        if (!file) {
            throw new AppError(ERROR_TYPE.FILE, MSG.document.parseError);
        }

        if (file.size > this.maxFileSize) {
            throw new AppError(ERROR_TYPE.FILE, MSG.document.tooBig, { size: file.size });
        }

        this.emit('onParsingStart', file);

        try {
            const controller = new AbortController();
            let timeoutHandle;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    controller.abort();
                    reject(new AppError(
                        ERROR_TYPE.TIMEOUT,
                        MSG.document.parseTimeout,
                        { operation: 'parseFile', ms: this.parseTimeout }
                    ));
                }, this.parseTimeout);
            });

            const parser = await Promise.race([
                this._parseFileWithTimeout(file, controller),
                timeoutPromise,
            ]);
            clearTimeout(timeoutHandle);

            this.emit('onDocumentLoaded', { file, parser });
            return parser;
        } catch (error) {
            const appError = error instanceof AppError
                ? error
                : new AppError(ERROR_TYPE.PARSE, MSG.document.parseError, { originalError: error });

            logError(appError, { source: 'DocumentEditorController' });
            this.emit('onDocumentError', appError);
            throw appError;
        }
    }

    /**
     * Faz parse com timeout
     * @private
     */
    async _parseFileWithTimeout(file, controller) {
        if (controller.signal.aborted) {
            throw new AppError(ERROR_TYPE.TIMEOUT, MSG.document.parseTimeout);
        }

        let html;
        try {
            console.log('[DocumentEditorController] Chamando fileService.parseFile...');
            html = await this.fileService.parseFile(file, controller.signal);
            console.log(`[DocumentEditorController] parseFile retornou: tipo=${typeof html}, length=${html?.length || 0}`);
        } catch (error) {
            console.error('[DocumentEditorController] Erro em fileService.parseFile:', error);
            console.error('[DocumentEditorController] Stack:', error.stack);
            throw error;
        }

        if (!html || typeof html !== 'string') {
            console.error('[DocumentEditorController] parseFile retornou valor inválido:', html);
            throw new AppError(ERROR_TYPE.PARSE, MSG.document.parseError);
        }

        let parser;
        try {
            console.log('[DocumentEditorController] Criando DocumentParser...');
            parser = new DocumentParser(html);
            console.log(`[DocumentEditorController] DocumentParser criado com sucesso: ${parser.placeholders?.length || 0} placeholders`);
        } catch (error) {
            console.error('[DocumentEditorController] Erro ao criar DocumentParser:', error);
            console.error('[DocumentEditorController] Stack:', error.stack);
            console.error('[DocumentEditorController] HTML que causou erro (primeiros 500 chars):', html?.substring(0, 500));
            throw new AppError(ERROR_TYPE.PARSE, 'Erro ao processar placeholders do documento.', { originalError: error });
        }

        return parser;
    }

    /**
     * Sistema de eventos simples (pode ser upgradado para EventEmitter)
     */
    on(eventName, callback) {
        if (this.listeners.hasOwnProperty('on' + eventName.charAt(0).toUpperCase() + eventName.slice(1))) {
            this.listeners['on' + eventName.charAt(0).toUpperCase() + eventName.slice(1)] = callback;
        }
    }

    emit(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName](data);
        }
    }
}
