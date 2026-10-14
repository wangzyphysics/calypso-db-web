# 本地 PostgreSQL 接入 — 2026-10-12

2026-10-13 补充：同源代理已支持通过服务端绑定选择 local／remote，详见 [BACKEND_SELECTION.md](BACKEND_SELECTION.md)。以下本机运行方式保持兼容；远程服务器部署目前因资源余量不足暂缓。

## 启动与测试账号

在 `calypso-web` 目录执行：

```sh
npm run dev:local
```

此命令复用相邻 `materials-backend-lab` 的 PostgreSQL（55432），启动本地平台 API（8877）和网站（5173），配置本机 `.env.local` 与 `.dev.vars`。不安装依赖、不重新导入材料、不覆盖已有测试账号。检测到相同服务时复用；其他服务占用端口时停止并说明原因。Ctrl+C 只停止本命令创建的 API/网站进程，PostgreSQL 保持运行。已有 dev 进程需重启才能读取新配置。

打开 <http://127.0.0.1:5173>。正式服务模式已启用，浏览器模拟账号开关关闭。可以注册新账号，或使用 PostgreSQL 预置的 `local.researcher` / `local.admin`。**随机测试密码只在 `materials-backend-lab/.local/platform-test-accounts.json` 私有文件中提供**，没有通用硬编码密码。数据库凭据在同目录 `connection.json`，不要放入前端、Git 或日志。

手动分开运行时，在后端目录执行 `npm run db:start`、`npm run platform:bootstrap`、`npm run platform:serve`；在网站目录执行 `npm run dev`。原材料检查 API 仍由后端 `npm run serve` 启动，端口 8878，与网站接入 API 分开。

前端公共配置为 `/api/materials`、`/api/identity`、`/api/contributions`；预览路径 `/previews`。Worker 私有绑定 `CALYPSO_LOCAL_BACKEND_URL=http://127.0.0.1:8877` 把请求代理到本机，不把数据库凭据送到浏览器。不启用跨域访问，写操作的 Origin 只允许本机 5173。生产构建可本地验证，但此配置不能直接部署到远端 Worker 后访问本机 PostgreSQL。

本地生产预览读取 dist/server 的 Wrangler 配置，需要显式提供绑定：先停网站 dev 进程，执行 `npm start -- --port 5173 --var CALYPSO_LOCAL_BACKEND_URL:http://127.0.0.1:8877`。其他端口可验证只读页面；写操作需使用允许的 5173 Origin。没有绑定时 API 返回明确的 503，不回退到假数据。

## 注册、资料与后台更新

必填/可选字段、China 默认值、邮箱验证码待接入事项及管理员资料/密码管理详见 [ACCOUNT_MANAGEMENT.md](ACCOUNT_MANAGEMENT.md)。后台地址 http://127.0.0.1:5173/admin，账号 local.admin，密码文件见上。空条件搜索展示所有记录，每页 10 条。

## 已接通的流程

- 注册：账号、密码及必填机构/课题组/个人阶段 → PostgreSQL；注册后登录并返回原查询。密码独立加盐，PBKDF2-SHA256 600,000 次；数据库仅存派生值。
- 登录：账号或邮箱与密码；HttpOnly、SameSite Cookie，数据库会话 8 小时，退出撤销。写操作校验 CSRF 与 Origin；密码尝试有数据库限频。服务不可用时不降级为浏览器模拟身份。
- 资料：版本校验防止覆盖并发修改；在投稿页手动复制署名快照，后续个人资料修改不改变旧批次。
- 材料：真实统计、固定六条公开预览、登录后的七种检索及压力/组成/晶系/空间群筛选、10 条一页。原始别名、Material/Structure/Phase ID 保留。公式按组成比例匹配；缺失压力不匹配数值压力过滤。
- 投稿：多文件/ZIP/CSV 关联与原值检查沿用现有界面；保存原始文件、哈希与记录，提交前再次在服务端检查。支持实验谱学、物性及理论结构；默认私有。
- 审核：管理员只读取已提交的审核包，不得读取他人的未提交草稿。通过、退回补充、拒绝都有真实时间及事件。通过不等于科学标准化、收敛确认或正式入库。
- 展示：仅“审核通过 + 选择公开 + 未归档”记录加入登录后的搜索；标注原始贡献和标准化状态（红星）。私有批次始终不进入共享搜索。首页统计仍按原材料库身份计数，避免将拉曼曲线算作材料或晶相。
- 工作台：按批次读取真实状态，打开批次时每 15 秒轮询事件；页面隐藏时暂停。可以归档/恢复、下载自己原文件、导出完整投稿。计算未运行时显示未开始/等待适配器，百分比为 null。
- 管理：另一个账户的角色授权/撤销需要理由和版本；保留审计，撤销目标会话；禁止自己修改权限以及删除最后一个管理员身份。

## 数据与科学边界

原 `calypso_lab` 科学表只读，新增 `calypso_platform` 账户、会话、批次、文件、记录与事件表。原数据为 20 个材料身份、10 个来源相标签、20 个展示结构（另有 20 个计算胞表示）。11 个材料有报告压力，9 个未知；不以 VASP PSTRESS=0 代替未知压力。不把相标签或记录存在视为稳定性结论。

来源由 `materials-backend-lab/samples/manifest.json` 和原 `results-0430` 导出记录追溯。新上传数据单独存储、标记用户提供，审核不会修改这些原科学表，也不会生成插值结构。

## 当前限制与后续认证后端

本轮为真实本地服务。**邮箱未验证**；微信/QQ/Google、邮件验证码、短信、密码找回、MFA 均未接服务，按钮按提供方可用性禁用。VASP 脚本、队列、调度器、工作流适配器未连接，不生成运行百分比。谱学没有可用结构时不自动进入 VASP。

上线认证时保留同源 BFF 与数据库用户 ID：配置 HTTPS/Secure Cookie、代理可信 Origin、正式数据库最小权限用户和迁移；接邮件验证/找回令牌与短信限频；在服务端配置 OAuth 回调、state/PKCE 和平台密钥，明确账号绑定/合并；增加管理 MFA、会话撤销、监控及备份。第三方密钥只留在服务端，不能放在 NEXT_PUBLIC 变量。已有 `docs/AUTHENTICATION.md` 包含预留契约；当前本地密码注册新增 `/registrations/password`，邮箱验证接入后应启用原挑战注册流程。

本地原文件暂存 PostgreSQL bytea：100 文件/批、单文件 10 MiB、批次解包后 50 MiB；base64 请求增加传输量。当前批次列表会读回完整文件，适合此本机小规模验证；正式运行需对象存储、分块上传、列表元数据分页、配额、病毒扫描及授权下载。旧浏览器草稿保留，需明确导入/复制才保存到数据库。私有提交仅授权审核者查看，不能承诺存储加密或研究机构身份认证。

## 验证与备份

```sh
# calypso-web
npm test
npm run typecheck
npm run build
# materials-backend-lab（需 PostgreSQL 运行）
npm run platform:test
```

集成测试使用带随机标识的专用虚构账户/投稿，结束时只清理本测试创建的对象，不触碰材料表。

修改前备份位于相邻 `versions/20261012-195739-before-local-database-v8-1`：源码归档、修改前一致性只读数据库 JSON、带逻辑哈希的材料迁移包及 DDL。15 张科学表逐表比对未变，迁移包已在独立内存数据库验证恢复。恢复步骤见备份内 `RESTORE.md`。该备份早于新账户/投稿表。本轮修改前另有 versions/20261012-214544-before-registration-verification-v9，含材料、现有账号和投稿的完整一致性只读快照；其私有文件请勿公开。后续需另备份 `calypso_platform` 与私有凭据，不能用旧快照替代新用户数据备份。

## 本轮主要修改文件

- 现有后端：`src/platform/001-platform.sql`、`database.mjs`、`server.mjs`、`materials.mjs`；测试账号脚本和 PostgreSQL 集成测试；package.json 与 README。原科学模型/导入器没有重写。
- 网站代理：`lib/local-backend-proxy.ts`，`app/api/identity`、`materials`、`contributions` 的同源路由。
- 网站界面与适配器：注册、管理员审核、投稿与个人批次组件；账户 client、材料 API、贡献 API、原浏览器草稿适配器、分页与贡献标记样式。
- 启动/说明：`scripts/local-database.mjs`、环境配置示例、LOCAL_DATABASE、认证/贡献/API/验证文档，以及界面更新日志。
