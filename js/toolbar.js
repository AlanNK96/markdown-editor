/**
 * 工具栏模块
 * 负责处理工具栏按钮点击事件和 Markdown 语法插入
 */

class Toolbar {
    constructor(editor) {
        this.editor = editor;
        this.buttons = {};
        
        this.init();
    }

    /**
     * 初始化工具栏
     */
    init() {
        // 绑定所有工具栏按钮
        this.bindButton('btn-heading', () => this.insertHeading());
        this.bindButton('btn-bold', () => this.insertBold());
        this.bindButton('btn-italic', () => this.insertItalic());
        this.bindButton('btn-strikethrough', () => this.insertStrikethrough());
        this.bindButton('btn-link', () => this.insertLink());
        this.bindButton('btn-image', () => this.insertImage());
        this.bindButton('btn-code', () => this.insertInlineCode());
        this.bindButton('btn-code-block', () => this.insertCodeBlock());
        this.bindButton('btn-ul', () => this.insertUnorderedList());
        this.bindButton('btn-ol', () => this.insertOrderedList());
        this.bindButton('btn-quote', () => this.insertQuote());
        this.bindButton('btn-hr', () => this.insertHorizontalRule());
        this.bindButton('btn-table', () => this.insertTable());
    }

    /**
     * 绑定按钮点击事件
     * @param {String} buttonId - 按钮 ID
     * @param {Function} handler - 处理函数
     */
    bindButton(buttonId, handler) {
        const button = document.getElementById(buttonId);
        if (button) {
            this.buttons[buttonId] = button;
            button.addEventListener('click', handler);
        }
    }

    /**
     * 插入标题
     */
    insertHeading() {
        const selection = this.editor.getSelection();
        if (selection.text) {
            this.editor.replaceSelection('# ' + selection.text, 2);
        } else {
            this.editor.insertAtLineStart('# ');
        }
    }

    /**
     * 插入粗体
     */
    insertBold() {
        this.editor.wrapSelection('**', '**', '粗体文本');
    }

    /**
     * 插入斜体
     */
    insertItalic() {
        this.editor.wrapSelection('*', '*', '斜体文本');
    }

    /**
     * 插入删除线
     */
    insertStrikethrough() {
        this.editor.wrapSelection('~~', '~~', '删除线文本');
    }

    /**
     * 插入链接
     */
    insertLink() {
        const selection = this.editor.getSelection();
        const text = selection.text || '链接文本';
        const link = '[' + text + '](URL)';
        
        this.editor.replaceSelection(link, text.length + 3); // 光标定位到 URL 处
    }

    /**
     * 插入图片
     */
    insertImage() {
        const selection = this.editor.getSelection();
        const text = selection.text || '图片描述';
        const image = '![' + text + '](图片URL)';
        
        this.editor.replaceSelection(image, 2 + text.length + 2);
    }

    /**
     * 插入行内代码
     */
    insertInlineCode() {
        this.editor.wrapSelection('`', '`', '代码');
    }

    /**
     * 插入代码块
     */
    insertCodeBlock() {
        const selection = this.editor.getSelection();
        const code = selection.text || '// 在此输入代码';
        const codeBlock = '```\n' + code + '\n```';
        
        this.editor.replaceSelection(codeBlock, 4); // 光标定位到代码区
    }

    /**
     * 插入无序列表
     */
    insertUnorderedList() {
        const selection = this.editor.getSelection();
        if (selection.text) {
            // 如果有选中文本，将每行转换为列表项
            const lines = selection.text.split('\n');
            const list = lines.map(line => '- ' + line).join('\n');
            this.editor.replaceSelection(list);
        } else {
            this.editor.insertAtLineStart('- ');
        }
    }

    /**
     * 插入有序列表
     */
    insertOrderedList() {
        const selection = this.editor.getSelection();
        if (selection.text) {
            // 如果有选中文本，将每行转换为列表项
            const lines = selection.text.split('\n');
            const list = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
            this.editor.replaceSelection(list);
        } else {
            this.editor.insertAtLineStart('1. ');
        }
    }

    /**
     * 插入引用
     */
    insertQuote() {
        const selection = this.editor.getSelection();
        if (selection.text) {
            // 如果有选中文本，将每行转换为引用
            const lines = selection.text.split('\n');
            const quote = lines.map(line => '> ' + line).join('\n');
            this.editor.replaceSelection(quote);
        } else {
            this.editor.insertAtLineStart('> ');
        }
    }

    /**
     * 插入水平线
     */
    insertHorizontalRule() {
        this.editor.insertText('\n\n---\n\n');
    }

    /**
     * 插入表格
     */
    insertTable() {
        const table = 
            '| 列1 | 列2 | 列3 |\n' +
            '| --- | --- | --- |\n' +
            '| 内容1 | 内容2 | 内容3 |\n' +
            '| 内容4 | 内容5 | 内容6 |\n';
        
        this.editor.insertText('\n' + table);
    }

    /**
     * 包裹选中文本
     * @param {String} prefix - 前缀
     * @param {String} suffix - 后缀
     */
    wrapSelection(prefix, suffix) {
        this.editor.wrapSelection(prefix, suffix);
    }
}
