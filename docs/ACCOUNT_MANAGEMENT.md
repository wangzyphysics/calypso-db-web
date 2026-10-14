# 注册、Research Profile 与管理员管理

## 必填与可选

注册与 Research Profile 共用同一字段组件及服务端校验规则。

| 字段 | 注册 | Research Profile |
|---|---|---|
| 姓名 / Full name | 必填 | 必填 |
| 邮箱 / Email address | 必填，格式校验 | 必填，格式校验 |
| 机构 / Institution | 必填 | 必填 |
| 课题组 / Research group | 必填 | 必填 |
| 身份阶段 / Career stage | 必填 | 必填 |
| 国家/地区 / Country / region | 必填，默认 China，可改 | 必填，继承注册填写值 |
| 部门 / Department | 可选 | 可选 |
| ORCID iD | 可选，填写时检查格式 | 可选，填写时检查格式 |

账号、密码及密码确认另外属于注册必填项，不存进 Research Profile。注册邮箱会规范为小写并复制到 profile.contactEmail；姓名、机构、课题组、身份阶段、国家、部门和 ORCID 均一起存储。已有账户只补齐原先空的联系邮箱，不覆盖已有机构/课题组，也不猜测旧账户的国家。旧资料下一次保存时须补齐必填项。

非法邮箱离开输入框即显示字段错误，后续输入会重新校验；提交与服务端也校验。格式有效不代表邮箱存在或归属已验证。修改 Profile 联系邮箱不会修改登录邮箱，不会自动改变 emailVerified；历史投稿的署名快照保持原样。

## 邮箱验证码：明确的待接入任务

根据本轮确认，**现在不发送真实验证码，也不提供模拟验证码**。注册页保留验证码输入和 Send code 位置，禁用并说明未启用；注册成功后 emailVerified 仍为 false，不把邮箱格式正确当作验证成功。

将来启用需要一起完成：

1. 配置真实 SMTP 或邮件 API，服务端保管凭据；发送到用户填写的邮箱，不在接口响应或日志泄露验证码。
2. 实现已预留的 POST /api/identity/challenges（purpose=sign-up）和 POST /api/identity/registrations；挑战绑定邮箱、用途和发起会话，保存验证码摘要、过期时间、发送状态、次数与消费状态。
3. 验证码有有效期、重发冷却和尝试限制，重发撤销旧码，成功后单次消费；数据库事务保证并发请求不能重复注册或使用验证码。
4. 服务端确认邮箱与挑战一致后设置 emailVerified=true；registration-options.emailVerification 才能返回 true。必须同时禁止绕过验证码的 /registrations/password 注册路径，不能只改前端按钮。
5. 分别测试错误码、过期码、重放、换邮箱、限频和发送失败；在真实邮箱验证实际收件。SMTP 可参考 [Nodemailer 官方配置](https://nodemailer.com/smtp)，令牌/恢复流程参考 [OWASP 文档](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)。这些发送能力尚未安装或实现。

界面通过服务端 availability 信息切换，现有账号密码登录不依赖邮件服务。

## 管理员怎么进入

入口：<http://127.0.0.1:5173/admin>。未登录会跳转登录页；普通用户无法读取后台，登录管理员后账户菜单、个人导航以及页脚 Administration 都有入口。

预置本地管理员账号：**local.admin**。随机密码只在相邻 `materials-backend-lab/.local/platform-test-accounts.json` 私有文件中提供；本轮未修改预置密码。用该账号登录后可查找用户名/邮箱/姓名/机构。

- Manage account：编辑其他用户的 Research Profile，仍要求同一必填规则，填写修改原因。账户版本变化时返回冲突，须刷新；不能通过资料字段授予角色、修改登录邮箱或宣称邮箱已验证。
- Reset user password：填写原因，Generate temporary password。服务端生成随机临时密码，仅本次响应提供，数据库只存派生值；旧会话全部撤销。临时密码只展示在编辑器内，关闭/隐藏后消失，不保存到浏览器或审计。
- 用户使用临时密码登录后必须去 Account settings / Change password 输入当前临时密码与新密码。改密前服务端禁止检索、贡献和管理操作；成功后轮换会话并解除限制。管理员不能在此重置自己，自己的改密须提供当前密码。
- Account change history：记录资料修改、密码重置/改密的操作者、目标、原因和时间；不记录密码。角色授权仍沿用单独的理由、版本及会话撤销规则。
- Contribution review：查看已提交批次、原文件与方法/来源，审核通过、要求补充、拒绝。私有草稿不可通过管理员入口读取；审核和 VASP 计算状态分开，暂无运行任务或百分比。

管理员可以自行通过适当的私密渠道将临时密码交给账户所有者；网站不会自动发邮件。改登录邮箱、账号合并、SMTP 验证、找回邮件及管理员 MFA 是后续事项，不能用后台资料修改冒充这些认证操作。

## 接口与存储

- PATCH /api/identity/admin/users/:id/profile：profile、expectedVersion、reason。
- POST /api/identity/admin/users/:id/password-reset：expectedVersion、reason；返回 user 与一次性展示的 temporaryPassword。
- POST /api/identity/password/change：currentPassword、newPassword；返回新的会话。
- 所有写入校验登录、CSRF、Origin 和权限；角色修改/管理员操作读取真实角色，不相信浏览器字段。
- 002-account-management.sql 为新增版本迁移，添加 password_change_required 与 account_audit，保留 v1 校验哈希和科学表。

无查询和筛选的 Search 导航到 /explore#results，返回所有可访问记录；默认每页 20 条，可选择 10、20、50 或 100 条；重新 Search 回第一页。检索仍要求登录。

## Statistics overview — 2026-10-13

Administration now includes database/account/contribution aggregates, registration trends and JSON export. A read-only CLI is available via `npm --prefix materials-backend-lab run platform:stats` from the workspace root. See [statistics and results](STATISTICS_AND_RESULTS.md) for field definitions, public-map privacy thresholds and future event metrics.

## Account lifecycle — v11, 2026-10-13

Administration now separates charts, accounts, submitted-batch review and audits. Account operations add status filtering, paginated users, session revocation, suspension/reactivation and recoverable deletion/restoration. They require an administrator, reason, current record version and last-active-admin protection. Deleted/suspended identities cannot authenticate; prior sessions are revoked. Demo identities have no login credentials or grant/reset capability. See [the v11 guide](STATISTICS_AND_RESULTS.md) for precise retention, demo isolation and aggregate definitions.


## 网站管理员与 PostgreSQL 管理员 — v12, 2026-10-14

这两套身份和权限相互独立：

- **网站账号**存放在 `calypso_platform.users`，角色字段 `role=admin` 决定网站后台权限；账号密码派生值在 `password_credentials`。初始化脚本创建第一个本地测试管理员 `local.admin`，私有 JSON 只是初始化凭据记录，不是运行时角色配置。
- 已有网站管理员可以在 `/admin` → **Accounts** 为其他有效账号选择 **Grant admin** 或 **Remove admin**，填写原因并确认。服务端保存角色、撤销目标会话并记录审计。不能修改自己的角色，也不能移除最后一个有效管理员。演示身份不能获得管理员权限。
- **PostgreSQL 账号**是数据库连接和 SQL 权限使用的角色，通过私有 `.local/connection.json` 配置给后端。它不用于网页登录；数据库超级用户也不会自动成为网站管理员。网站管理员没有因此获得数据库连接密码或 PostgreSQL 超级用户权限。

Manage 现在打开独立的对话框，关闭按钮固定在顶部，内容区内部滚动。点击外部、按 Esc 或点击关闭按钮均可退出，并将焦点还给原来的 Manage 按钮。资料或密码请求提交期间暂时禁用关闭，避免把未完成的写入误认为取消；退出不会自动保存编辑内容。
