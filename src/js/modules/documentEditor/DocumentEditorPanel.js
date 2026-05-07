import { DocumentParser } from './DocumentParser.js';
import { PreviewUpdater } from './PreviewUpdater.js';
import { TemplateFileService } from './services/TemplateFileService.js';
import { ExportService } from './services/ExportService.js';
import { SettingsStore } from './services/SettingsStore.js';
import { getDocumentEditorIcon } from './ui/iconSet.js';
import { getDocumentEditorTemplate } from './ui/template.js';
import { renderDynamicForm } from './ui/formFactory.js';
import { DocumentEditorController } from './DocumentEditorController.js';
import { ExportOrchestrator } from './ExportOrchestrator.js';
import { togglePreview, toggleExpanded, setZoom } from './uiHelpers.js';
import { handlePreviewEdit, handleSplitterPointerDown, handleDrop, handleGlobalKeydown } from './eventHandlers.js';
import { updateActionState, saveSettings, resetForm, toggleSettingsPopover, updateConfiguredParameters, toggleConfiguredParameters, getConfiguredParameters } from './settingsHelpers.js';
import { downloadAsWord, downloadAsPdf, buildExportMarkup } from './exportHelpers.js';

const STYLESHEET_URL = new URL('./styles/main.css', import.meta.url).href;

export class DocumentEditorPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.fileService = new TemplateFileService();
        this.exportService = new ExportService();
        this.settingsStore = new SettingsStore();
        this.controller = new DocumentEditorController({ fileService: this.fileService });
        this.exporter = new ExportOrchestrator({ exportService: this.exportService });
        this.parser = null;
        this.previewUpdater = null;
        this.currentFile = null;
        this.zoom = 75;
        this.isPreviewOpen = false;
        this.isExpanded = false;
        this.splitRatio = 0.5;
        this.isResizing = false;
        this.startX = 0;
        this.onKeydown = (event) => handleGlobalKeydown(this, event);
    }
    connectedCallback() {
        this.render(); this.loadStyles(); this.attachEventListeners(); updateActionState(this, this.getRefs());
        document.addEventListener('keydown', this.onKeydown);

        // Configurar listeners dos controllers
        this.controller.on('documentLoaded', (data) => this.onDocumentLoaded(data));
        this.controller.on('documentError', (error) => this.onDocumentError(error));
        this.controller.on('parsingStart', (file) => this.onParsingStart(file));

        this.exporter.onExportComplete = (message) => this.showFeedback(message);
        this.exporter.onExportError = (error) => this.showFeedback(`Erro no export: ${error.message}`);
    }
    disconnectedCallback() {
        document.removeEventListener('keydown', this.onKeydown);
        document.documentElement.style.overflow = '';
    }

    loadStyles() {
        if (this.shadowRoot.querySelector('link[data-document-editor-style]')) return;
        const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: STYLESHEET_URL });
        link.dataset.documentEditorStyle = 'true';
        this.shadowRoot.prepend(link);
    }
    render() { this.shadowRoot.innerHTML = getDocumentEditorTemplate(); }
    attachEventListeners() {
        const refs = this.getRefs();
        refs.pickFileBtn.addEventListener('click', () => refs.fileInput.click());
        refs.fileInput.addEventListener('change', (event) => this.handleDocumentUpload(event.target.files?.[0]));
        refs.dropzone.addEventListener('click', (event) => !event.target.closest('button') && refs.fileInput.click());
        refs.dropzone.addEventListener('keydown', (event) => ['Enter', ' '].includes(event.key) && (event.preventDefault(), refs.fileInput.click()));
        ['dragenter', 'dragover'].forEach((name) => refs.dropzone.addEventListener(name, (event) => this.toggleDragState(event, true)));
        ['dragleave', 'dragend'].forEach((name) => refs.dropzone.addEventListener(name, (event) => this.toggleDragState(event, false)));
        refs.dropzone.addEventListener('drop', (event) => handleDrop(this, event));
        refs.togglePreviewBtn.addEventListener('click', () => this.togglePreview());
        refs.closePreviewBtn.addEventListener('click', () => this.togglePreview(false));
        refs.toggleExpandBtn.addEventListener('click', () => this.toggleExpanded());
        refs.downloadWordBtn.addEventListener('click', () => downloadAsWord(this));
        refs.downloadPdfBtn.addEventListener('click', () => downloadAsPdf(this));
        refs.zoomRange.addEventListener('input', (event) => this.setZoom(event.target.value));
        refs.root.addEventListener('click', (event) => {
            const action = event.target.closest('[data-action="toggle-configured-parameters"]');
            if (action) {
                event.preventDefault();
                toggleConfiguredParameters(this, this.getRefs());
            }
        });
        refs.previewContainer.addEventListener('dblclick', (event) => handlePreviewEdit(this, event));
        refs.previewSplitter?.addEventListener('pointerdown', (event) => handleSplitterPointerDown(this, event));
        this.bindDynamicFormActions();
    }

    getRefs() {
        const root = this.shadowRoot;
        if (!root) {
            console.error('[DocumentEditorPanel.getRefs] shadowRoot não existe!');
            return {};
        }

        const refs = {
            root: root.querySelector('.document-editor'),
            fileInput: root.getElementById('docUpload'),
            pickFileBtn: root.getElementById('pickFileBtn'),
            dropzone: root.getElementById('dropzone'),
            dynamicForm: root.getElementById('dynamicForm'),
            statusBox: root.getElementById('statusBox'),
            previewContainer: root.getElementById('previewContainer'),
            previewSummary: root.getElementById('previewSummary'),
            togglePreviewBtn: root.getElementById('togglePreviewBtn'),
            toggleExpandBtn: root.getElementById('toggleExpandBtn'),
            closePreviewBtn: root.getElementById('closePreviewBtn'),
            downloadWordBtn: root.getElementById('downloadWordBtn'),
            downloadPdfBtn: root.getElementById('downloadPdfBtn'),
            zoomRange: root.getElementById('zoomRange'),
            zoomValue: root.getElementById('zoomValue'),
            previewDrawer: root.getElementById('previewDrawer'),
            previewSplitter: root.getElementById('previewSplitter')
        };

        // Verificar se elementos críticos estão faltando
        const missingElements = Object.entries(refs)
            .filter(([key, el]) => !el && ['statusBox', 'dynamicForm', 'previewSummary', 'previewContainer'].includes(key))
            .map(([key]) => key);

        if (missingElements.length > 0) {
            console.warn('[DocumentEditorPanel.getRefs] Elementos críticos faltando:', missingElements);
        }

        return refs;
    }

    async handleDocumentUpload(file) {
        const refs = this.getRefs();
        if (!file) return;
        try {
            this.currentFile = file;
            refs.dropzone.classList.add('is-disabled');
            await this.controller.handleFileUpload(file);
        } catch (error) {
            // Erro já tratado pelo controller
        } finally {
            refs.dropzone.classList.remove('is-disabled');
            refs.fileInput.value = '';
            updateActionState(this, this.getRefs());
        }
    }

    renderDynamicForm() {
        const savedData = this.previewUpdater?.getData() || {};
        renderDynamicForm(this.getRefs().dynamicForm, this.parser?.getPlaceholders() || [], this.settingsStore, (fieldName, value) => this.previewUpdater?.updateField(fieldName, value));
        Object.entries(savedData).forEach(([fieldName, value]) => {
            const control = this.shadowRoot.querySelector(`[data-field-name="${fieldName}"]`);
            if (control) control.value = value;
        });
        this.bindDynamicFormActions();
        updateConfiguredParameters(this, this.getRefs());
        updateActionState(this, this.getRefs());
    }

    bindDynamicFormActions() {
        const { dynamicForm } = this.getRefs();
        dynamicForm.querySelector('[data-action="reset-fields"]')?.addEventListener('click', () => resetForm(this));
        dynamicForm.querySelector('[data-action="save-settings"]')?.addEventListener('click', () => saveSettings(this));
        dynamicForm.querySelector('[data-action="open-settings"]')?.addEventListener('click', () => toggleSettingsPopover(this, this.getRefs(), true));
        dynamicForm.querySelector('[data-role="settings-backdrop"]')?.addEventListener('click', () => toggleSettingsPopover(this, this.getRefs(), false));
        dynamicForm.querySelector('[data-action="close-settings"]')?.addEventListener('click', () => toggleSettingsPopover(this, this.getRefs(), false));
    }

    initializePreview() {
        try {
            if (!this.parser || !this.parser.placeholders) {
                throw new Error('Parser inválido ou sem placeholders');
            }

            this.previewUpdater = new PreviewUpdater(this.getRefs().previewContainer, this.parser, {
                debounceMs: 180,
                getLayoutSettings: () => this.settingsStore.getAll()
            });

            this.previewUpdater.render();
            this.setZoom(this.zoom);
        } catch (error) {
            console.error('[DocumentEditorPanel.initializePreview] Erro:', error);
            console.error('[DocumentEditorPanel.initializePreview] Stack:', error.stack);
            throw error; // Re-throw para ser capturado por onDocumentLoaded
        }
    }

    togglePreview(force) {
        togglePreview(this, this.getRefs(), force);
        updateActionState(this, this.getRefs());
    }

    toggleExpanded(force) {
        toggleExpanded(this, this.getRefs(), force);
        if (this.isExpanded) {
            this.togglePreview(true);
        } else {
            this.togglePreview(false);
        }
        updateActionState(this, this.getRefs());
    }

    resetForm() {
        resetForm(this);
    }

    toggleDragState(event, active) {
        event.preventDefault();
        this.getRefs().dropzone?.classList.toggle('is-dragover', active);
    }



    saveSettings() {
        saveSettings(this);
    }



    setZoom(value) {
        setZoom(this, this.getRefs(), value);
    }













    setStatus(message, kind = 'neutral') {
        const { statusBox } = this.getRefs();
        if (!statusBox) {
            console.warn('[DocumentEditorPanel.setStatus] statusBox não encontrado no DOM', this.getRefs());
            return;
        }
        statusBox.textContent = message; statusBox.dataset.kind = kind;
    }
    updatePreviewSummary() {
        const refs = this.getRefs();
        if (!refs.previewSummary) {
            console.warn('[DocumentEditorPanel.updatePreviewSummary] previewSummary não encontrado no DOM', refs);
            return;
        }
        const total = this.parser?.getPlaceholders?.().length || 0;
        refs.previewSummary.textContent = `${this.currentFile?.name || 'Documento'} • ${total} campo(s) detectado(s). Prévia lateral com cabeçalho auxiliar.`;
    }

    onDocumentLoaded({ file, parser }) {
        try {
            if (!parser || !parser.placeholders) {
                throw new Error('Parser inválido ou sem placeholders');
            }

            this.parser = parser;
            this.renderDynamicForm();
            this.initializePreview();
            this.updatePreviewSummary();

            this.toggleExpanded(true);
            this.setStatus(`${file.name} carregado com sucesso.`, 'success');
            this.showFeedback('Documento carregado. A prévia foi aberta automaticamente no modo ampliado.');
        } catch (error) {
            console.error('[DocumentEditorPanel.onDocumentLoaded] Erro durante processamento:', error);
            console.error('[DocumentEditorPanel.onDocumentLoaded] Stack:', error.stack);
            this.onDocumentError(new Error(`Erro ao processar documento: ${error.message}`));
        }
    }

    onDocumentError(error) {
        this.parser = null;
        this.previewUpdater = null;
        this.setStatus(error.message, 'warning');
        this.showFeedback(error.message);
    }

    onParsingStart(file) {
        this.setStatus(`Processando ${file.name}...`, 'info');
    }

    showFeedback(message) {
        if (window.showGenericFeedback) window.showGenericFeedback(message);
        else console.log('DocumentEditor:', message);
    }
}
