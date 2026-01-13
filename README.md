# Windows11 桌面股票小组件（Electron + ECharts）

一个基于 Electron 的桌面小组件示例，支持在 Windows 11 桌面上显示任意多个可调整大小的股票分时图 / K 线图（使用新浪财经数据）。

主要功能
- 每个 widget 是一个独立窗口，可调整宽高、支持多开。
- 支持分时（实时）与 K 线（历史）两种展示模式。
- 使用新浪财经公开接口获取数据（hq.sinajs.cn / money.finance.sina.com.cn）。
- 使用 ECharts 渲染图表（��染在 renderer）。
- GitHub Actions 自动构建并打包 Windows 可执行安装包（electron-builder）。

快速开始（开发）
1. 克隆仓库并安装依赖
   - npm install

2. 启动开发模式（打开一个 widget 窗口）
   - npm run start
   - 首次打开会出现默认 widget，点击右上齿轮可设置股票代码（例如 `sh600519` 或 `sz000001`）

构建 / 打包���Windows）
- 本仓库含 GitHub Actions workflow（.github/workflows/build.yml），会在 push 时在 windows-latest runner 上构建并使用 electron-builder 打包，生成 windows 安装程序。
- 本地打包（在 Windows 环境）：
  - npm run dist
  - 打包输出在 dist/ 目录

如何使用
- 打开应用后，点击右上角设置（⚙️）输入股票代码并保存。也可在主菜单创建更多 widget 窗口。
- 支持 `实时（分时）` 与 `K线（日/分钟）` 切换。

重要说明 / 权限
- 本项目示例使用新浪财经的公开接口抓取数据，请确认遵守数据源的使用条款。
- 若要发布到 Microsoft Store 或做更深集成（Windows Widgets 面板），可能需要使用 Windows App SDK / WinUI 与微软的专有接口，本示例提供桌面版“仿小组件”体验（独立窗口）。

下一步建议
- 改进 UI / 设置面板（保存每个 widget 的配置到本地 JSON，支持双击桌面创建快捷 widget 等）。
- 增加缓存、断网处理、重试策略、限流，避免对新浪接口过于频繁请求。
- 用更丰富的 chart 交互（指标、画线、缩放、导出图片）。