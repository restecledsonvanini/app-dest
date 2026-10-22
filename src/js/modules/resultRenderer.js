/**
 * modules/resultRenderer.js — Renderização comum para os resultados de ferramentas.
 * Centraliza o comportamento de atualização do resultBox e dos botões de ação.
 */

import { updateActionButtons } from './ui.js';

export function escapeHtml(value) {
    const str = value === null || value === undefined ? '' : String(value);
    return str.replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function sanitizeHtmlForDom(value) {
    if (typeof value !== 'string') return '';

    return value
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
        .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '');
}

function setResult(resultBox, html, stateClass, dataResult = null) {
    if (!resultBox) return;

    const safeHtml = sanitizeHtmlForDom(String(html ?? ''));
    resultBox.innerHTML = safeHtml;
    resultBox.className = `result-box ${stateClass}`;

    try {
        if (dataResult !== null) {
            resultBox.dataset.result = String(dataResult);
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
    setResult(resultBox, escapeHtml(msg), 'error');

export const ioHtml = (input, output) =>
    `<div class="res-col"><small>Entrada:</small><strong>${escapeHtml(input)}</strong></div>` +
    `<div class="res-sep"></div>` +
    `<div class="res-col"><small>Saída:</small><strong>${escapeHtml(output)}</strong></div>`;
