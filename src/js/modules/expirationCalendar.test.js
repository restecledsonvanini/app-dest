import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCalendarText } from './CalendarTextParser.js';
import { formatDateInputValue } from './inputBehaviors.js';
import { syncDateValidityFields } from './dateValidityUI.js';
import { handleClearAction } from './ui.js';
import { toolHandlerMap } from '../handlers/toolHandlers.js';
import { ok, ioHtml, escapeHtml } from './resultRenderer.js';
import { DocumentParser } from './documentEditor/DocumentParser.js';
import { TemplateFileService } from './documentEditor/services/TemplateFileService.js';
import { ExportService } from './documentEditor/services/ExportService.js';
import {
    calcEndDate,
    calcEndDateByDays,
    formatBRDate,
    isLeapYear,
    parseBRDate,
    parseDateInput,
} from './dateUtils.js';

const storage = new Map();
globalThis.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
};

function createResultBox() {
    return {
        innerHTML: '',
        className: '',
        dataset: {},
        closest: () => null,
    };
}

test('escapa HTML em resultados e placeholders antes de escrever no DOM', () => {
    const resultBox = createResultBox();
    ok(resultBox, ioHtml('<img src=x onerror=alert(1)>', '<script>alert(1)</script>'));

    assert.equal(resultBox.innerHTML.includes('<img src=x onerror=alert(1)>'), false);
    assert.equal(resultBox.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'), true);
    assert.equal(resultBox.innerHTML.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), true);

    const parser = new DocumentParser('<p>{{nome}}</p>');
    const rendered = parser.render({ nome: '<svg onload=alert(1)>' }, { highlightEmpty: true, escapeHtml: true });

    assert.equal(rendered.includes('<svg onload=alert(1)>'), false);
    assert.equal(rendered.includes('&lt;svg onload=alert(1)&gt;'), true);
    assert.equal(escapeHtml("'\"&<>"), '&#039;&quot;&amp;&lt;&gt;');
});

test('rejeita uploads com extensão não suportada ou tamanho acima do limite', async () => {
    const service = new TemplateFileService();

    await assert.rejects(
        () => service.parseFile({ name: 'arquivo.txt', size: 32 }, new AbortController().signal),
        /Formato não suportado/
    );

    await assert.rejects(
        () => service.parseFile({ name: 'arquivo.docx', size: service.maxFileSize + 1 }, new AbortController().signal),
        /Arquivo muito grande/
    );
});

test('sanitiza markup de exportação antes de enviar para iframe e preview', () => {
    const service = new ExportService();
    const html = '<h1>Ok</h1><script>alert(1)</script><img src=x onerror=alert(2)><a href="javascript:alert(3)">link</a>';
    const sanitized = service.extractPrintableBody(html);

    assert.equal(sanitized.includes('<script'), false);
    assert.equal(sanitized.includes('onerror='), false);
    assert.equal(sanitized.includes('javascript:'), false);
    assert.equal(sanitized.includes('<h1>Ok</h1>'), true);
});

test('preserva o contrato atual de regras de data em casos de borda pendentes de aprovação de negócio', () => {
    const january31 = parseBRDate('31/01/2026');
    const leapYear = parseBRDate('29/02/2024');

    assert.equal(formatBRDate(calcEndDate(january31, 'months', 1)), '02/03/2026');
    assert.equal(formatBRDate(calcEndDate(leapYear, 'years', 1)), '01/03/2025');
    assert.equal(formatBRDate(calcEndDate(parseBRDate('01/03/2024'), 'months', 1)), '31/03/2024');
    assert.equal(formatBRDate(calcEndDate(parseBRDate('30/01/2026'), 'months', 1)), '01/03/2026');
});

test('conta o dia inicial no prazo por padrão: 180 dias terminam em início + 179', () => {
    const result = calcEndDateByDays(parseBRDate('01/01/2026'), 180);
    assert.equal(formatBRDate(result), '29/06/2026');
});

test('permite excluir o dia inicial pela configuração geral', () => {
    const result = calcEndDateByDays(parseBRDate('01/01/2026'), 180, false);
    assert.equal(formatBRDate(result), '30/06/2026');
});

test('soma dias inclusivos atravessando ano bissexto', () => {
    const result = calcEndDateByDays(parseBRDate('01/02/2028'), 30);
    assert.equal(formatBRDate(result), '01/03/2028');
});

test('identifica anos bissextos conforme o calendário gregoriano', () => {
    assert.equal(isLeapYear(2024), true);
    assert.equal(isLeapYear(2026), false);
    assert.equal(isLeapYear(2000), true);
    assert.equal(isLeapYear(2100), false);
});

test('mantém compatibilidade com datas ISO no parser', () => {
    const date = parseDateInput('2026-01-01');
    assert.equal(formatBRDate(date), '01/01/2026');
});

test('máscara conserva posição do cursor ao digitar e editar no meio da data', () => {
    assert.deepEqual(formatDateInputValue('01012026', 8), {
        value: '01/01/2026',
        caret: 10,
    });
    assert.deepEqual(formatDateInputValue('0102026', 4), {
        value: '01/02/026',
        caret: 5,
    });
});

test('Dias, Meses e Anos mostram assinatura, início e controle de vínculo', () => {
    const fields = {
        '#select-unit': { value: 'years' },
        '#input-date-start': { value: '01/01/2026', disabled: false, hidden: false },
        '#input-expiration-signature': { value: '01/01/2026', disabled: false, hidden: false },
        '#input-start-matches-signature': { checked: true, disabled: false, hidden: false },
        'label[for="input-start-matches-signature"]': { hidden: false },
        '.expiration-start-toolbar': { hidden: false },
        '.expiration-date-row': {},
        '#input-duration': { value: '180', max: '', placeholder: '', title: '', disabled: false },
        'label[for="input-duration"]': { textContent: 'Duração:' },
        'label[for="input-date-start"]': { textContent: 'Data de Início:' },
        'label[for="input-expiration-signature"]': { textContent: 'Data da Assinatura:' },
    };
    const form = {
        querySelector: (selector) => fields[selector] || null,
    };

    syncDateValidityFields(form);

    assert.equal(form.querySelector('#input-start-matches-signature').hidden, false);
    assert.equal(form.querySelector('#input-start-matches-signature').disabled, false);
    assert.equal(form.querySelector('label[for="input-start-matches-signature"]').hidden, false);
    assert.equal(form.querySelector('.expiration-start-toolbar').hidden, false);
    assert.equal(form.querySelector('#input-expiration-signature').hidden, false);
    assert.equal(form.querySelector('label[for="input-expiration-signature"]').hidden, false);
    assert.equal(form.querySelector('#input-date-start').disabled, true);
    assert.equal(form.querySelector('label[for="input-date-start"]').textContent, 'Início da Vigência:');

    fields['#select-unit'].value = 'months';
    syncDateValidityFields(form);
    assert.equal(form.querySelector('#input-expiration-signature').hidden, false);
    assert.equal(form.querySelector('#input-date-start').disabled, true);

    fields['#select-unit'].value = 'days';
    syncDateValidityFields(form);
    assert.equal(form.querySelector('#input-expiration-signature').hidden, false);
    assert.equal(form.querySelector('#input-date-start').disabled, true);
});

test('após calcular, limpa o formulário e foca o primeiro campo disponível', async () => {
    let wasReset = false;
    let wasFocused = false;
    const startDate = {
        value: '01/01/2026',
        disabled: false,
        hidden: false,
        focus: () => { wasFocused = true; },
    };
    const fields = {
        '#select-unit': { value: 'months' },
        '#input-date-start': startDate,
        '#input-expiration-signature': { value: '', disabled: true, hidden: true },
        '#input-start-matches-signature': { checked: true, disabled: false, hidden: false },
        'label[for="input-start-matches-signature"]': { hidden: false },
        '.expiration-start-toolbar': { hidden: false },
        '#input-duration': { value: '1', max: '', placeholder: '', title: '' },
        'label[for="input-duration"]': { textContent: 'Duração:' },
        'label[for="input-date-start"]': { textContent: 'Início da Vigência:' },
        'label[for="input-expiration-signature"]': { textContent: 'Data da Assinatura:' },
    };
    const form = {
        querySelector(selector) {
            if (selector.startsWith('input:not(')) return startDate;
            return fields[selector] || null;
        },
        reset() {
            wasReset = true;
            fields['#select-unit'].value = '';
            startDate.value = '';
            fields['#input-duration'].value = '';
        },
    };
    const data = new FormData();
    data.set('signature_date', '01/01/2026');
    data.set('start_matches_signature', 'on');
    data.set('date_start', '2026-01-01');
    data.set('time_unit', 'months');
    data.set('duration', '1');
    const resultBox = createResultBox();
    resultBox.classList = { contains: (name) => resultBox.className.split(' ').includes(name) };
    resultBox.closest = (selector) => selector === 'form' ? form : null;

    await toolHandlerMap.calculateDateValidity(data, resultBox);
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(wasReset, true);
    assert.equal(startDate.value, '');
    assert.equal(wasFocused, true);
});

test('rejeita texto extra em datas sem rejeitar dia e mês de um dígito', () => {
    assert.equal(parseBRDate('1/1/2026') instanceof Date, true);
    assert.equal(parseBRDate('01<script>/01/2026'), null);
});

test('expande intervalos, datas duplas e ordinais em feriados informativos', () => {
    const { entries, warnings } = parseCalendarText([
        'I - Feriado nacional: 1º de janeiro',
        'II - Recesso: 21 a 31 de dezembro',
        'III - Feriado: 16 e 17 de fevereiro',
    ].join('\n'), 2026);

    assert.equal(warnings.length, 0);
    assert.equal(Object.keys(entries).length, 14);
    assert.equal(entries['2026-01-01'].type, 'feriado');
    assert.equal(entries['2026-01-01'].isHoliday, true);
    assert.equal(entries['2026-12-31'].type, 'recesso');
    assert.equal(entries['2026-02-16'].type, 'feriado');
});

test('classifica recesso facultativo como facultativo', () => {
    const { entries, warnings } = parseCalendarText([
        'I - Feriado nacional: 1º de janeiro',
        'II - Recesso administrativo: 24 de dezembro',
        'III - Recesso facultativo: 31 de dezembro',
    ].join('\n'), 2026);

    assert.equal(warnings.length, 0);
    assert.equal(entries['2026-01-01'].type, 'feriado');
    assert.equal(entries['2026-12-24'].type, 'recesso');
    assert.equal(entries['2026-12-31'].type, 'facultativo');
});

test('Limpar redefine o conversor e foca Data da Assinatura', () => {
    let focusedSignature = false;
    let focusedStart = false;
    const signatureDate = {
        type: 'text', value: '01/01/2026', disabled: false, hidden: false,
        focus: () => { focusedSignature = true; },
    };
    const startDate = {
        type: 'text', value: '01/02/2026', disabled: false, hidden: false,
        focus: () => { focusedStart = true; },
    };
    const unitSelect = { value: 'days', dispatchEvent: () => syncDateValidityFields(form) };
    const checkbox = { type: 'checkbox', checked: false, defaultChecked: true };
    const duration = { type: 'number', value: '180' };
    const fields = {
        '#input-expiration-signature': signatureDate,
        '#input-date-start': startDate,
        '#select-unit': unitSelect,
        '#input-start-matches-signature': checkbox,
        '#input-duration': duration,
        'label[for="input-duration"]': { textContent: '' },
        'label[for="input-date-start"]': { textContent: '' },
        'label[for="input-expiration-signature"]': { hidden: false },
        'label[for="input-start-matches-signature"]': { hidden: false },
        '.expiration-start-toolbar': { hidden: false },
        '.expiration-date-row': {},
    };
    const form = {
        dataset: { tool: 'calculateDateValidity' },
        querySelector: (selector) => fields[selector] || null,
        querySelectorAll: () => [checkbox, signatureDate, startDate, unitSelect, duration],
    };
    const resultBox = { innerHTML: 'resultado', dataset: { result: '30/06/2026' }, className: 'result-box info' };
    const panel = {
        querySelector: (selector) => selector === '.form-tool' ? form : resultBox,
        querySelectorAll: (selector) => selector.startsWith('input:') ? form.querySelectorAll() : [],
        dispatchEvent: () => { },
    };
    const previousCustomEvent = globalThis.CustomEvent;
    globalThis.CustomEvent = class { };

    try {
        handleClearAction({ closest: () => panel });
    } finally {
        globalThis.CustomEvent = previousCustomEvent;
    }

    assert.equal(signatureDate.value, '');
    assert.equal(startDate.value, '');
    assert.equal(unitSelect.value, '');
    assert.equal(duration.value, '');
    assert.equal(checkbox.checked, true);
    assert.equal(focusedSignature, true);
    assert.equal(focusedStart, false);
});

test('rejeita datas oficiais impossíveis sem gravá-las no calendário', () => {
    const { entries, warnings } = parseCalendarText('I - Feriado: 31 de fevereiro', 2026);

    assert.deepEqual(entries, {});
    assert.equal(warnings.length, 1);
});

test('Data Final calcula assinatura + 179 dias quando unidade Dias e prazo 180', async () => {
    storage.delete('dest-expiration-settings');
    const data = new FormData();
    data.set('signature_date', '2026-01-01');
    data.set('start_matches_signature', 'on');
    data.set('date_start', '2026-01-01');
    data.set('time_unit', 'days');
    data.set('duration', '180');
    const resultBox = createResultBox();

    await toolHandlerMap.calculateDateValidity(data, resultBox);

    assert.equal(resultBox.dataset.result, '29/06/2026');
    assert.match(resultBox.innerHTML, /Dia inicial<\/small><strong>Incluído/);
});

test('Data Final usa início alternativo e configuração de início não incluído em Dias', async () => {
    storage.set('dest-expiration-settings', JSON.stringify({ includeStartDate: false }));
    const data = new FormData();
    data.set('signature_date', '01/01/2026');
    data.set('date_start', '01/02/2026');
    data.set('time_unit', 'days');
    data.set('duration', '180');
    const resultBox = createResultBox();

    await toolHandlerMap.calculateDateValidity(data, resultBox);

    assert.equal(resultBox.dataset.result, '31/07/2026');
    assert.match(resultBox.innerHTML, /Dia inicial<\/small><strong>Não incluído/);
});

test('Data Final respeita contagem exclusiva mesmo quando assinatura e início são iguais', async () => {
    storage.set('dest-expiration-settings', JSON.stringify({ includeStartDate: false }));
    const data = new FormData();
    data.set('signature_date', '01/01/2026');
    data.set('date_start', '01/01/2026');
    data.set('time_unit', 'days');
    data.set('duration', '180');
    const resultBox = createResultBox();

    await toolHandlerMap.calculateDateValidity(data, resultBox);

    assert.equal(resultBox.dataset.result, '30/06/2026');
    assert.match(resultBox.innerHTML, /Dia inicial<\/small><strong>Não incluído/);
});

test('Data Final mantém o cálculo por meses e anos a partir do início vinculado', async () => {
    const monthData = new FormData();
    monthData.set('signature_date', '2026-01-01');
    monthData.set('start_matches_signature', 'on');
    monthData.set('date_start', '2026-02-01');
    monthData.set('time_unit', 'months');
    monthData.set('duration', '1');
    const monthResult = createResultBox();
    await toolHandlerMap.calculateDateValidity(monthData, monthResult);
    assert.equal(monthResult.dataset.result, '31/01/2026');
    assert.match(monthResult.innerHTML, /Assinatura<\/small><strong>01\/01\/2026/);
    assert.match(monthResult.innerHTML, /Início da Vigência<\/small><strong>01\/01\/2026/);
    assert.match(monthResult.innerHTML, /Meses<\/small><strong>1/);

    const yearData = new FormData();
    yearData.set('signature_date', '2026-01-01');
    yearData.set('start_matches_signature', 'on');
    yearData.set('date_start', '2026-02-01');
    yearData.set('time_unit', 'years');
    yearData.set('duration', '1');
    const yearResult = createResultBox();
    await toolHandlerMap.calculateDateValidity(yearData, yearResult);
    assert.equal(yearResult.dataset.result, '01/01/2027');
    assert.match(yearResult.innerHTML, /Anos<\/small><strong>1/);
});

test('Meses e Anos distinguem assinatura de início da vigência no resultado', async () => {
    for (const [unit, expectedEnd] of [['months', '28/02/2026'], ['years', '01/02/2027']]) {
        const data = new FormData();
        data.set('signature_date', '01/01/2026');
        data.set('date_start', '01/02/2026');
        data.set('time_unit', unit);
        data.set('duration', '1');
        const resultBox = createResultBox();

        await toolHandlerMap.calculateDateValidity(data, resultBox);

        assert.equal(resultBox.dataset.result, expectedEnd);
        assert.match(resultBox.innerHTML, /Assinatura<\/small><strong>01\/01\/2026/);
        assert.match(resultBox.innerHTML, /Início da Vigência<\/small><strong>01\/02\/2026/);
        assert.match(resultBox.innerHTML, new RegExp(`${unit === 'months' ? 'Meses' : 'Anos'}<\\/small><strong>1`));
        assert.match(resultBox.innerHTML, new RegExp(`Vencimento<\\/small><strong>${expectedEnd}`));
    }
});

