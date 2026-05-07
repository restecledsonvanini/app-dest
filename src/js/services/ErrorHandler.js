/**
 * services/ErrorHandler.js — Tratamento centralizado de erros
 * Evita inconsistência entre mensagens de erro
 * @author Auditoria de Código 2026-04-09
 */

import { MSG } from '../config/messages.js';

/**
 * Tipos de erro conhecidos — facilita teste e tracking
 */
export const ERROR_TYPE = {
    VALIDATION: 'VALIDATION_ERROR',
    API: 'API_ERROR',
    NETWORK: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT_ERROR',
    PARSE: 'PARSE_ERROR',
    FILE: 'FILE_ERROR',
};

/**
 * Classe centralizada de erro com tipo, mensagem, origem
 */
export class AppError extends Error {
    constructor(type, message, details = {}) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.details = details;
        this.timestamp = new Date();
    }

    /**
     * Retorna mensagem amigável para UI
     */
    getUserMessage() {
        if (this.type === ERROR_TYPE.VALIDATION) {
            return this.message || MSG.feedback.errorOccurred;
        }

        const map = {
            [ERROR_TYPE.API]: MSG.cnpj.apiError(this.message),
            [ERROR_TYPE.NETWORK]: MSG.feedback.networkError,
            [ERROR_TYPE.TIMEOUT]: MSG.cnpj.timeout,
            [ERROR_TYPE.PARSE]: MSG.document.parseError,
            [ERROR_TYPE.FILE]: MSG.document.unsupportedFormat,
        };
        return map[this.type] || this.message;
    }

    /**
     * Log estruturado (útil para telemetria)
     */
    toJSON() {
        return {
            type: this.type,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
            stack: this.stack,
        };
    }
}

/**
 * Factory para criar erros validação
 */
export function validationError(field, reason) {
    return new AppError(
        ERROR_TYPE.VALIDATION,
        `${field}: ${reason}`,
        { field, reason }
    );
}

/**
 * Factory para criar erros API
 */
export function apiError(endpoint, statusCode, details) {
    return new AppError(
        ERROR_TYPE.API,
        `API call failed: ${endpoint} (${statusCode})`,
        { endpoint, statusCode, ...details }
    );
}

/**
 * Trata timeout com cleanliness
 */
export function timeoutError(operation, ms) {
    return new AppError(
        ERROR_TYPE.TIMEOUT,
        `${operation} took longer than ${ms}ms`,
        { operation, ms }
    );
}

/**
 * Logger de erros (pode integrar com Sentry/Rollbar)
 */
export function logError(error, context = {}) {
    console.error('[AppError]', {
        ...error.toJSON?.() || error,
        context,
    });

    // Aqui você integraria com seu serviço de telemetria:
    // Sentry.captureException(error, { tags: context });
}
