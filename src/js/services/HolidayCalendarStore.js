const PREFIX = 'dest-calendar-';

function keyForYear(year) {
    return `${PREFIX}${year}`;
}

function safeJsonParse(value, fallback = null) {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

export class HolidayCalendarStore {
    save(year, data) {
        const previous = this.load(year);
        const payload = {
            year,
            importedAt: data?.importedAt ?? previous?.importedAt ?? '',
            updatedAt: new Date().toISOString(),
            sourceText: data?.sourceText || '',
            entries: data?.entries || {},
        };
        localStorage.setItem(keyForYear(year), JSON.stringify(payload));
        return payload;
    }

    load(year) {
        const raw = localStorage.getItem(keyForYear(year));
        return raw ? safeJsonParse(raw, null) : null;
    }

    hasYear(year) {
        const item = this.load(year);
        return !!(item?.entries && Object.keys(item.entries).length);
    }

    remove(year) {
        localStorage.removeItem(keyForYear(year));
    }
}