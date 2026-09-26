import * as tencentcloud from 'tencentcloud-sdk-nodejs';

// 腾讯云「人脸融合 FaceFusion」：把用户人脸换到明星经典造型素材上。
// 与 DashScope 图像编辑的本质区别：换脸保留素材模板的服装/发型/姿态/场景，只替换人脸。
const FaceFusionClient = tencentcloud.facefusion.v20220927.Client;

type FusionModelMap = Record<string, string>; // starId -> 素材 ModelId

function getClient() {
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  if (!secretId || !secretKey) return null;
  return new FaceFusionClient({
    credential: { secretId, secretKey },
    region: process.env.TENCENT_FUSION_REGION || 'ap-guangzhou',
    profile: {
      httpProfile: {
        endpoint: 'facefusion.tencentcloudapi.com',
        proxy: process.env.TENCENT_HTTP_PROXY || undefined,
      },
    },
  });
}

function getProjectId(): string {
  return process.env.ZHIXIAN_FUSION_PROJECT_ID || '';
}

// 明星 -> 素材 ModelId 映射，两种配置方式（后者优先）：
// 1) ZHIXIAN_FUSION_MODEL_ID：全局默认素材，用于先跑通单个明星验证；
// 2) ZHIXIAN_FUSION_MODELS：JSON 映射 {"shen_teng":"mt_xxx","ma_li":"mt_yyy"}，按明星精确匹配。
function getModelMap(): FusionModelMap {
  try {
    const raw = process.env.ZHIXIAN_FUSION_MODELS;
    if (raw) return JSON.parse(raw) as FusionModelMap;
  } catch {
    /* 配置格式错误时按空映射处理 */
  }
  return {};
}

export function resolveModelId(starId: string): string {
  const map = getModelMap();
  if (map[starId]) return map[starId];
  return process.env.ZHIXIAN_FUSION_MODEL_ID || '';
}

// 完整配置：凭据 + 活动 ID + 可解析的素材 ID（至少有一个全局默认或映射里能命中）。
export function isConfigured(): boolean {
  return !!(process.env.TENCENT_SECRET_ID && process.env.TENCENT_SECRET_KEY && getProjectId());
}

export function isConfiguredForStar(starId: string): boolean {
  return isConfigured() && !!resolveModelId(starId);
}

// 执行换脸，返回融合结果公网 URL（有效期 7 天，且带「AI 合成」标识）。
export async function fuseFace(userImageBase64: string, starId: string): Promise<string> {
  const client = getClient();
  if (!client) throw new Error('未配置腾讯云凭据');
  const projectId = getProjectId();
  const modelId = resolveModelId(starId);
  if (!projectId) throw new Error('未配置人脸融合活动 ID（ZHIXIAN_FUSION_PROJECT_ID）');
  if (!modelId) throw new Error('未配置该明星的人脸融合素材 ID（ZHIXIAN_FUSION_MODEL_ID / ZHIXIAN_FUSION_MODELS）');

  const image = userImageBase64.replace(/^data:image\/\w+;base64,/, '');
  const res = await client.FuseFace({
    ProjectId: projectId,
    ModelId: modelId,
    RspImgType: 'url',
    MergeInfos: [{ Image: image }],
    LogoAdd: 1, // 默认已为 1，显式保留：为结果加「本图片为 AI 合成图片」标识（合规必需）
  });
  const url = res.FusedImage;
  if (!url) throw new Error('人脸融合未返回结果');
  return url;
}
