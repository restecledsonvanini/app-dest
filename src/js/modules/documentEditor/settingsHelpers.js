import { getDocumentEditorIcon } from './ui/iconSet.js';

/**
 * Update action buttons state
 */
export function updateActionState(panel, refs) {
    const hasDocument = !!panel.parser;
    refs.togglePreviewBtn.disabled = !hasDocument;
    refs.togglePreviewBtn.hidden = !panel.isExpanded;
    refs.toggleExpandBtn.innerHTML = panel.isExpanded ? getDocumentEditorIcon('compress') + '<span>Recolher</span>' : getDocumentEditorIcon('expand') + '<span>Expandir</span>';
    refs.togglePreviewBtn.innerHTML = `${getDocumentEditorIcon(panel.isPreviewOpen ? 'eyeOff' : 'eye')}<span>${panel.isPreviewOpen ? 'Ocultar prévia' : 'Abrir prévia'}</span>`;
    refs.downloadWordBtn.disabled = !hasDocument;
    refs.downloadPdfBtn.disabled = !hasDocument;
}

/**
 * Save settings — lê diretamente dos data-attributes do Shadow DOM
 * (FormData não captura campos sem `name` attribute)
 */
export function saveSettings(panel) {
    const refs = panel.getRefs();
    const root = panel.shadowRoot;

    // Captura opções de campos select
    root.querySelectorAll('[data-setting-options]').forEach((control) => {
        const options = control.value
            .split(/\r?\n/u)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const [value, label] = line.split('|').map((part) => part.trim());
                return { value: value || label || '', label: label || value || '' };
            });
        panel.settingsStore.setFieldOptions(control.dataset.settingOptions, options);
    });

    // Captura cabeçalho auxiliar
    panel.settingsStore.setHeaderFallback({
        headerText: root.querySelector('[data-setting-header="headerText"]')?.value?.trim() || '',
        preambleText: root.querySelector('[data-setting-header="preambleText"]')?.value?.trim() || '',
    });

    // Preserva dados atuais e re-renderiza
    const currentData = panel.previewUpdater?.getData() || {};
    panel.renderDynamicForm();
    Object.assign(panel.previewUpdater?.currentData || {}, currentData);
    panel.previewUpdater?.render();

    updateConfiguredParameters(panel, panel.getRefs());
    toggleSettingsPopover(panel, panel.getRefs(), false);
    panel.setStatus('Configurações salvas. A prévia foi atualizada com o cabeçalho auxiliar.', 'success');
}

/**
 * Reset form
 */
export function resetForm(panel) {
    panel.previewUpdater?.resetData?.() ?? panel.previewUpdater?.clear?.();
    panel.renderDynamicForm();
    panel.showFeedback('Campos redefinidos. O foco voltou ao primeiro campo.');
}

/**
 * Toggle settings popover — usa `hidden` attribute, consistente com o template
 */
export function toggleSettingsPopover(panel, refs, force) {
    // O popover está dentro do dynamicForm (Shadow DOM), não no root
    const popover = panel.shadowRoot?.querySelector('.document-editor__settings-popover');
    if (!popover) {
        console.warn('[settingsHelpers.toggleSettingsPopover] popover não encontrado');
        return;
    }
    const shouldOpen = typeof force === 'boolean' ? force : popover.hasAttribute('hidden');
    if (shouldOpen) {
        popover.removeAttribute('hidden');
    } else {
        popover.setAttribute('hidden', '');
    }
}

/**
 * Update configured parameters — recebe refs para acessar o elemento correto no Shadow DOM
 */
export function updateConfiguredParameters(panel, refs) {
    const configured = panel.settingsStore.getAll();
    const paramsList = Object.entries(configured)
        .filter(([key]) => key !== 'headerFallback')
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');

    // O elemento está dentro do dynamicForm (renderizado dinamicamente)
    const listEl = panel.shadowRoot?.querySelector('#configuredParametersList');
    if (!listEl) {
        // Silencioso: pode não existir ainda se o popover nunca foi aberto
        return;
    }
    listEl.textContent = paramsList || 'Nenhum parâmetro configurado.';
}

/**
 * Toggle configured parameters visibility
 */
export function toggleConfiguredParameters(panel, refs) {
    const paramsSection = panel.shadowRoot?.querySelector('.document-editor__settings-parameters');
    if (!paramsSection) {
        console.warn('[settingsHelpers.toggleConfiguredParameters] paramsSection não encontrado');
        return;
    }
    const isVisible = !paramsSection.hidden;
    paramsSection.hidden = isVisible;
    const button = panel.shadowRoot?.querySelector('[data-action="toggle-configured-parameters"]');
    if (button) {
        button.textContent = isVisible ? '+ Mostrar parâmetros configurados' : '− Ocultar parâmetros configurados';
    }
}

/**
 * Get configured parameters from header and document placeholders
 */
export function getConfiguredParameters(panel) {
    const headerText = panel.settingsStore.getHeaderFallback().headerText || '';
    const preambleText = panel.settingsStore.getHeaderFallback().preambleText || '';
    const sourceText = `${headerText} ${preambleText}`;
    const regex = /\{\{\s*([^}\s]+)\s*\}\}/g;
    const params = new Set();
    let match;

    while ((match = regex.exec(sourceText)) !== null) {
        params.add(match[1]);
    }

    if (panel.parser) {
        panel.parser.getPlaceholders().forEach(({ name }) => params.add(name));
    }

    return Array.from(params).sort();
}