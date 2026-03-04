/**
 * ToolResult.js — Custom Element <tool-result>
 * Encapsula o conjunto botão-primário + copiar + limpar + caixa de resultado.
 * Sem Shadow DOM: event delegation de main.js e lógica de ui.js continuam
 * funcionando pois .result-box e .btn-copy/.btn-clear ficam no light DOM.
 *
 * @attr {string} primary-icon  - Classe Bootstrap Icons do ícone do botão primário (ex: "bi bi-magic")
 * @attr {string} primary-label - Texto do botão primário (ex: "Calcular")
 * @attr {string} result-id     - id aplicado ao .result-box para referência direta no DOM
 */
export class ToolResult extends HTMLElement {
    connectedCallback() {
        const icon    = this.getAttribute('primary-icon')  || 'bi bi-check-circle';
        const label   = this.getAttribute('primary-label') || 'Calcular';
        const resultId = this.getAttribute('result-id')    || '';
        const idAttr  = resultId ? ` id="${resultId}"` : '';

        this.innerHTML = `
            <div class="button-group">
                <button class="btn btn-primary" type="submit">
                    <i class="${icon}"></i><span class="btn-label">${label}</span>
                </button>
                <button class="btn btn-copy" type="button" disabled
                    title="Copiar resultado" aria-label="Copiar resultado">
                    <i class="bi bi-clipboard"></i><span class="btn-label">Copiar</span>
                </button>
                <button class="btn btn-clear" type="button" disabled data-action="clear"
                    title="Limpar resultado" aria-label="Limpar resultado">
                    <i class="bi bi-x-circle"></i><span class="btn-label">Limpar</span>
                </button>
            </div>
            <div${idAttr} class="result-box" aria-live="polite" aria-atomic="true"></div>`;
    }
}
