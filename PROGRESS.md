# BeanWater 实施进度（断点续作指南）

> **断点重续方式**：本文件是唯一进度源。每完成一个 Step：勾选 → commit（`feat(step N): ...`）→ push。
> **新会话续作**：读本文件 → 找到第一个未完成 Step → 按"验收"小节自检前序成果 → 继续实现。

## 技术栈（已定）

- **Taro 4.3.3 + React 18 + TypeScript + Sass**，webpack5 编译器
- 产物：微信小程序（`npm run build:weapp` → `dist/weapp`）+ H5 移动网页（`npm run build:h5` → `dist/h5`）
- 状态管理：zustand，持久化走 Taro Storage（H5 = localStorage / 小程序 = 本地存储）
- 逻辑单测：vitest（只测纯逻辑模块）；数据校验：`npm run check:data`
- 种子数据：仓库根 `seed/*.json`（单一数据源）
- 设计规范见 `PRODUCT_DESIGN.md`（字段规则 §7、合规 §12、验收 §13）

## Steps（全部完成 ✅ 2026-11-20）

- [x] Step 0 远程仓库（origin/main）+ 本进度文档
- [x] Step 1 Taro 脚手架（React+TS，H5/小程序双构建通过）
- [x] Step 2 数据层与类型（导入 seed、结构化 allergens/emoji、数据校验脚本）
- [x] Step 3 核心逻辑 + vitest 单测（匹配四态/至少选一组/稀疏兜底/时段/去重/水量换算）
- [x] Step 4 全局状态与持久化（常备清单/口味档案/收藏/做过了/引导标记）
- [x] Step 5 应用外壳 + 基础组件（四 Tab、设计 tokens、Chip/RecipeCard/MatchBadge）
- [x] Step 6 食材库页 + 首次引导（60 秒勾选，三标记模式）
- [x] Step 7 首页（今日推荐、晚间"明早喝什么"泡豆卡片、稀疏兜底）
- [x] Step 8 发现页（六分类、筛选、排序、搜索）
- [x] Step 9 食谱详情页（至少选一组/水量浓度计算/泡豆提示/警示聚合/收藏/做过了/分享）
- [x] Step 10 我的页（收藏、口味档案、做过记录、关于与重置）
- [x] Step 11 搜索打通（首页搜索 → 发现页关键词）；水量计算器在详情页内实现（§9 P0 落位）
- [x] Step 12 内容扩充（42 食材 / 32 食谱）+ 44px 触控区 + 验收对照

## MVP 验收对照（设计文档 §13）

| 验收标准 | 结果 |
|---|---|
| 新用户 60 秒完成首次勾选并看到第一批推荐 | ✅ CDP 浏览器实测：6 次点击 + 完成即刷新 |
| 3 秒内找到"我有这些食材能做什么"入口 | ✅ 首页快捷入口首格 |
| 选 3–6 个食材 1 秒内返回推荐 | ✅ 本地即时计算 |
| "现在就能做"为空时展示最接近 3 个并标缺 | ✅ 空食材库实测生效 |
| 详情可见食材量/水量/最低水量/模式/泡豆/时间/步骤/注意事项 | ✅ CDP 实测（奶昔二选一 + 水位线钳制 + 警示聚合） |
| 标记"做过了"近 7 天不占推荐首位 | ✅ 单测覆盖 |
| 收藏离线可看 | ✅ 数据本地打包，无网络依赖 |
| 无横向滚动、点击区 ≥44×44px | ✅ chips/按钮已调整 |

## 遗留事项（非阻塞，按优先级）

1. **食材数 42 vs 文档目标 60–80**：食谱已达 30–50 目标（32 个）；食材按"被食谱引用 + 替代闭环"驱动，扩充食谱时同步补食材即可。
2. **小程序真机验证**：`app/project.config.json` appid 为游客模式占位，需替换真实 appid 后用微信开发者工具打开 `app/dist/weapp`。
3. **PWA**（manifest / service worker）未配置，Web 端目前为纯 H5。
4. **字号放大 / 我的机器档案**（§4.5、§9 的 P2 项）未实现。
5. **分享**目前为剪贴板文案，小程序原生分享卡片（§8.2）待接。

## 关键命令

```bash
cd app
npm run dev:h5        # H5 开发（浏览器 http://localhost:10086）
npm run build:h5      # H5 构建 → dist/h5（可静态托管）
npm run build:weapp   # 小程序构建 → dist/weapp（微信开发者工具打开）
npm test              # vitest 单测（25 个）
npm run typecheck     # tsc --noEmit
npm run check:data    # 种子数据校验（引用闭环/分类覆盖）
```

## 已知踩坑记录（新会话必读）

- **webpack 必须精确 5.91.0**（`@tarojs/webpack5-runner@4.3.3` 的 peer 要求），版本漂移会报 ProgressPlugin schema 错。
- **@babel/preset-* 保持 v7**：v8 与 babel-preset-taro 4.3.3 不兼容。
- **vitest 安装需 `--legacy-peer-deps`**：vitest 自带 vite 与 Taro 声明的 vite@^4 peer 冲突；我们用 webpack5 编译，vite 不参与构建，冲突无害。全量安装也统一加该参数。
- **两个平台构建输出分目录**（`dist/h5`、`dist/weapp`），否则互相覆盖。
- **Taro H5 是 hash 路由**：直链形如 `/#/pages/recipe/index?id=xxx`；首页搜索/快捷入口用 `redirectTo` 平铺切换，详情页用 `navigateTo`。
