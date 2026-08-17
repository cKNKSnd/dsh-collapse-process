/**
 * dsh-collapse-process — host half.
 *
 * 纯 Client 插件：Host 侧只需要一个可激活的空 apply，
 * 让 Cordis Loader 条目建立 fiber，client-modules 才能扫描到本包的
 * `dsh.client` 声明并把 lib/client.js 作为 web bundle 注入。
 */
export function apply() {
  // Host 侧无逻辑，全部功能在 Client bundle 中。
}
