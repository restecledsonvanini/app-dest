/**
 * modules/documentEditor/DocumentEditorPanelWithDiagnostics.js
 * Exemplo de integração do sistema de erros com DocumentEditorPanel existente
 * 
 * Este é um exemplo de como integrar:
 * - Validação de upload
 * - Detecção de erros
 * - UI de diagnósticos
 * 
 * Com o código existente de DocumentEditorPanel
 * @author 2026-04-17
 */

import { DocumentEditorWithDiagnostics } from './DocumentEditorWithDiagnostics.js';
import { DiagnosticsUI } from './ui/DiagnosticsUI.js';
import { MSG } from '../../config/messages.js';
import { AppError, ERROR_TYPE } from '../../services/ErrorHandler.js';
import { CONSTANTS } from '../../config/constants.js';

/**
 * Extensão de DocumentEditorPanel com diagnósticos
 * 
 * USO:
 * ----
 * const panel = new DocumentEditorPanelWithDiagnostics({
 *   panelElement: document.getElementById('editor-panel'),
 *   previewElement: document.getElementById('preview'),
 *   settingsStore: settingsStore
 * });
 * 
 * panel.initDiagnostics();
 * 
 * // No handler de upload:
 * fileInput.addEventListener('change', async (e) => {
 *   await panel.handleFileUploadWithDiagnostics(e.target.files[0]);
 * });
 */
export class DocumentEditorPanelWithDiagnostics {
    constructor(options = {}) {
        // Elementos DOM
        this.panelElement = options.panelElement;
        this.previewElement = options.previewElement;
        this.settingsStore = options.settingsStore;

        // Editor com diagnósticos
        this.editor = new DocumentEditorWithDiagnostics({
            maxFileSize: options.maxFileSize || CONSTANTS.sizes.maxFileSize,
            parseTimeout: options.parseTimeout || CONSTANTS.timeouts.parseDocument
        });

        // UI de diagnósticos
        this.diagnosticsUI = null;

        // Elementos de formulário
        this.formInputs = new Map();
        this.fileInput = null;

        // Listeners
        this.listeners = {
            onDocumentReady: null,
            onDocumenterError: null,
            onDiagnosticsUpdated: null,
        };

        this._init();
    }

    /**
     * Inicializar
     */
    _init() {
        this._findFormElements();
        this._attachFormListeners();
    }

    /**
     * Encontrar elementos de formulário
     */
    _findFormElements() {
        // Procurar por input type="file" no painel
        this.fileInput = this.panelElement?.querySelector('input[type="file"]');

        // Procurar por inputs de dados (tipo texto, etc)
        this.formInputs.clear();
        this.panelElement?.querySelectorAll('input[data-field], textarea[data-field]').forEach(input => {
            const fieldName = input.dataset.field;
            if (fieldName) {
                this.formInputs.set(fieldName, input);
            }
        });
    }

    /**
     * Atrelar listeners do formulário
     */
    _attachFormListeners() {
        // Upload
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                this.handleFileUploadWithDiagnostics(e.target.files[0]);
            });
        }

        // Campos de dados - atualizar prévia
        this.formInputs.forEach((input) => {
            input.addEventListener('input', () => this._updatePreviewWithDiagnostics());
            input.addEventListener('change', () => this._validateField(input));
        });
    }

    /**
     * Inicializar UI de diagnósticos
     */
    initDiagnostics() {
        this.diagnosticsUI = new DiagnosticsUI(document.body, this.editor.diagnostics);

        // Listeners
        this.editor.on('onDocumentLoaded', (data) => {
            this._onDocumentLoaded(data);
        });

        this.editor.on('onDocumentError', (error) => {
            this._onDocumentError(error);
        });

        this.editor.on('onValidationComplete', (summary) => {
            this._onValidationComplete(summary);
        });
    }

    /**
     * Processar upload com validação
     */
    async handleFileUploadWithDiagnostics(file) {
        if (!file) return;

        try {
            // Mostrar status
            this._showStatus(`Validando arquivo "${file.name}"...`, 'info');

            // Processar com validações
            await this.editor.handleFileUpload(file);

            // Sucesso
            const diagnosticsSummary = this.editor.getDiagnosticsSummary();
            if (diagnosticsSummary.errors === 0) {
                this._showStatus(
                    `✅ Template carregado com sucesso! ${this.editor.currentParser.getPlaceholders().length} campos encontrados.`,
                    'success'
                );
            } else {
                this._showStatus(
                    `⚠️ Template carregado com avisos: ${diagnosticsSummary.errors} erro(s), ${diagnosticsSummary.warnings} aviso(s)`,
                    'warning'
                );
            }

            // Atualizar prévia
            this._updatePreviewWithDiagnostics();

        } catch (error) {
            this._showStatus(`❌ Erro: ${error.message}`, 'error');
            console.error('[DocumentEditorPanelWithDiagnostics] Erro no upload:', error);
        }
    }

    /**
     * Atualizar prévia com diagnósticos
     */
    _updatePreviewWithDiagnostics() {
        if (!this.editor.currentParser) return;

        try {
            // Coletar dados do formulário
            const data = {};
            this.formInputs.forEach((input, fieldName) => {
                data[fieldName] = input.value;
            });

            // Renderizar com diagnósticos
            const html = this.editor.render(data);
            this.previewElement.innerHTML = html;

            // Salvar dados (se configurado)
            if (this.settingsStore) {
                this.settingsStore.saveData(data);
            }

        } catch (error) {
            console.error('[DocumentEditorPanelWithDiagnostics] Erro ao atualizar prévia:', error);
        }
    }

    /**
     * Validar campo individual
     */
    _validateField(input) {
        const fieldName = input.dataset.field;
        if (!fieldName) return;

        // Verificar se é campo obrigatório
        const placeholders = this.editor.currentParser?.getPlaceholders() || [];
        const placeholder = placeholders.find(p => p.name === fieldName);

        if (placeholder && placeholder.required && !input.value.trim()) {
            input.classList.add('field-with-diagnostic-warning');
            this.diagnosticsUI?.highlightFieldError(fieldName, 'warning');
        } else {
            input.classList.remove('field-with-diagnostic-warning', 'field-with-diagnostic-error');
            this.diagnosticsUI?.removeFieldHighlight(fieldName);
        }
    }

    /**
     * Validar antes de exportar
     */
    async validateBeforeExport() {
        const data = {};
        this.formInputs.forEach((input, fieldName) => {
            data[fieldName] = input.value;
        });

        return this.editor.validateDataForExport(data);
    }

    /**
     * Exportar documento
     */
    async exportDocument(format = 'docx') {
        if (!await this.validateBeforeExport()) {
            this._showStatus('Corrija os erros antes de exportar', 'error');
            this.diagnosticsUI?.show();
            return false;
        }

        try {
            this._showStatus('Exportando...', 'info');

            const data = {};
            this.formInputs.forEach((input, fieldName) => {
                data[fieldName] = input.value;
            });

            // Aqui integrar com ExportService
            // const result = await exportService.download({
            //   fileName: 'documento',
            //   markup: this.editor.render(data),
            //   originalFile: this.editor.currentFile,
            //   data: data
            // });

            this._showStatus('✅ Documento exportado com sucesso!', 'success');
            return true;

        } catch (error) {
            this._showStatus(`Erro ao exportar: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Mostrar status
     */
    _showStatus(message, type = 'info') {
        // Procurar por elemento de status no painel
        let statusEl = this.panelElement?.querySelector('[role="status"]');

        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.setAttribute('role', 'status');
            statusEl.style.cssText = `
                padding: 12px 16px;
                border-radius: 4px;
                margin-bottom: 15px;
                font-size: 14px;
                border-left: 4px solid;
            `;
            this.panelElement?.insertBefore(statusEl, this.panelElement.firstChild);
        }

        const colors = {
            success: { bg: '#e8f5e9', border: '#2e7d32', text: '#2e7d32' },
            error: { bg: '#ffebee', border: '#d32f2f', text: '#d32f2f' },
            warning: { bg: '#fff3e0', border: '#f57c00', text: '#f57c00' },
            info: { bg: '#e3f2fd', border: '#1976d2', text: '#1976d2' }
        };

        const color = colors[type] || colors.info;
        statusEl.style.backgroundColor = color.bg;
        statusEl.style.borderColor = color.border;
        statusEl.style.color = color.text;
        statusEl.textContent = message;

        // Auto-desaparecer após 4 segundos
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 4000);
    }

    /**
     * Callbacks dos listeners
     */
    _onDocumentLoaded(data) {
        console.log('[DocumentEditorPanelWithDiagnostics] Documento carregado:', data);
        if (this.listeners.onDocumentReady) {
            this.listeners.onDocumentReady(data);
        }
    }

    _onDocumentError(error) {
        console.error('[DocumentEditorPanelWithDiagnostics] Erro no documento:', error);
        if (this.listeners.onDocumenterError) {
            this.listeners.onDocumenterError(error);
        }
    }

    _onValidationComplete(summary) {
        console.log('[DocumentEditorPanelWithDiagnostics] Validação concluída:', summary);
        if (this.listeners.onDiagnosticsUpdated) {
            this.listeners.onDiagnosticsUpdated(summary);
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
     * Obter diagnósticos
     */
    getDiagnostics() {
        return this.editor.getDiagnostics();
    }

    /**
     * Exportar relatório de diagnósticos
     */
    exportDiagnosticsReport(format = 'html') {
        this.editor.exportDiagnosticsReport(format);
    }

    /**
     * Limpar
     */
    reset() {
        this.editor.reset();
        this.formInputs.forEach(input => {
            input.value = '';
            input.classList.remove('field-with-diagnostic-error', 'field-with-diagnostic-warning');
        });
        if (this.previewElement) {
            this.previewElement.innerHTML = '';
        }
        if (this.fileInput) {
            this.fileInput.value = '';
        }
    }
}

/**
 * EXEMPLO DE USO NO HTML:
 * 
 * <div id="editor-panel">
 *   <input type="file" accept=".docx,.odt,.html" />
 *   
 *   <form>
 *     <input type="text" data-field="tipo_termo" placeholder="Tipo do Termo" />
 *     <input type="text" data-field="num_termo" placeholder="Número" />
 *     <input type="date" data-field="data_inicio" />
 *     <textarea data-field="observacoes"></textarea>
 *     
 *     <button type="button" id="export-btn">Exportar</button>
 *   </form>
 * </div>
 * 
 * <div id="preview"></div>
 * 
 * JAVASCRIPT:
 * 
 * import { DocumentEditorPanelWithDiagnostics } from './DocumentEditorPanelWithDiagnostics.js';
 * 
 * const panel = new DocumentEditorPanelWithDiagnostics({
 *   panelElement: document.getElementById('editor-panel'),
 *   previewElement: document.getElementById('preview')
 * });
 * 
 * // Inicializar diagnósticos
 * panel.initDiagnostics();
 * 
 * // Listeners
 * panel.on('onDocumentReady', (data) => {
 *   console.log('Template pronto!', data);
 * });
 * 
 * // Export button
 * document.getElementById('export-btn').addEventListener('click', async () => {
 *   await panel.exportDocument('docx');
 * });
 * 
 * // Mostrar diagnósticos
 * document.getElementById('show-diagnostics-btn').addEventListener('click', () => {
 *   panel.diagnosticsUI.toggle();
 * });
 */
