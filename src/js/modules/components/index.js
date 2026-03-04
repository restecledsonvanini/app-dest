/**
 * components/index.js — Registro central de Custom Elements.
 * Chamar registerComponents() uma vez em main.js antes do DOMContentLoaded.
 */
import { SheetCard }  from './SheetCard.js';
import { ToolResult } from './ToolResult.js';
import { ToolPanel }  from './ToolPanel.js';

export function registerComponents() {
    customElements.define('sheet-card',  SheetCard);
    customElements.define('tool-result', ToolResult);
    customElements.define('tool-panel',  ToolPanel);
}
