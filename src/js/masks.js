// ---- mask related utilities ----

function removeMask() {
    const input = document.getElementById('input-remove-mask');
    const resultBox = document.getElementById('remove-mask-result');
    const value = input.value.trim();

    if (!value) {
        resultBox.innerHTML = 'Digite um valor para remover a máscara';
        resultBox.className = 'result-box empty'; enableActionButtons(resultBox.id);
        return;
    }
    const result = value.replace(/\D/g, '');
    if (!result) {
        resultBox.innerHTML = 'Nenhum número encontrado no valor digitado';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    resultBox.innerHTML = `<div class="res-col"><small>Entrada:</small><strong>${value}</strong></div><div class="res-sep"></div><div class="res-col"><small>Saída:</small><strong>${result}</strong></div>`;
    resultBox.className = 'result-box info'; enableActionButtons(resultBox.id);
    try { resultBox.dataset.result = result; } catch (e) {}
    input.value = '';
    input.focus();
}

function copyRemoveMaskResult() {
    const box = document.getElementById('remove-mask-result');
    if (!box) return;
    const value = box.dataset?.result || (() => {
        const txt = box.innerText || '';
        const idx = txt.indexOf('Saída:');
        return idx >= 0 ? txt.slice(idx + 6).trim() : txt.trim();
    })();
    if (value && !value.includes('Digite') && !value.includes('Nenhum')) {
        navigator.clipboard.writeText(value);
        showCopyFeedback();
    }
}

function addMaskEprotocolo() {
    const input = document.getElementById('input-eprotocolo');
    const resultBox = document.getElementById('eprotocolo-result');
    const cleanInput = input.value.replace(/\D/g, '');

    if (!cleanInput) {
        resultBox.innerHTML = 'Digite apenas números';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    if (cleanInput.length !== 9) {
        resultBox.innerHTML = `Digite 9 dígitos (você digitou ${cleanInput.length})`;
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    const formatted = `${cleanInput.substring(0, 2)}.${cleanInput.substring(2, 5)}.${cleanInput.substring(5, 8)}-${cleanInput.substring(8, 9)}`;
    resultBox.innerHTML = `<div class="res-col"><small>Entrada:</small><strong>${cleanInput}</strong></div><div class="res-sep"></div><div class="res-col"><small>Saída:</small><strong>${formatted}</strong></div>`;
    resultBox.className = 'result-box info'; enableActionButtons(resultBox.id);
    try { resultBox.dataset.result = formatted; } catch (e) {}
    input.value = '';
    input.focus();
}

function copyEprotocoResult() {
    const box = document.getElementById('eprotocolo-result');
    if (!box) return;
    const value = box.dataset?.result || (() => {
        const txt = box.innerText || '';
        const idx = txt.indexOf('Saída:');
        return idx >= 0 ? txt.slice(idx + 6).trim() : txt.trim();
    })();
    if (value && value.includes('.')) { navigator.clipboard.writeText(value); showCopyFeedback(); }
}

function addMaskGMS() {
    const numberInput = document.getElementById('input-gms-number');
    const yearInput = document.getElementById('input-gms-year');
    const resultBox = document.getElementById('gms-result');
    const cleanNumber = numberInput.value.replace(/\D/g, '');
    const cleanYear = yearInput.value.replace(/\D/g, '');
    if (!cleanNumber) {
        resultBox.innerHTML = 'Digite o número GMS';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    if (!cleanYear) {
        resultBox.innerHTML = 'Digite o ano';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    if (cleanYear.length !== 4) {
        resultBox.innerHTML = `Ano deve ter 4 dígitos (você digitou ${cleanYear.length})`;
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    const formatted = `${cleanNumber}/${cleanYear}`;
    resultBox.innerHTML = `<div class="res-col"><small>Entrada:</small><strong>${cleanNumber} / ${cleanYear}</strong></div><div class="res-sep"></div><div class="res-col"><small>Saída:</small><strong>${formatted}</strong></div>`;
    resultBox.className = 'result-box info'; enableActionButtons(resultBox.id);
    try { resultBox.dataset.result = formatted; } catch (e) {}
    numberInput.value = '';
    yearInput.value = '';
    numberInput.focus();
}

function copyGMSResult() {
    const box = document.getElementById('gms-result');
    if (!box) return;
    const value = box.dataset?.result || (() => {
        const txt = box.innerText || '';
        const idx = txt.indexOf('Saída:');
        return idx >= 0 ? txt.slice(idx + 6).trim() : txt.trim();
    })();
    if (value && value.includes('/')) { navigator.clipboard.writeText(value); showCopyFeedback(); }
}

function addMaskCPF() {
    const input = document.getElementById('input-cpf');
    const resultBox = document.getElementById('cpf-result');
    const clean = input.value.replace(/\D/g, '');
    if (!clean) {
        resultBox.innerHTML = 'Digite apenas números';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    if (clean.length !== 11) {
        resultBox.innerHTML = `CPF deve ter 11 dígitos (você digitou ${clean.length})`;
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    const formatted = `${clean.substring(0,3)}.${clean.substring(3,6)}.${clean.substring(6,9)}-${clean.substring(9,11)}`;
    resultBox.innerHTML = `<div class="res-col"><small>Entrada:</small><strong>${clean}</strong></div><div class="res-sep"></div><div class="res-col"><small>Saída:</small><strong>${formatted}</strong></div>`;
    resultBox.className = 'result-box info'; enableActionButtons(resultBox.id);
    try { resultBox.dataset.result = formatted; } catch (e) {}
    input.value = '';
    input.focus();
}

function copyCPFResult() {
    const box = document.getElementById('cpf-result');
    if (!box) return;
    const value = box.dataset?.result || (() => {
        const txt = box.innerText || '';
        const idx = txt.indexOf('Saída:');
        return idx >= 0 ? txt.slice(idx + 6).trim() : txt.trim();
    })();
    if (value && value.includes('.')) { navigator.clipboard.writeText(value); showCopyFeedback(); }
}

function addMaskCNPJ() {
    const input = document.getElementById('input-cnpj-add');
    const resultBox = document.getElementById('cnpj-add-result');
    const clean = input.value.replace(/\D/g, '');
    if (!clean) {
        resultBox.innerHTML = 'Digite apenas números';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    if (clean.length !== 14) {
        resultBox.innerHTML = `CNPJ deve ter 14 dígitos (você digitou ${clean.length})`;
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    const formatted = `${clean.substring(0,2)}.${clean.substring(2,5)}.${clean.substring(5,8)}/${clean.substring(8,12)}-${clean.substring(12,14)}`;
    resultBox.innerHTML = `<div class="res-col"><small>Entrada:</small><strong>${clean}</strong></div><div class="res-sep"></div><div class="res-col"><small>Saída:</small><strong>${formatted}</strong></div>`;
    resultBox.className = 'result-box info'; enableActionButtons(resultBox.id);
    try { resultBox.dataset.result = formatted; } catch (e) {}
    input.value = '';
    input.focus();
}

function copyCNPJAddResult() {
    const box = document.getElementById('cnpj-add-result');
    if (!box) return;
    const value = box.dataset?.result || (() => {
        const txt = box.innerText || '';
        const idx = txt.indexOf('Saída:');
        return idx >= 0 ? txt.slice(idx + 6).trim() : txt.trim();
    })();
    if (value && value.includes('/')) { navigator.clipboard.writeText(value); showCopyFeedback(); }
}

// enter key handlers for mask section
['input-remove-mask','input-eprotocolo','input-gms-year','input-cpf','input-cnpj-add']
    .forEach(id => {
        document.getElementById(id)?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                switch(id) {
                    case 'input-remove-mask': removeMask(); break;
                    case 'input-eprotocolo': addMaskEprotocolo(); break;
                    case 'input-gms-year': addMaskGMS(); break;
                    case 'input-cpf': addMaskCPF(); break;
                    case 'input-cnpj-add': addMaskCNPJ(); break;
                }
            }
        });
    });
