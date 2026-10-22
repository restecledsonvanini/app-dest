import { ExpirationSettingsStore } from '../services/ExpirationSettingsStore.js';

const expirationSettings = new ExpirationSettingsStore();

export function initSettingsUI() {
    const includeStartDate = document.getElementById('settings-include-start-date');
    const status = document.getElementById('settings-save-status');

    if (includeStartDate) {
        includeStartDate.checked = expirationSettings.load().includeStartDate;
        includeStartDate.addEventListener('change', () => {
            try {
                expirationSettings.save({ includeStartDate: includeStartDate.checked });
                if (status) status.textContent = 'Configuração salva.';
                const expirationForm = document.querySelector('.form-tool[data-tool="calculateDateValidity"]');
                const unit = expirationForm?.querySelector('#select-unit')?.value;
                const signatureDate = expirationForm?.querySelector('#input-expiration-signature')?.value;
                const duration = expirationForm?.querySelector('#input-duration')?.value;
                const startDate = expirationForm?.querySelector('#input-date-start')?.value;
                const startMatchesSignature = expirationForm?.querySelector('#input-start-matches-signature')?.checked;
                if (unit === 'days' && signatureDate && duration && (startMatchesSignature || startDate)) {
                    expirationForm.requestSubmit();
                }
            } catch (error) {
                includeStartDate.checked = expirationSettings.load().includeStartDate;
                if (status) status.textContent = 'Não foi possível salvar a configuração neste navegador.';
                console.error('[Settings] Falha ao salvar configuração:', error);
            }
        });
    }

}