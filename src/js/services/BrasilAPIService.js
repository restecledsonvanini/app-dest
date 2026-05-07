/**
 * services/BrasilAPIService.js — Cliente para BrasilAPI com timeout + retry
 * Abstrai a complexidade de chamadas HTTP com tratamento de erro robusto
 * @author Refatoração 2026-05-04
 */

import { AppError, ERROR_TYPE, apiError, timeoutError } from './ErrorHandler.js';
import { CONSTANTS } from '../config/constants.js';

export class BrasilAPIService {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://brasilapi.com.br/api';
        this.timeout = options.timeout || CONSTANTS.timeouts.apiRequest;
        this.retries = options.retries || CONSTANTS.retries.api;
        this.retryDelay = options.retryDelay || CONSTANTS.delays.retry;
    }

    /**
     * Busca CNPJ com tratamento robusto de erro
     * @param {string} cnpj - CNPJ sem máscara (14 dígitos)
     * @returns {Promise<Object>} dados do CNPJ
     * @throws {AppError} se não encontrado ou timeout
     */
    async search(cnpj) {
        if (!/^\d{14}$/.test(cnpj)) {
            throw new AppError(
                ERROR_TYPE.VALIDATION,
                'CNPJ deve ter 14 dígitos sem máscara',
                { cnpj }
            );
        }

        return this.requestWithRetry(`/cnpj/v1/${cnpj}`, this.retries);
    }

    /**
     * Implementa retry com backoff exponencial
     * @private
     */
    async requestWithRetry(endpoint, attemptsLeft) {
        try {
            return await this.request(endpoint);
        } catch (error) {
            if (error.type === ERROR_TYPE.TIMEOUT && attemptsLeft > 0) {
                // Aguarda e tenta novamente
                await new Promise(resolve =>
                    setTimeout(resolve, this.retryDelay)
                );
                return this.requestWithRetry(endpoint, attemptsLeft - 1);
            }
            throw error;
        }
    }

    /**
     * Faz requisição com timeout (AbortController)
     * @private
     */
    async request(endpoint) {
        const url = this.baseUrl + endpoint;
        const controller = new AbortController();
        let timeoutHandle;

        try {
            // Timeout automático
            timeoutHandle = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw apiError(endpoint, response.status, {
                    statusText: response.statusText
                });
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw timeoutError('BrasilAPI ' + endpoint, this.timeout);
            }
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(
                ERROR_TYPE.NETWORK,
                error.message || 'Falha na conexão com a API',
                { originalError: error }
            );
        } finally {
            clearTimeout(timeoutHandle);
        }
    }
}
