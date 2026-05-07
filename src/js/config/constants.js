/**
 * config/constants.js — Constantes centralizadas
 * Evita hard-coding de timeouts, tamanhos e outros valores fixos
 * @author Refatoração 2026-05-04
 */

export const CONSTANTS = {
    timeouts: {
        parseDocument: 30000, // ms para parsing de documentos
        apiRequest: 10000,    // ms para requests de API
    },
    retries: {
        api: 1, // número de tentativas para API
    },
    delays: {
        retry: 500, // ms de delay entre retries
    },
    sizes: {
        maxFileSize: 52428800, // 50MB para uploads de arquivo
    },
};