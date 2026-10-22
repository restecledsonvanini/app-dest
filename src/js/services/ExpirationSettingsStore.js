const STORAGE_KEY = 'dest-expiration-settings';

const DEFAULT_SETTINGS = Object.freeze({
    includeStartDate: true,
});

export class ExpirationSettingsStore {
    load() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return {
                includeStartDate: typeof saved.includeStartDate === 'boolean'
                    ? saved.includeStartDate
                    : DEFAULT_SETTINGS.includeStartDate,
            };
        } catch {
            return { ...DEFAULT_SETTINGS };
        }
    }

    save(settings = {}) {
        const normalized = {
            includeStartDate: typeof settings.includeStartDate === 'boolean'
                ? settings.includeStartDate
                : DEFAULT_SETTINGS.includeStartDate,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
    }
}