const http = require('http');
const https = require('https');

const DEFAULT_PORT = Number(process.env.PROXY_PORT || 3000);
const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN || '').trim();
const DEFAULT_ALLOWED_ORIGIN = 'null';

function sanitizeOrigin(origin) {
    if (!origin) return '';

    const candidates = String(origin)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    const first = candidates[0] || '';
    if (!first || first === '*') return '';

    try {
        const parsed = new URL(first);
        return parsed.origin;
    } catch {
        return '';
    }
}

function isAllowedProxyRequest(urlPath, method = 'GET') {
    if (method !== 'GET' && method !== 'OPTIONS') {
        return false;
    }

    const path = String(urlPath || '');
    const match = /^\/cnpj\/v1\/(\d{14})$/.exec(path);
    return Boolean(match);
}

function buildTargetUrl(urlPath) {
    const match = /^\/cnpj\/v1\/(\d{14})$/.exec(String(urlPath || ''));
    if (!match) {
        throw new Error('Rotas fora do CNPJ não são permitidas.');
    }

    return `https://brasilapi.com.br/api/cnpj/v1/${match[1]}`;
}

function writeCorsHeaders(res, originHeader) {
    const origin = sanitizeOrigin(originHeader || ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN);
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'null');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Vary', 'Origin');
}

function startProxyServer(port = DEFAULT_PORT) {
    const server = http.createServer((req, res) => {
        const requestOrigin = req.headers.origin || '';
        writeCorsHeaders(res, requestOrigin);

        if (!isAllowedProxyRequest(req.url, req.method)) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        try {
            const targetUrl = buildTargetUrl(req.url);
            const proxyReq = https.request(targetUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'DEST-Proxy/1.0'
                }
            }, (proxyRes) => {
                const headers = { ...proxyRes.headers };
                delete headers['access-control-allow-origin'];
                delete headers['access-control-allow-methods'];
                delete headers['access-control-allow-headers'];
                res.writeHead(proxyRes.statusCode, headers);
                proxyRes.pipe(res);
            });

            proxyReq.on('error', (err) => {
                console.error('Proxy error:', err.message);
                res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Proxy error');
            });

            proxyReq.end();
        } catch (err) {
            console.error('Proxy config error:', err.message);
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Bad request');
        }
    });

    server.listen(port, () => {
        console.log(`Proxy server running on http://localhost:${port}`);
    });

    return server;
}

module.exports = {
    sanitizeOrigin,
    isAllowedProxyRequest,
    buildTargetUrl,
    startProxyServer,
};

if (require.main === module) {
    startProxyServer();
}
