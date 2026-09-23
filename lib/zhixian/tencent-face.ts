import * as tencentcloud from 'tencentcloud-sdk-nodejs';

const IaiClient = tencentcloud.iai.v20200303.Client;

export type FaceCandidate = { personId: string; score: number };

function getClient() {
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  if (!secretId || !secretKey) return null;
  return new IaiClient({
    credential: { secretId, secretKey },
    region: process.env.TENCENT_FACE_REGION || 'ap-guangzhou',
    profile: {
      httpProfile: {
        endpoint: 'iai.tencentcloudapi.com',
        proxy: process.env.TENCENT_HTTP_PROXY || undefined,
      },
    },
  });
}

export function isConfigured(): boolean {
  return !!(process.env.TENCENT_SECRET_ID && process.env.TENCENT_SECRET_KEY);
}

export async function createGroup(groupId: string, groupName: string): Promise<void> {
  const client = getClient();
  if (!client) throw new Error('未配置腾讯云凭据');
  try {
    await client.CreateGroup({ GroupId: groupId, GroupName: groupName });
  } catch (error: unknown) {
    const msg = String((error as { message?: string })?.message || error);
    if (msg.includes('已存在') || msg.includes('exist')) return;
    throw error;
  }
}

export async function createPerson(
  groupId: string,
  personId: string,
  name: string,
  imageBase64: string,
): Promise<void> {
  const client = getClient();
  if (!client) throw new Error('未配置腾讯云凭据');
  await client.CreatePerson({ GroupId: groupId, PersonId: personId, PersonName: name, Image: imageBase64 });
}

export async function searchFaces(
  groupId: string,
  imageBase64: string,
  topN = 3,
): Promise<FaceCandidate[]> {
  const client = getClient();
  if (!client) throw new Error('未配置腾讯云凭据');
  const image = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const res = await client.SearchFaces({
    GroupIds: [groupId],
    Image: image,
    MaxFaceNum: 1,
    MaxPersonNum: Math.min(topN, 10),
    FaceMatchThreshold: 0,
    NeedRotateDetection: 1,
  });
  const candidates = res.Results?.[0]?.Candidates || [];
  return candidates.map((c) => ({ personId: c.PersonId || '', score: c.Score || 0 }));
}
