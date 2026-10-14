# 本地与远程 API 选择

2026-10-13：网站保留 Cloudflare 编译部署，同源 API 代理通过 Worker 私有绑定选择后端。此配置功能已实现，远程数据库与 API 尚未部署，不能将它当作已经连通。

## 本地

在 `.dev.vars` 中使用：

```dotenv
CALYPSO_BACKEND_MODE=local
CALYPSO_LOCAL_BACKEND_URL=http://127.0.0.1:8877
```

未设置 `CALYPSO_BACKEND_MODE` 时仍默认 local，兼容原 `npm run dev:local`。更改绑定后重启本地网站。这里 8877 是网站使用的平台 API；8878 是独立材料检查页 API，不能代替账号、检索、投稿接口。

## 远程

在 Cloudflare 部署环境的服务端绑定中设置：

```dotenv
CALYPSO_BACKEND_MODE=remote
CALYPSO_REMOTE_BACKEND_URL=https://your-api.example.com
```

示例地址是占位符。远程 URL 必须是 HTTPS origin，不带用户名、密码、路径、查询或片段。`/api/materials`、`/api/identity`、`/api/contributions` 和 `/previews` 路由继续代理到相同后端路径，前端公共配置无需改变。URL 只控制后端服务位置，PostgreSQL 凭据仍由后端保存。

部署后的 Cloudflare Worker 的 `127.0.0.1` 并不是开发电脑或阿里云机器，所以 local 模式用于本地开发，remote 用于云端预览。切换是部署配置操作，不提供浏览器按钮或公共接口来任意选择后端；浏览器不能覆盖该绑定。

## 接通远程之前

- 服务器需部署与网站契约一致的 API、PostgreSQL 和必要文件；不能只部署数据库。
- API 的写入 Origin 白名单需包含实际网站 HTTPS origin；HTTPS 会话需使用 Secure Cookie。当前平台后端的本机默认配置不能直接视为完成远程适配。
- 明确 API 服务认证与团队访问限制；如入口使用 Tunnel，确保 Worker 收到 API 响应而非交互式邮箱登录页面。
- 配置失败、后端断线都返回 503，不切回本地、不返回样本替代数据。
- 两个库是独立副本。切换不迁移或合并账号、投稿、材料；需约定主库和同步过程。

完整服务器检查、暂缓原因、待执行迁移顺序和回滚方法见 [bj-server 迁移记录](../../materials-backend-lab/deploy/bj-server/MIGRATION.md)。

## 验证

```sh
node --experimental-strip-types --test tests/backend-target.test.ts
npm run typecheck
npm test
npm run build
```

配置测试覆盖本地默认、显式远程、无隐式回退及非法目标拒绝。实际远程端到端验证需等待服务器部署。
