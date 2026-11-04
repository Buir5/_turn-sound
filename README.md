**中文** | **[English](#english)**

> **🧭 收徒 · 我靠这套路子吃饭，你也可以**
>
> 从「发现一个痛点」→「写个几百行的小工具」→「挂上资源位」→「有人付钱」，全流程我在这篇里讲透了。
> 想学这门手艺的，点这里：**[👉 收徒说明（知乎）](https://zhuanlan.zhihu.com/p/54351262)**

# _turn-sound · 回合结束提示音 + 额度浮层

> 一轮对话结束，响一声；同时左上角弹一行账：**这一轮扣了多少钱、余额还剩多少**。十秒后自己淡出。

一个 DeepSeek Harness（DSH）插件。宿主半区跑在 Node 里负责记账与发音频，客户端半区是一个 38px 的金色铃铛，点开是设置面板。

## 它解决什么

DSH 干完一轮活是「静悄悄」的——你去干别的了，回来才发现它早答完了；额度是花了多少，也只能去网页里翻。

这个插件把两件事放到你眼皮底下：

| 能力 | 说明 |
|---|---|
| 回合结束提示音 | 检测到这一轮真正结束（不是流式中）才响，同一轮只响一次 |
| 扣费浮层 | 左上角显示「本轮扣费 / 余额」，可拖动，10 秒淡出，位置记在浏览器里 |
| 额度账本 | 监听 `session/event` 的 `assistant/message.usage`，按模型单价算人民币 |
| 余额校准 | 优先走 `deepseekAccount.getBalance()`，取不到再回落 API key / 旧快照 |
| 自定义音频 | 面板里选本地 MP3/WAV 上传，或直接用内置提示音 |

## 安装

```bash
# 1) 放进 DSH 的 profile 依赖
#    ~/.dsh/profiles/desktop/package.json 里加：
#    "_turn-sound": "file:C:/path/to/_turn-sound"
#    并在 dsh.profile.bundles 里加上 "_turn-sound"（放第一位才会排在最上）

# 2) 让 DSH 认得这个包（关键，缺了它插件不会进应用图）
#    包自带 cordis.patch.yml：
#    - insert:
#        - id: _turn-sound
#          name: _turn-sound
```

装完重启 DSH，右下角出现金色铃铛即生效。

## 用法

1. 点铃铛 → 面板
2. 勾「启用」、选声音、调音量/浮层透明度
3. 「试听」确认音量，「测浮层」看额度样式
4. 「保存」写进 `~/.dsh/turn-sound/config.json`

数据目录：`~/.dsh/turn-sound/`（`config.json`、`ledger.json`、上传的音频）。

## 更新提示

插件启动时会去读仓库根目录的 `version.json`（`fetch` + `no-store`）。发现远端版本比本地新，铃铛右上角会多一个红点，面板底部显示 `v当前 → v最新 · 去更新`，点开是 Release 页。没有网络时静默跳过，不影响播放。

## 已知边界

- 只在 **web 客户端**（`dsh.client.platform = web`）挂载；客户端必须是 `window.__ModuleLoader__.load({...})` 包装，顶层 `export` 会让渲染层报 `Unexpected token export` 并让整个 web boot 判定失败。
- 提示音靠「流式按钮消失 + 5 秒静默窗口」判断回合结束；如果 DSH 改了按钮无障碍标签，需要同步改 `busyUI()` 里的选择器。
- 人民币金额是**按 token 单价估算**，和官方账单可能有分位差异；余额取的是账号接口的真实值。

## License

MIT。作者：[知乎老哥](https://www.zhihu.com/people/svip3)

<a id=english></a>

---

# _turn-sound · turn-end chime + quota overlay

> A round of chat ends, it chimes once; a line appears at the top-left: **how much this round cost and what is left**. Fades out after ten seconds.

A DeepSeek Harness (DSH) plugin. The host half runs in Node and owns the ledger plus audio serving; the client half is a 38px golden bell — click it for settings.

## What it solves

DSH finishes a turn in total silence: you walk away, come back, and it has been done for minutes. And the money spent is only visible somewhere on a web page.

| Feature | Detail |
|---|---|
| Turn-end chime | Fires only when the turn is really over (not streaming), at most once per turn |
| Cost overlay | Top-left shows cost of this round plus remaining balance; draggable, 10s fade, position remembered |
| Ledger | Listens to `assistant/message.usage` in `session/event`, prices tokens per model in CNY |
| Balance | Prefers `deepseekAccount.getBalance()`, falls back to API key, then last snapshot |
| Custom audio | Upload your own MP3/WAV from the panel, or keep the built-in ding |

## Install

```bash
# 1) add to your DSH profile dependencies
#    in ~/.dsh/profiles/desktop/package.json:
#    "_turn-sound": "file:C:/path/to/_turn-sound"
#    and append "_turn-sound" to dsh.profile.bundles (first position keeps it on top)

# 2) make DSH actually load it — the package ships cordis.patch.yml:
#    - insert:
#        - id: _turn-sound
#          name: _turn-sound
```

Restart DSH. A golden bell appears at the bottom-right when it is live.

## Usage

1. Click the bell to open the panel
2. Toggle enabled, pick a sound, set volume and overlay opacity
3. `试听` (preview) to check loudness, `测浮层` (test overlay) to preview the quota card
4. `保存` (save) writes `~/.dsh/turn-sound/config.json`

Data dir: `~/.dsh/turn-sound/` (`config.json`, `ledger.json`, uploaded audio).

## Update check

On boot the plugin fetches `version.json` from the repo root (with `no-store`). If the remote version is newer, the bell gets a red dot and the panel footer shows `vCurrent → vLatest · update`, linking to the Release page. Offline failures are silent.

## Known limits

- Web client only (`dsh.client.platform = web`). The client file must be wrapped in `window.__ModuleLoader__.load({...})`; a top-level `export` makes the renderer throw `Unexpected token export` and the whole web boot fails.
- Turn-end detection relies on the streaming stop-button disappearing plus a 5s quiet window. If DSH changes those accessibility labels, update the selectors in `busyUI()`.
- CNY figures are **estimated from token prices** and may differ from the official bill by cents; the balance comes from the real account API.

## License

MIT. Author: [知乎老哥](https://www.zhihu.com/people/svip3)

> **🧭 收徒 · 我靠这套路子吃饭，你也可以**
>
> 从「发现一个痛点」→「写个几百行的小工具」→「挂上资源位」→「有人付钱」，全流程我在这篇里讲透了。
> 想学这门手艺的，点这里：**[👉 收徒说明（知乎）](https://zhuanlan.zhihu.com/p/54351262)**
