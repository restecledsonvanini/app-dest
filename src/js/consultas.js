// consulta cnpj

async function searchCNPJ() {
    const cnpjInput = document.getElementById('input-cnpj');
    const resultBox = document.getElementById('cnpj-result');
    const loading = document.getElementById('cnpj-loading');
    const cnpj = cnpjInput.value.trim();
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (!cleanCNPJ) {
        resultBox.innerHTML = 'Digite um CNPJ válido (14 dígitos)';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    if (cleanCNPJ.length !== 14) {
        resultBox.innerHTML = `CNPJ deve ter 14 dígitos (você digitou ${cleanCNPJ.length})`;
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    if (!isValidCNPJ(cleanCNPJ)) {
        resultBox.innerHTML = 'CNPJ inválido (falha na validação)';
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
        return;
    }
    loading.style.display = 'block';
    resultBox.innerHTML = '';

    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
        if (!response.ok) {
            throw new Error('CNPJ não encontrado na base de dados');
        }
        const data = await response.json();
        const resultado = `
            <div style="text-align:left; width: 100%; font-size: 0.95em; line-height: 1.5;">
                <strong style="font-size: 1.1em; color: var(--primary);">${data.nome_fantasia || data.razao_social}</strong><br>
                <strong>CNPJ:</strong> ${formatCNPJ(cleanCNPJ)}<br>
                <strong>Situação:</strong> ${data.descricao_situacao || 'N/A'}<br>
                <strong>Natureza Jurídica:</strong> ${data.descricao_natureza_juridica || 'N/A'}<br>
                <strong>Endereço:</strong> ${data.logradouro || ''} ${data.numero || ''}, ${data.bairro || ''}<br>
                ${data.municipio || ''} - ${data.uf || ''}
            </div>
        `;
        resultBox.innerHTML = resultado;
        try { resultBox.dataset.result = (data.nome_fantasia || data.razao_social) + ' - ' + formatCNPJ(cleanCNPJ); } catch (e) {}
        resultBox.className = 'result-box info'; enableActionButtons(resultBox.id);
    } catch (error) {
        resultBox.innerHTML = `Erro: ${error.message}`;
        resultBox.className = 'result-box error'; enableActionButtons(resultBox.id);
    } finally {
        loading.style.display = 'none';
        cnpjInput.value = '';
        cnpjInput.focus();
    }
}

function copyCNPJResult() {
    const box = document.getElementById('cnpj-result');
    if (!box) return;
    const value = box.dataset?.result || box.innerText || '';
    if (value && value.length > 10) { navigator.clipboard.writeText(value); showCopyFeedback(); }
}

function isValidCNPJ(cnpj) {
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    let digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += numbers.charAt(size - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0), 10)) return false;
    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += numbers.charAt(size - i) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1), 10)) return false;
    return true;
}

function formatCNPJ(cnpj) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// enter support for consulta
document.getElementById('input-cnpj')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchCNPJ();
});
