const STORAGE_KEY = 'dest-document-editor-settings';
const DEFAULT_HEADER_FALLBACK = {
    logoUrl: '/src/images/brasao_do_Parana.svg.png',
    headerText: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA\nCENTRO DE CONTRATOS E CONVÊNIOS – TERMO {{tipo_termo}} Nº {{num_termo}}',
    preambleText: ''
};
const LEGACY_HEADER_DEFAULTS = new Set([
    'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA\nCENTRO DE CONTRATOS E CONVÊNIOS – TERMO DE APOSTILAMENTO Nº {{num_termo}}',
    'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA\nCENTRO DE CONTRATOS E CONVÊNIOS – TERMO DE APOSTILAMENTO'
]);

export class SettingsStore {
    constructor(storage = window.localStorage) {
        this.storage = storage;
    }

    getAll() {
        try {
            return JSON.parse(this.storage.getItem(STORAGE_KEY) || '{}');
        } catch {
            return {};
        }
    }

    saveAll(data) {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    getFieldOptions(fieldName) {
        const settings = this.getAll();
        return settings.fieldOptions?.[fieldName] || [];
    }

    setFieldOptions(fieldName, options) {
        const settings = this.getAll();
        settings.fieldOptions = settings.fieldOptions || {};
        settings.fieldOptions[fieldName] = options;
        this.saveAll(settings);
    }

    getHeaderFallback() {
        const settings = this.getAll();
        const resolved = {
            ...DEFAULT_HEADER_FALLBACK,
            ...(settings.headerFallback || {})
        };

        resolved.headerText = String(resolved.headerText || DEFAULT_HEADER_FALLBACK.headerText)
            .replace(/\s+N[º°]?\s*undefined/giu, '')
            .replace(/\{\{\s*undefined\s*\}\}/giu, '')
            .trim();

        if (!resolved.headerText || LEGACY_HEADER_DEFAULTS.has(resolved.headerText)) {
            resolved.headerText = DEFAULT_HEADER_FALLBACK.headerText;
        }

        return resolved;
    }

    setHeaderFallback(config) {
        const settings = this.getAll();
        settings.headerFallback = {
            ...DEFAULT_HEADER_FALLBACK,
            ...config
        };
        this.saveAll(settings);
    }
}
