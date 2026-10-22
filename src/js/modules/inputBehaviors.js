/**
 * inputBehaviors.js — Comportamentos de entrada do usuário.
 * Gerencia sanitização e auto-formatação de campos de input.
 * Centraliza os listeners que antes estavam espalhados em utils.js e dates.js.
 */

export function formatDateInputValue(value, caretPosition = String(value || '').length) {
    const source = String(value || '');
    const digitsBeforeCursor = source.slice(0, caretPosition).replace(/\D/g, '').length;
    const digits = source.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;

    if (digits.length > 4) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    let digitCount = 0;
    let caret = 0;
    while (caret < formatted.length && digitCount < digitsBeforeCursor) {
        if (/\d/.test(formatted[caret])) digitCount += 1;
        caret += 1;
    }

    return { value: formatted, caret };
}

function autoFormatDate(event) {
    const input = event.target;
    const selectionStart = input.selectionStart ?? input.value.length;
    const formatted = formatDateInputValue(input.value, selectionStart);
    if (input.value === formatted.value) return;

    input.value = formatted.value;
    input.setSelectionRange(formatted.caret, formatted.caret);
}

/**
 * Inicializa todos os comportamentos de entrada.
 * Chamado uma vez pelo main.js no DOMContentLoaded.
 */
export function initInputBehaviors() {
    const digitInputs = document.querySelectorAll('[data-behavior="digits-only"], #input-eprotocolo, #input-gms-number, #input-gms-year');
    digitInputs.forEach(el => {
        el.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '');
        });
    });

    const dateInputs = document.querySelectorAll(
        '[data-behavior="date-format"], #input-date-start, #input-expiration-signature, #input-date-start-days, #input-date-final'
    );
    dateInputs.forEach(el => {
        el.addEventListener('input', autoFormatDate);
    });

    function autoFormatCurrency(e) {
        let digits = e.target.value.replace(/\D/g, '');
        if (!digits) {
            e.target.value = '';
            return;
        }

        if (digits.length === 1) {
            digits = '0' + digits;
        }
        if (digits.length === 2) {
            e.target.value = `R$ 0,${digits}`;
            return;
        }

        const cents = digits.slice(-2);
        let reais = digits.slice(0, -2).replace(/^0+/, '');
        if (!reais) reais = '0';
        reais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        e.target.value = `R$ ${reais},${cents}`;
    }

    const currencyInputs = document.querySelectorAll('[data-behavior="currency-format"]');
    currencyInputs.forEach(el => {
        el.addEventListener('input', autoFormatCurrency);
    });
}
