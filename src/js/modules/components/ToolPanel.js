/**
 * ToolPanel.js — Custom Element <tool-panel>
 * Encapsula o cabeçalho da ferramenta (h3 + p.tool-desc) e aplica a classe
 * .tool-panel ao elemento host. O conteúdo interno (form) é preservado;
 * o cabeçalho é inserido via prepend para não tocar nos filhos existentes.
 *
 * Requisito: <script type="module"> é defer por padrão, logo customElements.define()
 * é chamado após o parse completo do DOM — children já estão disponíveis em
 * connectedCallback via upgrade de elementos existentes.
 *
 * @attr {string} heading - Título da ferramenta (h3)
 * @attr {string} desc    - Descrição breve (p.tool-desc)
 */
export class ToolPanel extends HTMLElement {
    connectedCallback() {
        this.classList.add('tool-panel');

        const heading = this.getAttribute('heading') || '';
        const desc    = this.getAttribute('desc')    || '';

        const header = document.createElement('div');
        header.className = 'tool-header';

        const h3 = document.createElement('h3');
        h3.textContent = heading;

        const p = document.createElement('p');
        p.className = 'tool-desc';
        p.textContent = desc;

        header.append(h3, p);
        this.prepend(header);
    }
}
