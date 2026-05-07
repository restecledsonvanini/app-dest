/**
 * modules/documentEditor/DocumentEditorWithDiagnostics.js — Integração de diagnósticos
 * Versão melhorada do DocumentEditorController com validação e tratamento de erros
 * @author 2026-04-17
 */

import { EnhancedDocumentParser } from './EnhancedDocumentParser.js';
import { TemplateValidator } from '../../services/TemplateValidator.js';
import { UploadValidator } from '../../services/UploadValidator.js';
import { DiagnosticsService, DIAGNOSTIC_TYPE, DIAGNOSTIC_LEVEL } from '../../services/DiagnosticsService.js';
import { DiagnosticsUI } from './ui/DiagnosticsUI.js';
import { CONSTANTS } from '../../config/constants.js';

/**
 * Controlador melhorado com diagnósticos integrados
 */
export class DocumentEditorWithDiagnostics {
    constructor(options = {}) {
        this.diagnostics = options.diagnostics || new DiagnosticsService();
        this.uploadValidator = new UploadValidator(this.diagnostics);
        this.templateValidator = new TemplateValidator(this.diagnostics);
        this.diagnosticsUI = null;

        // Configurações
        this.maxFileSize = options.maxFileSize || CONSTANTS.sizes.maxFileSize;
        this.parseTimeout = options.parseTimeout || CONSTANTS.timeouts.parseDocument;

        // State
        this.currentFile = null;
        this.currentParser = null;
        this.currentData = {};

        // Listeners
        this.listeners = {
            onDocumentLoaded: null,
            onDocumentError: null,
            onValidationComplete: null,
            onDiagnosticsUpdated: null,
        };
    }

    /**
     * Inicializar UI de diagnósticos
     */
    initDiagnosticsUI(containerElement) {
        if (!containerElement) {
            console.warn('[DocumentEditorWithDiagnostics] Container para UI não fornecido');
            return;
        }
        this.diagnosticsUI = new DiagnosticsUI(containerElement, this.diagnostics);
    }

    /**
     * Processar upload com validação completa
     */
    async handleFileUpload(file) {
        // Limpar diagnósticos anteriores
        this.diagnostics.clear();

        if (!file) {
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                'Nenhum arquivo foi selecionado',
                { suggestion: 'Selecione um arquivo válido (DOCX, ODT, HTML)' }
            );
            this._emit('onDocumentError', { error: 'No file selected' });
            return;
        }

        try {
            // 1. Validar arquivo
            console.log('[DocumentEditorWithDiagnostics] Validando arquivo...');
            const uploadValidation = await this.uploadValidator.validateFile(file);

            if (!uploadValidation.isValid) {
                this._emit('onDocumentError', {
                    error: 'Upload validation failed',
                    details: uploadValidation
                });
                return;
            }

            this.currentFile = file;
            console.log('[DocumentEditorWithDiagnostics] Arquivo válido, começando parsing...');

            // 2. Ler conteúdo do arquivo
            const content = await this._readFileContent(file, uploadValidation.format);

            // 3. Validar template (detectar placeholders malformados)
            console.log('[DocumentEditorWithDiagnostics] Validando template...');
            const templateValidation = this.templateValidator.validateTemplate(content);

            // 4. Criar parser com diagnósticos
            console.log('[DocumentEditorWithDiagnostics] Criando parser...');
            this.currentParser = new EnhancedDocumentParser(content, this.diagnostics);

            // 5. Registrar resultados
            const report = this.currentParser.getErrorReport();
            console.log('[DocumentEditorWithDiagnostics] Relatório de erros:', report);

            if (this.currentParser.hasErrors()) {
                this.diagnostics.addWarning(
                    DIAGNOSTIC_TYPE.TEMPLATE_PARSE_ERROR,
                    `Template contém ${report.total} placeholder(s) malformado(s)`,
                    { suggestion: 'Revise os campos indicados em vermelho' }
                );
            }

            // 6. Emitir evento de sucesso
            this._emit('onDocumentLoaded', {
                file,
                parser: this.currentParser,
                validation: {
                    upload: uploadValidation,
                    template: templateValidation,
                    report
                }
            });

            this._emit('onValidationComplete', this.diagnostics.getSummary());

        } catch (error) {
            console.error('[DocumentEditorWithDiagnostics] Erro durante upload:', error);
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.TEMPLATE_PARSE_ERROR,
                `Erro ao processar arquivo: ${error.message}`,
                { suggestion: 'Tente novamente com outro arquivo' }
            );
            this._emit('onDocumentError', { error: error.message, stack: error.stack });
        }
    }

    /**
     * Ler conteúdo do arquivo
     */
    async _readFileContent(file, format) {
        if (format === 'html' || format === 'htm') {
            return await file.text();
        }

        if (format === 'docx' || format === 'odt') {
            // Para arquivos compactados, precisamos extrair o XML
            if (!window.PizZip) {
                throw new Error('Biblioteca PizZip não carregada. Necessária para DOCX/ODT');
            }

            const arrayBuffer = await file.arrayBuffer();
            const zip = new window.PizZip(arrayBuffer);

            let content = '';
            if (format === 'docx') {
                const doc = zip.file('word/document.xml');
                if (!doc) throw new Error('word/document.xml não encontrado no DOCX');
                content = doc.asText();
            } else if (format === 'odt') {
                const doc = zip.file('content.xml');
                if (!doc) throw new Error('content.xml não encontrado no ODT');
                content = doc.asText();
            }

            // Converter XML para HTML aproximado
            return this._convertXmlToHtml(content, format);
        }

        return await file.text();
    }

    /**
     * Converter XML de DOCX/ODT para HTML para análise
     */
    _convertXmlToHtml(xml, format) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, 'application/xml');

            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                throw new Error('XML malformado');
            }

            // Extrair placeholders do XML
            let text = xml;

            // Remove namespaces e tags desnecessárias
            text = text.replace(/<[^>]*>/g, (match) => {
                if (match.includes('{{') || match.includes('}}')) {
                    return match; // Preservar se contiver placeholder
                }
                return '';
            });

            return text;
        } catch (error) {
            console.error('[DocumentEditorWithDiagnostics] Erro ao converter XML:', error);
            throw new Error(`Erro ao processar arquivo ${format}: ${error.message}`);
        }
    }

    /**
     * Validar dados antes de exportar
     */
    validateDataForExport(data) {
        if (!this.currentParser) {
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.TEMPLATE_PARSE_ERROR,
                'Nenhum template carregado',
                { suggestion: 'Carregue um arquivo primeiro' }
            );
            return false;
        }

        const placeholders = this.currentParser.getPlaceholders();
        const validation = this.templateValidator.validateData(data, placeholders);

        if (validation.missingRequired.length > 0) {
            this.diagnostics.addWarning(
                DIAGNOSTIC_TYPE.MISSING_REQUIRED_FIELD,
                `${validation.missingRequired.length} campo(s) obrigatório(s) não preenchido(s): ${validation.missingRequired.join(', ')}`,
                { suggestion: 'Preencha todos os campos obrigatórios antes de exportar' }
            );
            return false;
        }

        if (this.currentParser.hasErrors()) {
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.TEMPLATE_RENDER_ERROR,
                'Não é possível exportar: template contém placeholders malformados',
                { suggestion: 'Corrija os placeholders indicados em vermelho' }
            );
            return false;
        }

        return true;
    }

    /**
     * Renderizar prévia com diagnósticos
     */
    render(data, options = {}) {
        if (!this.currentParser) {
            throw new Error('Nenhum parser disponível');
        }

        this.currentData = data;

        try {
            return this.currentParser.render(data, {
                highlightEmpty: true,
                escapeHtml: true,
                highlightMalformed: true,
                ...options
            });
        } catch (error) {
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.TEMPLATE_RENDER_ERROR,
                `Erro ao renderizar template: ${error.message}`,
                { suggestion: 'Verifique o template e os dados fornecidos' }
            );
            throw error;
        }
    }

    /**
     * Exportar relatório de diagnósticos
     */
    exportDiagnosticsReport(format = 'html') {
        if (this.diagnosticsUI) {
            this.diagnosticsUI.exportReport(format);
        } else {
            const report = this.diagnostics.generateReport(format);
            console.log('Relatório de Diagnósticos:', report);
        }
    }

    /**
     * Obter resumo de diagnósticos
     */
    getDiagnosticsSummary() {
        return this.diagnostics.getSummary();
    }

    /**
     * Obter todos os diagnósticos
     */
    getDiagnostics() {
        return this.diagnostics.diagnostics;
    }

    /**
     * Emitir evento
     */
    _emit(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName](data);
        }
    }

    /**
     * Registrar listener
     */
    on(eventName, callback) {
        if (eventName in this.listeners) {
            this.listeners[eventName] = callback;
        }
    }

    /**
     * Limpar e resetar
     */
    reset() {
        this.diagnostics.clear();
        this.currentFile = null;
        this.currentParser = null;
        this.currentData = {};

        if (this.diagnosticsUI) {
            this.diagnosticsUI.clear();
            this.diagnosticsUI.hide();
        }
    }
}
