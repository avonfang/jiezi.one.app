export type Star = {
  id: string;
  name: string;
  tag: string;
  pct: number;
  dims: string[];
  desc: string;
};

export const STARS: Star[] = [
  { id: 'shen_teng', name: '沈腾', tag: '喜剧松弛系', pct: 87, dims: ['脸型轮廓', '眼型弧度', '笑起来的神态'], desc: '自带冷幽默的松弛感，表情越随意越有味道，模仿重点是“不使劲”的喜感。' },
  { id: 'lei_jiayin', name: '雷佳音', tag: '憨厚随和系', pct: 74, dims: ['头身比', '眉骨', '抿嘴的憨态'], desc: '憨里带灵的亲和力，适合演“老好人突然冒金句”的反差场面。' },
  { id: 'yue_yunpeng', name: '岳云鹏', tag: '喜感圆润系', pct: 61, dims: ['脸型圆润度', '眼睛', '撇嘴的委屈感'], desc: '圆润喜感+委屈脸，一个“哎哟喂”就能撑起整条视频。' },
  { id: 'jia_ling', name: '贾玲', tag: '亲切感染力', pct: 56, dims: ['笑容弧度', '酒窝', '整体气质'], desc: '天生的亲切与自嘲，感染力极强，适合生活流搞笑段子。' },
  { id: 'sha_yi', name: '沙溢', tag: '中年幽默系', pct: 52, dims: ['眉宇', '法令纹', '尴尬而不失礼貌的笑'], desc: '中年危机的幽默感，一本正经地说离谱话最出效果。' },
  { id: 'bai_ke', name: '白客', tag: '丧萌颓帅系', pct: 47, dims: ['下颌线', '眼神', '有气无力的丧感'], desc: '丧萌系代表，面无表情地吐槽，冷幽默拉满。' },
];
