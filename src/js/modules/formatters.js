/**
 * formatters.js — Módulo de formatação/transformação puras.
 * Sem acesso ao DOM. Entram strings, saem strings.
 */

/** Remove todos os caracteres não-numéricos de uma string. */
export const stripMask = (value) => value.replace(/\D/g, '');

/** Aplica a máscara padrão de CNPJ: XX.XXX.XXX/XXXX-XX */
export const formatCNPJ = (cnpj) =>
    cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

/** Aplica a máscara padrão de CPF: XXX.XXX.XXX-XX */
export const formatCPF = (cpf) =>
    cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

/**
 * Aplica a máscara de eProtocolo: XX.XXX.XXX-X
 * @param {string} digits — 9 dígitos sem máscara
 */
export const formatEProtocolo = (digits) =>
    `${digits.substring(0, 2)}.${digits.substring(2, 5)}.${digits.substring(5, 8)}-${digits.substring(8, 9)}`;

/**
 * Formata número GMS: número/ano
 * @param {string} number
 * @param {string} year
 */
export const formatGMS = (number, year) => `${number}/${year}`;
