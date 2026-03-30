import { getDocumentEditorIcon } from './iconSet.js';

export function getDocumentEditorTemplate() {
    return `
        <div class="document-editor">
            <section class="document-editor__shell">
                <header class="document-editor__toolbar">
                    <div class="document-editor__heading">
                        <h2 class="document-editor__title">Editor de Documentos</h2>
                        <p class="document-editor__subtitle">Preserva o modelo original sempre que possível e substitui apenas os campos <code>{{ }}</code>.</p>
                    </div>
                    <div class="document-editor__toolbar-actions">
                        <button type="button" class="document-editor__btn document-editor__btn--ghost" id="toggleExpandBtn">${getDocumentEditorIcon('expand')}<span>Ampliar</span></button>
                        <button type="button" class="document-editor__btn document-editor__btn--secondary" id="togglePreviewBtn" disabled>${getDocumentEditorIcon('eye')}<span>Abrir prévia</span></button>
                        <button type="button" class="document-editor__btn document-editor__btn--secondary" id="downloadWordBtn" disabled>${getDocumentEditorIcon('word')}<span>Baixar Word</span></button>
                        <button type="button" class="document-editor__btn document-editor__btn--secondary" id="downloadPdfBtn" disabled>${getDocumentEditorIcon('pdf')}<span>Baixar PDF</span></button>
                    </div>
                </header>

                <div class="document-editor__layout">
                    <section class="document-editor__editor-panel" aria-label="Formulário do documento">
                        <div class="document-editor__dropzone" id="dropzone" tabindex="0" role="button" aria-describedby="docSupportHint">
                            <div class="document-editor__dropzone-icon">${getDocumentEditorIcon('upload')}</div>
                            <div class="document-editor__dropzone-copy">
                                <strong>Arraste o documento aqui</strong>
                                <span>ou selecione um arquivo para detectar os campos parametrizados.</span>
                            </div>
                            <button type="button" class="document-editor__btn document-editor__btn--primary" id="pickFileBtn">${getDocumentEditorIcon('folder')}<span>Selecionar arquivo</span></button>
                            <input type="file" id="docUpload" class="document-editor__file-input" accept=".docx,.odt">
                            <small id="docSupportHint" class="document-editor__hint">Compatível com <strong>.docx</strong>. Suporte a <strong>.odt</strong> segue em avaliação.</small>
                        </div>

                        <div class="document-editor__status" id="statusBox" aria-live="polite">Nenhum documento carregado.</div>

                        <div class="document-editor__form-container" id="dynamicForm">
                            <div class="document-editor__empty-state">
                                <div class="document-editor__empty-icon">${getDocumentEditorIcon('braces')}</div>
                                <p>Carregue um modelo para gerar automaticamente os campos do formulário.</p>
                            </div>
                        </div>
                    </section>

                    <aside class="document-editor__sidepanel" id="previewDrawer" aria-hidden="true">
                        <div class="document-editor__sidepanel-header">
                            <div>
                                <h3 class="document-editor__sidepanel-title">Pré-visualização</h3>
                                <p class="document-editor__sidepanel-subtitle" id="previewSummary">Abra a prévia para revisar o resultado.</p>
                            </div>
                            <div class="document-editor__sidepanel-tools">
                                <label for="zoomRange" class="document-editor__zoom-label">Zoom</label>
                                <input type="range" id="zoomRange" class="document-editor__zoom-range" min="50" max="150" step="5" value="100">
                                <span id="zoomValue" class="document-editor__zoom-value">100%</span>
                                <button type="button" class="document-editor__btn document-editor__btn--ghost document-editor__btn--icon" id="closePreviewBtn">${getDocumentEditorIcon('close')}</button>
                            </div>
                        </div>
                        <div id="previewContainer" class="document-editor__preview-container">
                            <div class="document-editor__preview-content">Abra a pré-visualização para revisar o documento.</div>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    `;
}
