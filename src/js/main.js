import { handleCopyAction, handleClearAction } from './modules/ui.js';
import { initTabs } from './modules/tabs.js';

// Global Event Delegator for all basic action buttons and initialization
document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize Tabs Module
    initTabs();

    // Global Delegator for Tool Buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn || btn.disabled) return;

        const action = btn.dataset.action;
        
        if (action === 'copy') {
            handleCopyAction(btn);
        } else if (action === 'clear') {
            handleClearAction(btn);
        }
    });

    console.log('[App] Core initialized (Vanilla JS 2026)');
});
