/**
 * 应用控制器
 * 协调各个模块，管理应用状态
 */

class MarkdownEditorApp {
    constructor() {
        this.editor = null;
        this.previewer = null;
        this.toolbar = null;
        this.fileManager = null;
        this.viewMode = 'split';
        this._syncScrolling = false;

        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * 设置应用
     */
    setup() {
        // 初始化各个模块
        this.initModules();
        
        // 绑定事件
        this.bindEvents();
        
        // 加载草稿
        this.loadDraftIfExists();
        
        // 初始渲染
        this.updatePreview();
        
        console.log('Markdown 编辑器已初始化');
    }

    /**
     * 初始化各个模块
     */
    initModules() {
        // 初始化编辑器
        const editorElement = document.getElementById('editor');
        this.editor = new Editor(editorElement);

        // 初始化预览器
        const previewElement = document.getElementById('preview');
        this.previewer = new Previewer(previewElement);

        // 初始化工具栏
        this.toolbar = new Toolbar(this.editor);

        // 初始化文件管理器
        this.fileManager = new FileManager();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 编辑器内容变化事件（使用防抖）
        this.editor.onChange = Utils.debounce((content) => {
            this.updatePreview();
            this.updateStats();
            this.fileManager.markAsModified();
            this.updateStatusBar();
            this.saveDraftDelayed();
        }, 300);

        // 文件操作按钮
        this.bindFileOperations();

        // 视图模式切换
        this.bindViewModeButtons();

        // 键盘快捷键
        this.bindKeyboardShortcuts();

        // 页面关闭前检查
        this.bindBeforeUnload();

        // 同步滚动
        this.bindSyncScroll();
    }

    /**
     * 绑定文件操作
     */
    bindFileOperations() {
        // 新建文件
        document.getElementById('btn-new').addEventListener('click', () => {
            this.newFile();
        });

        // 打开文件
        document.getElementById('btn-open').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        // 文件选择
        document.getElementById('file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.openFile(file);
            }
            // 清空 input，允许重复选择同一文件
            e.target.value = '';
        });

        // 保存文件
        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveFile();
        });
    }

    /**
     * 绑定视图模式按钮
     */
    bindViewModeButtons() {
        document.getElementById('btn-view-split').addEventListener('click', () => {
            this.setViewMode('split');
        });

        document.getElementById('btn-view-edit').addEventListener('click', () => {
            this.setViewMode('edit');
        });

        document.getElementById('btn-view-preview').addEventListener('click', () => {
            this.setViewMode('preview');
        });
    }

    /**
     * 绑定键盘快捷键
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: 保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveFile();
            }
            
            // Ctrl/Cmd + O: 打开
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                document.getElementById('file-input').click();
            }
            
            // Ctrl/Cmd + N: 新建
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.newFile();
            }
            
            // Ctrl/Cmd + B: 粗体
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toolbar.insertBold();
            }
            
            // Ctrl/Cmd + I: 斜体
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.toolbar.insertItalic();
            }
            
            // Ctrl/Cmd + K: 链接
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toolbar.insertLink();
            }
        });
    }

    /**
     * 绑定页面关闭前检查
     */
    bindBeforeUnload() {
        window.addEventListener('beforeunload', (e) => {
            if (this.fileManager.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    bindSyncScroll() {
        const textarea = this.editor.textarea;
        const previewScroll = this.previewer.preview.parentElement;

        const syncFromEditor = () => {
            if (this._syncScrolling) return;
            this._syncScrolling = true;
            const maxTop = textarea.scrollHeight - textarea.clientHeight;
            const ratio = maxTop > 0 ? textarea.scrollTop / maxTop : 0;
            this.previewer.updateScroll(ratio);
            requestAnimationFrame(() => { this._syncScrolling = false; });
        };

        const syncFromPreview = () => {
            if (this._syncScrolling) return;
            this._syncScrolling = true;
            const maxTop = previewScroll.scrollHeight - previewScroll.clientHeight;
            const ratio = maxTop > 0 ? previewScroll.scrollTop / maxTop : 0;
            const editorMaxTop = textarea.scrollHeight - textarea.clientHeight;
            textarea.scrollTop = editorMaxTop * ratio;
            requestAnimationFrame(() => { this._syncScrolling = false; });
        };

        textarea.addEventListener('scroll', Utils.throttle(syncFromEditor, 16));
        previewScroll.addEventListener('scroll', Utils.throttle(syncFromPreview, 16));
    }

    /**
     * 更新预览
     */
    updatePreview() {
        const content = this.editor.getText();
        this.previewer.render(content);
    }

    /**
     * 更新统计信息
     */
    updateStats() {
        const content = this.editor.getText();
        const stats = Utils.getTextStats(content);
        
        const statsElement = document.getElementById('status-stats');
        if (statsElement) {
            statsElement.textContent = `字符: ${stats.characters} | 词: ${stats.words} | 行: ${stats.lines}`;
        }
    }

    /**
     * 更新状态栏
     */
    updateStatusBar() {
        // 更新文件名
        const filenameElement = document.getElementById('status-filename');
        if (filenameElement) {
            filenameElement.textContent = this.fileManager.getFileName();
        }

        // 更新修改标记
        const modifiedElement = document.getElementById('status-modified');
        if (modifiedElement) {
            modifiedElement.style.display = this.fileManager.hasUnsavedChanges() ? 'inline' : 'none';
        }
    }

    /**
     * 延迟保存草稿
     */
    saveDraftDelayed() {
        if (this.saveDraftTimer) {
            clearTimeout(this.saveDraftTimer);
        }
        
        this.saveDraftTimer = setTimeout(() => {
            const content = this.editor.getText();
            this.fileManager.saveDraft(content);
        }, 2000); // 2秒后保存
    }

    /**
     * 新建文件
     */
    newFile() {
        const success = this.fileManager.newFile(
            () => this.editor.getText(),
            (content) => this.editor.setText(content)
        );

        if (success) {
            if (this.saveDraftTimer) {
                clearTimeout(this.saveDraftTimer);
                this.saveDraftTimer = null;
            }
            this.updatePreview();
            this.updateStats();
            this.updateStatusBar();
        }
    }

    /**
     * 打开文件
     * @param {File} file - 文件对象
     */
    openFile(file) {
        this.fileManager.openFile(
            file,
            (content) => this.editor.setText(content),
            () => {
                this.updatePreview();
                this.updateStats();
                this.updateStatusBar();
            }
        );
    }

    /**
     * 保存文件
     */
    saveFile() {
        const content = this.editor.getText();
        this.fileManager.saveFile(content);
        this.updateStatusBar();
    }

    /**
     * 加载草稿（如果存在）
     */
    loadDraftIfExists() {
        const restored = this.fileManager.promptRestoreDraft(
            (content) => this.editor.setText(content)
        );

        if (restored) {
            this.updatePreview();
            this.updateStats();
            this.updateStatusBar();
        }
    }

    /**
     * 设置视图模式
     * @param {String} mode - 模式：split, edit, preview
     */
    setViewMode(mode) {
        this.viewMode = mode;
        
        const container = document.getElementById('main-container');
        
        // 移除所有模式类
        container.classList.remove('edit-only', 'preview-only');
        
        // 添加对应模式类
        if (mode === 'edit') {
            container.classList.add('edit-only');
        } else if (mode === 'preview') {
            container.classList.add('preview-only');
        }

        // 更新按钮状态
        document.getElementById('btn-view-split').classList.toggle('active', mode === 'split');
        document.getElementById('btn-view-edit').classList.toggle('active', mode === 'edit');
        document.getElementById('btn-view-preview').classList.toggle('active', mode === 'preview');
    }
}

// 创建应用实例
const app = new MarkdownEditorApp();
