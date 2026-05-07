/**
 * config/institution.js — Dados institucionais centralizados
 * Único ponto de verdade para branding, logos, textos de header
 * @author Auditoria de Código 2026-04-09
 */

export const INSTITUTION = {
    // Identidade Visual
    name: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA',
    department: 'CENTRO DE CONTRATOS E CONVÊNIOS',
    logoUrl: '/src/images/brasao_do_Parana.svg.png',

    // Header padrão para documentos (com placeholders)
    defaultHeader: {
        mainText: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA',
        subtitle: 'CENTRO DE CONTRATOS E CONVÊNIOS – TERMO {{tipo_termo}} Nº {{num_termo}}',
    },

    // Preamble padrão (vazio por padrão, pode ser personalizado)
    defaultPreamble: '',

    // Cores associadas (para futura extensão de temas)
    brand: {
        primary: '#0b3d91',
        secondary: '#ea580c',
        success: '#16a34a',
        warning: '#eab308',
        danger: '#dc2626',
    }
};

/**
 * Construtor de header com validação:
 * @param {string} tipo - tipo de termo
 * @param {string} numero - número do termo
 * @returns {string} header formatado
 */
export function buildHeaderText(tipo = '', numero = '') {
    const mainText = INSTITUTION.defaultHeader.mainText;
    const subtitle = INSTITUTION.defaultHeader.subtitle
        .replace('{{tipo_termo}}', tipo || 'DE APOSTILAMENTO')
        .replace('{{num_termo}}', numero || '');
    return `${mainText}\n${subtitle}`;
}
