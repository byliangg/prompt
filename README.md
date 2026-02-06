# Prompt Hub 样板

这是一个纯静态的样板项目：
- 用户端：侧边栏浏览 Prompt / Files，一键复制、预览、下载
- 内容管理：编辑 `prompts/` 与 `files/`，然后生成索引并 Git push 更新

## 使用方式
1. 一键启动（推荐）：双击 `run.command`。
2. 在 `prompts/` 中新增或修改 Markdown prompt。
3. 在 `files/` 中新增或修改代码文件。
4. 重新双击 `scripts/run.command`（会自动重新生成索引）。

也可以用命令行启动：
- `bash run.command`

## 内容同步说明
- 本项目不包含在线编辑后台。
- 跨设备或部署到公网上时：修改 `prompts/`、`files/` 后运行脚本并 Git push。

## 上线（GitHub Pages 示例）
1. 将本目录作为一个 Git 仓库提交到 GitHub。
2. 每次更新内容后运行 `python3 scripts/build-manifest.py`（或 `run.command`）。
3. 在仓库设置中开启 GitHub Pages（选择 main 分支）。
4. 访问 GitHub Pages 提供的链接即可。

## 安全说明
本样板不包含真正的后端与鉴权。若需要在线编辑与权限控制，请接入 CMS 或服务端存储。

## 目录结构
- `prompts/`：每个 prompt 一个 Markdown 文件
- `files/`：代码或资料文件（支持预览与下载）
- `manifest.json`：自动生成的索引（部署到 GitHub Pages）
- `manifest.js`：本地 `file://` 兜底索引
