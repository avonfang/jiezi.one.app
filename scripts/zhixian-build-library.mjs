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
  { id: 'lei_jiayin', name: '雷佳音', file: 'lei_jiayin.jpg' },
  { id: 'yue_yunpeng', name: '岳云鹏', file: 'yue_yunpeng.jpg' },
  { id: 'jia_ling', name: '贾玲', file: 'jia_ling.jpg' },
  { id: 'sha_yi', name: '沙溢', file: 'sha_yi.jpg' },
  { id: 'bai_ke', name: '白客', file: 'bai_ke.jpg' },
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
