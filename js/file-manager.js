/**
 * 文件管理模块
 * 负责处理文件的读取、保存和草稿管理
 */

class FileManager {
    constructor() {
        this.currentFileName = 'untitled.md';
        this.isModified = false;
        this.draftKey = 'markdown-editor-draft';
        this.draftExpireDays = 7;
    }

    /**
     * 新建文件
     * @param {Function} getCurrentContent - 获取当前内容的函数
     * @param {Function} setContent - 设置内容的函数
     * @returns {Boolean} 是否成功新建
     */
    newFile(getCurrentContent, setContent) {
        // 检查是否有未保存的更改
        if (this.isModified) {
            const confirmed = Utils.confirm('当前文档有未保存的更改，确定要新建文件吗？');
            if (!confirmed) {
                return false;
            }
        }

        // 清空编辑器
        setContent('');
        this.currentFileName = 'untitled.md';
        this.isModified = false;

        return true;
    }

    /**
     * 打开文件
     * @param {File} file - 文件对象
     * @param {Function} setContent - 设置内容的函数
     * @param {Function} callback - 回调函数
     */
    openFile(file, setContent, callback) {
        // 检查文件类型
        if (!Utils.isSupportedFileType(file.name)) {
            Utils.alert('不支持的文件类型，仅支持 .md 和 .txt 文件');
            return;
        }

        // 检查文件大小
        if (!Utils.isValidFileSize(file.size)) {
            Utils.alert('文件过大，最大支持 10MB');
            return;
        }

        // 读取文件内容
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            setContent(content);
            this.currentFileName = file.name;
            this.isModified = false;

            if (callback) {
                callback(content);
            }
        };

        reader.onerror = () => {
            Utils.alert('读取文件失败');
        };

        reader.readAsText(file, 'UTF-8');
    }

    /**
     * 保存文件
     * @param {String} content - 文件内容
     * @param {String} filename - 文件名（可选）
     */
    saveFile(content, filename = null) {
        const name = filename || this.currentFileName;
        
        // 确保文件名有 .md 扩展名
        const finalName = name.endsWith('.md') ? name : name + '.md';
        
        // 下载文件
        Utils.downloadFile(content, finalName, 'text/markdown');
        
        // 标记为已保存
        this.isModified = false;
        this.currentFileName = finalName;
    }

    /**
     * 保存草稿到 localStorage
     * @param {String} content - 草稿内容
     */
    saveDraft(content) {
        try {
            const draft = {
                content: content,
                timestamp: Date.now(),
                fileName: this.currentFileName,
                version: '1.0'
            };
            
            localStorage.setItem(this.draftKey, JSON.stringify(draft));
        } catch (error) {
            console.error('保存草稿失败:', error);
            // localStorage 可能已满或被禁用
        }
    }

    /**
     * 加载草稿
     * @returns {Object|null} 草稿对象或 null
     */
    loadDraft() {
        try {
            const draftStr = localStorage.getItem(this.draftKey);
            if (!draftStr) {
                return null;
            }

            const draft = JSON.parse(draftStr);
            
            // 检查草稿是否过期
            const now = Date.now();
            const expireTime = this.draftExpireDays * 24 * 60 * 60 * 1000;
            
            if (now - draft.timestamp > expireTime) {
                this.clearDraft();
                return null;
            }

            return draft;
        } catch (error) {
            console.error('加载草稿失败:', error);
            return null;
        }
    }

    /**
     * 清除草稿
     */
    clearDraft() {
        try {
            localStorage.removeItem(this.draftKey);
        } catch (error) {
            console.error('清除草稿失败:', error);
        }
    }

    /**
     * 检查是否有未保存的更改
     * @returns {Boolean}
     */
    hasUnsavedChanges() {
        return this.isModified;
    }

    /**
     * 标记为已修改
     */
    markAsModified() {
        this.isModified = true;
    }

    /**
     * 标记为未修改
     */
    markAsUnmodified() {
        this.isModified = false;
    }

    /**
     * 获取当前文件名
     * @returns {String}
     */
    getFileName() {
        return this.currentFileName;
    }

    /**
     * 设置文件名
     * @param {String} name - 文件名
     */
    setFileName(name) {
        this.currentFileName = name;
    }

    /**
     * 提示恢复草稿
     * @param {Function} setContent - 设置内容的函数
     * @returns {Boolean} 是否恢复了草稿
     */
    promptRestoreDraft(setContent) {
        const draft = this.loadDraft();
        
        if (!draft || !draft.content) {
            return false;
        }

        const time = Utils.formatDate(new Date(draft.timestamp));
        const confirmed = Utils.confirm(
            `发现草稿（保存于 ${time}），是否恢复？\n\n` +
            `文件名：${draft.fileName}\n` +
            `字符数：${draft.content.length}`
        );

        if (confirmed) {
            setContent(draft.content);
            this.currentFileName = draft.fileName;
            this.isModified = true;
            return true;
        } else {
            this.clearDraft();
            return false;
        }
    }
}
