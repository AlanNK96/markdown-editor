/**
 * 预览器模块
 * 负责将 Markdown 文本转换为 HTML 并渲染
 */

class Previewer {
    constructor(previewElement) {
        this.preview = previewElement;
        this.lastContent = '';
        
        this.init();
    }

    /**
     * 初始化预览器
     */
    init() {
        // 配置 marked.js
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                highlight: function(code, lang) {
                    if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (e) {
                            console.error('Highlight error:', e);
                        }
                    }
                    return code;
                }
            });
        }
    }

    /**
     * 渲染 Markdown 内容
     * @param {String} markdown - Markdown 文本
     */
    render(markdown) {
        // 避免重复渲染相同内容
        if (markdown === this.lastContent) {
            return;
        }
        
        this.lastContent = markdown;
        
        try {
            // 将 Markdown 转换为 HTML
            let html = '';
            if (typeof marked !== 'undefined') {
                html = marked.parse(markdown);
            } else {
                html = '<p>Markdown 解析库未加载</p>';
            }
            
            // 使用 DOMPurify 清理 HTML（防止 XSS）
            if (typeof DOMPurify !== 'undefined') {
                html = DOMPurify.sanitize(html, {
                    ALLOWED_TAGS: [
                        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        'p', 'br', 'hr',
                        'strong', 'em', 'del', 'code', 'pre',
                        'ul', 'ol', 'li',
                        'blockquote',
                        'a', 'img',
                        'table', 'thead', 'tbody', 'tr', 'th', 'td',
                        'span', 'div'
                    ],
                    ALLOWED_ATTR: [
                        'href', 'src', 'alt', 'title',
                        'class', 'id',
                        'target', 'rel'
                    ],
                    ALLOW_DATA_ATTR: false
                });
            }
            
            // 渲染到预览区
            this.preview.innerHTML = html;
            
            // 处理链接的安全性
            this.sanitizeLinks();
            
        } catch (error) {
            console.error('Render error:', error);
            this.preview.innerHTML = '<p style="color: red;">渲染错误：' + error.message + '</p>';
        }
    }

    /**
     * 清空预览区
     */
    clear() {
        this.preview.innerHTML = '';
        this.lastContent = '';
    }

    /**
     * 更新滚动位置（同步滚动）
     * @param {Number} scrollRatio - 滚动比例（0-1）
     */
    updateScroll(scrollRatio) {
        const maxScroll = this.preview.parentElement.scrollHeight - this.preview.parentElement.clientHeight;
        this.preview.parentElement.scrollTop = maxScroll * scrollRatio;
    }

    /**
     * 处理链接的安全性
     * 为外部链接添加 target="_blank" 和 rel="noopener noreferrer"
     */
    sanitizeLinks() {
        const links = this.preview.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // 检查是否为外部链接
            if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
            
            // 禁止危险协议
            if (href && (href.startsWith('javascript:') || href.startsWith('data:'))) {
                link.removeAttribute('href');
                link.style.color = '#999';
                link.style.cursor = 'not-allowed';
                link.title = '不安全的链接已被禁用';
            }
        });
    }

    /**
     * 获取预览的 HTML 内容
     * @returns {String} HTML 内容
     */
    getHTML() {
        return this.preview.innerHTML;
    }

    /**
     * 设置预览内容（直接设置 HTML）
     * @param {String} html - HTML 内容
     */
    setHTML(html) {
        this.preview.innerHTML = html;
    }
}
