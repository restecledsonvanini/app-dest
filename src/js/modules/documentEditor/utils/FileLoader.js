export class FileLoader {
    /**
     * Lê um arquivo como ArrayBuffer com suporte a AbortSignal.
     * @param {File} file - O arquivo a ser lido.
     * @param {AbortSignal} [signal] - Sinal para abortar a operação.
     * @returns {Promise<ArrayBuffer>} O conteúdo do arquivo como ArrayBuffer.
     * @throws {Error} Se o arquivo não for válido ou a operação for abortada.
     */
    static async readAsArrayBuffer(file, signal) {
        if (!file) {
            throw new Error('Arquivo não fornecido.');
        }

        if (signal?.aborted) {
            throw new Error('Processamento abortado pelo usuário ou timeout.');
        }

        try {
            const buffer = await file.arrayBuffer();
            if (signal?.aborted) {
                throw new Error('Processamento abortado pelo usuário ou timeout.');
            }
            return buffer;
        } catch (error) {
            console.error('[FileLoader] Erro ao ler arrayBuffer do arquivo:', error);
            throw new Error(`Erro ao ler arquivo: ${error.message}`);
        }
    }
}