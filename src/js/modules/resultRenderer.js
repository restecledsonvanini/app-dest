/**
 * modules/resultRenderer.js — Renderização comum para os resultados de ferramentas.
 * Centraliza o comportamento de atualização do resultBox e dos botões de ação.
 */

import { updateActionButtons } from './ui.js';

function setResult(resultBox, html, stateClass, dataResult = null) {
    if (!resultBox) return;

    resultBox.innerHTML = html;
    resultBox.className = `result-box ${stateClass}`;

    try {
        if (dataResult !== null) {
            resultBox.dataset.result = dataResult;
        } else {
            delete resultBox.dataset.result;
        }
    } catch (e) {
        // Ignorar problemas com dataset em navegadores antigos ou elementos não compatíveis.
    }

    updateActionButtons(resultBox);
}

export const ok = (resultBox, html, dataResult = null) =>
    setResult(resultBox, html, 'info', dataResult);

export const err = (resultBox, msg) =>
    setResult(resultBox, msg, 'error');

export const ioHtml = (input, output) =>
    `<div class="res-col"><small>Entrada:</small><strong>${input}</strong></div>` +
    `<div class="res-sep"></div>` +
    `<div class="res-col"><small>Saída:</small><strong>${output}</strong></div>`;
