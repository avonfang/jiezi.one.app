# 芥子微信小程序开发文档

> 基于现有 Next.js 后端（Vercel），新建微信小程序前端项目，复用全部 API。

---

## 一、架构总览

```
┌─────────────────────────────────────────┐
│           微信小程序 (新项目)             │
│  pages/index, validate, report, pricing │
│  utils/api.ts, auth.ts, storage.ts      │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│         Vercel (现有后端, 不动)           │
│  Next.js API Routes                     │
│  - /api/validate, /api/generate-prd ... │
│  - /api/auth/wechat (新增)              │
│  - /api/wxpay/pay (新增)                │
└─────────────────────────────────────────┘
```

**原则**：后端只增加微信登录和微信支付两个端点，现有 API 不动。

---

## 二、后端新增/修改

### 2.1 微信登录 — `app/api/auth/wechat/route.ts`

**请求**：
```json
{ "code": "wx-login-code", "anonymousId": "可选，用于合并匿名积分" }
```

**流程**：
1. 接收 `code`，调微信 `jscode2session` 接口换取 `openid`
2. 查 KV 中 `auth:openid-{openid}` 是否已有映射
3. 有 → 返回已有 userId 和 JWT
4. 无 → 创建新用户（生成 `u_` + 24 位 hex 的 userId），初始化 3 次免费积分，保存映射
5. 如果传了 `anonymousId`，合并匿名积分到新账号
6. 返回 JWT token

**响应**：
```json
{ "success": true, "userId": "u_xxx", "token": "jwt-token", "balance": 3, "isNew": true }
```

### 2.2 微信支付 — `app/api/wxpay/pay/route.ts`

**请求**：
```json
{ "plan": "basic", "userId": "u_xxx", "openid": "wx-openid" }
```

**流程**：
1. 根据 plan 确定金额（basic=7元, standard=12.9元, premium=29.9元, ...）
2. 生成内部订单号 `wx_` + 随机 hex
3. 调微信 JSAPI 统一下单 API，传 `openid`
4. 拿到 `prepay_id`，按微信规则生成小程序端调起支付所需的参数包
5. 返回 prepay 参数给小程序

**响应**：
```json
{
  "success": true,
  "orderId": "wx_xxx",
  "payment": {
    "appId": "wx-appid",
    "timeStamp": "1234567890",
    "nonceStr": "random",
    "package": "prepay_id=wx...",
    "signType": "MD5",
    "paySign": "signature"
  }
}
```

### 2.3 微信支付回调 — `app/api/wxpay/notify/route.ts`

- 接收微信支付结果通知（XML 格式）
- 验证签名
- 确认订单、增加积分
- 返回微信要求的成功响应

### 2.4 修改 `lib/auth-server.ts`

新增两个函数：

```typescript
// 通过 openid 注册或登录
export async function registerOrLoginByOpenid(
  openid: string,
  anonymousId?: string
): Promise<{ userId: string; isNew: boolean }> {
  const mapKey = `auth:openid-${openid}`;
  let userId = await kvGet(mapKey);
  if (userId) return { userId, isNew: false };

  // 新建用户
  userId = 'u_' + generateId(24);
  await kvSet(mapKey, userId);
  await kvSet(`auth:users:${userId}`, JSON.stringify({
    userId,
    name: `微信用户_${openid.slice(-4)}`,
    openid,
    createdAt: Date.now(),
    type: 'wechat'
  }));
  return { userId, isNew: true };
}

// 合并匿名积分
export async function mergeAnonymousCredits(userId: string, anonymousId: string): Promise<void> {
  // 读取 anonymousId 的积分，加到 userId 上，删除 anonymousId 的记录
}
```

### 2.5 环境变量新增

| 变量 | 说明 | 获取方式 |
|------|------|----------|
| `WX_APPID` | 小程序 AppID | 微信公众平台 |
| `WX_SECRET` | 小程序 AppSecret | 微信公众平台 |
| `WX_MCHID` | 微信商户号 | 微信商户平台 |
| `WX_MCH_KEY` | 商户 API 密钥 | 微信商户平台 |

---

## 三、小程序项目结构

```
wechat-miniprogram/
├── app.json                     # 全局配置 + tabBar
├── app.wxss                     # 全局样式
├── app.ts                       # 全局生命周期（启动时静默登录）
│
├── utils/
│   ├── api.ts                   # 封装 wx.request，自动带 auth header
│   ├── auth.ts                  # 微信登录 + token 管理
│   ├── storage.ts               # wx.getStorageSync / setStorageSync 封装
│   └── credit.ts                # 积分查询
│
├── components/
│   ├── idea-input/              # 产品想法输入组件
│   ├── summary-card/            # 验证摘要卡片
│   ├── report-section/          # 报告章节展示（通用）
│   ├── loading-timeline/        # 4 步加载时间线动画
│   ├── credit-badge/            # 顶部积分余额
│   └── pm-consult/              # PM 顾问聊天
│
├── pages/
│   ├── index/                   # 首页：输入想法 + 快速验证
│   │   ├── index.ts
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── validate/                # 验证流程（进度 + 摘要结果）
│   ├── report/                  # 完整验证报告
│   ├── prd/                     # PRD 文档
│   ├── preview/                 # 产品预览（web-view）
│   ├── history/                 # 本地历史记录
│   ├── profile/                 # 个人中心
│   ├── pricing/                 # 积分套餐 + 微信支付
│   ├── contact/                 # 联系客服
│   └── share/                   # 分享报告
│
└── images/
    ├── tab-home.png
    ├── tab-history.png
    └── tab-profile.png
```

---

## 四、关键设计方案

### 4.1 网络层 (`utils/api.ts`)

```typescript
const BASE_URL = 'https://jiezi.site';

interface RequestOptions {
  path: string;
  method?: string;
  data?: any;
  noAuth?: boolean; // 某些接口不需要 token
}

function request<T>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (!options.noAuth) {
      const token = wx.getStorageSync('jiezi-auth-token');
      if (token) header['Authorization'] = `Bearer ${token}`;
      else {
        const clientId = wx.getStorageSync('jiezi-client-id');
        if (clientId) header['x-client-id'] = clientId;
      }
    }
    wx.request({
      url: `${BASE_URL}${options.path}`,
      method: options.method || 'POST',
      data: options.data,
      header,
      success: (res) => {
        if (res.statusCode >= 400) reject(res.data);
        else resolve(res.data as T);
      },
      fail: reject,
    });
  });
}
```

### 4.2 流式处理策略

验证/PRD/预览端点返回 NDJSON 流，小程序不支持 `ReadableStream`。

**方案：后端增加非流式模式**

在现有流式端点加参数 `?mode=json`，当检测到该参数时，将流式输出缓冲到内存，全部生成完毕后一次性返回完整 JSON：

```typescript
// app/api/validate/route.ts — 修改
const searchParams = new URL(request.url).searchParams;
const mode = searchParams.get('mode');

if (mode === 'json') {
  // 不创建 stream，等全部生成完直接 return Response.json({ report })
  const report = await generateFullReport(idea);
  return Response.json({ success: true, report });
}
// 原有流式逻辑不变
```

小程序端统一用非流式调用，代价是等待时间更长（约 30-60s），但实现最简单。

### 4.3 微信登录 (`utils/auth.ts`)

```typescript
async function wechatLogin(): Promise<void> {
  const token = wx.getStorageSync('jiezi-auth-token');
  if (token) return; // 已有 token，跳过

  // 静默登录
  const { code } = await wx.login();
  const anonymousId = wx.getStorageSync('jiezi-client-id') || generateUUID();

  const res = await request<LoginResult>({
    path: '/api/auth/wechat',
    data: { code, anonymousId },
    noAuth: true,
  });

  wx.setStorageSync('jiezi-auth-token', res.token);
  wx.setStorageSync('jiezi-user-id', res.userId);
  wx.setStorageSync('jiezi-username', `微信用户${res.userId.slice(-4)}`);
}
```

### 4.4 微信支付 (`pages/pricing/`)

```typescript
async function wxPay(plan: string): Promise<void> {
  const openid = wx.getStorageSync('wx-openid');
  const userId = wx.getStorageSync('jiezi-user-id');

  const res = await request<PayResult>({
    path: '/api/wxpay/pay',
    data: { plan, userId, openid },
  });

  // 调起微信支付
  const { payment } = res;
  await wx.requestPayment({
    timeStamp: payment.timeStamp,
    nonceStr: payment.nonceStr,
    package: payment.package,
    signType: payment.signType,
    paySign: payment.paySign,
  });

  // 支付成功，更新积分
  await checkCredits();
}
```

### 4.5 Preview 渲染方案

AI 生成的 HTML 无法在小程序中直接渲染。

**方案：web-view 嵌入**

1. 后端新增 `app/preview/[id]/page.tsx` — 接收 previewId，从 KV 或文件读取 HTML 内容，直接渲染
2. 小程序 Preview 页用 `<web-view src="https://jiezi.site/preview/{previewId}" />`
3. 路径白名单需在小程序后台配置

### 4.6 TabBar 设计（`app.json`）

```json
{
  "tabBar": {
    "color": "#999",
    "selectedColor": "#3b82f6",
    "list": [
      { "pagePath": "pages/index/index", "text": "验证", "iconPath": "images/tab-home.png" },
      { "pagePath": "pages/history/history", "text": "历史", "iconPath": "images/tab-history.png" },
      { "pagePath": "pages/profile/profile", "text": "我的", "iconPath": "images/tab-profile.png" }
    ]
  }
}
```

---

## 五、API 端点完整参考

| 方法 | 路径 | 小程序端调用方式 | 说明 |
|------|------|-----------------|------|
| POST | `/api/auth/wechat` | `wx.login()` → code → 调此接口 | 微信登录（新增） |
| POST | `/api/wxpay/pay` | 选择套餐 → 调此接口 → `wx.requestPayment()` | 微信支付下单（新增） |
| POST | `/api/wxpay/notify` | （微信服务器回调） | 支付结果通知（新增） |
| POST | `/api/validate?mode=json` | 输入想法后调用 | AI 验证（非流式模式） |
| POST | `/api/generate-prd?mode=json` | 生成 PRD | PRD 生成（非流式） |
| POST | `/api/generate-preview?mode=json` | 生成预览 | 预览生成（非流式） |
| POST | `/api/unlock-report` | 解锁完整报告 | 消耗 2 积分 |
| POST | `/api/pm-consult` | PM 顾问提问 | 消耗 1 积分/次 |
| POST | `/api/codes/redeem` | 兑换激活码 | 输入兑换码 |
| GET | `/api/credits` | 查询积分 | 自动带 token |
| POST | `/api/share` | 生成分享 | 返回 shareId |
| GET | `/api/share/[id]` | 查看分享 | 公开接口 |
| POST | `/api/feedback` | 提交反馈 | 文字+联系方式 |

---

## 六、页面功能说明

### 6.1 首页 (`pages/index`)

- 品牌 Header + 积分余额
- 文本输入区（产品想法）
- 4 个示例想法按钮（快速填充）
- "验证方向" 按钮
- 加载时间线（提取 → 搜索 → 分析 → 生成）
- 验证完成后跳转到 `pages/validate`

### 6.2 验证结果 (`pages/validate`)

- 摘要卡片：评判（建议尝试/值得探索/暂不建议）
- 评分可视化：市场前景 + 开发可行性（进度条）
- 4 项指标：市场机会、技术难度、启动成本、回本周期
- "查看完整报告" 按钮 → `pages/report`
- "生成 PRD" 按钮 → `pages/prd`
- "PM 顾问" 聊天入口

### 6.3 完整报告 (`pages/report`)

- 滚动展示完整验证报告
- 竞品列表（带来源）
- SWOT 2x2 网格
- 评分详情（6 项子评分）
- 市场分析、差异化、目标用户、定价、获客渠道
- 成本估算、收入预估、技术评估、MVP 时间线、风险提示

### 6.4 PRD (`pages/prd`)

- 产品定位、目标用户、用户故事
- 功能列表（P0/P1/P2 优先级）
- 用户流程、数据模型、技术栈
- 下一步行动

### 6.5 预览 (`pages/preview`)

- `<web-view>` 嵌入 `https://jiezi.site/preview/{id}`
- 仅用于展示，不支持交互编辑

### 6.6 历史 (`pages/history`)

- 本地存储的历史验证记录列表
- 按时间倒序
- 按评判筛选（全部/建议尝试/值得探索/暂不建议）
- 左滑删除

### 6.7 个人中心 (`pages/profile`)

- 头像 + 昵称（微信信息）
- 积分余额 + 充值入口
- 退出登录

### 6.8 积分套餐 (`pages/pricing`)

- 3 个套餐卡（6.9元/7次、12.9元/15次、29.9元/35次）
- 2 个小额加油包
- 选择后调起微信支付

### 6.9 联系 (`pages/contact`)

- 品牌介绍
- 客服联系方式
- 微信客服消息入口

### 6.10 分享 (`pages/share`)

- `onShareAppMessage` 定义分享卡片
- 接收分享参数后加载 `/api/share/[id]` 展示

---

## 七、开发步骤

### Phase 1 — 核心流程（约 3-5 天）

1. 注册小程序账号，获取 AppID 和 AppSecret
2. 配置 Vercel 环境变量（WX_APPID、WX_SECRET）
3. 实现 `app/api/auth/wechat` 后端
4. 修改 `app/api/validate` 支持 `?mode=json` 非流式模式
5. 创建小程序项目，实现 `utils/` 基础库
6. 实现 `pages/index`（输入 + 发起验证）
7. 实现 `pages/validate`（进度展示 + 摘要结果）
8. 部署测试：输入想法 → 验证 → 看到结果

### Phase 2 — 支付 + 登录（约 2-3 天）

9. 申请微信商户号，获取商户密钥
10. 实现 `app/api/wxpay/pay` + `app/api/wxpay/notify`
11. 实现 `pages/pricing`（套餐选择 + 微信支付）
12. 实现 `pages/profile`（登录状态 + 积分展示）
13. 部署测试：支付流程完整跑通

### Phase 3 — 完整功能（约 3-5 天）

14. 修改 `app/api/generate-prd` 支持 `?mode=json`
15. 修改 `app/api/generate-preview` 支持 `?mode=json`
16. 实现 `pages/report`、`pages/prd`、`pages/preview`
17. 实现 `pages/history`
18. 实现分享功能
19. 实现 `pages/contact`

---

## 八、注意事项

### 小程序发布要求
- 个人主体：无需 ICP 备案，但类目有限制（"工具-效率" 可覆盖）
- 企业主体：可申请微信支付，类目更广
- **域名白名单**：需在微信公众平台配置 `https://jiezi.site` 为合法 request 域名
- **web-view 域名**：也需单独配置业务域名白名单

### 用户隐私
- 收集用户 openid 需在《用户隐私保护指引》中说明
- 小程序提交审核时需填写隐私相关条款

### 与现有系统的关系
- 微信小程序用户和邮箱注册用户是**两套身份体系**，不打通
- 可以在后续版本实现绑定（邮箱 + 微信绑定同一個账号）
- 积分系统共用，userId 格式统一

### 审核注意
- 小程序审核无法使用 Dev 环境，必须在线上版本验证
- 建议 Phase 1 完成后先提交一版审核，后续增量更新
