import { applyFieldMask, formatFieldLabel, getFieldMask, getFieldOptions, getFieldPlaceholder } from '../utils/fieldHelpers.js';
import { getDocumentEditorIcon } from './iconSet.js';
import { INSTITUTION } from '../../../config/institution.js';
import { escreverPorExtenso } from '../../extenso.js';

export function renderDynamicForm(container, placeholders, settingsStore, onFieldValueChange) {
    const headerFallback = settingsStore.getHeaderFallback();
    const selectFields = placeholders.filter((field) => field.kind === 'select');

    container.innerHTML = `
        <div class="document-editor__form-toolbar">
            <div class="document-editor__form-summary">
                <div class="document-editor__form-summary-text">
                    <strong>${placeholders.length}</strong>&nbsp;campo(s) detectado(s). Campos com&nbsp;<code>[{{nome}}]</code>&nbsp;usam opções salvas.
                </div>
                <div class="document-editor__form-summary-actions">
                    <button type="button" class="document-editor__btn document-editor__btn--ghost document-editor__btn--small" data-action="open-settings">
                        <span class="document-editor__btn-icon">${getDocumentEditorIcon('info')}</span><span>Configurações</span>
                    </button>
                    <button type="button" class="document-editor__btn document-editor__btn--ghost document-editor__btn--small" data-action="reset-fields">
                        <span class="document-editor__btn-icon">${getDocumentEditorIcon('reset')}</span><span>Redefinir</span>
                    </button>
                </div>
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
                    <div class="document-editor__settings-header-row">
                        <p class="document-editor__settings-note">Configure as opções dos campos <code>[{{nome}}]</code> e o cabeçalho parametrizado da prévia.</p>
                        <button type="button" class="document-editor__btn document-editor__btn--ghost document-editor__btn--small" data-action="toggle-configured-parameters">+ Mostrar parâmetros configurados</button>
                    </div>
                    <div class="document-editor__settings-parameters" hidden>
                        <p class="document-editor__settings-note" style="margin-bottom:8px;">Parâmetros configurados internamente:</p>
                        <pre id="configuredParametersList" style="margin:0;padding:12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;white-space:pre-wrap;word-break:break-word;">Nenhum parâmetro detectado.</pre>
                    </div>
                    <div class="document-editor__settings-grid">
                        ${renderSelectSettings(selectFields, settingsStore)}
                        <label class="document-editor__settings-field document-editor__settings-field--wide">
                            <span>Texto do cabeçalho</span>
                            <textarea class="document-editor__control document-editor__control--textarea" data-setting-header="headerText" rows="4" placeholder="${INSTITUTION.defaultHeader.mainText}&#10;${INSTITUTION.defaultHeader.subtitle}">${escapeHtml(headerFallback.headerText || '')}</textarea>
                        </label>
                        <label class="document-editor__settings-field document-editor__settings-field--wide">
                            <span>Preâmbulo auxiliar (opcional)</span>
                            <textarea class="document-editor__control document-editor__control--textarea" data-setting-header="preambleText" rows="4" placeholder="Cole aqui o texto do preâmbulo, se quiser substituir o padrão inicial.">${escapeHtml(headerFallback.preambleText || '')}</textarea>
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
    // Map lowercased placeholder name -> original-cased name, for extenso lookup
    const placeholderNameMap = new Map(placeholders.map((p) => [p.name.toLowerCase(), p.name]));
    placeholders.forEach((field) => grid.appendChild(createField(field, settingsStore, onFieldValueChange, placeholderNameMap)));
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

function createField(field, settingsStore, onFieldValueChange, placeholderNameMap) {
    const wrapper = document.createElement('div');
    wrapper.className = 'document-editor__field';

    const label = document.createElement('label');
    label.className = `document-editor__label${field.required ? ' document-editor__label--required' : ''}`;
    label.textContent = formatFieldLabel(field.name);

    const control = field.kind === 'select'
        ? createSelect(field, settingsStore)
        : field.type === 'textarea'
            ? createTextarea(field)
            : createInput(field);

    // Resolve the actual-cased name of the _extenso counterpart, if it exists in the template
    const extensoCounterpartName = isExtensoSource(field.name)
        ? placeholderNameMap?.get(`${field.name}_extenso`.toLowerCase()) ?? null
        : null;

    control.addEventListener(control.tagName === 'SELECT' ? 'change' : 'input', () => {
        if (control.tagName === 'INPUT') {
            control.value = applyFieldMask(field.name, control.value);
        }
        onFieldValueChange(field.name, control.value);

        // Auto-fill _EXTENSO counterpart declared in the template
        if (extensoCounterpartName) {
            const computed = escreverPorExtenso(control.value);
            if (computed && computed !== 'Campo obrigatório') {
                const extensoInput = wrapper.closest('.document-editor__form-grid')
                    ?.querySelector(`[data-field-name="${extensoCounterpartName}"]`);
                if (extensoInput) extensoInput.value = computed;
                onFieldValueChange(extensoCounterpartName, computed);
            }
        }
    });

    wrapper.append(label, control);
    return wrapper;
}

/** Returns true when the field can be the source of an _EXTENSO derivation. */
function isExtensoSource(fieldName) {
    return /valor|total_dias|total_meses/i.test(fieldName) && !/_extenso$/i.test(fieldName);
}

function createInput(field) {
    const input = document.createElement('input');
    const mask = getFieldMask(field.name);
    const isDateField = field.type === 'date' || field.name.toLowerCase().includes('data') || field.name.toLowerCase().includes('vigencia');

    input.type = 'text';
    input.className = 'document-editor__control';
    input.placeholder = getFieldPlaceholder(field);
    input.required = field.required;
    input.dataset.fieldName = field.name;

    const isNumericInput = ['cpf', 'cnpj', 'protocol'].includes(mask) || isDateField;
    input.inputMode = mask === 'currency' ? 'decimal' : isNumericInput ? 'numeric' : 'text';

    if (mask) {
        input.dataset.mask = mask;
    }
    if (isDateField && !mask) {
        input.dataset.mask = 'date';
    }
    if (mask === 'cpf') input.maxLength = 14;
    if (mask === 'cnpj') input.maxLength = 18;

    return input;
}

function createTextarea(field) {
    const textarea = document.createElement('textarea');
    textarea.className = 'document-editor__control document-editor__control--textarea';
    textarea.placeholder = getFieldPlaceholder(field);
    textarea.required = field.required;
    textarea.dataset.fieldName = field.name;
    textarea.rows = 4;
    return textarea;
}

function createSelect(field, settingsStore) {
    const select = document.createElement('select');
    select.className = 'document-editor__control';
    select.dataset.fieldName = field.name;
    select.required = field.required;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Escolha um campo';
    placeholder.selected = true;
    placeholder.disabled = true;
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
