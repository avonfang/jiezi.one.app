import { ProxyAgent } from 'undici';

// 阿里云百炼 / 通义万相「通用图像编辑」：用参考图 + 指令生成造型图。
const HOST = process.env.DASHSCOPE_API_HOST || 'https://dashscope.aliyuncs.com';
const CREATE_URL = HOST + '/api/v1/services/aigc/image2image/image-synthesis';

let _proxy: ProxyAgent | null = null;
function dispatcher(): { dispatcher: ProxyAgent } | Record<string, never> {
  const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.BAIDU_HTTP_PROXY;
  if (!proxy) return {};
  if (!_proxy) _proxy = new ProxyAgent({ uri: proxy });
  return { dispatcher: _proxy };
}

function key(): string {
  return process.env.DASHSCOPE_API_KEY || '';
}

export function isConfigured(): boolean {
  return !!key();
}

async function createTask(imageBase64: string, prompt: string): Promise<string> {
  const res = await fetch(CREATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + key(),
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'wanx2.1-imageedit',
      input: {
        function: 'description_edit',
        prompt,
        base_image_url: imageBase64,
      },
      parameters: { n: 1 },
    }),
    ...dispatcher(),
  });
  const data = (await res.json()) as { output?: { task_id?: string }; code?: string; message?: string };
  const taskId = data?.output?.task_id;
  if (!taskId) {
    throw new Error('DashScope 创建任务失败: ' + (data?.message || data?.code || res.status));
  }
  return taskId;
}

async function pollTask(taskId: string): Promise<string | null> {
  const url = HOST + '/api/v1/tasks/' + taskId;
  for (let i = 0; i < 40; i++) {
    const res = await fetch(url, {
      headers: { Authorization: 'Bearer ' + key() },
      ...dispatcher(),
    });
    const data = (await res.json()) as {
      output?: { task_status?: string; results?: Array<{ url?: string }>; message?: string };
    };
    const status = data?.output?.task_status;
    if (status === 'SUCCEEDED') {
      return data?.output?.results?.[0]?.url || null;
    }
    if (status === 'FAILED' || status === 'CANCELED' || status === 'UNKNOWN') {
      throw new Error('DashScope 生成失败: ' + (data?.output?.message || status));
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('DashScope 生成超时');
}

// 返回生成图片的公网 URL（24 小时有效）。
export async function generateStyleImage(imageBase64: string, prompt: string): Promise<string> {
  const taskId = await createTask(imageBase64, prompt);
  const url = await pollTask(taskId);
  if (!url) throw new Error('DashScope 未返回图片结果');
  return url;
}
