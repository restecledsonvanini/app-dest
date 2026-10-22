const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedProxyRequest, sanitizeOrigin } = require('./proxy.js');

test('rejeita caminhos fora do CNPJ e métodos não permitidos', () => {
    assert.equal(isAllowedProxyRequest('/cnpj/v1/12345678000195', 'GET'), true);
    assert.equal(isAllowedProxyRequest('/cnpj/v1/123', 'GET'), false);
    assert.equal(isAllowedProxyRequest('/cnpj/v1/12345678000195', 'POST'), false);
    assert.equal(isAllowedProxyRequest('/api/anything', 'GET'), false);
});

test('mantém origem CORS restrita em vez de wildcard', () => {
    assert.equal(sanitizeOrigin('*'), '');
    assert.equal(sanitizeOrigin('https://example.com'), 'https://example.com');
    assert.equal(sanitizeOrigin('https://app.example.com,https://other.example.com'), 'https://app.example.com');
});
