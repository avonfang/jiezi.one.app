export interface ValidationRequest {
  idea: string;
}

export interface Competitor {
  name: string;
  positioning: string;
  user_feedback: string;
  source_url?: string;
}

export interface MarketAnalysis {
  competitor_count: string;
  demand: string;
  competition_level: string;
}

export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ValidationSummary {
  market_opportunity: string;
  tech_difficulty: string;
  startup_cost: string;
  payback_period: string;
  one_liner: string;
}

export interface ValidationReport {
  verdict: '建议尝试' | '值得探索' | '暂不建议' | '推荐做' | '谨慎做' | '不建议做';
  verdict_reason: string;
  market_score: number;
  feasibility_score: number;
  sharp_comment?: string;
  summary?: ValidationSummary;
  scoring?: {
    market_size: number;
    user_demand: number;
    competition_density: number;
    monetization_potential: number;
    tech_feasibility: number;
    team_cost: number;
  };
  market_analysis: MarketAnalysis;
  competitors: Competitor[];
  swot: SWOT;
  differentiation: string;
  target_users: string;
  pricing_suggestion: string;
  acquisition_channels: string;
  cost_budget: string;
  risk_warnings: string[];
  revenue_estimation: string;
  tech_assessment: string;
  mvp_timeline: string;
  has_search_data?: boolean;
}

export interface HistoryItem {
  id: string;
  idea: string;
  timestamp: number;
  report: ValidationReport;
  prd?: PRD;
  preview?: PreviewPage;
}

export interface ExtractedInfo {
  target_users: string;
  core_features: string;
  industry: string;
  keywords: string[];
}

export interface PRDFeature {
  name: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
}

export interface PRDDataModel {
  entity: string;
  fields: string;
}

export interface PRD {
  product_name: string;
  one_liner: string;
  positioning: string;
  target_users: string;
  user_story: string;
  features: PRDFeature[];
  user_flow: string;
  data_models: PRDDataModel[];
  tech_stack_suggestion: string;
  next_steps: string;
}

export interface PreviewPage {
  html: string;
  product_name: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type AppStatus = 'idle' | 'loading' | 'success' | 'error';
export type PrdStatus = 'idle' | 'generating' | 'done';

export interface ShareData {
  idea: string;
  report: ValidationReport;
  prd?: PRD;
  preview?: PreviewPage;
  created_at: number;
}
