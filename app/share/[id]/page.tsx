import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { dataDir } from '@/lib/data-dir';
import type { ShareData } from '@/lib/types';
import SharePageClient from './SharePageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const filePath = path.join(dataDir('shares'), `${id}.json`);

  let title = '产品验证 - 芥子';
  let description = 'AI 驱动的产品想法验证平台';
  let imageUrl = '/share-card-test.png';

  if (existsSync(filePath)) {
    try {
      const raw = await readFile(filePath, 'utf-8');
      const data = JSON.parse(raw) as ShareData;
      const name = (data as any).report?.product_name || data.idea || '产品验证';
      title = `${name} - 芥子验证`;
      description = data.report?.verdict_reason || '用芥子验证你的产品想法';
    } catch {}
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let initialData: ShareData | null = null;
  const filePath = path.join(dataDir('shares'), `${id}.json`);
  if (existsSync(filePath)) {
    try {
      const raw = await readFile(filePath, 'utf-8');
      initialData = JSON.parse(raw);
    } catch {}
  }

  return <SharePageClient id={id} initialData={initialData} />;
}
