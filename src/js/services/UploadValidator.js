/**
 * services/UploadValidator.js — Validação de upload de arquivos
 * Verifica:
 * - Formato de arquivo (DOCX, ODT, HTML, DOC)
 * - Tamanho do arquivo
 * - Integridade do arquivo
 * - Encoding
 * @author 2026-04-17
 */

import { DiagnosticsService, DIAGNOSTIC_TYPE, DIAGNOSTIC_LEVEL } from './DiagnosticsService.js';

/**
 * Tipos de arquivo suportados
 */
export const SUPPORTED_FORMATS = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    odt: 'application/vnd.oasis.opendocument.text',
    html: 'text/html',
};

/**
 * Magic bytes (file signatures) para validação
 */
const FILE_SIGNATURES = {
    docx: [0x50, 0x4b, 0x03, 0x04], // ZIP (DOCX é ZIP)
    odt: [0x50, 0x4b, 0x03, 0x04],  // ZIP
    doc: [0xd0, 0xcf, 0x11, 0xe0],  // OLE (antigo WORD)
    html: [0x3c, 0x21, 0x44, 0x4f], // <!DO (DOCTYPE)
};

/**
 * Validador de upload
 */
export class UploadValidator {
    constructor(diagnostics = null) {
        this.diagnostics = diagnostics || new DiagnosticsService();
        this.maxFileSize = 52428800; // 50MB
        this.allowedExtensions = ['docx', 'doc', 'odt', 'html', 'htm'];
    }

    /**
     * Validar arquivo completo
     * @returns {ValidationResult} resultado da validação
     */
    async validateFile(file) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            format: null,
            size: file.size,
            name: file.name,
        };

        // Validações
        this._validateFileName(file.name, result);
        this._validateFileSize(file.size, result);

        // Validação de conteúdo (assíncrono)
        await this._validateFileContent(file, result);

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Validar nome do arquivo
     */
    _validateFileName(fileName, result) {
        if (!fileName || fileName.trim() === '') {
            const error = {
                type: DIAGNOSTIC_TYPE.INVALID_FILE_FORMAT,
                message: 'Nome do arquivo é vazio ou inválido',
                suggestion: 'Carregue um arquivo com nome válido'
            };
            result.errors.push(error);
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.INVALID_FILE_FORMAT,
                error.message,
                { suggestion: error.suggestion }
            );
            return;
        }

        const ext = fileName.split('.').pop()?.toLowerCase();
        if (!this.allowedExtensions.includes(ext)) {
            const error = {
                type: DIAGNOSTIC_TYPE.INVALID_FILE_FORMAT,
                message: `Extensão não suportada: .${ext}`,
                suggestion: `Use um dos formatos: ${this.allowedExtensions.join(', ')}`
            };
            result.errors.push(error);
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.INVALID_FILE_FORMAT,
                error.message,
                { suggestion: error.suggestion }
            );
            return;
        }

        result.format = ext;
    }

    /**
     * Validar tamanho do arquivo
     */
    _validateFileSize(size, result) {
        if (size === 0) {
            const error = {
                type: DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                message: 'Arquivo está vazio (0 bytes)',
                suggestion: 'Carregue um arquivo com conteúdo válido'
            };
            result.warnings.push(error);
            this.diagnostics.addWarning(
                DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                error.message,
                { suggestion: error.suggestion }
            );
            return;
        }

        if (size > this.maxFileSize) {
            const sizeMB = (size / 1024 / 1024).toFixed(2);
            const maxMB = (this.maxFileSize / 1024 / 1024).toFixed(0);
            const error = {
                type: DIAGNOSTIC_TYPE.FILE_TOO_LARGE,
                message: `Arquivo muito grande: ${sizeMB}MB (máximo: ${maxMB}MB)`,
                suggestion: 'Comprima o arquivo ou remova conteúdo desnecessário'
            };
            result.errors.push(error);
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.FILE_TOO_LARGE,
                error.message,
                { suggestion: error.suggestion, size: size, max: this.maxFileSize }
            );
        }

        // Avisar sobre arquivos muito pequenos (pode estar truncado)
        if (size < 1000) {
            const error = {
                type: DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                message: 'Arquivo muito pequeno (pode estar truncado)',
                suggestion: 'Verifique se o arquivo foi completamente carregado'
            };
            result.warnings.push(error);
            this.diagnostics.addWarning(
                DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                error.message,
                { suggestion: error.suggestion }
            );
        }
    }

    /**
     * Validar conteúdo do arquivo (magic bytes, ZIP integrity, etc)
     */
    async _validateFileContent(file, result) {
        try {
            const headerBytes = await this._readFileHeader(file, 4);
            const ext = file.name.split('.').pop()?.toLowerCase();

            // Verificar magic bytes
            const expectedSignature = FILE_SIGNATURES[ext];
            if (expectedSignature && !this._compareByteArrays(headerBytes, expectedSignature)) {
                const error = {
                    type: DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                    message: `Assinatura de arquivo inválida. Arquivo pode estar corrompido ou em formato incorreto: .${ext}`,
                    suggestion: 'Tente novamente com um arquivo válido do tipo indicado'
                };
                result.warnings.push(error);
                this.diagnostics.addWarning(
                    DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                    error.message,
                    { suggestion: error.suggestion, format: ext }
                );
            }

            // Para DOCX/ODT (que são ZIP), validar estrutura
            if ((ext === 'docx' || ext === 'odt') && window.PizZip) {
                await this._validateZipStructure(file, ext, result);
            }

            // Para HTML, validar encoding
            if (ext === 'html' || ext === 'htm') {
                await this._validateHtmlEncoding(file, result);
            }
        } catch (error) {
            const err = {
                type: DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                message: `Erro ao validar conteúdo do arquivo: ${error.message}`,
                suggestion: 'O arquivo pode estar corrompido. Tente um arquivo diferente'
            };
            result.errors.push(err);
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                err.message,
                { suggestion: err.suggestion }
            );
        }
    }

    /**
     * Ler primeiros bytes do arquivo
     */
    async _readFileHeader(file, numBytes = 4) {
        const blob = file.slice(0, numBytes);
        const arrayBuffer = await blob.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }

    /**
     * Comparar arrays de bytes
     */
    _compareByteArrays(actual, expected) {
        if (actual.length < expected.length) return false;
        for (let i = 0; i < expected.length; i++) {
            if (actual[i] !== expected[i]) return false;
        }
        return true;
    }

    /**
     * Validar estrutura ZIP (DOCX/ODT)
     */
    async _validateZipStructure(file, format, result) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const zip = new window.PizZip(arrayBuffer);

            // Verificar se tem os arquivos essenciais
            const requiredFiles = format === 'docx'
                ? ['word/document.xml', '[Content_Types].xml']
                : ['content.xml', 'META-INF/manifest.xml'];

            const missingFiles = requiredFiles.filter(requiredFile => !zip.file(requiredFile));
            if (missingFiles.length > 0) {
                const error = {
                    type: DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                    message: `Arquivo ${format.toUpperCase()} está incompleto. Faltam: ${missingFiles.join(', ')}`,
                    suggestion: 'O arquivo pode estar corrompido. Salve-o novamente e tente novamente'
                };
                result.warnings.push(error);
                this.diagnostics.addWarning(
                    DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                    error.message,
                    { suggestion: error.suggestion, missingFiles }
                );
            }
        } catch (error) {
            const err = {
                type: DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                message: `Não foi possível ler a estrutura ZIP: ${error.message}`,
                suggestion: 'O arquivo pode estar corrompido ou ser um ZIP inválido'
            };
            result.errors.push(err);
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.FILE_CORRUPTED,
                err.message,
                { suggestion: err.suggestion }
            );
        }
    }

    /**
     * Validar encoding de arquivo HTML
     */
    async _validateHtmlEncoding(file, result) {
        try {
            const text = await file.text();

            // Verificar se tem charset declarado
            if (!text.includes('charset') && !text.includes('utf')) {
                const warning = {
                    type: DIAGNOSTIC_TYPE.UNSUPPORTED_ENCODING,
                    message: 'Arquivo HTML não declara charset explicitamente',
                    suggestion: 'Adicione <meta charset="UTF-8"> no <head>'
                };
                result.warnings.push(warning);
                this.diagnostics.addWarning(
                    DIAGNOSTIC_TYPE.UNSUPPORTED_ENCODING,
                    warning.message,
                    { suggestion: warning.suggestion }
                );
            }

            // Validar se é HTML bem-formado
            try {
                new DOMParser().parseFromString(text, 'text/html');
            } catch {
                const warning = {
                    type: DIAGNOSTIC_TYPE.TEMPLATE_PARSE_ERROR,
                    message: 'Arquivo HTML pode ter estrutura inválida',
                    suggestion: 'Valide o HTML em um validador online'
                };
                result.warnings.push(warning);
                this.diagnostics.addWarning(
                    DIAGNOSTIC_TYPE.TEMPLATE_PARSE_ERROR,
                    warning.message,
                    { suggestion: warning.suggestion }
                );
            }
        } catch (error) {
            const err = {
                type: DIAGNOSTIC_TYPE.UNSUPPORTED_ENCODING,
                message: `Erro ao ler conteúdo HTML: ${error.message}`,
                suggestion: 'O arquivo pode estar em encoding não-suportado'
            };
            result.errors.push(err);
            this.diagnostics.addError(
                DIAGNOSTIC_TYPE.UNSUPPORTED_ENCODING,
                err.message,
                { suggestion: err.suggestion }
            );
        }
    }

    /**
     * Obter tipo MIME do arquivo
     */
    getMimeType(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return SUPPORTED_FORMATS[ext] || 'application/octet-stream';
    }
}
