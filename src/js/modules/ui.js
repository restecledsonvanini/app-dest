export function showGenericFeedback(text) {
    const existing = document.querySelector('[data-feedback]');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.setAttribute('data-feedback', 'true');
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #16c76b;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    feedback.innerText = text;
    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => feedback.remove(), 300);
    }, 1500);
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
