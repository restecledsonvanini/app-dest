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
    resultBox.innerHTML = formattedResult;
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

    let resultHTML = '';
    if (daysDiff < 0) {
        resultHTML = `<strong>Período invertido (${Math.abs(daysDiff)} dias)</strong>`;
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
    } else {
        resultHTML = `<strong>${daysDiff} dia(s)</strong> de ${formatBRDate(startDate)} até ${formatBRDate(finalDate)}`;
        resultBox.className = 'result-box info'; enableActionButtons(resultBox.id);
        // apply color warnings
        if (daysDiff <= 30) resultBox.classList.add('warning-red');
        else if (daysDiff <= 60) resultBox.classList.add('warning-orange');
        else if (daysDiff <= 90) resultBox.classList.add('warning-yellow');
        else resultBox.classList.add('warning-green');
    }

    resultBox.innerHTML = resultHTML;
    try { resultBox.dataset.result = resultHTML.replace(/<[^>]+>/g, '').trim(); } catch (e) {}
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
