const PROTOCOL_LENGTH = 9;
const YEAR_LENGTH = 4;
const PADDED_NUMBER_LENGTH = 4;

export function formatFieldLabel(name) {
    return name
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getFieldMask(fieldName = '') {
    const normalized = fieldName.toLowerCase();

    if (normalized.includes('protocolo') || normalized.includes('procolo')) {
        return 'protocol';
    }

    if (
        normalized.includes('apostil') ||
        normalized.includes('aditivo') ||
        normalized.includes('gms')
    ) {
        return 'numberYear';
    }

    return null;
}

export function getFieldPlaceholder(field) {
    const label = formatFieldLabel(field.name).toLowerCase();
    const mask = getFieldMask(field.name);

    if (mask === 'protocol') return '24.471.673-3';
    if (mask === 'numberYear' && field.name.toLowerCase().includes('gms')) return '5209/2025';
    if (mask === 'numberYear') return '0015/2026';
    if (field.type === 'date') return 'dd/mm/aaaa';
    return `Digite ${label}`;
}

export function applyFieldMask(fieldName, value) {
    const digits = String(value || '').replace(/\D/g, '');
    const mask = getFieldMask(fieldName);

    if (!mask || !digits) return value;
    if (mask === 'protocol') return formatProtocol(digits);
    if (mask === 'numberYear') return formatNumberYear(digits);
    return value;
}

export function getFieldOptions(field, savedOptions = []) {
    if (field.kind !== 'select') return [];
    if (savedOptions.length) return savedOptions;

    return [
        { label: 'Selecione...', value: '' },
        { label: formatFieldLabel(field.name), value: field.name }
    ];
}

function formatProtocol(digits) {
    const sliced = digits.slice(0, PROTOCOL_LENGTH);
    const part1 = sliced.slice(0, 2);
    const part2 = sliced.slice(2, 5);
    const part3 = sliced.slice(5, 8);
    const part4 = sliced.slice(8, 9);

    return [part1, part2, part3].filter(Boolean).join('.') + (part4 ? `-${part4}` : '');
}

function formatNumberYear(digits) {
    if (digits.length <= YEAR_LENGTH) return digits;

    const year = digits.slice(-YEAR_LENGTH);
    const number = digits.slice(0, -YEAR_LENGTH).padStart(PADDED_NUMBER_LENGTH, '0');
    return `${number}/${year}`;
}
