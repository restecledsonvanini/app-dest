/**
 * dateUtils.js — Módulo de utilitários de data puros.
 * Sem acesso ao DOM. Operações matemáticas e de formatação de datas.
 */

/**
 * Converte string no formato DD/MM/YYYY em um objeto Date (ou null se inválido).
 * @param {string} dateStr
 * @returns {Date|null}
 */
export function parseBRDate(dateStr) {
    const normalized = String(dateStr || '').trim();
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) return null;

    const parts = normalized.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    if (year < 1900 || year > 2100) return null;

    const date = new Date(year, month - 1, day);
    // Evita normalizacoes silenciosas como 31/02 -> 03/03
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }
    return date;
}

/**
 * Converte valor de input date ISO (YYYY-MM-DD) ou data brasileira em Date local.
 * @param {string} value
 * @returns {Date|null}
 */
export function parseDateInput(value) {
    const normalized = String(value || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        const [year, month, day] = normalized.split('-').map(Number);
        return parseDateParts(day, month, year);
    }
    return parseBRDate(normalized);
}

function parseDateParts(day, month, year) {
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
}

/**
 * Retorna true se o ano for bissexto.
 * @param {number} year
 * @returns {boolean}
 */
export function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Converte Date local para timestamp UTC (00:00 do mesmo dia de calendario).
 * @param {Date} date
 * @returns {number}
 */
export function toUTCMidnight(date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Converte timestamp UTC para Date local mantendo o dia calendario UTC.
 * @param {number} utcMillis
 * @returns {Date}
 */
export function fromUTCMidnight(utcMillis) {
    const d = new Date(utcMillis);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Soma dias corridos em UTC.
 * @param {Date} startDate
 * @param {number} days - Quantidade de dias, incluindo o dia inicial por padrão.
 * @param {boolean} includeStartDate - Se false, soma a quantidade total de dias.
 * @returns {Date}
 */
export function calcEndDateByDays(startDate, days, includeStartDate = true) {
    const dayMs = 1000 * 60 * 60 * 24;
    const startUTC = toUTCMidnight(startDate);
    const daysToAdd = days - (includeStartDate ? 1 : 0);
    const endUTC = startUTC + (daysToAdd * dayMs);
    return fromUTCMidnight(endUTC);
}

/**
 * Formata um objeto Date para a string DD/MM/YYYY.
 * @param {Date} date
 * @returns {string}
 */
export function formatBRDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Calcula a data final de vigência.
 * - Meses: data inicial + N meses - 1 dia (período inclusivo)
 * - Anos: data inicial + N anos (mesmo dia)
 * @param {Date} startDate
 * @param {'months'|'years'} unit
 * @param {number} duration
 * @returns {Date}
 */
export function calcEndDate(startDate, unit, duration) {
    const endDate = new Date(startDate);
    if (unit === 'months') {
        endDate.setMonth(endDate.getMonth() + duration);
        endDate.setDate(endDate.getDate() - 1);
    } else if (unit === 'years') {
        endDate.setFullYear(endDate.getFullYear() + duration);
    }
    return endDate;
}

/**
 * Calcula diferença em dias e o status de vencimento em relação a hoje.
 * @param {Date} startDate
 * @param {Date} finalDate
 * @returns {{ daysDiff: number, daysUntilExpiration: number, statusText: string, statusColor: string }}
 */
export function calcDaysStatus(startDate, finalDate) {
    const daysDiff = Math.ceil((finalDate - startDate) / (1000 * 60 * 60 * 24));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilExpiration = Math.ceil((finalDate - today) / (1000 * 60 * 60 * 24));

    let statusText, statusColor;
    if (daysUntilExpiration < 0) {
        statusText = `Vencido há ${Math.abs(daysUntilExpiration)} dia(s)`;
        statusColor = '#dc2626';
    } else if (daysUntilExpiration === 0) {
        statusText = 'Vence hoje';
        statusColor = '#ea580c';
    } else {
        statusText = `Vence em ${daysUntilExpiration} dia(s)`;
        statusColor = daysUntilExpiration <= 30 ? '#ea580c'
            : daysUntilExpiration <= 60 ? '#eab308'
                : '#16a34a';
    }

    return { daysDiff, daysUntilExpiration, statusText, statusColor };
}
