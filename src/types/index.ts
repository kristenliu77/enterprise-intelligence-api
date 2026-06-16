export type EntityType = "industry" | "region" | "enterprise" | "project";
export type Trend = "up" | "stable" | "down";
export type HeatLevel = "低热度" | "一般热度" | "较高热度" | "高热度" | "极高热度";
export type ConfidenceLevel = "高可信" | "较可信" | "一般" | "数据不足";

export interface HeatDimensions {
  searchScore: number;
  mediaScore: number;
  investmentScore: number;
  policyScore: number;
  foundationScore: number;
  riskScore: number;
}

export interface HeatWeights {
  search: number;
  media: number;
  investment: number;
  policy: number;
  foundation: number;
}

export interface HeatRawMetrics {
  searchIndex: number;
  searchGrowthRate: number;
  exposure: number;
  keywordCount: number;
  likes: number;
  comments: number;
  shares: number;
  newsCount: number;
  interactionRate: number;
  positiveSentiment: number;
  investmentAmount: number;
  projectCount: number;
  newEnterpriseCount: number;
  financingEvents: number;
  investmentGrowthRate: number;
  chainActivity: number;
  policyTextMatch: number;
  taxBenefit: number;
  subsidyAmount: number;
  costAdvantage: number;
  approvalConvenience: number;
  policyStability: number;
  infrastructure: number;
  talentSupply: number;
  logistics: number;
  industrialSupport: number;
  researchResource: number;
  marketSize: number;
  policyRisk: number;
  marketRisk: number;
  creditRisk: number;
  overheatRisk: number;
  dataUncertainty: number;
  dataCompleteness: number;
  sourceCount: number;
  updatedDaysAgo: number;
  growthRate: number;
}

export interface HeatResult {
  entityId: string;
  entityName: string;
  entityType: EntityType;
  dimensions: HeatDimensions;
  baseHeat: number;
  finalHeat: number;
  riskFactor: number;
  qualityFactor: number;
  trendFactor: number;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  heatLevel: HeatLevel;
  trend: Trend;
  calculatedAt: string;
}

export interface Enterprise {
  id: string;
  name: string;
  industry: string;
  region: string;
  scale: string;
  financingStage: string;
  heatScore: number;
  policyMatch: number;
  investmentActivity: number;
  riskLevel: string;
  leadStatus: string;
  updatedAt: string;
}

export interface InvestmentProject {
  id: string;
  name: string;
  industry: string;
  targetRegion: string;
  expectedInvestment: number;
  landRequirement: number;
  stage: string;
  heatScore: number;
  feasibilityScore: number;
  owner: string;
  updatedAt: string;
}

export interface Industry {
  id: string;
  name: string;
  regionFocus: string[];
  lifecycle: string;
  heatScore: number;
  marketSize: number;
  investmentActivity: number;
  enterpriseCount: number;
  chainCompleteness: number;
  policySupport: number;
  talentSupply: number;
  risk: string;
  heatMetrics: HeatRawMetrics;
}

export interface Region {
  id: string;
  name: string;
  province: string;
  heatScore: number;
  policyEnvironment: number;
  talentResource: number;
  infrastructure: number;
  logistics: number;
  industrialSupport: number;
  cost: number;
  marketSize: number;
  attractionEfficiency: number;
  risk: number;
  keyIndustries: string[];
  enterpriseCount: number;
}

export interface Policy {
  id: string;
  name: string;
  agency: string;
  region: string;
  industries: string[];
  type: string;
  publishedAt: string;
  status: "有效" | "即将到期" | "已失效";
  matchedEnterpriseCount: number;
  summary: string;
}

export interface Lead {
  id: string;
  title: string;
  enterpriseName: string;
  industry: string;
  region: string;
  stage: LeadStage;
  priority: "高" | "中" | "低";
  owner: string;
  followDate: string;
  updatedAt: string;
}

export type LeadStage =
  | "待评估"
  | "初步接触"
  | "需求确认"
  | "方案洽谈"
  | "实地考察"
  | "签约推进"
  | "已落地"
  | "暂缓";

export interface DataSourceItem {
  id: string;
  name: string;
  status: "正常" | "延迟" | "异常";
  lastSyncAt: string;
  recordCount: number;
  quality: number;
  frequency: string;
  owner: string;
}

export interface Opportunity {
  id: string;
  title: string;
  region: string;
  industry: string;
  heat: number;
  policyMatch: number;
  investmentActivity: number;
  reason: string;
  risk: string;
}

export interface RankingItem {
  id: string;
  name: string;
  scope: string;
  score: number;
  level: HeatLevel;
  change30d: number;
  trend: Trend;
}
