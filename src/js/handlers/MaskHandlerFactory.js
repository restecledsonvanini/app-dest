/**
 * handlers/MaskHandlerFactory.js — Factory Pattern para reduzir duplicação
 * Reduz 6 handlers similares para 1 gerador parametrizável
 * @author Auditoria de Código 2026-04-09
 */

import { stripMask } from '../modules/formatters.js';
import { MSG } from '../config/messages.js';
import { ok, err, ioHtml } from '../modules/resultRenderer.js';

/**
 * Cria um handler de máscara reutilizável
 * @param {Object} config - configuração do handler
 * @returns {Function} handler pronto para toolHandlerMap
 * 
 * Exemplo de uso:
 * createMaskHandler({
 *     inputKey: 'cpf',
 *     maxLength: 11,
 *     formatter: formatCPF,
 *     fieldLabel: 'CPF'
 * })
 */
export function createMaskHandler(config) {
    const {
        inputKey,
        maxLength,
        formatter,
        fieldLabel,
        validator = null // optional custom validator
    } = config;

    return (data, resultBox) => {
        const value = (data.get(inputKey) || '').trim();

        if (!value) {
            return err(resultBox, `Digite ${fieldLabel.toLowerCase()}`);
        }

        const clean = stripMask(value);
        if (!clean) {
            return err(resultBox, MSG.mask.onlyNumbers);
        }

        // Validar comprimento
        if (clean.length !== maxLength) {
            return err(resultBox, MSG.mask.digitCount(maxLength, clean.length));
        }

        // Validar com validator customizado (se fornecido)
        if (validator && !validator(clean)) {
            return err(resultBox, MSG.mask.invalid);
        }

        const formatted = formatter(clean);
        ok(resultBox, ioHtml(clean, formatted), formatted);
    };
}

/**
 * Cria um handler de remoção de máscara
 * Genérico, reutilizável
 */
export function createRemoveMaskHandler() {
    return (data, resultBox) => {
        const value = (data.get('value') || '').trim();
        if (!value) {
            return err(resultBox, MSG.mask.removeError);
        }
        const result = stripMask(value);
        if (!result) {
            return err(resultBox, MSG.mask.notFound);
        }
        ok(resultBox, ioHtml(value, result), result);
    };
}
