window.__ModuleLoader__.load({
  id: 'dsh-collapse-process',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    let react = require('react');

    /**
     * 需要隐藏的“过程”行。`data-chat-flow-kind` 取值来自
     * `conversation.chat.node` 的 keyDomain（官方 UI 的已占用 key 表）；
     * turn-error / turn-max-tokens 为回合级错误与截断行。
     * `unknown` 是未知节点的兜底渲染，保留可见以免误藏重要内容。
     */
    const HIDE_CSS = [
      '[data-chat-flow-kind="tool-call"],',
      '[data-chat-flow-kind="steering"],',
      '[data-chat-flow-kind="command"],',
      '[data-chat-flow-kind="command-input"],',
      '[data-chat-flow-kind="context"],',
      '[data-chat-flow-kind="compaction"],',
      '[data-chat-flow-kind="manual-compaction"],',
      '[data-chat-flow-kind="model-retry"],',
      '[data-chat-flow-kind="turn-error"],',
      '[data-chat-flow-kind="turn-max-tokens"],',
      '[data-chat-flow-kind="workflow-run"],',
      '[data-variant="think"]',
      '{ display: none !important }'
    ].join('\n');

    /** 切换按钮的 focus-visible 焦点环（常驻样式，随插件卸载清理）。 */
    const FOCUS_CSS = [
      '.dsh-collapse-process-toggle:focus-visible {',
      '  outline: 2px solid var(--dsw-alias-brand-primary);',
      '  outline-offset: 1px;',
      '  border-radius: 6px;',
      '}'
    ].join('\n');

    /** 本插件注入的样式元素标识（官方 data-plugin-css 模式，避免全局 id 冲突）。 */
    const HIDE_CSS_TAG = 'dsh-collapse-process/process.css';
    const FOCUS_CSS_TAG = 'dsh-collapse-process/toggle.css';

    /** 折叠偏好持久化 key（localStorage，浏览器本地生效）。 */
    const STORAGE_KEY = 'dsh-collapse-process.hidden';

    /** 多语言命名空间与词典。 */
    const NS = 'processToggle';
    const zh = {
      'label.show': '显示过程',
      'label.hide': '隐藏过程',
      'title': '切换显示思考过程与工具调用'
    };
    const en = {
      'label.show': 'Show process',
      'label.hide': 'Hide process',
      'title': 'Toggle thinking and tool call visibility'
    };

    /** 服务依赖：slots 是注册按钮的硬依赖；locale 通过 ctx.get 可选读取。 */
    const inject = ['slots'];

    /** 读取持久化的折叠偏好；无记录或读取失败时默认折叠。 */
    function readStoredHidden() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === null) return true;
        return raw === '1' || raw === 'true';
      } catch (err) {
        return true;
      }
    }

    /** 持久化折叠偏好；存储不可用时静默降级为仅本次会话生效。 */
    function storeHidden(hidden) {
      try {
        window.localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
      } catch (err) {
        // 隐私模式等场景下写入失败，忽略即可。
      }
    }

    /**
     * Client 插件主体。
     * @param ctx - client cordis 上下文（slots、locale 等）。
     */
    function apply(ctx) {
      const slots = ctx.get('slots');
      if (slots === undefined) return;

      function styleEl(tag) {
        return document.querySelector('style[data-plugin-css=' + JSON.stringify(tag) + ']');
      }
      /** 以官方 data-plugin-css 标签写入一个样式元素（重复写入时先移除旧的）。 */
      function upsertStyle(tag, css) {
        const existing = styleEl(tag);
        if (existing !== null) existing.remove();
        const el = document.createElement('style');
        el.dataset.plugin = 'dsh-collapse-process';
        el.dataset.pluginCss = tag;
        el.textContent = css;
        document.head.appendChild(el);
      }
      function applyCss(hidden) {
        if (hidden) {
          upsertStyle(HIDE_CSS_TAG, HIDE_CSS);
        } else {
          const existing = styleEl(HIDE_CSS_TAG);
          if (existing !== null) existing.remove();
        }
      }

      // 常驻 focus 样式 + 初始折叠状态：在会话渲染前注入，避免过程行先闪现。
      upsertStyle(FOCUS_CSS_TAG, FOCUS_CSS);
      applyCss(readStoredHidden());

      // 插件卸载时清理注入的样式。
      ctx.effect(() => () => {
        const hide = styleEl(HIDE_CSS_TAG);
        if (hide !== null) hide.remove();
        const focus = styleEl(FOCUS_CSS_TAG);
        if (focus !== null) focus.remove();
      });

      // 多语言词典注册；同 namespace 残留注册（词典相同）时幂等容忍。
      const locale = ctx.get('locale');
      let disposeLocale = null;
      if (locale !== undefined) {
        try {
          disposeLocale = locale.register(NS, { zh, en });
        } catch (err) {
          disposeLocale = null;
        }
      }
      ctx.effect(() => () => {
        if (disposeLocale !== null) disposeLocale();
      });

      function ToggleButton(props) {
        // 折叠状态以 React 为准（单一数据源），初始值来自持久化偏好。
        const [isHidden, setLocal] = react.useState(readStoredHidden);
        // t 由插槽注册的 locale 字段以框架标准座注入；缺失时回退到中文词典。
        const t = (props && props.t) || ((key) => zh[key] || key);
        react.useEffect(() => {
          applyCss(isHidden);
        }, [isHidden]);
        const label = isHidden ? t('label.show') : t('label.hide');
        const title = t('title');
        return react.createElement('button', {
          type: 'button',
          className: 'dsh-collapse-process-toggle',
          'aria-pressed': isHidden,
          'aria-label': label,
          title: title,
          onClick: () => {
            const next = !isHidden;
            setLocal(next);
            storeHidden(next);
          },
          style: {
            minHeight: '28px',
            color: 'var(--dsw-alias-label-tertiary)',
            cursor: 'pointer',
            background: 'transparent',
            border: '0',
            borderRadius: '6px',
            padding: '3px 6px',
            fontSize: '12px',
            lineHeight: '18px',
            whiteSpace: 'nowrap'
          }
        }, label);
      }

      slots.inject('conversation.session.header.actions', () => slots.register(
        { name: 'conversation.session.header.actions', id: 'process-visibility', order: 30, locale: NS },
        (props) => react.createElement(ToggleButton, props)
      ));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
