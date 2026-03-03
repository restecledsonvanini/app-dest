/**
 * uiControls.js — Font size scaler + Light/Dark theme toggle.
 *
 * Persists user preferences in localStorage.
 * Reads `prefers-color-scheme` as the initial default when no preference
 * has been saved yet.
 *
 * Usage:
 *   import { initUIControls } from './uiControls.js';
 *   initUIControls();  // call once on DOMContentLoaded
 *
 * Anti-flash: pair with the inline <script> in <head> (see HTML files).
 */

const STORAGE_FONT  = 'dest-font-size';
const STORAGE_THEME = 'dest-theme';

const SIZE_PX = { sm: '14px', md: '16px', lg: '18px' };

// ─── Font size ────────────────────────────────────────────────────────────────

function applyFontSize(size) {
    document.documentElement.style.fontSize = SIZE_PX[size] ?? SIZE_PX.md;
    document.querySelectorAll('[data-font]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.font === size);
    });
    localStorage.setItem(STORAGE_FONT, size);
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('#theme-toggle i').forEach(icon => {
        icon.className = theme === 'dark'
            ? 'bi bi-moon-stars-fill'
            : 'bi bi-sun-fill';
    });
    localStorage.setItem(STORAGE_THEME, theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') ?? 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initUIControls() {
    // Font size — restore or default to 'md'
    applyFontSize(localStorage.getItem(STORAGE_FONT) ?? 'md');

    // Theme — restore, else follow OS preference
    const savedTheme = localStorage.getItem(STORAGE_THEME)
        ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    // ── Event: font size buttons ──────────────────────────────────────────
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-font]');
        if (btn) applyFontSize(btn.dataset.font);
    });

    // ── Event: theme toggle ───────────────────────────────────────────────
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

    // ── Sync if OS changes while page is open (only when user has no saved pref) ──
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_THEME)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}
