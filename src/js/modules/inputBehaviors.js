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
    // Campos que aceitam somente dígitos
    ['input-eprotocolo', 'input-gms-number', 'input-gms-year'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '');
        });
    });

    // Campos de data: aceita apenas dígitos e barras, com auto-formatação DD/MM/YYYY
    ['input-date-start', 'input-date-start-days', 'input-date-final'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', (e) => {
            // sanitiza primeiro (remove caracteres inválidos)
            e.target.value = e.target.value.replace(/[^0-9/]/g, '');
            // depois auto-formata
            autoFormatDate(e);
        });
    });
}
