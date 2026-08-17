window.__ModuleLoader__.load({
  id: 'dsh-collapse-process',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    let react = require('react');

    /** 需要隐藏的“过程”行：思考(Think)披露、工具调用、steering、命令、上下文、压缩、重试、工作流等。 */
    const HIDE_CSS = [
      '[data-chat-flow-kind="tool-call"],',
      '[data-chat-flow-kind="steering"],',
      '[data-chat-flow-kind="command"],',
      '[data-chat-flow-kind="command-input"],',
      '[data-chat-flow-kind="context"],',
      '[data-chat-flow-kind="compaction"],',
      '[data-chat-flow-kind="manual-compaction"],',
      '[data-chat-flow-kind="model-retry"],',
      '[data-chat-flow-kind="workflow-run"],',
      '[data-variant="think"]',
      '{ display: none !important }'
    ].join('\n');

    /** 本插件注入的样式元素 id，用于切换时增删。 */
    const STYLE_ID = 'dsh-collapse-process-css';

    /** 服务依赖：slots 是注册按钮的硬依赖；locale 通过 ctx.get 可选读取。 */
    const inject = ['slots'];

    /**
     * Client 插件主体。
     * @param ctx - client cordis 上下文（slots、locale 等）。
     */
    function apply(ctx) {
      const slots = ctx.get('slots');
      if (slots === undefined) return;

      // 折叠状态（默认折叠不显示）；listeners 用于跨组件同步按钮文案。
      let hidden = true;
      const listeners = new Set();

      function styleEl() {
        return document.getElementById(STYLE_ID);
      }
      function applyCss() {
        const existing = styleEl();
        if (existing !== null) existing.remove();
        if (hidden) {
          const tag = document.createElement('style');
          tag.id = STYLE_ID;
          tag.dataset.plugin = 'dsh-collapse-process';
          tag.textContent = HIDE_CSS;
          document.head.appendChild(tag);
        }
      }
      function setHidden(next) {
        if (hidden === next) return;
        hidden = next;
        applyCss();
        for (const fn of listeners) fn(next);
      }

      applyCss();
      // 插件卸载时清理注入的样式。
      ctx.effect(() => () => {
        const existing = styleEl();
        if (existing !== null) existing.remove();
      });

      // 多语言词典：标签随应用语言切换。
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
      const locale = ctx.get('locale');
      let disposeLocale = null;
      if (locale !== undefined) {
        try {
          disposeLocale = locale.register('processToggle', { zh, en });
        } catch (err) {
          // 同 namespace 残留注册（词典相同）时幂等容忍。
          disposeLocale = null;
        }
      }
      ctx.effect(() => () => {
        if (disposeLocale !== null) disposeLocale();
      });

      function ToggleButton(props) {
        const [isHidden, setLocal] = react.useState(hidden);
        react.useEffect(() => {
          const onNotify = (value) => setLocal(value);
          listeners.add(onNotify);
          return () => {
            listeners.delete(onNotify);
          };
        }, []);
        const t = props && props.t;
        const label = isHidden
          ? (t ? t('label.show') : '显示过程')
          : (t ? t('label.hide') : '隐藏过程');
        const title = t ? t('title') : '切换显示思考过程与工具调用';
        return react.createElement('button', {
          type: 'button',
          'aria-pressed': isHidden,
          title: title,
          onClick: () => setHidden(!hidden),
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
        { name: 'conversation.session.header.actions', id: 'process-visibility', order: 30, locale: 'processToggle' },
        (props) => react.createElement(ToggleButton, props)
      ));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
