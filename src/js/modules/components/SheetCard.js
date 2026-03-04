/**
 * SheetCard.js — Custom Element <sheet-card>
 * Encapsula o card de planilha (ícone SVG + label + link externo).
 * Sem Shadow DOM: CSS de .sheet-card em ferramentas.css continua aplicando.
 *
 * @attr {string} href   - URL da planilha (target="_blank")
 * @attr {string} label  - Texto exibido sob o ícone
 * @attr {string} title  - Tooltip (usa label quando omitido)
 */

const SHEET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <path d="M8 3v18M2 9h20M2 15h20" />
</svg>`;

export class SheetCard extends HTMLElement {
    connectedCallback() {
        const href  = this.getAttribute('href')  || '#';
        const label = this.getAttribute('label') || '';
        const title = this.getAttribute('title') || label;

        this.innerHTML = `
            <a href="${href}" target="_blank" rel="noopener noreferrer"
               class="sheet-card" title="${title}">
                ${SHEET_SVG}
                <span>${label}</span>
            </a>`;
    }
}
