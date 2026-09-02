/**
 * 热门创业点子池（与小程序端同步）
 *
 * 当前为内置精选池，模拟"最近很火 / 大家正在验证"的灵感集合，
 * 供工作台首页"随机生成创业点子"使用。后续如需换成后端真实热门数据，
 * 只需替换 pickRandomHotIdeas 的数据源即可。
 */

export interface HotIdea {
  icon: string;
  idea: string;
  tag: string;
}

export const HOT_IDEA_POOL: HotIdea[] = [
  { icon: '🤖', idea: '一个帮独立开发者自动写周报和项目文档的 AI 助手', tag: 'AI工具' },
  { icon: '🧓', idea: '为独居老人设计的 AI 紧急呼叫与跌倒检测设备', tag: '银发经济' },
  { icon: '📦', idea: '面向跨境卖家的 AI 选品与竞品差评分析工具', tag: '出海电商' },
  { icon: '🎙️', idea: 'AI 模拟面试官，帮求职者练习技术面试并打分反馈', tag: '求职教育' },
  { icon: '💰', idea: 'AI 记账工具：自动分类账单并给出个性化省钱建议', tag: '效率工具' },
  { icon: '🐱', idea: 'AI 宠物健康管家：拍照识别猫狗常见皮肤病', tag: '宠物' },
  { icon: '🥗', idea: '拍照识别冰箱剩余食材、自动推荐菜谱的做饭助手', tag: '本地生活' },
  { icon: '😴', idea: 'AI 睡眠教练：根据作息数据生成助眠与午睡方案', tag: '健康' },
  { icon: '👶', idea: 'AI 育儿助手：记录宝宝作息并预测睡眠与喂奶窗口', tag: '母婴' },
  { icon: '🏠', idea: '为个人房东提供 AI 房源定价与租客背景审核服务', tag: '房产' },
  { icon: '📄', idea: 'AI 论文精读助手：几分钟读懂一篇英文论文', tag: '教育科研' },
  { icon: '🎬', idea: 'AI 短视频口播稿生成器：一键产出钩子开头与分镜建议', tag: '内容创作' },
  { icon: '🍜', idea: '面向小餐饮店的 AI 菜单优化与食材采购记账工具', tag: '本地生活' },
  { icon: '🗣️', idea: '陪伴式 AI 英语口语陪练，实时纠正发音与语法', tag: '语言学习' },
  { icon: '🩺', idea: 'AI 体检报告解读：把专业指标翻译成大白话和建议', tag: '健康' },
  { icon: '🎮', idea: 'AI 剧情生成器：帮独立游戏开发者快速写 NPC 对话', tag: '游戏' },
  { icon: '✍️', idea: '自由职业者合同 AI 审查小工具，标注风险条款', tag: '效率工具' },
  { icon: '🔋', idea: '新能源车主共享充电桩地图：实时空闲查询与预约', tag: '出行' },
  { icon: '🌱', idea: '阳台种菜 AI 助手：拍照识别病虫害并给出养护建议', tag: '农业' },
  { icon: '🎯', idea: '用 AI 把年度目标拆解成每周可执行计划并监督打卡', tag: '自我提升' },
  { icon: '📷', idea: 'AI 手机摄影后期：一键构图裁切与风格化调色建议', tag: '效率工具' },
  { icon: '💊', idea: '慢性病患者用药提醒 + 复诊与报告整理助手', tag: '健康' },
  { icon: '🎧', idea: 'AI 播客转文字并自动生成精华笔记与时间戳', tag: '效率工具' },
  { icon: '👔', idea: '应届生简历 AI 优化与模拟群面陪练', tag: '求职教育' },
  { icon: '🛍️', idea: '帮小店店主 3 分钟生成朋友圈营销图文的小工具', tag: '内容创作' },
  { icon: '🏋️', idea: 'AI 健身教练：根据现有器械自动生成每日训练计划', tag: '健康' },
  { icon: '🏖️', idea: '海岛民宿 AI 收益管理与多平台房态自动同步', tag: '旅游' },
  { icon: '🤝', idea: 'AI 匹配创业合伙人：按技能、方向与性格互补推荐', tag: '社交' },
  { icon: '📖', idea: 'AI 儿童绘本生成器：孩子说一句话就变成绘本', tag: '亲子教育' },
  { icon: '🧹', idea: '家政阿姨技能培训 + 按小区就近接单的平台', tag: '本地生活' },
  { icon: '🔐', idea: '中小企业 AI 邮件安全巡检：识别钓鱼与伪造邮件', tag: '企业服务' },
  { icon: '💎', idea: '二手奢侈品 AI 辅助鉴定：拍照初筛真伪风险', tag: '电商' },
  { icon: '🎹', idea: 'AI 音乐创作助手：哼一段旋律自动生成完整编曲', tag: '内容创作' },
  { icon: '🛴', idea: '校园电动车 AI 防盗定位与共享充电柜', tag: '物联网' },
  { icon: '🧋', idea: '茶饮店 AI 配方管理与效期库存预警 SaaS', tag: '企业服务' },
  { icon: '🗺️', idea: 'AI 城市漫步路线生成器：按口味推荐探店打卡路线', tag: '本地生活' },
  { icon: '🎨', idea: 'AI 专属表情包与头像生成工作室', tag: '内容创作' },
  { icon: '🐝', idea: '智能蜂箱监测：温湿度、出勤与产蜜量预警', tag: '农业' },
  { icon: '🧠', idea: '面向老人的 AI 认知训练小游戏与早期风险提醒', tag: '银发经济' },
  { icon: '🏫', idea: '培训机构 AI 助教：自动批改作业并生成学情报告', tag: '教育' },
  { icon: '🧳', idea: '出差人群 AI 行程管家：发票拍照自动整理成报销单', tag: '效率工具' },
  { icon: '⚽', idea: '青少年足球训练 AI 动作分析：拍视频自动点评', tag: '体育' },
  { icon: '🪴', idea: '办公室绿植 AI 养护提醒：缺水、光照与换盆提醒', tag: '生活方式' },
  { icon: '📊', idea: '给小红书博主的 AI 选题库与笔记数据复盘工具', tag: '内容创作' },
  { icon: '🧾', idea: '小微企业 AI 税务问答助手：新政解读与申报提醒', tag: '企业服务' },
  { icon: '🛠️', idea: '装修业主 AI 避坑助手：识别报价单里的猫腻', tag: '房产' },
  { icon: '🎒', idea: '大学生 AI 选课与期末复习规划助手', tag: '教育' },
  { icon: '🐶', idea: '宠物寄养 AI 匹配：按性格习惯找靠谱铲屎官', tag: '宠物' },
];

/** 从池中随机抽取 n 条互不重复的热门点子（洗牌后取前 n 条） */
export function pickRandomHotIdeas(n: number): HotIdea[] {
  const pool = HOT_IDEA_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  const count = Math.max(0, Math.min(n, pool.length));
  return pool.slice(0, count);
}