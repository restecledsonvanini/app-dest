const TOKEN_REGEX = /\[\{\{([^}]+)\}\}\]|\{\{([^}]+)\}\}/g;

export class DocumentParser {
    constructor(htmlContent) {
        this.originalHtml = htmlContent;
        this.placeholders = this.extractPlaceholders();
    }

    extractPlaceholders() {
        const placeholderMap = new Map();
        let match;

        while ((match = TOKEN_REGEX.exec(this.originalHtml)) !== null) {
            const content = match[1] || match[2];
            const isSelect = Boolean(match[1]);
            const parsed = this.parseTokenContent(content);

            if (!placeholderMap.has(parsed.name)) {
                placeholderMap.set(parsed.name, {
                    ...parsed,
                    kind: isSelect ? 'select' : 'input',
                    count: 0
                });
            }

            placeholderMap.get(parsed.name).count += 1;
        }

        return Array.from(placeholderMap.values());
    }

    parseTokenContent(content) {
        let name = content;
        let type = 'text';
        let required = true;

        if (name.endsWith('?')) {
            required = false;
            name = name.slice(0, -1);
        }

        if (name.includes(':')) {
            const [fieldName, fieldType] = name.split(':');
            name = fieldName;
            type = this.normalizeType(fieldType);
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

        this.placeholders.forEach(({ name }) => {
            const value = data[name] ?? '';
            const safeValue = escapeHtml ? this.escapeHtml(value) : value;
            const pattern = new RegExp(`(?:\\[)?\\{\\{${escapeRegExp(name)}[^}]*\\}\\}(?:\\])?`, 'g');

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
        });

        return cleanupRenderedBrackets(html);
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
