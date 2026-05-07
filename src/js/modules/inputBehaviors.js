/**
 * inputBehaviors.js — Comportamentos de entrada do usuário.
 * Gerencia sanitização e auto-formatação de campos de input.
 * Centraliza os listeners que antes estavam espalhados em utils.js e dates.js.
 */

/** Auto-formata campo de texto para DD/MM/YYYY enquanto o usuário digita. */
function autoFormatDate(e) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 8) v = v.substring(0, 8);
    if (v.length >= 5) {
        v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
    } else if (v.length >= 3) {
        v = v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
    }
    e.target.value = v;
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

    const dateInputs = document.querySelectorAll('[data-behavior="date-format"], #input-date-start, #input-date-start-days, #input-date-final');
    dateInputs.forEach(el => {
        el.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9/]/g, '');
            autoFormatDate(e);
        });
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
