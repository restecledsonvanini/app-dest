/** Toast de feedback usando a Popover API nativa (Baseline 2024).
 *  O elemento #feedback-toast já existe no HTML com popover="manual".
 *  @param {string} text — Mensagem exibida no toast.
 */
export function showGenericFeedback(text) {
    const toast = document.getElementById('feedback-toast');
    if (!toast) return;

    toast.textContent = text;
    toast.showPopover();

    // Auto-esconde após 1 800 ms
    setTimeout(() => toast.hidePopover(), 1800);
}

export function handleCopyAction(button) {
    const panel = button.closest('.tool-panel');
    if (!panel) return;
    const box = panel.querySelector('.result-box');
    if (!box) return;
    const value = box.dataset?.result || box.innerText || '';
    if (value) { 
       navigator.clipboard.writeText(value); 
       showGenericFeedback('Copiado!');
    }
}

export function handleClearAction(button) {
    const panel = button.closest('.tool-panel');
    if (!panel) return;
    
    // Clear result box
    const box = panel.querySelector('.result-box');
    if (box) {
        box.innerHTML = '';
        try { delete box.dataset.result; } catch (e) {}
        box.className = 'result-box';
    }
    
    // Clear form fields
    const inputs = panel.querySelectorAll('input, select, textarea');
    if (inputs.length) {
        inputs.forEach(i => i.value = '');
        inputs[0].focus();
    }
    
    // Disable action buttons
    panel.querySelectorAll('.btn-copy, .btn-clear').forEach(b => b.setAttribute('disabled', 'true'));
    
    // Optionally trigger a custom event for specific cleanups if needed
    panel.dispatchEvent(new CustomEvent('tool::cleared', { bubbles: true }));
}

/**
 * Habilita/desabilita os botões de ação (.btn-copy, .btn-clear) do painel
 * com base na classe do resultBox (info = sucesso, qualquer outra = erro).
 * Chamado pelos handlers de ferramenta após escrever no resultBox.
 * @param {HTMLElement} resultBox
 */
export function updateActionButtons(resultBox) {
    const panel = resultBox.closest('.tool-panel');
    if (!panel) return;
    const isSuccess = resultBox.classList.contains('info');
    panel.querySelectorAll('.btn-clear').forEach(b => b.removeAttribute('disabled'));
    panel.querySelectorAll('.btn-copy').forEach(b => {
        if (isSuccess) b.removeAttribute('disabled');
        else b.setAttribute('disabled', 'true');
    });
}
