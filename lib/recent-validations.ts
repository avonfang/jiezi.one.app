import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dataDir } from './data-dir';
import type { ValidationReport } from './types';

const MAX_RECORDS = 20;
const FILE = dataDir('recent', 'validations.json');

export interface RecentRecord {
  id: string;
  idea: string;
  verdict: string;
  verdict_reason: string;
  market_score: number;
  feasibility_score: number;
  target_users: string;
  report: ValidationReport;
  created_at: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export async function saveValidation(idea: string, report: ValidationReport): Promise<void> {
  await mkdir(dataDir('recent'), { recursive: true });

  let records: RecentRecord[] = [];
  if (existsSync(FILE)) {
    try {
      const raw = await readFile(FILE, 'utf-8');
      records = JSON.parse(raw);
    } catch { /* ignore */ }
  }

  records.unshift({
    id: generateId(),
    idea,
    verdict: report.verdict,
    verdict_reason: report.verdict_reason,
    market_score: report.market_score,
    feasibility_score: report.feasibility_score,
    target_users: report.target_users,
    report,
    created_at: Date.now(),
  });

  if (records.length > MAX_RECORDS) records = records.slice(0, MAX_RECORDS);
  await writeFile(FILE, JSON.stringify(records), 'utf-8');
}

export async function getRecentValidations(limit = 10): Promise<RecentRecord[]> {
  if (!existsSync(FILE)) return [];
  try {
    const raw = await readFile(FILE, 'utf-8');
    const records: RecentRecord[] = JSON.parse(raw);
    return records.slice(0, limit);
  } catch {
    return [];
  }
}
