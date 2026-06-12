import path from 'path';

const BASE = process.env.VERCEL
  ? '/tmp/jiezi-data'
  : path.join(process.cwd(), '.data');

export function dataDir(...subpaths: string[]): string {
  return path.join(BASE, ...subpaths);
}
