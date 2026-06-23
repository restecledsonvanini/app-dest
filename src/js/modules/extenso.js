/**
 * extenso.js — Módulo de conversão determinística para texto por extenso.
 * ZERO-DEPS, funções puras, testável em Node.js/Vitest.
 * Implementa algoritmos determinísticos sem uso de IA ou bibliotecas externas.
 *
 * @author Equipe DEST · SESP-PR
 * @date 2026-05-05
 * @version 1.0
 */

/**
 * Converte um número inteiro para texto por extenso em português brasileiro.
 * Suporta até trilhões (12 dígitos).
 * @param {number} num — Número inteiro positivo (0 <= num <= 999999999999)
 * @returns {string} — Texto por extenso ou string vazia se inválido
 */
export function numberToWords(num) {
    if (num === 0) return 'zero';
    if (num < 0 || num > 999999999999 || !Number.isInteger(num)) return '';

    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    const escalas = ['', 'mil', 'milhão', 'bilhão', 'trilhão'];

    function converterCentenas(valor) {
        if (valor === 0) return '';

        const centena = Math.floor(valor / 100);
        const resto = valor % 100;
        let texto = '';

        if (centena > 0) {
            texto += centena === 1 && resto === 0 ? 'cem' : centenas[centena];
        }

        if (resto > 0) {
            if (texto) texto += ' e ';
            if (resto < 10) {
                texto += unidades[resto];
            } else if (resto < 20) {
                texto += especiais[resto - 10];
            } else {
                const dezena = Math.floor(resto / 10);
                const unidade = resto % 10;
                texto += dezenas[dezena];
                if (unidade > 0) {
                    texto += ' e ' + unidades[unidade];
                }
            }
        }

        return texto;
    }

    function formatarGrupo(valor, escala) {
        const base = converterCentenas(valor);
        if (escala === 0) {
            return { texto: base, valor, escala };
        }

        if (escala === 1) {
            return {
                texto: valor === 1 ? 'mil' : `${base} mil`,
                valor,
                escala
            };
        }

        const singular = escalas[escala];
        const plural = singular.endsWith('ão') ? singular.replace(/ão$/, 'ões') : singular + 's';
        return {
            texto: `${base} ${valor === 1 ? singular : plural}`,
            valor,
            escala
        };
    }

    function juntarPartes(partes) {
        if (!partes.length) return '';
        if (partes.length > 1) {
            const primeiro = partes[0];
            const proximo = partes[1];
            if (primeiro.escala === 1 && primeiro.valor === 1) {
                if (proximo.valor < 100 || proximo.valor % 100 === 0) {
                    primeiro.texto = 'mil';
                } else {
                    primeiro.texto = 'um mil';
                }
            }
        }

        let texto = partes[0].texto;
        for (let i = 1; i < partes.length; i++) {
            const atual = partes[i];
            const textoAtual = atual.texto;
            const precisaE = atual.valor < 100 || atual.valor % 100 === 0;
            texto += precisaE ? ' e ' + textoAtual : ' ' + textoAtual;
        }
        return texto;
    }

    const partes = [];
    let restante = num;
    let escala = 0;

    while (restante > 0) {
        const grupo = restante % 1000;
        if (grupo > 0) {
            partes.unshift(formatarGrupo(grupo, escala));
        }
        restante = Math.floor(restante / 1000);
        escala += 1;
    }

    return juntarPartes(partes);
}

function yearToWords(year) {
    const palavras = numberToWords(year);
    return palavras.replace(/\bmil e /, 'mil ');
}

/**
 * Converte uma data no formato DD/MM/YYYY para texto por extenso.
 * @param {string} dateStr — Data no formato DD/MM/YYYY
 * @returns {string} — Data por extenso ou string vazia se inválido
 */
export function dateToWords(dateStr) {
    if (typeof dateStr !== 'string') return '';

    const meses = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];

    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return '';

    const [, dia, mes, ano] = match.map(Number);
    if (dia < 1 || mes < 1 || mes > 12 || ano < 1000 || ano > 9999) return '';

    const diasNoMes = [31, (ano % 400 === 0 || (ano % 4 === 0 && ano % 100 !== 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (dia > diasNoMes[mes - 1]) return '';

    const diaExtenso = numberToWords(dia);
    const mesExtenso = meses[mes - 1];
    const anoExtenso = yearToWords(ano);

    return `${diaExtenso} de ${mesExtenso} de ${anoExtenso}`;
}

/**
 * Converte um valor monetário para texto por extenso.
 * @param {string} currencyStr — Valor no formato R$ XXX,XX ou XXX,XX
 * @returns {string} — Valor por extenso ou string vazia se inválido
 */
export function currencyToWords(currencyStr) {
    if (typeof currencyStr !== 'string') return '';

    // Remove "R$" e espaços
    let cleanStr = currencyStr.replace(/^R\$\s*/, '').trim();

    // Trata casos como "1.234,56" ou "1234,56"
    cleanStr = cleanStr.replace(/\./g, '');

    const match = cleanStr.match(/^(\d+),(\d{2})$/);
    if (!match) return '';

    const [, reais, centavos] = match;
    const reaisNum = parseInt(reais, 10);
    const centavosNum = parseInt(centavos, 10);

    if (reaisNum > 999999999999 || centavosNum > 99) return '';

    let resultado = '';

    if (reaisNum > 0) {
        resultado = numberToWords(reaisNum);
        resultado += reaisNum === 1 ? ' real' : ' reais';
    }

    if (centavosNum > 0) {
        const centavosTexto = numberToWords(centavosNum);
        if (resultado) {
            resultado += ' e ';
        }
        resultado += centavosTexto;
        resultado += centavosNum === 1 ? ' centavo' : ' centavos';
    }

    return resultado || 'zero reais';
}

/**
 * Função principal que despacha para o conversor apropriado baseado no tipo de entrada.
 * @param {string} input — Entrada do usuário (número, data ou moeda)
 * @returns {string} — Texto por extenso ou string vazia se inválido
 */
export function removeExcludedBlocks(text) {
    if (typeof text !== 'string') return '';
    // Raw HTML/XML form: <excluir>...</excluir>
    let result = text.replace(/<\s*excluir\b[^>]*>[\s\S]*?<\s*\/\s*excluir\s*>/gi, '');
    // HTML-escaped form (produced by Mammoth/ODT parsers): &lt;excluir&gt;...&lt;/excluir&gt;
    result = result.replace(/&lt;excluir(?:[^&]|&(?!gt;))*&gt;[\s\S]*?&lt;\/excluir\s*&gt;/gi, '');
    return result;
}

export function normalizePlaceholderName(token) {
    let name = String(token || '').trim();
    if (!name) return '';

    if (name.endsWith('?')) {
        name = name.slice(0, -1).trim();
    }

    if (name.includes(':')) {
        name = name.split(':', 1)[0].trim();
    }

    return name;
}

export function extractPlaceholderNames(text) {
    if (typeof text !== 'string') return [];

    const placeholderNames = new Set();
    const regex = /\[\s*\{\{\s*([^}]+?)\s*\}\}\s*\]|\{\{\s*([^}]+?)\s*\}\}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const token = match[1] || match[2];
        const name = normalizePlaceholderName(token);
        if (name) placeholderNames.add(name);
    }

    return [...placeholderNames];
}

export function expandExtensoVariables(data = {}, placeholderNames = []) {
    const normalized = { ...(data || {}) };
    const allowed = new Set((placeholderNames || []).map((name) => String(name || '').toLowerCase()));

    for (const [key, value] of Object.entries(normalized)) {
        if (typeof value !== 'string' && value !== null && value !== undefined) {
            normalized[key] = String(value);
        }
    }

    const expanded = { ...normalized };

    for (const key of Object.keys(normalized)) {
        const rawValue = normalized[key];
        if (typeof rawValue !== 'string') continue;

        const trimmed = rawValue.trim();
        if (!trimmed) continue;

        const extensoField = `${key}_extenso`;
        if (!allowed.has(extensoField.toLowerCase())) continue;

        if (/valor/i.test(key) || /total_dias|total_meses/i.test(key)) {
            const extenso = escreverPorExtenso(trimmed);
            if (!extenso || extenso === 'Campo obrigatório') continue;

            if (/valor/i.test(key) && /^Valor monetário inválido/i.test(extenso)) continue;
            if (/total_dias|total_meses/i.test(key) && /^Formato não reconhecido/i.test(extenso)) continue;

            expanded[extensoField] = extenso;
        }
    }

    return expanded;
}

export function escreverPorExtenso(input) {
    if (typeof input !== 'string') return '';

    const trimmed = input.trim();
    if (!trimmed) return 'Campo obrigatório';

    const currencyPattern = /^R\$\s*(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}$/;
    const currencyPatternNoSymbol = /^(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}$/;

    if (currencyPattern.test(trimmed) || currencyPatternNoSymbol.test(trimmed)) {
        const resultado = currencyToWords(trimmed);
        return resultado || 'Valor monetário inválido. Use formato R$ XXX,XX ou XXX,XX.';
    }

    if (/^R\$/.test(trimmed)) {
        return 'Valor monetário inválido. Use formato R$ XXX,XX ou XXX,XX.';
    }

    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (datePattern.test(trimmed)) {
        const resultado = dateToWords(trimmed);
        return resultado || 'Data inválida. Use formato DD/MM/YYYY com valores válidos.';
    }

    const integerPattern = /^\d+(?:\.\d{3})*$/;
    if (integerPattern.test(trimmed)) {
        const num = parseInt(trimmed.replace(/\./g, ''), 10);
        return numberToWords(num);
    }

    return 'Formato não reconhecido. Use: número inteiro, data DD/MM/YYYY ou valor monetário R$ XXX,XX.';
}