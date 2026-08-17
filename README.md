# dsh-collapse-process

DSH Web 插件：折叠对话中的思考过程与工具调用等过程行，会话头部按钮一键切换显示/隐藏。

## 功能

- **默认折叠**：隐藏对话中的“过程”内容 —— 思考过程（Think 披露）、工具调用卡片、steering、命令、上下文注入、压缩、模型重试、工作流运行等
- **一键切换**：会话标题栏右侧出现“显示过程 / 隐藏过程”按钮，点击切换
- 用户消息与最终回答**不受影响**
- 界面文案跟随 DSH 语言（中文 / English）

## 安装（另一台电脑同样适用）

前置要求：DSH 已安装（`dsh web` 可启动），Node.js ≥ 20，pnpm ≥ 10。

### 方式一：本地 tarball（无需发布）

在包目录打包：

```sh
cd dsh-collapse-process
pnpm pack
```

得到 `dsh-collapse-process-0.1.0.tgz`，复制到目标电脑后安装：

```sh
dsh plugin --profile web add ./dsh-collapse-process-0.1.0.tgz
```

### 方式二：发布到 npm 后安装

```sh
cd dsh-collapse-process
pnpm publish
dsh plugin --profile web add dsh-collapse-process
```

### 方式三：Git 仓库

```sh
dsh plugin --profile web add git+https://github.com/<you>/dsh-collapse-process.git
```

> 安装完成后**重启 dsh web 进程**，新的 client bundle 才会进入页面启动清单（`window.__DSH_BOOT__`）。

## 卸载

```sh
dsh plugin --profile web remove dsh-collapse-process
```

然后重启 dsh web 进程。

## 工作原理

- `package.json` 声明 `dsh.client.platform: "web"` 与 `exports["./client"]` → `lib/client.js`（web bundle）
- `cordis.patch.yml` 是 `dsh.bundle.patch` 层：安装时自动把本包加入 profile 的 bundle 栈，启动时插入插件行
- Host 侧 `lib/index.js` 提供空 apply 使 Loader 条目激活；Client 侧 `lib/client.js` 用 `window.__ModuleLoader__.load` 注册，注入 CSS 隐藏过程行，并在 `conversation.session.header.actions` 插槽注册切换按钮
