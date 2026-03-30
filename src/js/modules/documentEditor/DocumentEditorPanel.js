import { DocumentParser } from './DocumentParser.js';
import { PreviewUpdater } from './PreviewUpdater.js';
import { TemplateFileService } from './services/TemplateFileService.js';
import { ExportService } from './services/ExportService.js';
import { SettingsStore } from './services/SettingsStore.js';
import { getDocumentEditorIcon } from './ui/iconSet.js';
import { getDocumentEditorTemplate } from './ui/template.js';
import { renderDynamicForm } from './ui/formFactory.js';

const STYLESHEET_URL = new URL('./styles/main.css', import.meta.url).href;

export class DocumentEditorPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.fileService = new TemplateFileService();
        this.exportService = new ExportService();
        this.settingsStore = new SettingsStore();
        this.parser = null;
        this.previewUpdater = null;
        this.currentFile = null;
        this.zoom = 100;
        this.isPreviewOpen = false;
        this.isExpanded = false;
        this.onKeydown = (event) => this.handleGlobalKeydown(event);
    }
    connectedCallback() {
        this.render(); this.loadStyles(); this.attachEventListeners(); this.updateActionState();
        document.addEventListener('keydown', this.onKeydown);
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
        refs.dropzone.addEventListener('drop', (event) => this.handleDrop(event));
        refs.togglePreviewBtn.addEventListener('click', () => this.togglePreview());
        refs.closePreviewBtn.addEventListener('click', () => this.togglePreview(false));
        refs.toggleExpandBtn.addEventListener('click', () => this.toggleExpanded());
        refs.downloadWordBtn.addEventListener('click', () => this.downloadAsWord());
        refs.downloadPdfBtn.addEventListener('click', () => this.downloadAsPdf());
        refs.zoomRange.addEventListener('input', (event) => this.setZoom(event.target.value));
        refs.previewContainer.addEventListener('dblclick', (event) => this.handlePreviewEdit(event));
        this.bindDynamicFormActions();
    }

    getRefs() {
        const root = this.shadowRoot;
        return {
            root: root.querySelector('.document-editor'), fileInput: root.getElementById('docUpload'),
            pickFileBtn: root.getElementById('pickFileBtn'), dropzone: root.getElementById('dropzone'),
            dynamicForm: root.getElementById('dynamicForm'), statusBox: root.getElementById('statusBox'),
            previewContainer: root.getElementById('previewContainer'), previewSummary: root.getElementById('previewSummary'),
            togglePreviewBtn: root.getElementById('togglePreviewBtn'), toggleExpandBtn: root.getElementById('toggleExpandBtn'),
            closePreviewBtn: root.getElementById('closePreviewBtn'), downloadWordBtn: root.getElementById('downloadWordBtn'),
            downloadPdfBtn: root.getElementById('downloadPdfBtn'), zoomRange: root.getElementById('zoomRange'),
            zoomValue: root.getElementById('zoomValue'), previewDrawer: root.getElementById('previewDrawer')
        };
    }

    async handleDocumentUpload(file) {
        const refs = this.getRefs();
        if (!file) return;
        try {
            this.currentFile = file;
            this.setStatus(`Processando ${file.name}...`, 'info');
            refs.dropzone.classList.add('is-disabled');
            this.parser = new DocumentParser(await this.fileService.parseFile(file));
            this.renderDynamicForm({});
            this.initializePreview();
            this.updatePreviewSummary();
            this.setStatus(`${file.name} carregado com sucesso.`, 'success');
            this.showFeedback('Documento carregado. Use “Abrir prévia” para revisar o resultado.');
        } catch (error) {
            this.parser = null;
            this.previewUpdater = null;
            this.setStatus(error.message, 'warning');
            this.showFeedback(error.message);
        } finally {
            refs.dropzone.classList.remove('is-disabled');
            refs.fileInput.value = '';
            this.updateActionState();
        }
    }

    renderDynamicForm(savedData = this.previewUpdater?.getData() || {}) {
        renderDynamicForm(this.getRefs().dynamicForm, this.parser?.getPlaceholders() || [], this.settingsStore, (fieldName, value) => this.previewUpdater?.updateField(fieldName, value));
        Object.entries(savedData).forEach(([fieldName, value]) => {
            const control = this.shadowRoot.querySelector(`[data-field-name="${fieldName}"]`);
            if (control) control.value = value;
        });
        this.bindDynamicFormActions();
        this.updateActionState();
    }

    bindDynamicFormActions() {
        const { dynamicForm } = this.getRefs();
        dynamicForm.querySelector('[data-action="reset-fields"]')?.addEventListener('click', () => this.resetForm());
        dynamicForm.querySelector('[data-action="save-settings"]')?.addEventListener('click', () => this.saveSettings());
        dynamicForm.querySelector('[data-action="open-settings"]')?.addEventListener('click', () => this.toggleSettingsPopover(true));
        dynamicForm.querySelector('[data-action="close-settings"]')?.addEventListener('click', () => this.toggleSettingsPopover(false));
        dynamicForm.querySelector('[data-role="settings-backdrop"]')?.addEventListener('click', () => this.toggleSettingsPopover(false));
    }

    initializePreview() {
        this.previewUpdater = new PreviewUpdater(this.getRefs().previewContainer, this.parser, { debounceMs: 180, getLayoutSettings: () => this.settingsStore.getAll() });
        this.previewUpdater.render();
        this.setZoom(this.zoom);
    }

    togglePreview(force) {
        if (!this.parser) return;
        const { root, previewDrawer } = this.getRefs();
        this.isPreviewOpen = typeof force === 'boolean' ? force : !this.isPreviewOpen;
        root.classList.toggle('document-editor--preview-open', this.isPreviewOpen);
        previewDrawer.setAttribute('aria-hidden', String(!this.isPreviewOpen));
        this.updateActionState();
    }
    toggleExpanded(force) {
        this.isExpanded = typeof force === 'boolean' ? force : !this.isExpanded;
        this.getRefs().root.classList.toggle('document-editor--expanded', this.isExpanded);
        document.documentElement.style.overflow = this.isExpanded ? 'hidden' : '';
        this.updateActionState();
    }

    resetForm() {
        this.shadowRoot.querySelectorAll('[data-field-name]').forEach((control) => { control.value = ''; });
        this.previewUpdater?.clear();
        this.shadowRoot.querySelector('[data-field-name]')?.focus();
        this.setStatus('Campos redefinidos. O foco voltou ao primeiro campo.', 'info');
    }

    toggleSettingsPopover(force) {
        const panel = this.shadowRoot.querySelector('.document-editor__settings-popover');
        if (!panel) return;
        const isOpen = typeof force === 'boolean' ? force : panel.hasAttribute('hidden');
        panel.toggleAttribute('hidden', !isOpen);
    }

    saveSettings() {
        const currentData = this.previewUpdater?.getData() || {};
        this.shadowRoot.querySelectorAll('[data-setting-options]').forEach((control) => {
            const options = control.value.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).map((line) => {
                const [value, label] = line.split('|').map((part) => part.trim());
                return { value: value || label || '', label: label || value || '' };
            });
            this.settingsStore.setFieldOptions(control.dataset.settingOptions, options);
        });
        this.settingsStore.setHeaderFallback({
            logoUrl: this.shadowRoot.querySelector('[data-setting-header="logoUrl"]')?.value?.trim() || '',
            headerText: this.shadowRoot.querySelector('[data-setting-header="headerText"]')?.value?.trim() || '',
            preambleText: this.shadowRoot.querySelector('[data-setting-header="preambleText"]')?.value?.trim() || ''
        });
        this.renderDynamicForm(currentData);
        Object.assign(this.previewUpdater?.currentData || {}, currentData);
        this.previewUpdater?.render();
        this.toggleSettingsPopover(false);
        this.setStatus('Configurações salvas. A prévia foi atualizada com o cabeçalho auxiliar.', 'success');
    }

    updateActionState() {
        const { togglePreviewBtn, toggleExpandBtn, downloadWordBtn, downloadPdfBtn } = this.getRefs();
        const resetBtn = this.shadowRoot.querySelector('[data-action="reset-fields"]');
        const saveSettingsBtn = this.shadowRoot.querySelector('[data-action="save-settings"]');
        const hasDocument = Boolean(this.parser);
        togglePreviewBtn.disabled = !hasDocument;
        downloadWordBtn.disabled = !hasDocument;
        downloadPdfBtn.disabled = !hasDocument;
        if (resetBtn) resetBtn.disabled = !hasDocument;
        if (saveSettingsBtn) saveSettingsBtn.disabled = !hasDocument;
        togglePreviewBtn.innerHTML = `${getDocumentEditorIcon(this.isPreviewOpen ? 'eyeOff' : 'eye')}<span>${this.isPreviewOpen ? 'Ocultar prévia' : 'Abrir prévia'}</span>`;
        toggleExpandBtn.innerHTML = `${getDocumentEditorIcon(this.isExpanded ? 'collapse' : 'expand')}<span>${this.isExpanded ? 'Restaurar' : 'Ampliar'}</span>`;
    }

    setZoom(value) {
        this.zoom = Number(value);
        const { zoomValue } = this.getRefs();
        const pages = this.shadowRoot.querySelector('.document-editor__preview-pages');
        if (zoomValue) zoomValue.textContent = `${this.zoom}%`;
        if (pages) Object.assign(pages.style, { transform: `scale(${this.zoom / 100})`, transformOrigin: 'top left' });
    }

    async downloadAsWord() {
        const fileName = (this.currentFile?.name || 'documento').replace(/\.[^.]+$/u, '');
        try {
            const result = await this.exportService.downloadWord({
                fileName,
                markup: this.buildExportMarkup(),
                originalFile: this.currentFile,
                data: this.previewUpdater?.getData() || {}
            });
            this.showFeedback(result.format === 'docx'
                ? 'Arquivo .docx gerado preservando o modelo original do Word.'
                : 'Arquivo Word gerado a partir da versão HTML da prévia.');
        } catch (error) {
            this.showFeedback(`Falha ao gerar Word: ${error.message}`);
        }
    }

    async downloadAsPdf() {
        try {
            const fileName = (this.currentFile?.name || 'documento').replace(/\.[^.]+$/u, '');
            const result = await this.exportService.downloadPdf({ fileName, markup: this.buildExportMarkup() });
            this.showFeedback(result.mode === 'download'
                ? 'PDF baixado com base na versão editada do documento.'
                : 'Seu navegador abriu a janela para salvar a versão editada em PDF.');
        } catch (error) { this.showFeedback(`Falha ao gerar PDF: ${error.message}`); }
    }

    buildExportMarkup() {
        const pagesMarkup = this.shadowRoot.querySelector('.document-editor__preview-pages')?.innerHTML || this.parser.render(this.previewUpdater?.getData() || {}, { highlightEmpty: true, escapeHtml: true });
        return this.exportService.buildPrintableHtml(pagesMarkup);
    }

    setStatus(message, kind = 'neutral') {
        const { statusBox } = this.getRefs();
        statusBox.textContent = message; statusBox.dataset.kind = kind;
    }
    updatePreviewSummary() {
        const total = this.parser?.getPlaceholders().length || 0;
        this.getRefs().previewSummary.textContent = `${this.currentFile?.name || 'Documento'} • ${total} campo(s) detectado(s). Prévia lateral com cabeçalho auxiliar.`;
    }
    handlePreviewEdit(event) {
        const paragraph = event.target.closest('.document-editor__preview-page-body p');
        if (!paragraph || event.target.closest('.document-editor__placeholder')) return;
        paragraph.contentEditable = paragraph.contentEditable === 'true' ? 'false' : 'true';
        paragraph.classList.toggle('document-editor__paragraph--editing', paragraph.contentEditable === 'true');
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        this.getRefs().dropzone.classList.remove('is-dragover');
        const [file] = event.dataTransfer?.files || [];
        if (file) this.handleDocumentUpload(file);
    }
    toggleDragState(event, isActive) {
        event.preventDefault();
        event.stopPropagation();
        this.getRefs().dropzone.classList.toggle('is-dragover', isActive);
    }
    handleGlobalKeydown(event) {
        if (event.key !== 'Escape') return;
        if (this.isPreviewOpen) this.togglePreview(false);
        if (this.isExpanded) this.toggleExpanded(false);
    }
    showFeedback(message) {
        if (window.showGenericFeedback) window.showGenericFeedback(message);
        else console.log('DocumentEditor:', message);
    }
}
