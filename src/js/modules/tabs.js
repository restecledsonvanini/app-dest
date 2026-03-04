/**
 * tabs.js — Gerenciamento de abas (main tabs + subtabs).
 * Responsabilidades:
 *  - Inicializar atributos ARIA em tabs e panels (roles, aria-selected, aria-controls)
 *  - Tratar cliques em tab-btn e subtab-btn via event delegation
 *  - Navegação por teclado (←/→/Home/End) no tablist principal (WAI-ARIA pattern)
 *  - Tratar abre/fecha do menu hamburguer em mobile
 */

/**
 * Inicializa ARIA em um grupo tablist/tab/tabpanel.
 * @param {NodeList|HTMLElement[]} btns   - Botões com role="tab"
 * @param {NodeList|HTMLElement[]} panels - Divs com role="tabpanel"
 * @param {(btn: HTMLElement) => string}  getPanelId - Deriva o id do panel a partir do botão
 */
function initTabARIA(btns, panels, getPanelId) {
    btns.forEach(btn => {
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
        const panelId = getPanelId(btn);
        if (panelId) btn.setAttribute('aria-controls', panelId);
        if (!btn.id && panelId) btn.id = `tab-btn-${panelId}`;
    });
    panels.forEach(panel => {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('tabindex', '0');
        const labelBtn = document.getElementById(`tab-btn-${panel.id}`);
        if (labelBtn) panel.setAttribute('aria-labelledby', labelBtn.id);
    });
}

export function initTabs() {
    const detailsEl     = document.getElementById('mobile-tab-details');
    const tabNav       = document.getElementById('main-tab-nav');

    // ── Inicialização ARIA — Main Tabs ────────────────────────────────────────
    const mainTabBtns    = document.querySelectorAll('.tab-btn');
    const mainTabPanels  = document.querySelectorAll('.tab-content');
    if (tabNav) tabNav.setAttribute('role', 'tablist');
    initTabARIA(mainTabBtns, mainTabPanels, btn => btn.dataset.tab);

    // ── Inicialização ARIA — Subtabs ──────────────────────────────────────────
    document.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
        const targetId = btn.dataset.subtab;
        if (targetId) btn.setAttribute('aria-controls', targetId);
    });
    document.querySelectorAll('.subtab-content').forEach(panel => {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('tabindex', '0');
    });

    // ── Navegação por teclado no tablist principal (WAI-ARIA) ─────────────────
    tabNav?.addEventListener('keydown', (e) => {
        const tabs = [...document.querySelectorAll('.tab-btn')];
        const idx  = tabs.indexOf(document.activeElement);
        if (idx === -1) return;

        let next = -1;
        if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
        if (e.key === 'ArrowLeft')  next = (idx - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home')       next = 0;
        if (e.key === 'End')        next = tabs.length - 1;

        if (next !== -1) {
            e.preventDefault();
            tabs[next].focus();
            tabs[next].click();
        }
    });

    // ── Event Delegation global ───────────────────────────────────────────────
    document.addEventListener('click', (e) => {


        // Main Tabs
        const tabBtn = e.target.closest('.tab-btn');
        if (tabBtn) {
            const tabName = tabBtn.getAttribute('data-tab');

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tabBtn.classList.add('active');
            tabBtn.setAttribute('aria-selected', 'true');

            const target = document.getElementById(tabName);
            if (target) target.classList.add('active');

            // Fecha o menu mobile (<details>) ao selecionar qualquer aba
            detailsEl?.removeAttribute('open');
            return;
        }

        // Subtabs
        const subtabBtn = e.target.closest('.subtab-btn');
        if (subtabBtn) {
            const targetId = subtabBtn.getAttribute('data-subtab');
            const target   = document.getElementById(targetId);
            if (!target) return;

            const contents = target.closest('.subtab-contents');
            if (!contents) return;

            const nav = subtabBtn.closest('.subtab-nav');
            if (nav) {
                nav.querySelectorAll('.subtab-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
            }
            subtabBtn.classList.add('active');
            subtabBtn.setAttribute('aria-selected', 'true');

            contents.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
            target.classList.add('active');

            const firstInput = target.querySelector('input, select, textarea, button');
            if (firstInput) firstInput.focus();
        }
    });
}

