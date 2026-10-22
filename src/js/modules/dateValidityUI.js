export function syncDateValidityFields(form) {
    const unitSelect = form.querySelector('#select-unit');
    const startDate = form.querySelector('#input-date-start');
    const signatureDate = form.querySelector('#input-expiration-signature');
    const startMatchesSignature = form.querySelector('#input-start-matches-signature');
    const durationInput = form.querySelector('#input-duration');
    const durationLabel = form.querySelector('label[for="input-duration"]');
    const startDateLabel = form.querySelector('label[for="input-date-start"]');
    const signatureDateLabel = form.querySelector('label[for="input-expiration-signature"]');
    const startMatchesSignatureLabel = form.querySelector('label[for="input-start-matches-signature"]');
    const startToolbar = form.querySelector('.expiration-start-toolbar');
    const expirationDateRow = form.querySelector('.expiration-date-row');

    if (!unitSelect || !startDate || !signatureDate || !startMatchesSignature ||
        !durationInput || !durationLabel || !startDateLabel || !signatureDateLabel ||
        !startMatchesSignatureLabel || !startToolbar || !expirationDateRow) return;

    const isDays = unitSelect.value === 'days';
    durationLabel.textContent = isDays ? 'Dias de Vigência:' : 'Duração:';
    durationInput.placeholder = isDays ? 'Ex: 180' : 'Ex: 12';
    durationInput.max = isDays ? '36500' : '';
    durationInput.title = isDays
        ? 'Digite um número inteiro entre 1 e 36500'
        : 'Digite uma duração inteira maior que 0';

    startMatchesSignature.disabled = false;
    startMatchesSignature.hidden = false;
    startMatchesSignatureLabel.hidden = false;
    startToolbar.hidden = false;
    signatureDate.disabled = false;
    signatureDate.hidden = false;
    signatureDateLabel.hidden = false;
    startDate.disabled = startMatchesSignature.checked;
    startDateLabel.textContent = 'Início da Vigência:';

    if (startMatchesSignature.checked) startDate.value = signatureDate.value;
}

export function initDateValidityUI() {
    const form = document.querySelector('.form-tool[data-tool="calculateDateValidity"]');
    if (!form) return;

    const unitSelect = form.querySelector('#select-unit');
    const startDate = form.querySelector('#input-date-start');
    const signatureDate = form.querySelector('#input-expiration-signature');
    const startMatchesSignature = form.querySelector('#input-start-matches-signature');

    if (!unitSelect || !startDate || !signatureDate || !startMatchesSignature) return;

    const updateDateMode = () => syncDateValidityFields(form);

    unitSelect.addEventListener('change', updateDateMode);
    startMatchesSignature.addEventListener('change', updateDateMode);
    signatureDate.addEventListener('input', () => {
        if (startMatchesSignature.checked) {
            startDate.value = signatureDate.value;
        }
    });

    syncDateValidityFields(form);
}