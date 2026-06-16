import { enterprises, regions } from "../mock/data";

export interface MatchInput {
  mode: "regionToEnterprise" | "enterpriseToRegion";
  targetIndustry: string;
  investmentScale: number;
  talentNeed: number;
  landNeed: number;
  policyPreference: number;
  costPreference: number;
  riskTolerance: number;
}

export interface MatchResultItem {
  id: string;
  name: string;
  matchScore: number;
  heatScore: number;
  policyMatch: number;
  chainMatch: number;
  talentMatch: number;
  costMatch: number;
  strengths: string[];
  weaknesses: string[];
  reason: string;
  nextAction: string;
}

export function calculateMatches(input: MatchInput): MatchResultItem[] {
  if (input.mode === "regionToEnterprise") {
    return enterprises
      .filter((item) => !input.targetIndustry || item.industry === input.targetIndustry)
      .slice(0, 8)
      .map((item, index) => ({
        id: item.id,
        name: item.name,
        matchScore: Math.min(96, Math.round(item.heatScore * 0.35 + item.policyMatch * 0.3 + item.investmentActivity * 0.25 + input.riskTolerance * 0.1)),
        heatScore: item.heatScore,
        policyMatch: item.policyMatch,
        chainMatch: 70 + ((index * 7) % 24),
        talentMatch: 68 + ((index * 6) % 25),
        costMatch: 62 + ((index * 5) % 30),
        strengths: ["产业方向匹配", "政策承接度较高", "具备招商跟进基础"],
        weaknesses: item.riskLevel === "高" ? ["需补充企业信用尽调"] : ["需核实真实投资计划"],
        reason: `${item.name} 与 ${input.targetIndustry || item.industry} 方向匹配，热度与政策匹配度处于可跟进区间。`,
        nextAction: "建议纳入重点线索池，安排一轮需求访谈。"
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  return regions.slice(0, 8).map((item) => ({
    id: item.id,
    name: item.name,
    matchScore: Math.min(96, Math.round(item.policyEnvironment * 0.25 + item.talentResource * 0.2 + item.industrialSupport * 0.25 + item.cost * 0.15 + input.policyPreference * 0.15)),
    heatScore: item.heatScore,
    policyMatch: item.policyEnvironment,
    chainMatch: item.industrialSupport,
    talentMatch: item.talentResource,
    costMatch: item.cost,
    strengths: item.keyIndustries.slice(0, 2),
    weaknesses: item.risk > 38 ? ["风险指标偏高"] : ["需细化项目用地条件"],
    reason: `${item.name} 在政策、人才与产业配套方面具备承接条件，适合开展落地区域比选。`,
    nextAction: "建议形成项目选址比选表，并同步政策预审。"
  })).sort((a, b) => b.matchScore - a.matchScore);
}
