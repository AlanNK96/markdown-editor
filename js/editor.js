/**
 * 编辑器模块
 * 负责管理编辑区的文本输入和状态
 */

class Editor {
    constructor(textareaElement) {
        this.textarea = textareaElement;
        this.onChange = null;
        this.onSelectionChange = null;

        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        this._historyIgnore = false;
        this._compoundActive = false;
        this._compoundTimer = null;

        this.init();
    }

    init() {
        this._pushHistory();

        this.textarea.addEventListener('input', () => {
            if (this._historyIgnore) return;
            this._recordInput();
            if (this.onChange) {
                this.onChange(this.getText());
            }
        });

        this.textarea.addEventListener('select', () => {
            if (this.onSelectionChange) {
                this.onSelectionChange(this.getSelection());
            }
        });

        this.textarea.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
                e.preventDefault();
                this.redo();
                return;
            }

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

    _captureState() {
        return {
            content: this.textarea.value,
            cursorStart: this.textarea.selectionStart,
            cursorEnd: this.textarea.selectionEnd
        };
    }

    _pushHistory() {
        const snapshot = this._captureState();

        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(snapshot);

        while (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }

        this.historyIndex = this.history.length - 1;
    }

    _closeCompound() {
        this._compoundActive = false;
        if (this._compoundTimer) {
            clearTimeout(this._compoundTimer);
            this._compoundTimer = null;
        }
    }

    _recordChange() {
        this._closeCompound();
        this._pushHistory();
    }

    _recordInput() {
        if (this._compoundActive) {
            this.history[this.historyIndex] = this._captureState();
        } else {
            this._pushHistory();
            this._compoundActive = true;
        }

        clearTimeout(this._compoundTimer);
        this._compoundTimer = setTimeout(() => {
            this._compoundActive = false;
        }, 500);
    }

    _restoreState(state) {
        this._historyIgnore = true;
        this.textarea.value = state.content;
        this.textarea.setSelectionRange(state.cursorStart, state.cursorEnd);
        if (this.onChange) {
            this.onChange(state.content);
        }
        this._historyIgnore = false;
    }

    undo() {
        if (this.historyIndex <= 0) return false;
        this._closeCompound();
        this.historyIndex--;
        this._restoreState(this.history[this.historyIndex]);
        return true;
    }

    redo() {
        if (this.historyIndex >= this.history.length - 1) return false;
        this._closeCompound();
        this.historyIndex++;
        this._restoreState(this.history[this.historyIndex]);
        return true;
    }

    canUndo() {
        return this.historyIndex > 0;
    }

    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    getText() {
        return this.textarea.value;
    }

    setText(content) {
        this._closeCompound();
        this.textarea.value = content;
        this._pushHistory();
        if (this.onChange) {
            this.onChange(content);
        }
    }

    insertText(text, position = null) {
        const pos = position !== null ? position : this.textarea.selectionStart;
        const before = this.textarea.value.substring(0, pos);
        const after = this.textarea.value.substring(pos);
        this.textarea.value = before + text + after;

        const newPos = pos + text.length;
        this.textarea.setSelectionRange(newPos, newPos);
        this.textarea.focus();

        this._recordChange();

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
            const trimmedAfter = after.startsWith('\n') ? after.substring(1) : after;
            this.textarea.value = value.substring(0, lineStart) + '\n' + trimmedAfter;
            const newPos = lineStart + 1;
            this.textarea.setSelectionRange(newPos, newPos);
            this._recordChange();
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
            this._recordChange();
            if (this.onChange) {
                this.onChange(this.getText());
            }
            return true;
        }

        return false;
    }

    insertTab() {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const spaces = '    ';

        const before = this.textarea.value.substring(0, start);
        const after = this.textarea.value.substring(end);
        this.textarea.value = before + spaces + after;

        const newPos = start + spaces.length;
        this.textarea.setSelectionRange(newPos, newPos);

        this._recordChange();

        if (this.onChange) {
            this.onChange(this.getText());
        }
    }

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

    replaceSelection(text, cursorOffset = null) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const before = this.textarea.value.substring(0, start);
        const after = this.textarea.value.substring(end);

        this.textarea.value = before + text + after;

        const newPos = cursorOffset !== null
            ? start + cursorOffset
            : start + text.length;
        this.textarea.setSelectionRange(newPos, newPos);
        this.textarea.focus();

        this._recordChange();

        if (this.onChange) {
            this.onChange(this.getText());
        }
    }

    wrapSelection(prefix, suffix, placeholder = '') {
        const selection = this.getSelection();
        const text = selection.text || placeholder;
        const newText = prefix + text + suffix;

        this.replaceSelection(newText, prefix.length + text.length);
    }

    getCursorPosition() {
        return {
            start: this.textarea.selectionStart,
            end: this.textarea.selectionEnd
        };
    }

    setCursorPosition(start, end = null) {
        const endPos = end !== null ? end : start;
        this.textarea.setSelectionRange(start, endPos);
        this.textarea.focus();
    }

    getLineColumn() {
        const pos = this.textarea.selectionStart;
        const text = this.textarea.value.substring(0, pos);
        const lines = text.split('\n');

        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    clear() {
        this.setText('');
    }

    focus() {
        this.textarea.focus();
    }

    insertAtLineStart(text) {
        const pos = this.textarea.selectionStart;
        const before = this.textarea.value.substring(0, pos);

        const lastNewline = before.lastIndexOf('\n');
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

        const newValue =
            this.textarea.value.substring(0, lineStart) +
            text +
            this.textarea.value.substring(lineStart);

        this.textarea.value = newValue;

        const newPos = pos + text.length;
        this.textarea.setSelectionRange(newPos, newPos);
        this.textarea.focus();

        this._recordChange();

        if (this.onChange) {
            this.onChange(this.getText());
        }
    }
}
