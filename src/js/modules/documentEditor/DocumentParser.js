const TOKEN_REGEX = /\[\s*\{\{\s*([^}]+)\s*\}\}\s*\]|\{\{\s*([^}]+)\s*\}\}/g;

function debugRegex(html) {
    const matches = [];
    let match;
    const regex = new RegExp(TOKEN_REGEX.source, TOKEN_REGEX.flags);

    while ((match = regex.exec(html)) !== null) {
        matches.push({
            fullMatch: match[0],
            group1: match[1],
            group2: match[2],
            index: match.index
        });
    }

    return matches;
}

export class DocumentParser {
    constructor(htmlContent) {
        // Debug regex
        debugRegex(htmlContent);

        this.originalHtml = htmlContent;
        this.placeholders = this.extractPlaceholders();
    }

    extractPlaceholders() {
        const placeholderMap = new Map();
        let match;

        while ((match = TOKEN_REGEX.exec(this.originalHtml)) !== null) {
            const content = match[1] || match[2];
            const isSelect = Boolean(match[1]);

            try {
                const parsed = this.parseTokenContent(content);

                if (!placeholderMap.has(parsed.name)) {
                    placeholderMap.set(parsed.name, {
                        ...parsed,
                        kind: isSelect ? 'select' : 'input',
                        count: 0
                    });
                } else if (isSelect) {
                    placeholderMap.get(parsed.name).kind = 'select';
                }

                placeholderMap.get(parsed.name).count += 1;
            } catch (error) {
                console.error(`[DocumentParser.extractPlaceholders] Erro ao processar token "${content}":`, error);
                throw error;
            }
        }

        return Array.from(placeholderMap.values());
    }

    parseTokenContent(content) {
        let name = String(content || '').trim();
        let type = 'text';
        let required = true;

        if (name.endsWith('?')) {
            required = false;
            name = name.slice(0, -1).trim();
        }

        if (name.includes(':')) {
            const [fieldName, fieldType] = name.split(':').map((part) => part.trim());
            name = fieldName;
            type = this.normalizeType(fieldType);
        }

        if (type === 'text' && /\b(data|vigencia|vigência)\b/i.test(name)) {
            type = 'date';
        }

        return { name, type, required };
    }

    normalizeType(type) {
        const typeMap = {
            date: 'date',
            email: 'email',
            tel: 'tel',
            phone: 'tel',
            number: 'number',
            numeric: 'number',
            textarea: 'textarea',
            text: 'text'
        };

        return typeMap[type] || 'text';
    }

    getPlaceholders() {
        return this.placeholders;
    }

    render(data, options = {}) {
        const { highlightEmpty = true, escapeHtml = true } = options;
        let html = this.originalHtml;

        try {
            this.placeholders.forEach(({ name }) => {
                const value = data[name] ?? '';
                const safeValue = escapeHtml ? this.escapeHtml(value) : value;

                try {
                    const escapedName = escapeRegExp(name);
                    const pattern = new RegExp(`(?:\\[\\s*)?\\{\\{${escapedName}[^}]*\\}\\}(?:\\s*\\])?`, 'g');

                    if (String(value).trim()) {
                        html = html.replace(
                            pattern,
                            `<span class="document-editor__placeholder document-editor__placeholder--filled" data-field="${name}">${safeValue}</span>`
                        );
                    } else if (highlightEmpty) {
                        html = html.replace(
                            pattern,
                            `<span class="document-editor__placeholder document-editor__placeholder--empty" data-field="${name}">{{${name}}}</span>`
                        );
                    }
                } catch (regexError) {
                    console.error(`[DocumentParser.render] Erro na regex para placeholder "${name}":`, regexError);
                    throw regexError;
                }
            });

            return cleanupRenderedBrackets(html);
        } catch (error) {
            console.error('[DocumentParser.render] Erro geral no render:', error);
            throw error;
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return String(text).replace(/[&<>"']/g, (char) => map[char]);
    }
}

function cleanupRenderedBrackets(html) {
    return html.replace(/\[(\s*<span class="document-editor__placeholder[\s\S]*?<\/span>\s*)\]/g, '$1');
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
