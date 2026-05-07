/**
 * extenso.test.js — Testes unitários para o módulo extenso.js
 * Executar com: node extenso.test.js
 * Ou integrar com Vitest futuramente
 */

import { numberToWords, dateToWords, currencyToWords, escreverPorExtenso } from './extenso.js';

// ─── Funções auxiliares de teste ────────────────────────────────────────────────

function assertEqual(actual, expected, testName) {
    if (actual === expected) {
        console.log(`✅ ${testName}`);
    } else {
        console.log(`❌ ${testName}`);
        console.log(`   Esperado: "${expected}"`);
        console.log(`   Recebido: "${actual}"`);
    }
}

function assertEmpty(actual, testName) {
    if (actual === '') {
        console.log(`✅ ${testName}`);
    } else {
        console.log(`❌ ${testName} - Esperado string vazia, recebido: "${actual}"`);
    }
}

// ─── Testes para numberToWords ────────────────────────────────────────────────

console.log('\n🧪 Testando numberToWords...');

assertEqual(numberToWords(0), 'zero', 'Zero');
assertEqual(numberToWords(1), 'um', 'Um');
assertEqual(numberToWords(10), 'dez', 'Dez');
assertEqual(numberToWords(11), 'onze', 'Onze');
assertEqual(numberToWords(15), 'quinze', 'Quinze');
assertEqual(numberToWords(20), 'vinte', 'Vinte');
assertEqual(numberToWords(21), 'vinte e um', 'Vinte e um');
assertEqual(numberToWords(100), 'cem', 'Cem');
assertEqual(numberToWords(101), 'cento e um', 'Cento e um');
assertEqual(numberToWords(200), 'duzentos', 'Duzentos');
assertEqual(numberToWords(1000), 'mil', 'Mil');
assertEqual(numberToWords(1001), 'mil e um', 'Mil e um');
assertEqual(numberToWords(1100), 'mil e cem', 'Mil e cem');
assertEqual(numberToWords(2000), 'dois mil', 'Dois mil');
assertEqual(numberToWords(10000), 'dez mil', 'Dez mil');
assertEqual(numberToWords(100000), 'cem mil', 'Cem mil');
assertEqual(numberToWords(1000000), 'um milhão', 'Um milhão');
assertEqual(numberToWords(2000000), 'dois milhões', 'Dois milhões');
assertEqual(numberToWords(1000000000), 'um bilhão', 'Um bilhão');
assertEqual(numberToWords(2000000000), 'dois bilhões', 'Dois bilhões');
assertEqual(numberToWords(1234), 'um mil duzentos e trinta e quatro', 'Mil duzentos e trinta e quatro');
assertEqual(numberToWords(559986), 'quinhentos e cinquenta e nove mil novecentos e oitenta e seis', 'Quinhentos e cinquenta e nove mil...');

// Casos edge
assertEmpty(numberToWords(-1), 'Número negativo');
assertEmpty(numberToWords(1.5), 'Número decimal');
assertEmpty(numberToWords(1000000000000), 'Número muito grande');

// ─── Testes para dateToWords ──────────────────────────────────────────────────

console.log('\n🧪 Testando dateToWords...');

assertEqual(dateToWords('01/01/2026'), 'um de janeiro de dois mil vinte e seis', 'Primeiro de janeiro');
assertEqual(dateToWords('14/02/2026'), 'quatorze de fevereiro de dois mil vinte e seis', 'Dia dos namorados');
assertEqual(dateToWords('31/12/2025'), 'trinta e um de dezembro de dois mil vinte e cinco', 'Último dia do ano');
assertEqual(dateToWords('29/02/2024'), 'vinte e nove de fevereiro de dois mil vinte e quatro', 'Ano bissexto');

// Casos inválidos
assertEmpty(dateToWords('32/01/2026'), 'Dia inválido');
assertEmpty(dateToWords('01/13/2026'), 'Mês inválido');
assertEmpty(dateToWords('01/01/999'), 'Ano muito pequeno');
assertEmpty(dateToWords('01/01/10000'), 'Ano muito grande');
assertEmpty(dateToWords('29/02/2025'), '29 de fevereiro em ano não bissexto');
assertEmpty(dateToWords('abc'), 'Formato inválido');
assertEmpty(dateToWords('01/01'), 'Formato incompleto');

// ─── Testes para currencyToWords ──────────────────────────────────────────────

console.log('\n🧪 Testando currencyToWords...');

assertEqual(currencyToWords('R$ 0,00'), 'zero reais', 'Zero reais');
assertEqual(currencyToWords('R$ 1,00'), 'um real', 'Um real');
assertEqual(currencyToWords('R$ 2,00'), 'dois reais', 'Dois reais');
assertEqual(currencyToWords('R$ 1,50'), 'um real e cinquenta centavos', 'Um real e cinquenta centavos');
assertEqual(currencyToWords('R$ 2,01'), 'dois reais e um centavo', 'Dois reais e um centavo');
assertEqual(currencyToWords('R$ 1.234,56'), 'um mil duzentos e trinta e quatro reais e cinquenta e seis centavos', 'Mil reais com centavos');
assertEqual(currencyToWords('5.599,86'), 'cinco mil quinhentos e noventa e nove reais e oitenta e seis centavos', 'Cinco mil reais');

// Casos inválidos
assertEmpty(currencyToWords('R$ -1,00'), 'Valor negativo');
assertEmpty(currencyToWords('R$ 1.000.000.000.000,00'), 'Valor muito grande');
assertEmpty(currencyToWords('abc'), 'Formato inválido');
assertEmpty(currencyToWords('R$ 1,000'), 'Centavos inválidos');

// ─── Testes para escreverPorExtenso ───────────────────────────────────────────

console.log('\n🧪 Testando escreverPorExtenso...');

// Inteiros
assertEqual(escreverPorExtenso('1234'), 'um mil duzentos e trinta e quatro', 'Inteiro: 1234');
assertEqual(escreverPorExtenso('0'), 'zero', 'Inteiro: 0');

// Datas
assertEqual(escreverPorExtenso('14/02/2026'), 'quatorze de fevereiro de dois mil vinte e seis', 'Data: 14/02/2026');

// Moedas
assertEqual(escreverPorExtenso('R$ 5.599,86'), 'cinco mil quinhentos e noventa e nove reais e oitenta e seis centavos', 'Moeda: R$ 5.599,86');
assertEqual(escreverPorExtenso('1234,56'), 'um mil duzentos e trinta e quatro reais e cinquenta e seis centavos', 'Moeda sem R$: 1234,56');

// Casos de erro
assertEqual(escreverPorExtenso(''), 'Campo obrigatório', 'Entrada vazia');
assertEqual(escreverPorExtenso('abc'), 'Formato não reconhecido. Use: número inteiro, data DD/MM/YYYY ou valor monetário R$ XXX,XX.', 'Formato inválido');
assertEqual(escreverPorExtenso('32/01/2026'), 'Data inválida. Use formato DD/MM/YYYY com valores válidos.', 'Data inválida');
assertEqual(escreverPorExtenso('R$ abc'), 'Valor monetário inválido. Use formato R$ XXX,XX ou XXX,XX.', 'Moeda inválida');

console.log('\n🎉 Todos os testes executados!');

// ─── Validação de performance ─────────────────────────────────────────────────

console.log('\n⚡ Testando performance...');

const start = Date.now();
for (let i = 0; i < 1000; i++) {
    escreverPorExtenso('1234');
    escreverPorExtenso('14/02/2026');
    escreverPorExtenso('R$ 5.599,86');
}
const end = Date.now();
console.log(`⏱️  3000 conversões em ${end - start}ms (${(end - start) / 3000}ms por conversão)`);