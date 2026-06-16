import dayjs from "dayjs";
import type {
  ConfidenceLevel,
  EntityType,
  HeatDimensions,
  HeatLevel,
  HeatRawMetrics,
  HeatResult,
  HeatWeights,
  Trend
} from "../types";

export const DEFAULT_HALF_LIFE_DAYS = 30;

export const weightSchemes: Record<string, HeatWeights> = {
  综合招商方案: { search: 18, media: 16, investment: 26, policy: 20, foundation: 20 },
  产业趋势方案: { search: 25, media: 22, investment: 23, policy: 10, foundation: 20 },
  项目落地方案: { search: 10, media: 8, investment: 24, policy: 28, foundation: 30 }
};

export function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalize(value: number | null | undefined, min: number, max: number): number {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 50;
  }
  if (max === min) {
    return 50;
  }
  return round2(clamp(((value - min) / (max - min)) * 100));
}

export function reverseNormalize(value: number | null | undefined, min: number, max: number): number {
  return round2(100 - normalize(value, min, max));
}

export function zScore(value: number, mean: number, standardDeviation: number): number {
  if (standardDeviation === 0) {
    return 0;
  }
  return round2((value - mean) / standardDeviation);
}

export function applyTimeDecay(originalValue: number, ageDays: number, halfLifeDays = DEFAULT_HALF_LIFE_DAYS): number {
  const decayedValue = originalValue * Math.exp((-Math.log(2) * ageDays) / halfLifeDays);
  return round2(decayedValue);
}

export function calculateSearchScore(metrics: HeatRawMetrics): number {
  return round2(
    normalize(metrics.searchIndex, 1000, 10000) * 0.45 +
      normalize(metrics.searchGrowthRate, -20, 40) * 0.3 +
      normalize(metrics.exposure, 10000, 180000) * 0.15 +
      normalize(metrics.keywordCount, 10, 90) * 0.1
  );
}

export function calculateMediaScore(metrics: HeatRawMetrics): number {
  const engagementScore =
    normalize(metrics.likes, 500, 12000) * 0.2 +
    normalize(metrics.comments, 100, 3500) * 0.3 +
    normalize(metrics.shares, 50, 2800) * 0.35 +
    normalize(metrics.newsCount, 5, 160) * 0.15;
  return round2(
    engagementScore * 0.7 +
      normalize(metrics.interactionRate, 5, 80) * 0.15 +
      clamp(metrics.positiveSentiment * 100) * 0.15
  );
}

export function calculateInvestmentScore(metrics: HeatRawMetrics): number {
  return round2(
    normalize(metrics.investmentAmount, 1, 120) * 0.3 +
      normalize(metrics.projectCount, 1, 80) * 0.2 +
      normalize(metrics.newEnterpriseCount, 20, 700) * 0.15 +
      normalize(metrics.financingEvents, 0, 20) * 0.1 +
      normalize(metrics.investmentGrowthRate, -30, 60) * 0.15 +
      normalize(metrics.chainActivity, 10, 100) * 0.1
  );
}

export function calculatePolicyScore(metrics: HeatRawMetrics): number {
  return round2(
    clamp(metrics.policyTextMatch * 100) * 0.4 +
      normalize(metrics.taxBenefit, 0, 100) * 0.15 +
      normalize(metrics.subsidyAmount, 0, 6000) * 0.15 +
      normalize(metrics.costAdvantage, 0, 100) * 0.1 +
      clamp(metrics.approvalConvenience) * 0.1 +
      clamp(metrics.policyStability) * 0.1
  );
}

export function calculateFoundationScore(metrics: HeatRawMetrics): number {
  return round2(
    clamp(metrics.infrastructure) * 0.2 +
      clamp(metrics.talentSupply) * 0.2 +
      clamp(metrics.logistics) * 0.15 +
      clamp(metrics.industrialSupport) * 0.2 +
      clamp(metrics.researchResource) * 0.1 +
      clamp(metrics.marketSize) * 0.15
  );
}

export function calculateRiskScore(metrics: HeatRawMetrics): number {
  return round2(
    clamp(metrics.policyRisk) * 0.2 +
      clamp(metrics.marketRisk) * 0.25 +
      clamp(metrics.creditRisk) * 0.25 +
      clamp(metrics.overheatRisk) * 0.15 +
      clamp(metrics.dataUncertainty) * 0.15
  );
}

export function calculateDimensions(metrics: HeatRawMetrics): HeatDimensions {
  return {
    searchScore: calculateSearchScore(metrics),
    mediaScore: calculateMediaScore(metrics),
    investmentScore: calculateInvestmentScore(metrics),
    policyScore: calculatePolicyScore(metrics),
    foundationScore: calculateFoundationScore(metrics),
    riskScore: calculateRiskScore(metrics)
  };
}

export function heatLevel(score: number): HeatLevel {
  if (score < 40) return "低热度";
  if (score < 60) return "一般热度";
  if (score < 75) return "较高热度";
  if (score < 90) return "高热度";
  return "极高热度";
}

export function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 85) return "高可信";
  if (score >= 70) return "较可信";
  if (score >= 50) return "一般";
  return "数据不足";
}

export function trendFromGrowth(growthRate: number): Trend {
  if (growthRate > 5) return "up";
  if (growthRate < -5) return "down";
  return "stable";
}

export function validateWeights(weights: HeatWeights): boolean {
  const total = weights.search + weights.media + weights.investment + weights.policy + weights.foundation;
  return Math.abs(total - 100) < 0.001;
}

export function calculateHeatResult(
  entityId: string,
  entityName: string,
  entityType: EntityType,
  metrics: HeatRawMetrics,
  weights: HeatWeights
): HeatResult {
  const dimensions = calculateDimensions(metrics);
  const normalizedWeights = {
    search: weights.search / 100,
    media: weights.media / 100,
    investment: weights.investment / 100,
    policy: weights.policy / 100,
    foundation: weights.foundation / 100
  };
  const baseHeat = round2(
    dimensions.searchScore * normalizedWeights.search +
      dimensions.mediaScore * normalizedWeights.media +
      dimensions.investmentScore * normalizedWeights.investment +
      dimensions.policyScore * normalizedWeights.policy +
      dimensions.foundationScore * normalizedWeights.foundation
  );
  const riskFactor = round2(1 - (0.25 * dimensions.riskScore) / 100);
  const qualityFactor = round2(0.9 + 0.1 * clamp(metrics.dataCompleteness, 0, 1));
  const trendFactor = round2(1 + 0.08 * Math.tanh(metrics.growthRate / 20));
  const finalHeat = round2(clamp(baseHeat * riskFactor * qualityFactor * trendFactor));
  const sourceCoverage = clamp(metrics.sourceCount / 8, 0, 1);
  const freshness = clamp(1 - metrics.updatedDaysAgo / 30, 0, 1);
  const confidence = round2(
    (metrics.dataCompleteness * 0.5 + sourceCoverage * 0.3 + freshness * 0.2) * 100
  );

  return {
    entityId,
    entityName,
    entityType,
    dimensions,
    baseHeat,
    finalHeat,
    riskFactor,
    qualityFactor,
    trendFactor,
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    heatLevel: heatLevel(finalHeat),
    trend: trendFromGrowth(metrics.growthRate),
    calculatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss")
  };
}

export function simulateForecast(values: number[], months = 6): { actual: number[]; forecast: number[] } {
  const recent = values.slice(-3);
  const slope = recent.length >= 2 ? (recent[recent.length - 1] - recent[0]) / (recent.length - 1) : 0;
  const last = values[values.length - 1] ?? 60;
  const forecast = Array.from({ length: months }, (_, index) => {
    const uncertainty = index * 1.8;
    return round2(clamp(last + slope * (index + 1) + uncertainty));
  });
  return { actual: values, forecast };
}
