import { applyFieldMask, formatFieldLabel, getFieldOptions, getFieldPlaceholder } from '../utils/fieldHelpers.js';
import { getDocumentEditorIcon } from './iconSet.js';

export function renderDynamicForm(container, placeholders, settingsStore, onFieldValueChange) {
    const headerFallback = settingsStore.getHeaderFallback();
    const selectFields = placeholders.filter((field) => field.kind === 'select');

    container.innerHTML = `
        <div class="document-editor__form-toolbar">
            <div class="document-editor__form-intro">
                <strong>${placeholders.length}</strong> campo(s) detectado(s). Campos com <code>[{{nome}}]</code> usam opções salvas.
            </div>
            <div class="document-editor__form-toolbar-actions">
                <button type="button" class="document-editor__btn document-editor__btn--ghost document-editor__btn--small" data-action="open-settings">
                    ${getDocumentEditorIcon('info')}<span>Configurações</span>
                </button>
                <button type="button" class="document-editor__btn document-editor__btn--ghost document-editor__btn--small" data-action="reset-fields">
                    ${getDocumentEditorIcon('reset')}<span>Redefinir</span>
                </button>
            </div>
        </div>

        <div class="document-editor__settings-popover" hidden>
            <button type="button" class="document-editor__settings-backdrop" data-role="settings-backdrop" aria-label="Fechar configurações"></button>
            <section class="document-editor__settings-card" role="dialog" aria-modal="true" aria-labelledby="documentEditorSettingsTitle">
                <div class="document-editor__settings-card-header">
                    <h3 id="documentEditorSettingsTitle">Configurações</h3>
                    <button type="button" class="document-editor__btn document-editor__btn--ghost document-editor__btn--icon" data-action="close-settings">${getDocumentEditorIcon('close')}</button>
                </div>
                <div class="document-editor__settings-body">
                    <p class="document-editor__settings-note">Configure as opções dos campos <code>[{{nome}}]</code> e o cabeçalho parametrizado da prévia.</p>
                    <div class="document-editor__settings-grid">
                        ${renderSelectSettings(selectFields, settingsStore)}
                        <label class="document-editor__settings-field">
                            <span>Logo do cabeçalho</span>
                            <input type="text" class="document-editor__control" data-setting-header="logoUrl" value="${escapeHtml(headerFallback.logoUrl || '')}" placeholder="/src/images/brasao_do_Parana.svg.png">
                        </label>
                        <label class="document-editor__settings-field document-editor__settings-field--wide">
                            <span>Texto do cabeçalho</span>
                            <textarea class="document-editor__control document-editor__control--textarea" data-setting-header="headerText" rows="4" placeholder="SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA&#10;CENTRO DE CONTRATOS E CONVÊNIOS – TERMO {{tipo_termo}} Nº {{num_termo}}">${escapeHtml(headerFallback.headerText || '')}</textarea>
                        </label>
                        <label class="document-editor__settings-field document-editor__settings-field--wide">
                            <span>Preâmbulo auxiliar (opcional)</span>
                            <textarea class="document-editor__control document-editor__control--textarea" data-setting-header="preambleText" rows="4" placeholder="Cole aqui o texto do preâmbulo, se quiser reforçar o bloco da primeira página.">${escapeHtml(headerFallback.preambleText || '')}</textarea>
                        </label>
                    </div>
                    <div class="document-editor__settings-actions">
                        <button type="button" class="document-editor__btn document-editor__btn--secondary" data-action="save-settings">
                            ${getDocumentEditorIcon('check')}<span>Salvar configurações</span>
                        </button>
                    </div>
                </div>
            </section>
        </div>

        <div class="document-editor__form-grid"></div>
    `;

    const grid = container.querySelector('.document-editor__form-grid');
    placeholders.forEach((field) => grid.appendChild(createField(field, settingsStore, onFieldValueChange)));
    container.querySelector('[data-field-name]')?.focus();
}

function renderSelectSettings(selectFields, settingsStore) {
    if (!selectFields.length) {
        return `
            <div class="document-editor__settings-field document-editor__settings-field--wide">
                <span>Listas [{{ }}]</span>
                <div class="document-editor__settings-empty">Nenhum campo do tipo lista foi identificado neste modelo.</div>
            </div>
        `;
    }

    return selectFields.map((field) => `
        <label class="document-editor__settings-field">
            <span>${formatFieldLabel(field.name)}</span>
            <textarea class="document-editor__control document-editor__control--textarea" data-setting-options="${field.name}" rows="4" placeholder="Uma opção por linha ou valor | rótulo">${escapeHtml(formatOptions(settingsStore.getFieldOptions(field.name)))}</textarea>
        </label>
    `).join('');
}

function formatOptions(options = []) {
    return options
        .map((option) => option.label === option.value ? option.value : `${option.value} | ${option.label}`)
        .join('\n');
}

function createField(field, settingsStore, onFieldValueChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'document-editor__field';

    const label = document.createElement('label');
    label.className = `document-editor__label${field.required ? ' document-editor__label--required' : ''}`;
    label.textContent = formatFieldLabel(field.name);

    const control = field.kind === 'select'
        ? createSelect(field, settingsStore)
        : createInput(field);

    control.addEventListener(control.tagName === 'SELECT' ? 'change' : 'input', () => {
        if (control.tagName === 'INPUT') {
            control.value = applyFieldMask(field.name, control.value);
        }
        onFieldValueChange(field.name, control.value);
    });

    wrapper.append(label, control);
    return wrapper;
}

function createInput(field) {
    const input = document.createElement('input');
    input.type = field.type;
    input.className = 'document-editor__control';
    input.placeholder = getFieldPlaceholder(field);
    input.required = field.required;
    input.dataset.fieldName = field.name;
    return input;
}

function createSelect(field, settingsStore) {
    const select = document.createElement('select');
    select.className = 'document-editor__control';
    select.dataset.fieldName = field.name;
    select.required = field.required;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Escolha um campo';
    select.appendChild(placeholder);

    getFieldOptions(field, settingsStore.getFieldOptions(field.name)).forEach((option) => {
        const element = document.createElement('option');
        element.value = option.value;
        element.textContent = option.label;
        select.appendChild(element);
    });

    return select;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}
