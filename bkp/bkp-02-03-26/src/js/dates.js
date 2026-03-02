// date computation tools

function calculateDateValidity() {
    const dateStartInput = document.getElementById('input-date-start');
    const unitSelect = document.getElementById('select-unit');
    const durationInput = document.getElementById('input-duration');
    const resultBox = document.getElementById('date-result');
    const startValue = dateStartInput.value.trim();
    const unit = unitSelect.value;
    const duration = parseInt(durationInput.value, 10);

    if (!startValue) {
        resultBox.innerHTML = 'Digite a data de início';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }

    const startDate = parseBRDate(startValue);
    if (!startDate) {
        resultBox.innerHTML = 'Data inicial inválida (formato DD/MM/YYYY)';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }

    if (!unit) {
        resultBox.innerHTML = 'Selecione a unidade de tempo (Meses ou Anos)';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }

    if (!duration || duration < 1) {
        resultBox.innerHTML = 'Digite uma duração válida (maior que 0)';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }

    let endDate = new Date(startDate);
    if (unit === 'months') {
        endDate.setMonth(endDate.getMonth() + duration);
        endDate.setDate(endDate.getDate() - 1);
    } else if (unit === 'years') {
        endDate.setFullYear(endDate.getFullYear() + duration);
    }

    const formattedResult = formatBRDate(endDate);
    resultBox.innerHTML = `<div class="res-col"><small>Data Inicial</small><strong>${startValue}</strong></div><div class="res-sep"></div><div class="res-col"><small>Data Final</small><strong>${formattedResult}</strong></div>`;
    try { resultBox.dataset.result = formattedResult; } catch (e) {}
    resultBox.className = 'result-box info'; enableActionButtons(resultBox.id);
    dateStartInput.value = '';
    unitSelect.value = '';
    durationInput.value = '';
    dateStartInput.focus();
}

function copyDateResult() {
    const box = document.getElementById('date-result');
    if (!box) return;
    const value = box.dataset?.result || box.innerText || '';
    if (value && value.includes('/')) { navigator.clipboard.writeText(value); showCopyFeedback(); }
}

function calculateDaysRemaining() {
    const startInput = document.getElementById('input-date-start-days');
    const finalInput = document.getElementById('input-date-final');
    const resultBox = document.getElementById('days-result');
    const startVal = startInput.value.trim();
    const finalVal = finalInput.value.trim();

    if (!startVal || !finalVal) {
        resultBox.innerHTML = 'Selecione data inicial e final';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }

    const startDate = parseBRDate(startVal);
    const finalDate = parseBRDate(finalVal);
    if (!startDate || !finalDate) {
        resultBox.innerHTML = 'Datas inválidas (use DD/MM/YYYY)';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }

    const diffTime = finalDate - startDate;
    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expirationDiffTime = finalDate - today;
    const daysUntilExpiration = Math.ceil(expirationDiffTime / (1000 * 60 * 60 * 24));
    
    let statusText = '';
    let statusColor = '';
    if (daysUntilExpiration < 0) {
        statusText = `Vencido há ${Math.abs(daysUntilExpiration)} dia(s)`;
        statusColor = '#dc2626'; // red
    } else if (daysUntilExpiration === 0) {
        statusText = 'Vence hoje';
        statusColor = '#ea580c'; // orange
    } else {
        statusText = `Vence em ${daysUntilExpiration} dia(s)`;
        if (daysUntilExpiration <= 30) statusColor = '#ea580c'; // orange
        else if (daysUntilExpiration <= 60) statusColor = '#eab308'; // yellow
        else statusColor = '#16a34a'; // green
    }

    let resultHTML = '';
    if (daysDiff < 0) {
        resultHTML = `<div class="res-col"><small>Erro</small><strong>Período invertido (${Math.abs(daysDiff)} dias)</strong></div>`;
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
    } else {
        resultHTML = `
            <div style="display:flex; flex-direction:column; width:100%; gap:12px;">
                <div style="display:flex; justify-content:space-around; width:100%; align-items:center;">
                    <div class="res-col"><small>Período</small><strong>de ${formatBRDate(startDate)} até ${formatBRDate(finalDate)}</strong></div>
                    <div class="res-sep"></div>
                    <div class="res-col"><small>Total</small><strong>${daysDiff} dia(s)</strong></div>
                </div>
                <div style="text-align:center; padding-top:10px; border-top:1px solid #e2e8f0; font-size:1.05em;">
                    <strong style="color: ${statusColor};">${statusText}</strong>
                </div>
            </div>
        `;
        resultBox.className = 'result-box info'; enableActionButtons(resultBox.id);
    }

    resultBox.innerHTML = resultHTML;
    try { resultBox.dataset.result = `Período: ${formatBRDate(startDate)} a ${formatBRDate(finalDate)} (${daysDiff} dias) | ${statusText}`; } catch (e) {}
    startInput.value = '';
    finalInput.value = '';
    startInput.focus();
}

function copyDaysResult() {
    const box = document.getElementById('days-result');
    if (!box) return;
    const value = box.dataset?.result || box.innerText || '';
    if (value) { navigator.clipboard.writeText(value); showCopyFeedback(); }
}

// Enter key listeners for date tools
['input-date-start','input-duration'].forEach(id => {
    document.getElementById(id)?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateDateValidity();
    });
});

['input-date-start-days','input-date-final'].forEach(id => {
    document.getElementById(id)?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateDaysRemaining();
    });
});

// Auto-format date inputs as DD/MM/YYYY
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

['input-date-start', 'input-date-start-days', 'input-date-final'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', autoFormatDate);
});
