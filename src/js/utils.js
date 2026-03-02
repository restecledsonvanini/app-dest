// Utility helpers shared across tools

// aceita datas no formato brasileiro e retorna um objeto Date ou null
function parseBRDate(dateStr) {
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    if (year < 1900 || year > 2100) return null;

    return new Date(year, month - 1, day);
}

function formatBRDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// mostra feedback visual genérico de "copiado"
function showCopyFeedback() {
    const existing = document.querySelector('[data-feedback]');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.setAttribute('data-feedback', 'true');
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #16c76b;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    feedback.innerText = 'Copiado!';
    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => feedback.remove(), 300);
    }, 1500);
}

// Habilita/Desabilita os botões de ação após um resultado
function enableActionButtons(id) {
    const box = document.getElementById(id);
    if (box) {
        const panel = box.closest('.tool-panel');
        if (panel) {
            const isSuccess = box.classList.contains('info');
            panel.querySelectorAll('.btn-clear').forEach(b => b.removeAttribute('disabled'));
            panel.querySelectorAll('.btn-copy').forEach(b => {
                if (isSuccess) b.removeAttribute('disabled');
                else b.setAttribute('disabled', 'true');
            });
        }
    }
}

function clearResult(id) {
    const box = document.getElementById(id);
    if (box) {
        box.innerHTML = '';
        // remove any stored result value
        try { delete box.dataset.result; } catch (e) {}
        box.className = 'result-box';
        // also clear inputs within the same tool-panel (if any) and focus first input
        const panel = box.closest('.tool-panel');
        if (panel) {
            const inputs = panel.querySelectorAll('input, select, textarea');
            if (inputs.length) {
                inputs.forEach(i => i.value = '');
                // focus first input for quick re-entry
                const first = inputs[0];
                try { first.focus(); } catch (e) {}
            }
            // disable copy/clear buttons
            panel.querySelectorAll('.btn-copy, .btn-clear').forEach(b => b.setAttribute('disabled', 'true'));
        } else {
            // fallback: try common input ids derived from result id
            const map = {
                'cpf-result': 'input-cpf',
                'cnpj-add-result': 'input-cnpj-add',
                'remove-mask-result': 'input-remove-mask',
                'eprotocolo-result': 'input-eprotocolo',
                'gms-result': 'input-gms-number',
                'date-result': 'input-date-start',
                'days-result': 'input-date-start-days'
            };
            const inputId = map[id];
            if (inputId) {
                const input = document.getElementById(inputId);
                if (input) { input.value = ''; try { input.focus(); } catch (e) {} }
            }
        }
    }
}

// Sanitiza campos para aceitar apenas dígitos (remove tudo o que não for número)
function attachNumericSanitizer(id) {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '');
    });
}

// attach sanitization to the list of known numeric fields
// NOTE: 'input-remove-mask', 'input-cpf', 'input-cnpj', 'input-cnpj-add' intentionally omitted so we preserve mask chars
['input-eprotocolo', 'input-gms-number', 'input-gms-year']
     .forEach(id => attachNumericSanitizer(id));
// date inputs are allowed only digits and slash to ease manual typing
function attachDateSanitizer(id) {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9\\/]/g, '');
    });
}

['input-date-start', 'input-date-start-days', 'input-date-final'].forEach(id => attachDateSanitizer(id));

