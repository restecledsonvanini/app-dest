import { handleCopyAction, handleClearAction } from './modules/ui.js';
import { initTabs } from './modules/tabs.js';
import { initInputBehaviors } from './modules/inputBehaviors.js';
import { toolHandlerMap } from './modules/toolHandlers.js';
import { initUIControls } from './uiControls.js';

document.addEventListener('DOMContentLoaded', () => {

    // Inicializa abas, comportamentos de input e controles de UI
    initTabs();
    initInputBehaviors();
    initUIControls();

    // ── Delegador global: botões Copy e Clear ────────────────────────────────
    document.addEventListener('click', (e) => {
        // Suporta data-action="copy"|"clear" explícito, além da classe .btn-copy
        const btn = e.target.closest('button[data-action], button.btn-copy');
        if (!btn || btn.disabled) return;

        const action = btn.dataset.action || (btn.classList.contains('btn-copy') ? 'copy' : null);
        if (action === 'copy')  handleCopyAction(btn);
        else if (action === 'clear') handleClearAction(btn);
    });

    // ── Roteador de Formulários — Fase 3 ─────────────────────────────────────
    // Intercepta o submit de qualquer <form class="form-tool" data-tool="...">
    // e delega ao handler correspondente passando o FormData.
    document.addEventListener('submit', (e) => {
        const form = e.target.closest('.form-tool');
        if (!form) return;
        e.preventDefault();

        const tool = form.dataset.tool;
        const handler = toolHandlerMap[tool];
        if (!handler) {
            console.warn(`[App] Nenhum handler registrado para data-tool="${tool}"`);
            return;
        }

        const resultBox = form.querySelector('.result-box');
        if (!resultBox) return;

        handler(new FormData(form), resultBox);
    });

    console.log('[App] Core initialized (Vanilla JS 2026)');
});
