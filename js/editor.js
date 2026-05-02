/**
 * 编辑器模块
 * 负责管理编辑区的文本输入和状态
 */

class Editor {
    constructor(textareaElement) {
        this.textarea = textareaElement;
        this.onChange = null;
        this.onSelectionChange = null;
        
        this.init();
    }

    /**
     * 初始化编辑器
     */
    init() {
        // 监听内容变化事件
        this.textarea.addEventListener('input', () => {
            if (this.onChange) {
                this.onChange(this.getText());
            }
        });

        // 监听选中区域变化事件
        this.textarea.addEventListener('select', () => {
            if (this.onSelectionChange) {
                this.onSelectionChange(this.getSelection());
            }
        });

        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertTab();
            } else if (e.key === 'Enter') {
                if (this.handleListContinuation(e)) {
                    e.preventDefault();
                }
            }
        });
    }

    /**
     * 获取当前编辑内容
     * @returns {String} 编辑器内容
     */
    getText() {
        return this.textarea.value;
    }

    /**
     * 设置编辑内容
     * @param {String} content - 要设置的内容
     */
    setText(content) {
        this.textarea.value = content;
        if (this.onChange) {
            this.onChange(content);
        }
    }

    /**
     * 在指定位置插入文本
     * @param {String} text - 要插入的文本
     * @param {Number} position - 插入位置（可选，默认为当前光标位置）
     */
    insertText(text, position = null) {
        const pos = position !== null ? position : this.textarea.selectionStart;
        const before = this.textarea.value.substring(0, pos);
        const after = this.textarea.value.substring(pos);
        this.textarea.value = before + text + after;
        
        // 设置光标位置到插入文本之后
        const newPos = pos + text.length;
        this.textarea.setSelectionRange(newPos, newPos);
        this.textarea.focus();
        
        if (this.onChange) {
            this.onChange(this.getText());
        }
    }

    handleListContinuation(e) {
        const pos = this.textarea.selectionStart;
        const value = this.textarea.value;
        const before = value.substring(0, pos);
        const after = value.substring(pos);

        const lastNewline = before.lastIndexOf('\n');
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        const currentLine = before.substring(lineStart);

        const unorderedMatch = currentLine.match(/^(\s*)([-*+])\s/);
        const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
        const checkboxMatch = currentLine.match(/^(\s*[-*+])\s\[[ x]\]\s/);
        const blockquoteMatch = currentLine.match(/^(\s*>)+\s/);

        let prefix = '';
        let isEmptyMarker = false;

        if (checkboxMatch) {
            const marker = checkboxMatch[0];
            const rest = currentLine.substring(marker.length);
            if (rest.trim() === '') {
                isEmptyMarker = true;
            } else {
                prefix = checkboxMatch[1] + ' [ ] ';
            }
        } else if (orderedMatch) {
            const indent = orderedMatch[1];
            const num = parseInt(orderedMatch[2], 10);
            const rest = currentLine.substring(indent.length + orderedMatch[2].length + 2);
            if (rest.trim() === '') {
                isEmptyMarker = true;
            } else {
                prefix = indent + (num + 1) + '. ';
            }
        } else if (unorderedMatch) {
            const indent = unorderedMatch[1];
            const bullet = unorderedMatch[2];
            const rest = currentLine.substring(unorderedMatch[0].length);
            if (rest.trim() === '') {
                isEmptyMarker = true;
            } else {
                prefix = indent + bullet + ' ';
            }
        } else if (blockquoteMatch) {
            const marker = blockquoteMatch[0];
            const rest = currentLine.substring(marker.length);
            if (rest.trim() === '') {
                isEmptyMarker = true;
            } else {
                prefix = marker;
            }
        }

        if (isEmptyMarker) {
            const deleteCount = currentLine.length;
            this.textarea.value = value.substring(0, lineStart) + '\n' + after;
            const newPos = lineStart + 1;
            this.textarea.setSelectionRange(newPos, newPos);
            if (this.onChange) {
                this.onChange(this.getText());
            }
            return true;
        }

        if (prefix) {
            const insert = '\n' + prefix;
            this.textarea.value = before + insert + after;
            const newPos = pos + insert.length;
            this.textarea.setSelectionRange(newPos, newPos);
            if (this.onChange) {
                this.onChange(this.getText());
            }
            return true;
        }

        return false;
    }

    /**
     * 插入 Tab 字符（转换为空格）
     */
    insertTab() {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const spaces = '    '; // 4 个空格
        
        const before = this.textarea.value.substring(0, start);
        const after = this.textarea.value.substring(end);
        this.textarea.value = before + spaces + after;
        
        const newPos = start + spaces.length;
        this.textarea.setSelectionRange(newPos, newPos);
        
        if (this.onChange) {
            this.onChange(this.getText());
        }
    }

    /**
     * 获取当前选中的文本
     * @returns {Object} 包含 text、start、end 的对象
     */
    getSelection() {
        return {
            text: this.textarea.value.substring(
                this.textarea.selectionStart,
                this.textarea.selectionEnd
            ),
            start: this.textarea.selectionStart,
            end: this.textarea.selectionEnd
        };
    }

    /**
     * 替换选中的文本
     * @param {String} text - 新文本
     * @param {Number} cursorOffset - 光标偏移量（可选，默认为新文本长度）
     */
    replaceSelection(text, cursorOffset = null) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const before = this.textarea.value.substring(0, start);
        const after = this.textarea.value.substring(end);
        
        this.textarea.value = before + text + after;
        
        // 设置光标位置
        const newPos = cursorOffset !== null 
            ? start + cursorOffset 
            : start + text.length;
        this.textarea.setSelectionRange(newPos, newPos);
        this.textarea.focus();
        
        if (this.onChange) {
            this.onChange(this.getText());
        }
    }

    /**
     * 在选中文本周围包裹文本
     * @param {String} prefix - 前缀
     * @param {String} suffix - 后缀
     * @param {String} placeholder - 占位符（当没有选中文本时使用）
     */
    wrapSelection(prefix, suffix, placeholder = '') {
        const selection = this.getSelection();
        const text = selection.text || placeholder;
        const newText = prefix + text + suffix;
        
        this.replaceSelection(newText, prefix.length + text.length);
    }

    /**
     * 获取光标位置
     * @returns {Object} 包含 start 和 end 的对象
     */
    getCursorPosition() {
        return {
            start: this.textarea.selectionStart,
            end: this.textarea.selectionEnd
        };
    }

    /**
     * 设置光标位置
     * @param {Number} start - 起始位置
     * @param {Number} end - 结束位置（可选，默认与 start 相同）
     */
    setCursorPosition(start, end = null) {
        const endPos = end !== null ? end : start;
        this.textarea.setSelectionRange(start, endPos);
        this.textarea.focus();
    }

    /**
     * 获取当前行号和列号
     * @returns {Object} 包含 line 和 column 的对象
     */
    getLineColumn() {
        const pos = this.textarea.selectionStart;
        const text = this.textarea.value.substring(0, pos);
        const lines = text.split('\n');
        
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    /**
     * 清空编辑器
     */
    clear() {
        this.setText('');
    }

    /**
     * 聚焦到编辑器
     */
    focus() {
        this.textarea.focus();
    }

    /**
     * 插入行（在当前行的开头插入文本）
     * @param {String} text - 要插入的文本
     */
    insertAtLineStart(text) {
        const pos = this.textarea.selectionStart;
        const before = this.textarea.value.substring(0, pos);
        const after = this.textarea.value.substring(pos);
        
        // 找到当前行的开始位置
        const lastNewline = before.lastIndexOf('\n');
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        
        // 插入文本
        const newValue = 
            this.textarea.value.substring(0, lineStart) +
            text +
            this.textarea.value.substring(lineStart);
        
        this.textarea.value = newValue;
        
        // 调整光标位置
        const newPos = pos + text.length;
        this.textarea.setSelectionRange(newPos, newPos);
        this.textarea.focus();
        
        if (this.onChange) {
            this.onChange(this.getText());
        }
    }
}
