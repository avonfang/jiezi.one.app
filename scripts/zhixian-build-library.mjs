/**
 * 构建仙人指路风格档案库。
 *
 * 安全约束：
 * 1. 仅读取本机 ZHIXIAN_LIBRARY_DIR 中已获得授权/可使用的图片；
 * 2. 不从外部网站拉取明星照片；
 * 3. 云端匹配开关默认关闭，需在环境和前端单独同意后再启用。
 */
import fs from 'node:fs';
import path from 'node:path';
import tencentcloud from 'tencentcloud-sdk-nodejs';

const IaiClient = tencentcloud.iai.v20200303.Client;

const client = new IaiClient({
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: process.env.TENCENT_FACE_REGION || 'ap-guangzhou',
  profile: {
    httpProfile: {
      endpoint: 'iai.tencentcloudapi.com',
      proxy: process.env.TENCENT_HTTP_PROXY || undefined,
    },
  },
});

const GROUP_ID = process.env.TENCENT_FACE_GROUP_ID || 'zhixian_stars_v1';
const LIBRARY_DIR = process.env.ZHIXIAN_LIBRARY_DIR;

const STARS = [
  { id: 'shen_teng', name: '沈腾', file: 'shen_teng.jpg' },
  { id: 'ma_li', name: '马丽', file: 'ma_li.jpg' },
  { id: 'lei_jiayin', name: '雷佳音', file: 'lei_jiayin.jpg' },
  { id: 'yue_yunpeng', name: '岳云鹏', file: 'yue_yunpeng.jpg' },
  { id: 'jia_ling', name: '贾玲', file: 'jia_ling.jpg' },
  { id: 'sha_yi', name: '沙溢', file: 'sha_yi.jpg' },
  { id: 'bai_ke', name: '白客', file: 'bai_ke.jpg' },
  { id: 'huang_bo', name: '黄渤', file: 'huang_bo.jpg' },
  { id: 'xu_zheng', name: '徐峥', file: 'xu_zheng.jpg' },
  { id: 'wang_baoqiang', name: '王宝强', file: 'wang_baoqiang.jpg' },
  { id: 'da_peng', name: '大鹏', file: 'da_peng.jpg' },
  { id: 'qiao_shan', name: '乔杉', file: 'qiao_shan.jpg' },
  { id: 'chang_yuan', name: '常远', file: 'chang_yuan.jpg' },
  { id: 'ai_lun', name: '艾伦', file: 'ai_lun.jpg' },
  { id: 'wei_xiang', name: '魏翔', file: 'wei_xiang.jpg' },
  { id: 'wang_xun', name: '王迅', file: 'wang_xun.jpg' },
  { id: 'pan_binlong', name: '潘斌龙', file: 'pan_binlong.jpg' },
  { id: 'song_xiaobao', name: '宋小宝', file: 'song_xiaobao.jpg' },
  { id: 'xiao_shenyang', name: '小沈阳', file: 'xiao_shenyang.jpg' },
  { id: 'wen_song', name: '文松', file: 'wen_song.jpg' },
  { id: 'yang_di', name: '杨迪', file: 'yang_di.jpg' },
  { id: 'jin_jing', name: '金靖', file: 'jin_jing.jpg' },
  { id: 'lamu_yangzi', name: '辣目洋子', file: 'lamu_yangzi.jpg' },
  { id: 'jiang_long', name: '蒋龙', file: 'jiang_long.jpg' },
  { id: 'zhang_chi', name: '张弛', file: 'zhang_chi.jpg' },
  { id: 'da_suo', name: '大锁', file: 'da_suo.jpg' },
  { id: 'tu_dou', name: '土豆', file: 'tu_dou.jpg' },
  { id: 'lv_yan', name: '吕严', file: 'lv_yan.jpg' },
  { id: 'hu_lan', name: '呼兰', file: 'hu_lan.jpg' },
  { id: 'pang_bo', name: '庞博', file: 'pang_bo.jpg' }
];

function readLibraryImage(file) {
  if (!LIBRARY_DIR) throw new Error('缺少 ZHIXIAN_LIBRARY_DIR');
  const full = path.resolve(LIBRARY_DIR, file);
  if (!full.startsWith(path.resolve(LIBRARY_DIR))) throw new Error(`非法路径: ${file}`);
  if (!fs.existsSync(full)) throw new Error(`缺少授权档案图片: ${full}`);
  return fs.readFileSync(full).toString('base64');
}

async function main() {
  if (!process.env.TENCENT_SECRET_ID || !process.env.TENCENT_SECRET_KEY) {
    throw new Error('缺少 TENCENT_SECRET_ID / TENCENT_SECRET_KEY');
  }

  try {
    await client.CreateGroup({ GroupId: GROUP_ID, GroupName: '仙人指路风格档案库' });
    console.log('Group created:', GROUP_ID);
  } catch (error) {
    console.log('Group (exists or error):', error?.message || error?.code || error);
  }

  for (const star of STARS) {
    try {
      await client.CreatePerson({
        GroupId: GROUP_ID,
        PersonId: star.id,
        PersonName: star.name,
        Image: readLibraryImage(star.file),
      });
      console.log('Person created:', star.id, star.name);
    } catch (error) {
      console.log('Person error:', star.id, error?.message || error?.code || error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
