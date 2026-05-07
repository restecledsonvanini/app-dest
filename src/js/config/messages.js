/**
 * config/messages.js — Centro de mensagens da aplicação
 * i18n-ready: Todas as strings de usuário concentradas aqui
 * @author Auditoria de Código 2026-04-09
 * 
 * Uso: `import { MSG } from './config/messages.js'`
 * Então: `console.log(MSG.document.loaded('meu-arquivo.docx'))`
 */

export const MSG = {
    // Document Editor
    document: {
        loaded: (filename) => `${filename} carregado com sucesso.`,
        previewOpened: 'A prévia foi aberta automaticamente no modo ampliado.',
        processing: (filename) => `Processando ${filename}...`,
        parseError: 'Erro ao processar documento. Verifique o formato.',
        parseTimeout: 'O processamento excedeu o tempo limite. Tente novamente com um arquivo menor.',
        unsupportedFormat: 'Formato não suportado. Use preferencialmente .docx.',
        tooBig: 'Arquivo muito grande (máx. 50MB). Tente outro.',
    },

    // Form Fields
    form: {
        fieldCount: (count) => `${count} campo(s) detectado(s).`,
        selectFields: 'Campos com [{{nome}}] usam opções salvas.',
        noFieldsDetected: 'Nenhum campo parametrizado detectado.',
        resetSuccess: 'Campos redefinidos. O foco voltou ao primeiro campo.',
        saveSuccess: 'Configurações salvas. A prévia foi atualizada.',
    },

    // Mask Handlers
    mask: {
        removeError: 'Digite um valor para remover a máscara.',
        notFound: 'Nenhum número encontrado no valor digitado.',
        onlyNumbers: 'Digite apenas números.',
        digitCount: (expected, actual) => `Deve ter ${expected} dígitos (você digitou ${actual}).`,
        invalid: 'Valor inválido (falha na validação).',
        gmsNumberRequired: 'Digite o número GMS.',
        gmsYearRequired: 'Digite o ano.',
    },

    // CNPJ Search
    cnpj: {
        invalidInput: 'Digite um CNPJ válido (14 dígitos).',
        notFound: 'CNPJ não encontrado na base de dados.',
        apiError: (error) => `Erro: ${error.message || 'Erro de rede desconhecido'}`,
        timeout: 'Busca expirou. Servidor indisponível?',
    },

    // Date Operations
    date: {
        startRequired: 'Digite a data de início.',
        endRequired: 'Selecione data inicial e final.',
        invalidFormat: 'Data inválida (formato DD/MM/YYYY).',
        invalidDates: 'Datas inválidas (use DD/MM/YYYY).',
        selectUnit: 'Selecione a unidade de tempo (Meses ou Anos).',
        durationInvalid: 'Digite uma duração válida (maior que 0).',
        reversedPeriod: 'Período invertido',
        expired: (days) => `Vencido há ${Math.abs(days)} dia(s)`,
        expirestoday: 'Vence hoje',
        expiresIn: (days) => `Vence em ${days} dia(s)`,
    },

    // Feedback
    feedback: {
        copied: 'Copiado!',
        cleared: 'Formulário limpo.',
        errorOccurred: 'Ocorreu um erro. Tente novamente.',
        networkError: 'Erro de conexão. Verifique internet.',
    },

    // Export
    export: {
        wordDownloaded: 'Documento salvo para arquivar no Drive.',
        pdfError: 'Falha ao gerar PDF:',
        printFallback: 'Seu navegador abriu a janela para salvar em PDF.',
        windowBlocked: 'Não foi possível abrir a janela de impressão (popup bloqueado?).',
    },

    // UI Controls
    ui: {
        fontSizeSmall: 'Pequeno',
        fontSizeMedium: 'Médio',
        fontSizeLarge: 'Grande',
        lightTheme: 'Claro',
        darkTheme: 'Escuro',
    }
};

/**
 * Nota: Para implementar i18n completo, use pattern como:
 * 
 * import { FR } from './locales/fr.js';
 * const locale = navigator.language.startsWith('fr') ? FR : MSG;
 * console.log(locale.document.loaded('file.docx'));
 */
