/**
 * CalendarTextParser.js — Converte texto oficial em entradas de calendario.
 * Entrada esperada: blocos com linhas no formato romano, ex.: "I - 1º de janeiro, ...".
 */

const MONTHS = {
    janeiro: 1,
    fevereiro: 2,
    marco: 3,
    março: 3,
    abril: 4,
    maio: 5,
    junho: 6,
    julho: 7,
    agosto: 8,
    setembro: 9,
    outubro: 10,
    novembro: 11,
    dezembro: 12,
};

function pad2(value) {
    return String(value).padStart(2, '0');
}

function makeIsoDate(year, month, day) {
    return `${year}-${pad2(month)}-${pad2(day)}`;
}

function normalizeLine(rawLine) {
    return rawLine
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[;.]$/, '');
}

function stripRomanPrefix(line) {
    return line.replace(/^[IVXLCDM]+\s*-\s*/i, '').trim();
}

function detectType(text) {
    const lower = text.toLowerCase();
    if (lower.includes('ponto facultativo') || lower.includes('recesso facultativo')) return 'facultativo';
    if (lower.includes('recesso')) return 'recesso';
    if (lower.includes('feriado')) return 'feriado';
    return null;
}

function parseMonth(text) {
    const lower = text.toLowerCase();
    for (const [name, num] of Object.entries(MONTHS)) {
        if (lower.includes(`de ${name}`)) {
            return num;
        }
    }
    return null;
}

function extractDateTokens(text) {
    const lower = text.toLowerCase();

    // Ex: "21 a 31 de dezembro"
    const rangeMatch = lower.match(/(\d{1,2})\s*a\s*(\d{1,2})\s+de\s+([a-zçã]+)/i);
    if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        const month = MONTHS[rangeMatch[3]];
        if (month && start <= end) {
            const days = [];
            for (let d = start; d <= end; d += 1) days.push({ day: d, month });
            return days;
        }
    }

    // Ex: "16 e 17 de fevereiro"
    const pairMatch = lower.match(/(\d{1,2})\s*e\s*(\d{1,2})\s+de\s+([a-zçã]+)/i);
    if (pairMatch) {
        const month = MONTHS[pairMatch[3]];
        if (month) {
            return [
                { day: parseInt(pairMatch[1], 10), month },
                { day: parseInt(pairMatch[2], 10), month },
            ];
        }
    }

    // Ex: "1º de janeiro" ou "2 de abril"
    const singleMatch = lower.match(/(\d{1,2})(?:º)?\s+de\s+([a-zçã]+)/i);
    if (singleMatch) {
        const month = MONTHS[singleMatch[2]];
        if (month) {
            return [{ day: parseInt(singleMatch[1], 10), month }];
        }
    }

    // Fallback: tenta descobrir o mes e o primeiro numero do trecho
    const month = parseMonth(text);
    const dayMatch = lower.match(/\b(\d{1,2})(?:º)?\b/);
    if (month && dayMatch) {
        return [{ day: parseInt(dayMatch[1], 10), month }];
    }

    return [];
}

function toEntry(year, token, line, type) {
    const isoDate = makeIsoDate(year, token.month, token.day);

    return {
        isoDate,
        type,
        label: line,
        isHoliday: true,
    };
}

/**
 * @param {string} rawText
 * @param {number} year
 * @returns {{ entries: Record<string, {type:string,label:string,isHoliday:boolean}>, warnings: string[] }}
 */
export function parseCalendarText(rawText, year) {
    const lines = String(rawText || '')
        .split(/\r?\n/)
        .map(normalizeLine)
        .filter(Boolean);

    const warnings = [];
    const entries = {};

    lines.forEach((line) => {
        if (!/^[IVXLCDM]+\s*-/i.test(line)) return;

        const body = stripRomanPrefix(line);
        const type = detectType(body);
        if (!type) {
            warnings.push(`Tipo não identificado na linha: "${line}"`);
            return;
        }

        const tokens = extractDateTokens(body);
        if (!tokens.length) {
            warnings.push(`Data não identificada na linha: "${line}"`);
            return;
        }

        tokens.forEach((token) => {
            const daysInMonth = new Date(Date.UTC(year, token.month, 0)).getUTCDate();
            if (token.day < 1 || token.day > daysInMonth) {
                warnings.push(`Data invalida na linha: "${line}"`);
                return;
            }

            const entry = toEntry(year, token, body, type);
            entries[entry.isoDate] = {
                type: entry.type,
                label: entry.label,
                isHoliday: entry.isHoliday,
            };
        });
    });

    return { entries, warnings };
}
