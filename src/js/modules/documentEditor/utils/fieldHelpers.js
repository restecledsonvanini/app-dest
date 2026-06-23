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

    if (normalized.endsWith('_extenso')) {
        return null;
    }

    if (normalized.includes('protocolo') || normalized.includes('procolo')) {
        return 'protocol';
    }

    if (normalized.includes('cnpj')) {
        return 'cnpj';
    }

    if (normalized.includes('cpf')) {
        return 'cpf';
    }

    if (normalized.includes('valor') || normalized.includes('custo') || normalized.includes('investimento')) {
        return 'currency';
    }

    if (normalized.includes('apostil') || normalized.includes('aditivo')) {
        return 'numberYear';
    }

    if (normalized.includes('data') || normalized.includes('vigencia') || normalized.includes('vigência')) {
        return 'date';
    }

    return null;
}

export function getFieldPlaceholder(field) {
    const label = formatFieldLabel(field.name).toLowerCase();
    const mask = getFieldMask(field.name);

    if (mask === 'protocol') return '24.471.673-3';
    if (mask === 'numberYear') return '0015/2026';
    if (mask === 'currency') return 'R$ 0,00';
    if (mask === 'date' || field.type === 'date') return 'dd/mm/aaaa';
    if (mask === 'cpf') return '000.000.000-00';
    if (mask === 'cnpj') return '00.000.000/0000-00';
    return `Digite ${label}`;
}

export function applyFieldMask(fieldName, value) {
    if (value === undefined || value === null) return '';
    const mask = getFieldMask(fieldName);

    if (!mask) {
        return String(value);
    }

    if (mask === 'protocol') {
        const digits = String(value || '').replace(/\D/g, '');
        return formatProtocol(digits);
    }

    if (mask === 'numberYear') {
        const digits = String(value || '').replace(/\D/g, '');
        return formatNumberYear(digits);
    }

    if (mask === 'date') {
        return formatDateInput(value);
    }

    if (mask === 'currency') {
        return formatBRL(value);
    }

    if (mask === 'cpf') {
        const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
        return formatCPF(digits);
    }

    if (mask === 'cnpj') {
        const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
        return formatCNPJ(digits);
    }

    return String(value);
}

function formatDateInput(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function formatBRL(value) {
    const digits = String(value || '').replace(/[^\d]/g, '');
    const padded = digits.padStart(3, '0');
    const cents = padded.slice(-2);
    let integer = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    integer = integer.replace(/^0+(?=\d)/, '');
    if (integer === '') integer = '0';
    return `R$ ${integer},${cents}`;
}

/**
 * Formata CPF: 000.000.000-00
 */
function formatCPF(digits) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
function formatCNPJ(digits) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Opções para campo select.
 * Não inclui "Selecione..." — o placeholder já é gerado em formFactory.js (createSelect).
 */
export function getFieldOptions(field, savedOptions = []) {
    if (field.kind !== 'select') return [];
    if (savedOptions.length) return savedOptions;

    // Sem opções salvas → retorna apenas a opção padrão do campo
    return [
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
