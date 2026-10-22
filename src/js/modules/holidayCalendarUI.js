import { parseCalendarText } from './CalendarTextParser.js';
import { HolidayCalendarStore } from '../services/HolidayCalendarStore.js';
import { isLeapYear } from './dateUtils.js';

const store = new HolidayCalendarStore();
const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const YEARS_BEHIND = 2;
const YEARS_AHEAD = 15;

let refs = null;

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getYear(select) {
    return Number(select?.value) || new Date().getFullYear();
}

function updateLeapYearIndicator(indicator, year) {
    indicator.hidden = !isLeapYear(year);
}

function populateYears(select, selectedYear) {
    const currentYear = new Date().getFullYear();
    const years = new Set(Array.from(
        { length: YEARS_BEHIND + YEARS_AHEAD + 1 },
        (_, index) => currentYear - YEARS_BEHIND + index
    ));
    if (selectedYear) years.add(selectedYear);

    select.replaceChildren(...[...years].sort((a, b) => a - b).map((year) => {
        const option = document.createElement('option');
        option.value = String(year);
        option.textContent = String(year);
        return option;
    }));
    select.value = String(selectedYear || currentYear);
}

function normalizeEntries(entries = {}) {
    return Object.fromEntries(Object.entries(entries).map(([isoDate, item]) => [isoDate, {
        type: item?.type || 'facultativo',
        label: item?.label || '',
        isHoliday: typeof item?.isHoliday === 'boolean'
            ? item.isHoliday
            : item?.isBusinessDay === false,
        modified: item?.modified === true,
    }]));
}

function buildMonthGrid(year, monthIndex, entries, editable) {
    const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    let html = '<div class="calendar-weekdays">';
    WEEKDAYS.forEach((weekday) => { html += `<span>${weekday}</span>`; });
    html += '</div><div class="calendar-days">';

    for (let index = 0; index < firstWeekday; index += 1) {
        html += '<span class="calendar-day empty" aria-hidden="true"></span>';
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const utcMillis = Date.UTC(year, monthIndex, day);
        const isoDate = new Date(utcMillis).toISOString().slice(0, 10);
        const weekday = new Date(utcMillis).getUTCDay();
        const isWeekend = weekday === 0 || weekday === 6;
        const record = entries[isoDate];
        const isHoliday = record?.isHoliday === true;
        const canEdit = editable && !isWeekend;
        const classes = ['calendar-day'];
        let title = `${day}/${String(monthIndex + 1).padStart(2, '0')}/${year}`;

        if (isWeekend) classes.push('calendar-weekend');
        if (isHoliday && !isWeekend) {
            classes.push(record?.type === 'facultativo' ? 'warning-yellow' : 'warning-orange');
        }
        if (record?.modified) classes.push('calendar-day-edited');
        if (canEdit) classes.push('editable');
        if (record?.label) title += ` - ${record.label}`;
        if (record?.modified) title += ' (editado manualmente)';

        html += `<button type="button" class="${classes.join(' ')}" data-date="${isoDate}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}" aria-pressed="${isHoliday}" ${canEdit ? '' : 'disabled'}>${day}</button>`;
    }

    return `${html}</div>`;
}

function buildCalendarMarkup(year, entries, editable) {
    return MONTH_NAMES.map((month, monthIndex) =>
        `<section class="calendar-month"><h4>${month}</h4>${buildMonthGrid(year, monthIndex, entries, editable)}</section>`
    ).join('');
}

function setStatus(element, message, type = '') {
    if (!element) return;
    element.classList.remove('error', 'success');
    if (type) element.classList.add(type);
    element.textContent = message;
}

function updateLastImportLabel(saved) {
    refs.lastImport.textContent = saved?.importedAt
        ? `Importado em ${new Date(saved.importedAt).toLocaleDateString('pt-BR')}`
        : 'Sem importação registrada para este ano.';
}

function loadConfigYear() {
    const year = getYear(refs.configYearSelect);
    updateLeapYearIndicator(refs.configLeapIndicator, year);
    let saved = null;
    try {
        saved = store.load(year);
    } catch (error) {
        setStatus(refs.configStatus, 'Não foi possível ler o calendário salvo neste navegador.', 'error');
        console.error('[HolidayCalendar] Falha ao carregar calendário:', error);
    }

    refs.currentEntries = normalizeEntries(saved?.entries || {});
    refs.sourceText.value = saved?.sourceText || '';
    refs.importedAt = saved?.importedAt || '';
    updateLastImportLabel(saved);
    refs.editorCalendar.innerHTML = buildCalendarMarkup(year, refs.currentEntries, true);
    setStatus(refs.configStatus,
        Object.keys(refs.currentEntries).length
            ? `Calendário de ${year} carregado para edição.`
            : `Nenhuma data configurada para ${year}.`,
        '');
    refreshViewCalendar();
}

function refreshViewCalendar() {
    const year = getYear(refs.viewYearSelect);
    updateLeapYearIndicator(refs.viewLeapIndicator, year);
    let saved = null;
    try {
        saved = store.load(year);
    } catch (error) {
        setStatus(refs.viewStatus, 'Não foi possível ler o calendário salvo neste navegador.', 'error');
        console.error('[HolidayCalendar] Falha ao consultar calendário:', error);
    }

    const entries = normalizeEntries(saved?.entries || {});
    const hasConfiguredDates = Object.keys(entries).some((date) => entries[date].isHoliday);
    refs.viewCalendar.innerHTML = buildCalendarMarkup(year, entries, false);

    if (!hasConfiguredDates) {
        refs.viewStatus.innerHTML = `O calendário SESP de ${year} ainda não foi configurado. <button type="button" class="calendar-result-action" data-calendar-action="configure">Configurar feriados</button>`;
        refs.viewStatus.classList.remove('error', 'success');
        return;
    }

    const importedAt = saved?.importedAt
        ? new Date(saved.importedAt).toLocaleDateString('pt-BR')
        : 'data não registrada';
    setStatus(refs.viewStatus,
        `Calendário SESP de ${year} carregado. Importado em ${importedAt}; confira se corresponde à publicação mais recente.`);
}

function persistConfig(markImported = false) {
    const year = getYear(refs.configYearSelect);
    if (markImported) refs.importedAt = new Date().toISOString();

    const payload = {
        entries: refs.currentEntries,
        sourceText: refs.sourceText.value || '',
        importedAt: refs.importedAt,
    };

    try {
        if (!Object.keys(payload.entries).length && !payload.sourceText.trim()) {
            store.remove(year);
            refs.importedAt = '';
            updateLastImportLabel(null);
        } else {
            const saved = store.save(year, payload);
            refs.importedAt = saved.importedAt;
            updateLastImportLabel(saved);
        }
        if (getYear(refs.viewYearSelect) === year) refreshViewCalendar();
        return true;
    } catch (error) {
        setStatus(refs.configStatus, 'Não foi possível salvar o calendário neste navegador.', 'error');
        console.error('[HolidayCalendar] Falha ao salvar calendário:', error);
        return false;
    }
}

function handleImport() {
    const sourceText = refs.sourceText.value.trim();
    if (!sourceText) {
        refs.currentEntries = {};
        refs.importedAt = '';
        if (!persistConfig()) return;
        refs.editorCalendar.innerHTML = buildCalendarMarkup(getYear(refs.configYearSelect), {}, true);
        setStatus(refs.configStatus, 'Texto vazio: calendário removido.', 'success');
        return;
    }

    const { entries, warnings } = parseCalendarText(sourceText, getYear(refs.configYearSelect));
    refs.currentEntries = normalizeEntries(entries);
    if (!persistConfig(true)) return;
    refs.editorCalendar.innerHTML = buildCalendarMarkup(getYear(refs.configYearSelect), refs.currentEntries, true);

    setStatus(refs.configStatus,
        warnings.length
            ? `Importado com ${warnings.length} alerta(s). Revise as datas destacadas.`
            : 'Calendário importado e salvo.',
        warnings.length ? '' : 'success');
}

function handleClear() {
    refs.currentEntries = {};
    refs.sourceText.value = '';
    refs.importedAt = '';
    if (!persistConfig()) return;
    refs.editorCalendar.innerHTML = buildCalendarMarkup(getYear(refs.configYearSelect), {}, true);
    setStatus(refs.configStatus, 'Calendário removido para o ano selecionado.', 'success');
}

function toggleHoliday(isoDate) {
    const current = refs.currentEntries[isoDate];
    refs.currentEntries[isoDate] = current
        ? { ...current, isHoliday: !current.isHoliday, modified: true }
        : { type: 'manual', label: 'Ajuste manual', isHoliday: true, modified: true };

    if (!persistConfig()) return;
    refs.editorCalendar.innerHTML = buildCalendarMarkup(getYear(refs.configYearSelect), refs.currentEntries, true);
}

function openCalendarSettings(year = new Date().getFullYear()) {
    populateYears(refs.configYearSelect, year);
    if (getYear(refs.configYearSelect) !== year) {
        refs.configYearSelect.value = String(year);
    }
    loadConfigYear();
    if (!refs.configPopover.matches(':popover-open')) refs.configPopover.showPopover();
}

function openSettingsFromViewer() {
    document.querySelector('.tab-btn[data-tab="settings"]')?.click();
    openCalendarSettings(getYear(refs.viewYearSelect));
}

function bindEvents() {
    refs.configYearSelect.addEventListener('change', loadConfigYear);
    refs.viewYearSelect.addEventListener('change', refreshViewCalendar);
    refs.sourceText.addEventListener('input', () => persistConfig());
    refs.importButton.addEventListener('click', handleImport);
    refs.clearButton.addEventListener('click', handleClear);
    refs.openSettingsButton.addEventListener('click', () => openCalendarSettings());
    refs.viewConfigButton.addEventListener('click', () => openSettingsFromViewer());

    const editCalendar = (event) => {
        const day = event.target.closest('.calendar-day.editable[data-date]');
        if (day) toggleHoliday(day.dataset.date);
    };
    refs.editorCalendar.addEventListener('click', editCalendar);

    refs.viewStatus.addEventListener('click', (event) => {
        if (event.target.closest('[data-calendar-action="configure"]')) openSettingsFromViewer();
    });
    refs.viewPopover.addEventListener('beforetoggle', (event) => {
        if (event.newState === 'open') refreshViewCalendar();
    });
}

export function initHolidayCalendarUI() {
    refs = {
        configPopover: document.getElementById('calendario-config-popover'),
        configYearSelect: document.getElementById('calendar-source-year'),
        configLeapIndicator: document.getElementById('calendar-config-leap-indicator'),
        sourceText: document.getElementById('calendar-source-text'),
        importButton: document.getElementById('calendar-import-btn'),
        clearButton: document.getElementById('calendar-clear-btn'),
        lastImport: document.getElementById('calendar-last-import'),
        editorCalendar: document.getElementById('calendar-editor-grid'),
        configStatus: document.getElementById('calendar-config-status'),
        openSettingsButton: document.getElementById('settings-open-calendar'),
        viewPopover: document.getElementById('calendar-view-popover'),
        viewYearSelect: document.getElementById('calendar-view-year'),
        viewLeapIndicator: document.getElementById('calendar-view-leap-indicator'),
        viewCalendar: document.getElementById('calendar-view-grid'),
        viewStatus: document.getElementById('calendar-view-status'),
        viewConfigButton: document.getElementById('calendar-view-config'),
        currentEntries: {},
        importedAt: '',
    };

    if (Object.values(refs).some((value) => value === null)) return;

    const currentYear = new Date().getFullYear();
    populateYears(refs.configYearSelect, currentYear);
    populateYears(refs.viewYearSelect, currentYear);
    bindEvents();
    loadConfigYear();
    refreshViewCalendar();
}