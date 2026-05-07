import { INSTITUTION } from '../../../config/institution.js';

const STORAGE_KEY = 'dest-document-editor-settings';
const DEFAULT_HEADER_FALLBACK = {
    logoUrl: INSTITUTION.logoUrl,
    headerText: `${INSTITUTION.defaultHeader.mainText}\n${INSTITUTION.defaultHeader.subtitle}`,
    preambleText: INSTITUTION.defaultPreamble
};
const LEGACY_HEADER_DEFAULTS = new Set([
    `${INSTITUTION.defaultHeader.mainText}\n${INSTITUTION.defaultHeader.subtitle.replace('{{tipo_termo}}', 'DE APOSTILAMENTO')}`,
    `${INSTITUTION.defaultHeader.mainText}\n${INSTITUTION.defaultHeader.subtitle.replace('{{tipo_termo}}', 'DE APOSTILAMENTO').replace(' Nº {{num_termo}}', '')}`
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
