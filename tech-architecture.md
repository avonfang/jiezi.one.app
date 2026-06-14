# 芥子 (Jiezi) 技术架构文档

> v0.1.0 · Next.js 16 + React 19 + TypeScript · Tailwind CSS v4 · DeepSeek API

---

## 一、项目概览

| 属性 | 值 |
|------|-----|
| 项目名称 | ai-product-builder |
| 品牌名 | 芥子 (Jiezi) |
| 框架 | Next.js 16.2.9 (App Router) |
| UI 层 | React 19.2.4 |
| 样式方案 | Tailwind CSS v4 + PostCSS |
| 语言 | TypeScript (strict mode) |
| 包管理器 | npm |
| 部署平台 | Vercel |
| 生产域名 | https://jiezi.site |

### 目录结构

```
ai-product-builder/
├── app/                     # Next.js App Router 页面和 API
│   ├── layout.tsx           # 根布局 (Geist 字体, 全局元数据)
│   ├── globals.css          # 全局样式 + Tailwind v4 导入
│   ├── page.tsx             # 首页 (Landing Page)
│   ├── api/                 # API 路由
│   │   ├── validate/        # POST 产品方向验证
│   │   ├── generate-prd/    # POST PRD 生成
│   │   ├── generate-preview/# POST 预览页生成
│   │   ├── pm-consult/      # POST PM 顾问对话
│   │   ├── unlock-report/   # POST 解锁完整报告
│   │   ├── share/           # GET/POST 分享
│   │   ├── credits/         # GET 查询积分
│   │   ├── recent-validations/ # GET 近期验证
│   │   ├── auth/            # 注册/登录/找回密码
│   │   ├── xorpay/          # 支付回调/查询
│   │   ├── orders/          # 订单管理
│   │   ├── codes/           # 激活码管理
│   │   ├── feedback/        # 用户反馈
│   │   └── dev/             # 开发工具接口
│   ├── app/                 # 已认证应用页面 (侧边栏布局)
│   │   ├── layout.tsx       # 侧边栏布局
│   │   ├── page.tsx         # 主工作区 (验证/报告/PRD/预览)
│   │   ├── history/         # 历史记录
│   │   ├── xumi/            # 须弥 (产品愿景页)
│   │   ├── contact/         # 联系我们
│   │   └── settings/        # 登录/注册/注销
│   ├── forgot-password/     # 忘记密码页
│   ├── reset-password/      # 重置密码页 (Suspense)
│   ├── pricing/             # 定价与支付页
│   ├── admin/               # 管理后台
│   └── share/[id]/          # 公开分享页
├── components/              # React 组件 (13 个)
├── lib/                     # 核心逻辑层 (13 个模块)
├── public/                  # 静态资源
│   ├── contact-qr.png       # 微信群二维码
│   ├── favicon.svg          # 网站图标
│   ├── demo.html            # 产品演示动画
│   └── ...
├── .env.local               # 本地环境变量 (gitignored)
├── next.config.ts           # Next.js 配置
├── postcss.config.mjs       # PostCSS + Tailwind
├── tsconfig.json             # TypeScript 配置
└── package.json             # 依赖与脚本
```

---

## 二、技术栈详解

### 2.1 框架层

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| Next.js | 16.2.9 | 全栈框架 | 服务端渲染 + API 路由 + 文件系统路由 |
| React | 19.2.4 | UI 库 | 最新的 React 版本, 兼容 Next.js 16 |
| TypeScript | 5.x | 类型系统 | 全量 strict 模式, 全项目类型覆盖 |

### 2.2 样式层

Tailwind CSS v4 使用 PostCSS 插件模式 (`@tailwindcss/postcss`), 不再需要 `tailwind.config.js`。从 `globals.css` 通过 `@import 'tailwindcss'` 加载。

#### 自定义动画 (globals.css)

```css
@keyframes fadeIn {         /* 页面元素渐入: 0.3s-1s */
  to { opacity: 1; transform: translateY(0); }
}
@keyframes float {          /* 装饰元素漂浮: 8s-12s 循环 */
  50% { transform: translate(20px, -20px); }
}
@keyframes pulse-glow {     /* 光晕呼吸: 6s 循环 */
  50% { opacity: 0.6; transform: scale(1.05); }
}
```

#### 设计 Token

| Token | 值 | 用途 |
|-------|-----|------|
| `--background` | `#fafafa` | 页面背景 |
| `--foreground` | `#171717` | 主文字色 |
| 品牌渐变 | `blue-600 → indigo-500 → purple-600` | 导航/装饰 |
| 成功色 | `emerald-500 → green-500` | CTA 按钮/正 verdict |
| 警告色 | `amber`/`yellow` | 中等等级提示 |
| 危险色 | `red-500` | 负面 verdict/错误 |

### 2.3 运行时依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `@upstash/redis` | 1.38.0 | 生产环境 KV 存储 |
| `html-to-image` | 1.11.13 | 报告导出为 PNG 截图 |
| `qrcode` | 1.5.4 | 客户端二维码生成 |
| `resend` | 6.12.4 | 密码重置邮件发送 |

---

## 三、核心库模块 (lib/)

### 3.1 lib/types.ts — 类型系统

所有核心数据结构定义在此文件。关键类型：

```typescript
// 验证报告 (核心输出)
interface ValidationReport {
  verdict: '建议尝试' | '值得探索' | '暂不建议' | '推荐做' | '谨慎做' | '不建议做';
  verdict_reason: string;
  market_score: number;      // 0-10
  feasibility_score: number; // 0-10
  sharp_comment?: string;    // AI 毒舌点评
  summary?: {
    market_opportunity: string;
    tech_difficulty: string;
    startup_cost: string;
    payback_period: string;
    one_liner: string;       // 一句话结论
  };
  scoring?: {                // 6 维评分, 每项 1-5
    market_size: number;
    user_demand: number;
    competition_density: number;
    monetization_potential: number;
    tech_feasibility: number;
    team_cost: number;
  };
  competitors: Array<{ name: string; positioning: string; user_feedback: string; source_url?: string }>;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  // ... 更多可选字段
}

// PRD 文档
interface PRD {
  product_name: string;
  one_liner: string;
  positioning: string;
  target_users: string;
  features: Array<{ name: string; description: string; priority: 'P0'|'P1'|'P2' }>;
  user_flow: string;
  data_models: Array<{ entity: string; fields: string }>;
  tech_stack_suggestion: string;
  next_steps: string;
}

// 预览页
interface PreviewPage {
  html: string;         // 完整独立 HTML (CSS 内联)
  product_name: string;
}
```

### 3.2 lib/deepseek.ts — AI 引擎

封装 DeepSeek Chat API 的调用。

```
POST https://api.deepseek.com/v1/chat/completions
Authorization: Bearer <DEEPSEEK_API_KEY>
Model: deepseek-chat
```

提供两个接口：

| 函数 | 特点 | 用途 |
|------|------|------|
| `chatCompletion(messages, options?)` | 全量返回, Promise | 信息提取 (temperature 0.3) |
| `chatCompletionStream(messages, options?)` | SSE 流式, AsyncGenerator | 报告/PRD/预览生成 (temperature 0.5) |

默认参数: `temperature=0.7, max_tokens=4096`

### 3.3 lib/brave-search.ts — 实时搜索

封装 Brave Search Web API。

```
GET https://api.search.brave.com/res/v1/web/search?q=<query>&count=<count>
X-Subscription-Token: <BRAVE_SEARCH_API_KEY>
```

| 函数 | 说明 |
|------|------|
| `search(query, count?)` | 返回 `{name, snippet, url}[]`, 默认 count=5, 最大 10 |

### 3.4 lib/kv-store.ts — 数据存储抽象

双模式 KV 存储:

- **生产模式**: 通过 `@upstash/redis` 连接 Upstash Redis
- **开发模式**: 内存 `Map<string, string>` 降级

环境变量优先级: `UPSTASH_REDIS_REST_URL` > `KV_REST_API_URL`

```typescript
kvGet<T>(key): Promise<T | null>   // JSON 反序列化读取
kvSet(key, value): Promise<void>    // JSON 序列化写入
kvDel(key): Promise<void>           // 删除
kvKeys(pattern?): Promise<string[]> // 模式匹配 (通配符 *)
```

### 3.5 lib/auth-server.ts — 认证系统

基于 PBKDF2 的邮箱+密码认证。

**密码哈希**:
```
PBKDF2-SHA512(密码, 随机盐[16字节], 10,000 次迭代) → 64 字节哈希
```

**存储结构** (KV key: `auth:users`):
```typescript
interface StoredUser {
  userId: string;
  email: string;
  passwordHash: string;  // 64 字节十六进制
  salt: string;          // 16 字节十六进制
  name?: string;
  createdAt: number;
}
```

| 函数 | 说明 |
|------|------|
| `registerUser(email, password, name?)` | 校验邮箱唯一性 → PBKDF2 哈希 → 存入 KV |
| `loginUser(emailOrUsername, password)` | 先查邮箱 → 查用户名 (向后兼容) → 校验哈希 |
| `createResetToken(userId, email)` | 生成 32 字节随机令牌 → 存入 KV (1 小时过期) |
| `verifyResetToken(token)` | 检查令牌存在且未过期 |
| `consumeResetToken(token)` | 删除已使用令牌 |
| `updatePassword(userId, newPassword)` | 重新哈希并更新密码 |

### 3.6 lib/credits.ts — 积分经济

存储结构 (KV key: `credits:<userId>`):
```typescript
interface CreditRecord {
  balance: number;
  total_purchased: number;
  created_at: number;
}
```

| 操作 | 函数 | 消耗 |
|------|------|------|
| 新用户初始化 | `initCredits(userId)` | 赠送 3 积分 |
| 余额查询 | `getBalance(userId)` | - |
| 消费 1 积分 | `useCredit(userId)` | 返回 boolean |
| 消费 N 积分 | `useCredits(userId, n)` | 返回 boolean |
| 增加积分 | `addCredits(userId, n)` | 返回新余额 |

### 3.7 lib/email.ts — 邮件服务

通过 Resend SDK 发送密码重置邮件。

- 发件人: `onboarding@resend.dev` (沙箱模式, 需验证域名后可自定义)
- 重置链接: `https://<JIEZI_DOMAIN>/reset-password?token=<token>`
- 1 小时有效期

### 3.8 lib/xorpay.ts — 支付网关

对接 XORPay (微信个人收款聚合平台)。

**支付签名算法**: `MD5(name + pay_type + price + order_id + notify_url + app_secret)`

**通知验签算法**: `MD5(aoid + order_id + pay_price + pay_time + app_secret)`

### 3.9 lib/client-id.ts — 客户端身份

两种身份模式:
- **已注册用户**: localStorage 存储 `jiezi-user-id` (UUID), `jiezi-username`
- **匿名用户**: localStorage 存储 `jiezi-client-id` (自动生成的 UUID)

### 3.10 lib/data-dir.ts — 数据目录

路径路由:
- **Vercel 生产**: `/tmp/jiezi-data/<subpath>`
- **本地开发**: `<project>/.data/<subpath>`

---

## 四、API 接口全集

所有 API 路由位于 `app/api/` 目录下。

### 4.1 核心业务接口

| 路由 | 方法 | 请求体 | 响应 | 积分成本 |
|------|------|--------|------|---------|
| `/api/validate` | POST | `{ idea: string }` | NDJSON 流 (progress/token/result/error) | 1 |
| `/api/generate-prd` | POST | `{ idea, report }` | NDJSON 流 (progress/result/error) | 2 |
| `/api/generate-preview` | POST | `{ prd }` | NDJSON 流 (progress/result/error) | 3 |
| `/api/pm-consult` | POST | `{ idea, report, messages }` | `{ success, reply }` | 1/次 |
| `/api/unlock-report` | POST | - | `{ success }` | 2 |

### 4.2 认证接口

| 路由 | 方法 | 请求体 | 响应 |
|------|------|--------|------|
| `/api/auth/register` | POST | `{ email, password, name?, anonymousId? }` | `{ success, userId, name }` |
| `/api/auth/login` | POST | `{ email, password, anonymousId? }` | `{ success, userId, name }` |
| `/api/auth/forgot-password` | POST | `{ email }` | `{ success, message }` |
| `/api/auth/reset-password` | POST | `{ token, password }` | `{ success, message }` |

### 4.3 数据查询接口

| 路由 | 方法 | 参数 | 响应 |
|------|------|------|------|
| `/api/credits` | GET | Header: `x-client-id` | `{ balance }` |
| `/api/recent-validations` | GET | `?limit=N` | `{ records }` |
| `/api/share/[id]` | GET | - | `{ success, data }` |

### 4.4 支付接口

| 路由 | 方法 | 请求体/参数 | 响应 |
|------|------|------------|------|
| `/api/xorpay/pay` | POST | `{ plan, userId, payType }` | `{ success, orderId, qrCode }` |
| `/api/xorpay/notify` | POST | Form data (XORPay 回调) | `"success"` 或 `"fail"` |
| `/api/xorpay/query` | GET | `?order_id=` | `{ status, confirmed, plan, credits }` |
| `/api/orders/create` | POST | `{ plan, userId, transactionId }` | `{ success, orderId }` |
| `/api/orders/confirm` | POST | `{ orderId }` | `{ success }` |
| `/api/orders/list` | GET | - | `{ orders }` |

### 4.5 管理接口

| 路由 | 方法 | 请求体 | 响应 |
|------|------|--------|------|
| `/api/codes/generate` | POST | `{ plan, count }` | `{ success, codes }` |
| `/api/codes/list` | GET | - | `{ codes }` |
| `/api/codes/redeem` | POST | `{ code, userId }` | `{ success, credits }` |
| `/api/feedback` | POST | `{ content, contact? }` | `{ success }` |

---

## 五、NDJSON 流协议

所有 AI 生成接口 (`/api/validate`, `/api/generate-prd`, `/api/generate-preview`) 使用 **NDJSON (Newline-Delimited JSON)** 流式传输。

Content-Type: `application/x-ndjson`

### 事件类型

```typescript
// 进度事件
{ "type": "progress", "stage": string, "message": string }

// Token 事件 (仅 /api/validate)
{ "type": "token", "text": string }

// 结果事件
{ "type": "result", "report"?: ValidationReport, "prd"?: PRD, "preview"?: PreviewPage }

// 错误事件
{ "type": "error", "message": string }
```

### 客户端读取模式

```typescript
const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(Boolean);
  
  for (const line of lines) {
    const event = JSON.parse(line);
    switch (event.type) {
      case 'progress': updateProgress(event.stage, event.message); break;
      case 'token': accumulateText(event.text); break;
      case 'result': handleResult(event); break;
      case 'error': handleError(event.message); break;
    }
  }
}
```

### 进度阶段

| 接口 | 阶段序列 |
|------|---------|
| `/api/validate` | `extracting` → `searching` → `analyzing` → `generating` → `done` |
| `/api/generate-prd` | `analyzing` → `writing` → `done` |
| `/api/generate-preview` | `designing` → `writing` → `done` |

---

## 六、组件体系

### 6.1 组件层级

```
app/layout.tsx (根布局)
├── app/page.tsx (首页)
│   ├── IdeaInput (想法输入)
│   ├── LoadingState (加载动画)
│   ├── SummaryCard (内联总结卡片)
│   ├── LoadingState (加载)
│   ├── ReportView (完整报告)
│   └── DemoView (产品演示)
│
├── app/app/layout.tsx (侧边栏布局)
│   └── app/app/page.tsx (主工作区)
│       ├── HistoryPanel (历史记录)
│       ├── SummaryView (核心总结)
│       ├── PMConsultView (PM 顾问)
│       ├── ReportView (完整报告)
│       ├── PRDView (PRD 文档)
│       └── PreviewView (预览页)
│
├── app/pricing/page.tsx
├── app/forgot-password/page.tsx
├── app/reset-password/page.tsx
├── app/admin/page.tsx
└── app/share/[id]/page.tsx
    └── SharePageClient (公开分享页)
```

### 6.2 组件接口 (Props)

| 组件 | Props | 说明 |
|------|-------|------|
| `IdeaInput` | `{ onSubmit, disabled, sampleIdea? }` | 想法输入框, Cmd+Enter 提交 |
| `LoadingState` | `{ stage?, message?, steps?, showTagline? }` | 进度动画, 支持自定义步骤 |
| `SummaryView` | `{ report, idea, onViewReport, onGeneratePrd?, prdLoading?, onPmConsult?, onReset }` | 核心总结面板 |
| `ReportView` | `{ report, idea?, onReset, onGeneratePrd?, onPmConsult?, onShare?, onViewPrd? }` | 完整验证报告 |
| `PRDView` | `{ prd, onBack, onGeneratePreview?, previewLoading?, onShare?, hasPreview?, onViewPreview? }` | PRD 文档视图 |
| `PreviewView` | `{ preview, onBack, onRegenerate?, regenerateLoading?, onShare? }` | 预览页 iframe 视图 |
| `PMConsultView` | `{ idea, report }` | PM 对话界面 |
| `AuthModal` | `{ onClose, onAuth, anonymousId }` | 登录注册模态框 |
| `HistoryPanel` | `{ items, onRestore, onDelete }` | 历史记录列表 |
| `CreditBadge` | (无 props, 自获取积分) | 顶部积分显示 |
| `FeedbackButton` | (无 props) | 反馈悬浮按钮 |
| `DemoView` | `{ html, onBack }` | 演示页面查看器 |

### 6.3 状态管理模式

主工作区 (`app/app/page.tsx`) 使用 React useState 组件的状态机:

```typescript
// 主状态
status: 'idle' | 'loading' | 'success' | 'error'
view: 'summary' | 'report' | 'prd' | 'preview'

// 数据状态
report: ValidationReport | null
prd: PRD | null
preview: PreviewPage | null

// 加载状态
prdLoading: boolean
previewLoading: boolean
pmConsultOpen: boolean

// 加载阶段 (流式)
prdStage: string
prdMessage: string
previewStage: string
previewMessage: string

// 加载超时检测
stallTimer: NodeJS.Timeout | null  // 5 秒无更新则显示停顿提示
```

**事件通信**: 积分更新通过自定义 DOM 事件 `credits-changed` 广播, `CreditBadge` 和侧边栏监听刷新。

---

## 七、数据流详解

### 7.1 产品验证流程

```
用户输入想法
    │
    ▼
POST /api/validate { idea }
    │
    ├── 1. 积分校验: useCredit(userId) → 402 若不足
    │
    ├── 2. 信息提取: chatCompletion(提取提示词, 0.3 温度)
    │   → ExtractedInfo { target_users, core_features, industry, keywords[] }
    │
    ├── 3. 实时搜索: 对最多 3 个关键词并行 search(query, count=5)
    │   → SearchResult[] (最多 15 条)
    │
    ├── 4. AI 分析: chatCompletionStream(分析提示词 + 搜索结果, 0.5 温度)
    │   → NDJSON 流式输出 ValidationReport
    │
    ├── 5. 保存: saveValidation(idea, report) → recent:validations
    │
    └── 返回: NDJSON 流
```

### 7.2 支付流程

```
用户选择套餐
    │
    ▼
POST /api/xorpay/pay { plan, userId, payType }
    │
    ├── 1. createOrder(userId, plan, credits, price) → order (status: pending)
    │
    ├── 2. createXorpayPayment({ name, pay_type, price, order_id, notify_url })
    │   → { qrCode, expireIn }
    │
    └── 返回: { orderId, qrCode, expireIn }
            │
            ▼
      客户端显示二维码 (qrcode 库生成)
            │
            ├── 用户扫码支付
            │       │
            │       ▼
            │  XORPay 回调 → POST /api/xorpay/notify
            │  → verifyNotifySign → confirmOrder → addCredits → 返回 "success"
            │
            └── 轮询 (3s): GET /api/xorpay/query?order_id=
                → { confirmed: true } → 更新 UI
```

### 7.3 匿名→注册用户积分合并流程

```
POST /api/auth/register 或 /api/auth/login (含 anonymousId)
    │
    ├── initCredits(anonymousId)  // 确保匿名用户存在积分记录
    ├── getBalance(anonymousId)   // 读取匿名积分
    │
    ├── if (anonBalance > 0):
    │   ├── initCredits(registeredUserId)
    │   └── addCredits(registeredUserId, anonBalance)
    │
    └── (注意: 不减少匿名积分 — 同一 client ID 对应原有记录)
```

---

## 八、KV 存储 Schema

### 键空间

| Key | 类型 | 说明 | 归属模块 |
|-----|------|------|---------|
| `auth:users` | `Record<string, StoredUser>` | 所有用户 (按邮箱归一化键值) | auth-server |
| `credits:<userId>` | `CreditRecord` | 用户积分余额 | credits |
| `code:<code>` | `ActivationCode` | 激活码详情 | codes |
| `codes:ids` | `string[]` | 激活码 ID 列表 | codes |
| `order:<id>` | `OrderRecord` | 订单详情 | orders |
| `orders:ids` | `string[]` | 订单 ID 列表 | orders |
| `recent:validations` | `RecentRecord[]` | 近期验证 (最多 20 条) | recent-validations |
| `reset_token:<token>` | `{ userId, email, expiresAt }` | 密码重置令牌 (1 小时 TTL) | auth-server |

### 文件存储

| 路径 | 格式 | 说明 |
|------|------|------|
| `.data/shares/<id>.json` | `ShareData` | 分享报告 (JSON) |
| `.data/feedback/<timestamp>.json` | `{ content, contact? }` | 用户反馈 (JSON) |

---

## 九、积分经济学

### 经济模型

```
免费赠送 3 积分 (新用户)
    │
    ▼
用户消费:
  验证 1分 → 解锁报告 2分 → PRD 2分 → 预览 3分 → PM 追问 1分/次
    │
    ▼
积分耗尽 → 购买:
  ¥6.90 / 7分 (体验装)
  ¥12.90 / 15分 (标准装)
  ¥29.90 / 35分 (畅享装)
    │
    ▼
积分增加 → 继续使用
```

### 套餐定价

| 套餐 | 价格 | 积分 | 单价 | 定位 |
|------|------|------|------|------|
| 体验装 | ¥6.90 | 7 | ¥0.99/分 | 低成本体验全流程 |
| 标准装 | ¥12.90 | 15 | ¥0.86/分 | 畅销款, 积分永久有效 |
| 畅享装 | ¥29.90 | 35 | ¥0.85/分 | 高性价比, 生成速度优先 |
| 小加油包 | ¥2.90 | 3 | ¥0.97/分 | 临时补量 |
| 大加油包 | ¥3.90 | 5 | ¥0.78/分 | 临时补量最优 |

---

## 十、AI 提示词架构

### 10.1 信息提取 (提取.md, temperature=0.3)

```
你是一个产品分析专家。从用户的产品想法中提取结构化信息。
输出格式: 严格 JSON { target_users, core_features, industry, keywords }
```

### 10.2 报告生成 (temperature=0.5)

```
你是一个资深产品战略分析师。基于产品想法和搜索到的竞品信息,
生成完整的市场验证报告。
输出格式: 严格 JSON (ValidationReport schema)
```

### 10.3 PRD 生成

```
你是一个资深产品经理。基于验证报告生成完整的产品需求文档。
输出格式: 严格 JSON (PRD schema)
功能优先级规则: P0=核心功能必须做, P1=重要功能建议做, P2=锦上添花
```

### 10.4 预览页生成

```
你是一个资深前端设计师。基于 PRD 生成产品着陆页 HTML。
约束: HTML 必须是完整的独立文件 (所有 CSS 内联), 
包含品牌、功能、CTA 等模块, 使用现代美观的设计。
```

### 10.5 PM 顾问

```
你是一个有 15 年经验的资深 PM, 基于验证报告回答用户的问题。
约束: 每次回答不超过 200 字, 基于报告数据给出务实建议。
```

---

## 十一、部署与运维

### 11.1 Vercel 部署

```bash
# 开发
npm run dev      # localhost:3000

# 构建检查
npm run build    # 静态分析 + 构建

# 生产部署 (Vercel)
vercel --prod    # 或 GitHub 自动部署
```

### 11.2 环境变量清单

| 变量 | 必填 | 用途 | 获取方式 |
|------|------|------|---------|
| `DEEPSEEK_API_KEY` | 是 | DeepSeek LLM | deepseek.com API 控制台 |
| `BRAVE_SEARCH_API_KEY` | 是 | Brave 搜索 | api.search.brave.com |
| `XORPAY_AID` | 是 | XORPay 商户 ID | xorpay.com |
| `XORPAY_APP_SECRET` | 是 | XORPay 签名密钥 | xorpay.com |
| `RESEND_API_KEY` | 否 (密码重置) | 邮件发送 | resend.com API 控制台 |
| `JIEZI_DOMAIN` | 否 (重置链接) | 自定义域名 | 如 `jiezi.site` |
| `UPSTASH_REDIS_REST_URL` | 否 (生产 KV) | Upstash Redis | upstash.com |
| `UPSTASH_REDIS_REST_TOKEN` | 否 (生产 KV) | Upstash Redis | upstash.com |

### 11.3 存储模式切换

```typescript
// lib/kv-store.ts 自动检测
// 生产环境 (Vercel + Upstash)
UPSTASH_REDIS_REST_URL=https://<id>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

// 开发环境 (无环境变量) → 降级为内存 Map
// 注意: 重启后数据丢失
```

---

## 十二、设计约束与限制

### 12.1 技术约束

1. **KV 存储容量**: Upstash Redis 免费版上限 10MB, 不适合存储大对象
2. **AI 输出稳定性**: 流式 JSON 输出可能因令牌边界导致 JSON 解析中断, 需要容错处理
3. **搜索配额**: Brave Search 免费版 2000 次/月, 高频使用时需注意配额
4. **邮件限制**: Resend 免费版 100 封/天, 发件人域名需验证后可自定义

### 12.2 安全措施

1. **密码安全**: PBKDF2-SHA512, 10,000 次迭代, 随机盐
2. **支付验签**: MD5 签名验证, 防止回调伪造
3. **积分校验**: 服务端执行扣减, 避免客户端篡改
4. **分享隔离**: 文件存储, 通过唯一 ID 访问

### 12.3 向后兼容

认证系统经历两次迁移:
- **v1**: 用户名 + 密码 (legacy, 仍可通过 `getUserIdByUsername` 登录)
- **v2 (当前)**: 邮箱 + 密码 (主键), 登录时先查邮箱再查用户名作为 fallback

---

## 十三、本地开发快速开始

```bash
# 1. 克隆项目
git clone <repo-url>
cd ai-product-builder

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 API Keys

# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:3000
```

---

*文档版本: 0.1.0 · 最后更新: 2026 年 6 月*
