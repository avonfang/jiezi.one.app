# 微信小程序接入计划

## Context

用户希望将芥子（Jiezi）——AI 产品创意验证器——做成微信小程序。当前项目是 Next.js 全栈应用，后端运行在 Vercel。核心目标是**复用所有后端 API，只新建一个小程序前端项目**。

## 挑战

| 挑战 | 原因 | 方案 |
|------|------|------|
| 无 `ReadableStream` | 小程序不支持流式响应 | 后端增加非流式 SSG 端点，或小程序端用 WebSocket 桥接 |
| 无 iframe | PreviewView 渲染 AI 生成的 HTML | 后端渲染为图片（Satori/Puppeteer），或用 `<web-view>` |
| 无 email/password | 小程序用微信 OAuth | 新增 `POST /api/auth/wechat` 交换 code → openid → JWT |
| 无 XORPay | 小程序用微信支付 | 新增 `POST /api/wxpay/pay` + `POST /api/wxpay/notify` |
| 无 localStorage | 小程序用 `wx.getStorageSync` | 纯替换，逻辑不变 |

## 新增后端文件（仅 2 个）

| 文件 | 说明 |
|------|------|
| `app/api/auth/wechat/route.ts` | 接收 `{ code, anonymousId? }` → 调微信 jscode2session → 创建/查找用户 → 返回 JWT |
| `lib/wx-pay.ts` | 微信支付统一下单 + 回调验签 |

## 修改后端文件

| 文件 | 修改内容 |
|------|----------|
| `lib/auth-server.ts` | 新增 `registerOrLoginByOpenid(openid)` 函数；新增 `auth:openid-{openid}` → userId 映射 |
| `app/api/xorpay/pay/route.ts` | 当收到 `payType: 'mp'` 时返回 `{ prepayId }` 而非二维码 |

## 小程序项目结构（全新项目）

```
wechat-miniprogram/
├── app.json              # 全局配置 + tabBar
├── app.wxss              # 全局样式
├── app.ts                # 全局生命周期
├── utils/
│   ├── api.ts            # 封装 wx.request，自动带 auth header
│   ├── auth.ts           # 登录态管理（token 存 storage）
│   ├── credit.ts         # 积分查询
│   └── storage.ts        # storage 操作封装
├── components/
│   ├── idea-input/       # 产品想法输入组件
│   ├── summary-card/     # 验证摘要卡片
│   ├── report-section/   # 报告章节展示
│   ├── loading-timeline/ # 4 步时间线加载动画
│   ├── credit-badge/     # 积分余额展示
│   └── pm-consult/       # PM 顾问聊天组件
├── pages/
│   ├── index/            # 首页：输入想法 + 快速验证
│   ├── validate/         # 验证流程（流式进度 + 结果）
│   ├── report/           # 完整报告展示
│   ├── prd/              # PRD 文档
│   ├── preview/          # 产品预览（web-view）
│   ├── history/          # 历史记录列表
│   ├── profile/          # 个人中心 + 登录
│   ├── pricing/          # 积分套餐 + 支付
│   ├── contact/          # 联系客服
│   └── share/            # 分享报告展示
└── images/               # 图标资源
```

## 阶段划分

### Phase 1 — MVP（核心路径可用）

完成首页、验证流程、积分支付、个人中心

1. 新建小程序项目，配置 app.json
2. `utils/api.ts` 封装网络层
3. **后端**：`app/api/auth/wechat/route.ts` + `lib/auth-server.ts` 新增 openid 映射
4. **后端**：`lib/wx-pay.ts` + 支付端点
5. 页面：`index`（输入想法、发起验证）
6. 页面：`validate`（验证进度、展示摘要结果）
7. 页面：`pricing`（选择套餐、微信支付）
8. 页面：`profile`（微信登录、积分余额）

### Phase 2 — 完整功能

报告详情、PRD、预览、历史记录、分享

9. 页面：`report`（完整验证报告）
10. 页面：`prd`（PRD 文档展示）
11. 页面：`preview`（web-view 嵌入 AI 生成页面）
12. 页面：`history`（本地历史记录）
13. 页面：`share`（分享报告）
14. 页面：`contact`（联系页面）

## 关键设计决策

### 流式处理
验证/PRD/预览端点目前返回 NDJSON 流。小程序最小改动方案：后端新增 `?mode=json` 参数，让流式端点也支持返回完整 JSON（等全部生成完再响应）。小程序端用非流式调用来换取可靠性。

### Preview 预览
AI 生成的 HTML 无法在小程序中直接渲染。方案：后端将 HTML 部署为一个独立的 Vercel 页面（`/preview/[id]`），小程序中 `<web-view>` 嵌入该 URL。

### 微信支付
取代 XORPay。小程序端调 `wx.login()` 拿到 code 后，后端换取 openid，再调微信 JSAPI 统一下单。前端用 `wx.requestPayment()` 拉起支付界面。

### 登录流程
```
小程序启动 → wx.login() → code → POST /api/auth/wechat → 
后端调 jscode2session → 查 openid 是否已注册 → 
未注册：创建新用户（分配 userId，送 3 次免费额度）→ 
返回 JWT token → 小程序存 storage → 后续请求带 Authorization header
```

### TabBar 设计
```
首页（输入想法） | 历史（记录） | 个人（登录/积分）
```

## 验证
1. 小程序启动 → 自动登录（静默）→ 显示积分
2. 输入想法 → 发起验证 → 看到进度 → 显示摘要结果
3. 进积分页面 → 选择套餐 → 微信支付 → 积分到账
4. 重新验证 → 积分扣减正确
