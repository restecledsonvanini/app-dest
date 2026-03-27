/**
 * FolderCard.js — Custom Element <folder-card>
 * Encapsula o card de pasta de documentos com ícone SVG.
 * Sem Shadow DOM: CSS de .folder-card em ferramentas.css continua aplicando.
 * Estilo idêntico ao sheet-card para máxima coerência visual.
 *
 * Otimização: Renderização eficiente usando innerHTML single-pass para evitar
 * atrasos de reflow/repaint ao adicionar múltiplos elementos.
 *
 * @attr {string} href   - URL da pasta no Drive (target="_blank")
 * @attr {string} label  - Texto exibido sob o ícone
 * @attr {string} title  - Tooltip (usa label quando omitido)
 */

const FOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>`;

export class FolderCard extends HTMLElement {
    connectedCallback() {
        // Cache dos atributos para evitar múltiplas chamadas getAttribute
        const href = this.getAttribute('href') || '#';
        const label = this.getAttribute('label') || '';
        const title = this.getAttribute('title') || label;

        // Template literal único para evitar concatenação desnecessária
        this.innerHTML = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="folder-card" title="${title}">${FOLDER_SVG}<span>${label}</span></a>`;
    }
}
