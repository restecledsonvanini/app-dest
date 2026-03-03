/**
 * toolHandlers.js — Mapa de handlers para cada ferramenta.
 *
 * Cada handler recebe (formData: FormData, resultBox: HTMLElement) e
 * escreve o resultado diretamente no resultBox. Não usa document.getElementById.
 *
 * Fase 3: as funções são chamadas pelo roteador de submit em main.js,
 * que passa o FormData lido dos inputs com atributo `name`.
 */

import { stripMask, formatCNPJ, formatCPF, formatEProtocolo, formatGMS } from './formatters.js';
import { isValidCNPJ } from './validators.js';
import { parseBRDate, formatBRDate, calcEndDate, calcDaysStatus } from './dateUtils.js';
import { updateActionButtons } from './ui.js';

// ─── Helpers internos ────────────────────────────────────────────────────────

function setResult(resultBox, html, stateClass, dataResult = null) {
    resultBox.innerHTML = html;
    resultBox.className = `result-box ${stateClass}`;
    try {
        if (dataResult !== null) resultBox.dataset.result = dataResult;
        else delete resultBox.dataset.result;
    } catch (e) { /* ignorar */ }
    updateActionButtons(resultBox);
}

const ok = (resultBox, html, dataResult) => setResult(resultBox, html, 'info', dataResult);
const err = (resultBox, msg)             => setResult(resultBox, msg, 'error');

/** HTML padrão para exibir entrada → saída lado a lado */
const ioHtml = (input, output) =>
    `<div class="res-col"><small>Entrada:</small><strong>${input}</strong></div>` +
    `<div class="res-sep"></div>` +
    `<div class="res-col"><small>Saída:</small><strong>${output}</strong></div>`;

// ─── Handlers das ferramentas ─────────────────────────────────────────────────

function handleRemoveMask(data, resultBox) {
    const value = (data.get('value') || '').trim();
    if (!value) return err(resultBox, 'Digite um valor para remover a máscara');
    const result = stripMask(value);
    if (!result) return err(resultBox, 'Nenhum número encontrado no valor digitado');
    ok(resultBox, ioHtml(value, result), result);
}

function handleAddMaskEprotocolo(data, resultBox) {
    const clean = stripMask(data.get('value') || '');
    if (!clean) return err(resultBox, 'Digite apenas números');
    if (clean.length !== 9) return err(resultBox, `Digite 9 dígitos (você digitou ${clean.length})`);
    const formatted = formatEProtocolo(clean);
    ok(resultBox, ioHtml(clean, formatted), formatted);
}

function handleAddMaskGMS(data, resultBox) {
    const cleanNumber = stripMask(data.get('gms_number') || '');
    const cleanYear   = stripMask(data.get('gms_year')   || '');
    if (!cleanNumber) return err(resultBox, 'Digite o número GMS');
    if (!cleanYear)   return err(resultBox, 'Digite o ano');
    if (cleanYear.length !== 4) return err(resultBox, `Ano deve ter 4 dígitos (você digitou ${cleanYear.length})`);
    const formatted = formatGMS(cleanNumber, cleanYear);
    ok(resultBox, ioHtml(`${cleanNumber} / ${cleanYear}`, formatted), formatted);
}

function handleAddMaskCPF(data, resultBox) {
    const clean = stripMask(data.get('cpf') || '');
    if (!clean) return err(resultBox, 'Digite apenas números');
    if (clean.length !== 11) return err(resultBox, `CPF deve ter 11 dígitos (você digitou ${clean.length})`);
    const formatted = formatCPF(clean);
    ok(resultBox, ioHtml(clean, formatted), formatted);
}

function handleAddMaskCNPJ(data, resultBox) {
    const clean = stripMask(data.get('cnpj') || '');
    if (!clean) return err(resultBox, 'Digite apenas números');
    if (clean.length !== 14) return err(resultBox, `CNPJ deve ter 14 dígitos (você digitou ${clean.length})`);
    const formatted = formatCNPJ(clean);
    ok(resultBox, ioHtml(clean, formatted), formatted);
}

function handleCalculateDateValidity(data, resultBox) {
    const startValue = (data.get('date_start') || '').trim();
    const unit       = data.get('time_unit') || '';
    const duration   = parseInt(data.get('duration'), 10);

    if (!startValue)             return err(resultBox, 'Digite a data de início');
    const startDate = parseBRDate(startValue);
    if (!startDate)              return err(resultBox, 'Data inicial inválida (formato DD/MM/YYYY)');
    if (!unit)                   return err(resultBox, 'Selecione a unidade de tempo (Meses ou Anos)');
    if (!duration || duration < 1) return err(resultBox, 'Digite uma duração válida (maior que 0)');

    const endDate = calcEndDate(startDate, unit, duration);
    const formattedResult = formatBRDate(endDate);
    ok(
        resultBox,
        `<div class="res-col"><small>Data Inicial</small><strong>${startValue}</strong></div>` +
        `<div class="res-sep"></div>` +
        `<div class="res-col"><small>Data Final</small><strong>${formattedResult}</strong></div>`,
        formattedResult
    );
}

function handleCalculateDaysRemaining(data, resultBox) {
    const startVal = (data.get('date_start') || '').trim();
    const finalVal = (data.get('date_final') || '').trim();

    if (!startVal || !finalVal) return err(resultBox, 'Selecione data inicial e final');
    const startDate = parseBRDate(startVal);
    const finalDate = parseBRDate(finalVal);
    if (!startDate || !finalDate) return err(resultBox, 'Datas inválidas (use DD/MM/YYYY)');

    const { daysDiff, statusText, statusColor } = calcDaysStatus(startDate, finalDate);

    if (daysDiff < 0) {
        err(resultBox,
            `<div class="res-col"><small>Erro</small><strong>Período invertido (${Math.abs(daysDiff)} dias)</strong></div>`
        );
    } else {
        ok(
            resultBox,
            `<div style="display:flex;flex-direction:column;width:100%;gap:12px;">
                <div style="display:flex;justify-content:space-around;width:100%;align-items:center;">
                    <div class="res-col"><small>Período</small><strong>de ${formatBRDate(startDate)} até ${formatBRDate(finalDate)}</strong></div>
                    <div class="res-sep"></div>
                    <div class="res-col"><small>Total</small><strong>${daysDiff} dia(s)</strong></div>
                </div>
                <div style="text-align:center;padding-top:10px;border-top:1px solid #e2e8f0;font-size:1.05em;">
                    <strong style="color:${statusColor};">${statusText}</strong>
                </div>
            </div>`,
            `Período: ${formatBRDate(startDate)} a ${formatBRDate(finalDate)} (${daysDiff} dias) | ${statusText}`
        );
    }
}

async function handleSearchCNPJ(data, resultBox) {
    const form      = resultBox.closest('.form-tool');
    const loadingEl = form?.querySelector('.loading');
    const cnpj      = (data.get('cnpj') || '').trim();
    const cleanCNPJ = stripMask(cnpj);

    if (!cleanCNPJ)              return err(resultBox, 'Digite um CNPJ válido (14 dígitos)');
    if (cleanCNPJ.length !== 14) return err(resultBox, `CNPJ deve ter 14 dígitos (você digitou ${cleanCNPJ.length})`);
    if (!isValidCNPJ(cleanCNPJ)) return err(resultBox, 'CNPJ inválido (falha na validação)');

    if (loadingEl) loadingEl.style.display = 'block';
    resultBox.innerHTML = '';

    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
        if (!response.ok) throw new Error('CNPJ não encontrado na base de dados');
        const d = await response.json();

        ok(
            resultBox,
            `<div style="text-align:left;width:100%;font-size:0.95em;line-height:1.5;">
                <strong style="font-size:1.1em;color:var(--primary);">${d.nome_fantasia || d.razao_social}</strong><br>
                <strong>CNPJ:</strong> ${formatCNPJ(cleanCNPJ)}<br>
                <strong>Situação:</strong> ${d.descricao_situacao || 'N/A'}<br>
                <strong>Natureza Jurídica:</strong> ${d.descricao_natureza_juridica || 'N/A'}<br>
                <strong>Endereço:</strong> ${d.logradouro || ''} ${d.numero || ''}, ${d.bairro || ''}<br>
                ${d.municipio || ''} - ${d.uf || ''}
            </div>`,
            `${d.nome_fantasia || d.razao_social} - ${formatCNPJ(cleanCNPJ)}`
        );
    } catch (error) {
        err(resultBox, `Erro: ${error.message}`);
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// ─── Mapa de handlers: data-tool → função ────────────────────────────────────

export const toolHandlerMap = {
    removeMask:               handleRemoveMask,
    addMaskEprotocolo:        handleAddMaskEprotocolo,
    addMaskGMS:               handleAddMaskGMS,
    addMaskCPF:               handleAddMaskCPF,
    addMaskCNPJ:              handleAddMaskCNPJ,
    calculateDateValidity:    handleCalculateDateValidity,
    calculateDaysRemaining:   handleCalculateDaysRemaining,
    searchCNPJ:               handleSearchCNPJ,
};
