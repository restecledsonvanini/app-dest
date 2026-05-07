/**
 * modules/documentEditor/ui/DiagnosticsUI.js — Interface de diagnósticos para usuário
 * Mostra placeholders malformados, erros e avisos de forma visual
 * @author 2026-04-17
 */

import { DIAGNOSTIC_LEVEL, DIAGNOSTIC_TYPE } from '../../../services/DiagnosticsService.js';

/**
 * Gerenciador de UI para diagnósticos
 */
export class DiagnosticsUI {
    constructor(containerElement, diagnosticsService) {
        this.container = containerElement;
        this.diagnosticsService = diagnosticsService;
        this.isVisible = false;
        this.panelElement = null;
        this.init();
    }

    /**
     * Inicializar UI
     */
    init() {
        this._createPanelStructure();
        this._attachListeners();
    }

    /**
     * Criar estrutura do painel
     */
    _createPanelStructure() {
        const panel = document.createElement('div');
        panel.className = 'diagnostics-panel';
        panel.innerHTML = `
            <div class="diagnostics-header">
                <div class="diagnostics-title">
                    <span class="diagnostics-icon">⚠️</span>
                    <span class="diagnostics-label">Diagnósticos</span>
                </div>
                <button class="diagnostics-close" aria-label="Fechar diagnósticos">✕</button>
            </div>
            <div class="diagnostics-summary">
                <span class="diagnostics-count-errors">0</span>
                <span class="diagnostics-count-warnings">0</span>
                <span class="diagnostics-count-info">0</span>
            </div>
            <div class="diagnostics-list"></div>
        `;

        // Adicionar estilos se não existirem
        this._ensureStyles();

        this.container.appendChild(panel);
        this.panelElement = panel;

        // Inicialmente oculto
        this.hide();
    }

    /**
     * Garantir que estilos existem
     */
    _ensureStyles() {
        if (document.getElementById('diagnostics-styles')) return;

        const style = document.createElement('style');
        style.id = 'diagnostics-styles';
        style.textContent = `
            .diagnostics-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 400px;
                max-height: 500px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                z-index: 10000;
                display: flex;
                flex-direction: column;
            }

            .diagnostics-panel.hidden {
                display: none;
            }

            .diagnostics-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid #eee;
                background: #f9f9f9;
            }

            .diagnostics-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                font-size: 14px;
                color: #333;
            }

            .diagnostics-icon {
                font-size: 18px;
            }

            .diagnostics-close {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 18px;
                color: #999;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }

            .diagnostics-close:hover {
                background: #eee;
                color: #333;
            }

            .diagnostics-summary {
                display: flex;
                gap: 12px;
                padding: 8px 16px;
                background: #fafafa;
                border-bottom: 1px solid #eee;
                font-size: 12px;
            }

            .diagnostics-count-errors::before {
                content: "Erros: ";
                color: #999;
            }

            .diagnostics-count-errors {
                color: #d32f2f;
                font-weight: 600;
            }

            .diagnostics-count-warnings::before {
                content: "Avisos: ";
                color: #999;
            }

            .diagnostics-count-warnings {
                color: #f57c00;
                font-weight: 600;
            }

            .diagnostics-count-info::before {
                content: "Info: ";
                color: #999;
            }

            .diagnostics-count-info {
                color: #1976d2;
                font-weight: 600;
            }

            .diagnostics-list {
                overflow-y: auto;
                flex: 1;
                padding: 0;
            }

            .diagnostic-item {
                padding: 12px 16px;
                border-left: 4px solid #999;
                border-bottom: 1px solid #eee;
                font-size: 13px;
                line-height: 1.4;
            }

            .diagnostic-item.error {
                border-left-color: #d32f2f;
                background: #ffebee;
            }

            .diagnostic-item.warning {
                border-left-color: #f57c00;
                background: #fff3e0;
            }

            .diagnostic-item.info {
                border-left-color: #1976d2;
                background: #e3f2fd;
            }

            .diagnostic-item:last-child {
                border-bottom: none;
            }

            .diagnostic-item-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
                font-weight: 600;
            }

            .diagnostic-item-type {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .diagnostic-item.error .diagnostic-item-type {
                background: #d32f2f;
                color: white;
            }

            .diagnostic-item.warning .diagnostic-item-type {
                background: #f57c00;
                color: white;
            }

            .diagnostic-item.info .diagnostic-item-type {
                background: #1976d2;
                color: white;
            }

            .diagnostic-item-message {
                margin-bottom: 6px;
                color: #333;
            }

            .diagnostic-item-location {
                font-size: 12px;
                color: #666;
                margin-bottom: 4px;
            }

            .diagnostic-item-suggestion {
                font-size: 12px;
                color: #2e7d32;
                font-style: italic;
            }

            /* Highlight para campos com erro */
            .field-with-diagnostic-error {
                border-color: #d32f2f !important;
                background-color: #ffebee !important;
            }

            .field-with-diagnostic-warning {
                border-color: #f57c00 !important;
                background-color: #fff3e0 !important;
            }

            .field-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-left: 4px;
                vertical-align: middle;
            }

            .field-indicator.error {
                background: #d32f2f;
            }

            .field-indicator.warning {
                background: #f57c00;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Atrelar listeners
     */
    _attachListeners() {
        const closeBtn = this.panelElement.querySelector('.diagnostics-close');
        closeBtn.addEventListener('click', () => this.hide());

        // Adicionar listener para novos diagnósticos
        if (this.diagnosticsService) {
            this.diagnosticsService.onDiagnosticAdded = (diagnostic) => {
                this.addDiagnosticItem(diagnostic);
            };
        }
    }

    /**
     * Mostrar painel
     */
    show() {
        this.isVisible = true;
        if (this.panelElement) {
            this.panelElement.classList.remove('hidden');
        }
    }

    /**
     * Ocultar painel
     */
    hide() {
        this.isVisible = false;
        if (this.panelElement) {
            this.panelElement.classList.add('hidden');
        }
    }

    /**
     * Alternar visibilidade
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Adicionar item de diagnóstico à interface
     */
    addDiagnosticItem(diagnostic) {
        const listContainer = this.panelElement.querySelector('.diagnostics-list');

        const item = document.createElement('div');
        item.className = `diagnostic-item ${diagnostic.level}`;
        item.id = `diagnostic-${diagnostic.id}`;

        const header = document.createElement('div');
        header.className = 'diagnostic-item-header';
        header.innerHTML = `
            <span class="diagnostic-item-type">${diagnostic.level}</span>
            <span>${this._getIcon(diagnostic.level)}</span>
        `;

        const message = document.createElement('div');
        message.className = 'diagnostic-item-message';
        message.textContent = diagnostic.message;

        item.appendChild(header);
        item.appendChild(message);

        if (diagnostic.location) {
            const location = document.createElement('div');
            location.className = 'diagnostic-item-location';
            location.textContent = `📍 ${diagnostic.location}`;
            item.appendChild(location);
        }

        if (diagnostic.suggestion) {
            const suggestion = document.createElement('div');
            suggestion.className = 'diagnostic-item-suggestion';
            suggestion.textContent = `💡 ${diagnostic.suggestion}`;
            item.appendChild(suggestion);
        }

        listContainer.appendChild(item);

        // Mostrar painel se houver erros
        if (diagnostic.level === DIAGNOSTIC_LEVEL.ERROR) {
            this.show();
        }

        // Auto-scroll para o novo item
        listContainer.scrollTop = listContainer.scrollHeight;

        // Atualizar contador
        this._updateSummary();
    }

    /**
     * Atualizar contadores de resumo
     */
    _updateSummary() {
        const summary = this.diagnosticsService.getSummary();
        this.panelElement.querySelector('.diagnostics-count-errors').textContent = summary.errors;
        this.panelElement.querySelector('.diagnostics-count-warnings').textContent = summary.warnings;
        this.panelElement.querySelector('.diagnostics-count-info').textContent = summary.infos;
    }

    /**
     * Limpar todos os itens
     */
    clear() {
        const listContainer = this.panelElement.querySelector('.diagnostics-list');
        listContainer.innerHTML = '';
        this._updateSummary();
    }

    /**
     * Destacar campo com erro
     */
    highlightFieldError(fieldName, level = DIAGNOSTIC_LEVEL.ERROR) {
        const fields = document.querySelectorAll(`[data-field="${fieldName}"], input[name="${fieldName}"]`);
        fields.forEach(field => {
            if (level === DIAGNOSTIC_LEVEL.ERROR) {
                field.classList.add('field-with-diagnostic-error');
            } else if (level === DIAGNOSTIC_LEVEL.WARNING) {
                field.classList.add('field-with-diagnostic-warning');
            }
        });
    }

    /**
     * Remover destaque de campo
     */
    removeFieldHighlight(fieldName) {
        const fields = document.querySelectorAll(`[data-field="${fieldName}"], input[name="${fieldName}"]`);
        fields.forEach(field => {
            field.classList.remove('field-with-diagnostic-error', 'field-with-diagnostic-warning');
        });
    }

    /**
     * Obter ícone do nível
     */
    _getIcon(level) {
        const icons = {
            [DIAGNOSTIC_LEVEL.ERROR]: '🔴',
            [DIAGNOSTIC_LEVEL.WARNING]: '🟠',
            [DIAGNOSTIC_LEVEL.INFO]: '🔵',
        };
        return icons[level] || '•';
    }

    /**
     * Exportar diagnósticos como relatório
     */
    exportReport(format = 'json') {
        const report = this.diagnosticsService.generateReport(format);

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            this._downloadFile(blob, 'diagnosticos.json');
        } else if (format === 'html') {
            const blob = new Blob([report], { type: 'text/html' });
            this._downloadFile(blob, 'diagnosticos.html');
        } else if (format === 'text') {
            const blob = new Blob([report], { type: 'text/plain' });
            this._downloadFile(blob, 'diagnosticos.txt');
        }
    }

    /**
     * Download de arquivo
     */
    _downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
