import { kvGet, kvSet } from './kv-store';
import type { ValidationReport } from './types';

const VALIDATIONS_KEY = 'recent:validations';
const MAX_RECORDS = 20;

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
  let records = await kvGet<RecentRecord[]>(VALIDATIONS_KEY) || [];

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
  await kvSet(VALIDATIONS_KEY, records);
}

export async function getRecentValidations(limit = 10): Promise<RecentRecord[]> {
  const records = await kvGet<RecentRecord[]>(VALIDATIONS_KEY);
  return records ? records.slice(0, limit) : [];
}
