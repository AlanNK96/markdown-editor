/**
 * 工具函数模块
 * 提供防抖、节流等常用工具函数
 */

const Utils = {
    /**
     * 防抖函数
     * @param {Function} func - 要执行的函数
     * @param {Number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 要执行的函数
     * @param {Number} delay - 延迟时间（毫秒）
     * @returns {Function} 节流后的函数
     */
    throttle(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            }
        };
    },

    /**
     * 转义 HTML 特殊字符
     * @param {String} text - 要转义的文本
     * @returns {String} 转义后的文本
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @returns {String} 格式化后的日期字符串
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    /**
     * 计算文本统计信息
     * @param {String} text - 要统计的文本
     * @returns {Object} 包含字符数、单词数、行数的对象
     */
    getTextStats(text) {
        const characters = text.length;
        const lines = text.split('\n').length;
        // 简单的单词统计（基于空格分隔）
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        
        return {
            characters,
            words,
            lines
        };
    },

    /**
     * 检查是否为有效的文件大小
     * @param {Number} size - 文件大小（字节）
     * @param {Number} maxSize - 最大允许大小（字节）
     * @returns {Boolean} 是否有效
     */
    isValidFileSize(size, maxSize = 10 * 1024 * 1024) { // 默认 10MB
        return size <= maxSize;
    },

    /**
     * 下载文本文件
     * @param {String} content - 文件内容
     * @param {String} filename - 文件名
     * @param {String} mimeType - MIME 类型
     */
    downloadFile(content, filename, mimeType = 'text/markdown') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 显示确认对话框
     * @param {String} message - 确认消息
     * @returns {Boolean} 用户是否确认
     */
    confirm(message) {
        return window.confirm(message);
    },

    /**
     * 显示提示对话框
     * @param {String} message - 提示消息
     */
    alert(message) {
        window.alert(message);
    },

    /**
     * 获取文件扩展名
     * @param {String} filename - 文件名
     * @returns {String} 扩展名（小写）
     */
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    },

    /**
     * 检查是否为支持的文件类型
     * @param {String} filename - 文件名
     * @returns {Boolean} 是否支持
     */
    isSupportedFileType(filename) {
        const ext = this.getFileExtension(filename);
        return ['md', 'txt', 'markdown'].includes(ext);
    }
};
