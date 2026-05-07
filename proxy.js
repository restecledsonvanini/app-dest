const http = require('http');
const https = require('https');

// Proxy simples para BrasilAPI
const server = http.createServer((req, res) => {
    // Apenas permitir requests para /cnpj/v1/
    if (!req.url.startsWith('/cnpj/v1/')) {
        res.writeHead(404);
        res.end('Not found');
        return;
    }

    const cnpj = req.url.replace('/cnpj/v1/', '');
    const targetUrl = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;

    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Proxy a request
    const proxyReq = https.request(targetUrl, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(500);
        res.end('Proxy error: ' + err.message);
    });

    req.pipe(proxyReq);
});

server.listen(3000, () => {
    console.log('Proxy server running on http://localhost:3000');
});