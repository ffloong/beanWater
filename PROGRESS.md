# BeanWater 实施进度（断点续作指南）

> **断点重续方式**：本文件是唯一进度源。每完成一个 Step：勾选 → commit（`feat(step N): ...`）→ push。
> **新会话续作**：读本文件 → 找到第一个未完成 Step → 按"验收"小节自检前序成果 → 继续实现。
> 任务清单同步在会话任务列表中（Step 1–12），编号与本文件一一对应。

## 技术栈（已定）

- **Taro 4 + React 18 + TypeScript + Sass**，webpack5 编译器
- 产物：微信小程序（`npm run build:weapp`）+ H5 移动网页（`npm run build:h5`），一套代码
- 状态管理：zustand，持久化走 Taro Storage（H5 = localStorage / 小程序 = 本地存储）
- 逻辑单测：vitest（只测纯逻辑模块，不 import `@tarojs/taro`）
- 种子数据：仓库根 `seed/*.json`，代码直接 import（单一数据源）
- 代码位于 `app/` 子目录；设计规范见 `PRODUCT_DESIGN.md`（字段规则 §7、合规 §12、验收 §13）

## Steps

- [x] Step 0 远程仓库（origin/main）+ 本进度文档
- [ ] Step 1 Taro 脚手架（React+TS，H5/小程序双构建通过）
- [ ] Step 2 数据层与类型（导入 seed、结构化 allergens/emoji、数据校验脚本）
- [ ] Step 3 核心逻辑 + vitest 单测（匹配三类/至少选一组/稀疏兜底/时段/去重/水量换算）
- [ ] Step 4 全局状态与持久化（常备清单/口味档案/收藏/做过了/引导标记）
- [ ] Step 5 应用外壳 + 基础组件（四 Tab、设计 tokens、Chip/RecipeCard/MatchBadge）
- [ ] Step 6 食材库页 + 首次引导（60 秒勾选）
- [ ] Step 7 首页（今日推荐、晚间"明早喝什么"泡豆卡片、稀疏兜底）
- [ ] Step 8 发现页（六分类、筛选、排序）
- [ ] Step 9 食谱详情页（至少选一组/最低水量/泡豆提示/警示聚合/收藏/做过了）
- [ ] Step 10 我的页（收藏、口味档案、做过记录、设置）
- [ ] Step 11 搜索 + 水量/浓度计算器
- [ ] Step 12 MVP 验收对照（设计文档 §13 逐条）+ 收尾

## 各 Step 验收方式

| Step | 验收 |
|---|---|
| 1 | `cd app && npm run build:h5` 与 `npm run build:weapp` 均成功 |
| 2 | `npm run check:data` 通过（引用闭环、六分类覆盖、字段齐全） |
| 3 | `npm test` 全绿（匹配/推荐/水量换算单测） |
| 4 | `npm test` + `npm run typecheck` 通过；storage 读写有单测 |
| 5 | 双构建通过；四 Tab 页可互相切换（H5 人工/截图验证） |
| 6–11 | 双构建 + typecheck + test 通过；对应页面功能可用 |
| 12 | 设计文档 §13 验收标准逐条核对并记录在 PROGRESS.md |

## 约定

- 每个 Step 独立 commit + push；**typecheck / test / 构建通过才提交**。
- 提交信息：`feat(step N): ...` / `fix(step N): ...`，结尾带 Co-Authored-By。
- `app/dist/`、`app/node_modules/` 不入库（见 .gitignore）。
- 不用原生 tabBar（省去小程序图标资源），用自绘 TabBar 组件 + `Taro.redirectTo` 平铺切换。
- 小程序 appid 暂用 `touristappid`（游客模式），用户注册后替换 `app/project.config.json`。
