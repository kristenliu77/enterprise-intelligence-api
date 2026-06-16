import dayjs from "dayjs";
import {
  dataSources,
  enterprises,
  heatTrends,
  industries,
  leads,
  opportunities,
  policies,
  projects,
  regions
} from "../mock/data";
import type { DataSourceItem, Enterprise, Industry, InvestmentProject, Lead, Opportunity, Policy, Region } from "../types";

const delay = async (ms = 260): Promise<void> => {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
};

export interface DashboardFilters {
  region?: string;
  industry?: string;
  timeRange?: string;
  dataScope?: string;
}

export async function getDashboardData(filters: DashboardFilters) {
  await delay();
  const filteredEnterprises = enterprises.filter((item) => {
    const regionMatch = !filters.region || filters.region === "全部区域" || item.region === filters.region;
    const industryMatch = !filters.industry || filters.industry === "全部行业" || item.industry === filters.industry;
    return regionMatch && industryMatch;
  });
  const filteredProjects = projects.filter((item) => !filters.industry || filters.industry === "全部行业" || item.industry === filters.industry);

  return {
    metrics: {
      heatIndex: Math.round(filteredEnterprises.reduce((sum, item) => sum + item.heatScore, 0) / Math.max(1, filteredEnterprises.length)),
      potentialIndustries: industries.filter((item) => item.heatScore >= 75).length,
      potentialEnterprises: filteredEnterprises.filter((item) => item.heatScore >= 75).length,
      newLeads: leads.filter((item) => dayjs(item.updatedAt).isAfter(dayjs("2026-06-05"))).length,
      policyAverage: Math.round(filteredEnterprises.reduce((sum, item) => sum + item.policyMatch, 0) / Math.max(1, filteredEnterprises.length)),
      investmentScale: Math.round(filteredProjects.reduce((sum, item) => sum + item.expectedInvestment, 0) / 10000)
    },
    enterprises: filteredEnterprises,
    projects: filteredProjects,
    regions,
    industries,
    opportunities,
    heatTrends
  };
}

export async function searchEnterprises(keyword: string, industry?: string, region?: string): Promise<Enterprise[]> {
  await delay(180);
  return enterprises.filter((item) => {
    const keywordMatch = !keyword || item.name.includes(keyword);
    const industryMatch = !industry || industry === "全部行业" || item.industry === industry;
    const regionMatch = !region || region === "全部区域" || item.region === region;
    return keywordMatch && industryMatch && regionMatch;
  });
}

export async function searchProjects(keyword: string, industry?: string): Promise<InvestmentProject[]> {
  await delay(180);
  return projects.filter((item) => {
    const keywordMatch = !keyword || item.name.includes(keyword);
    const industryMatch = !industry || industry === "全部行业" || item.industry === industry;
    return keywordMatch && industryMatch;
  });
}

export async function getPolicies(): Promise<Policy[]> {
  await delay(180);
  return policies;
}

export async function getLeads(): Promise<Lead[]> {
  await delay(180);
  return leads;
}

export async function getDataSources(): Promise<DataSourceItem[]> {
  await delay(180);
  return dataSources;
}

export function getIndustryById(id: string): Industry | undefined {
  return industries.find((item) => item.id === id);
}

export function getRegionById(id: string): Region | undefined {
  return regions.find((item) => item.id === id);
}

export function getOpportunities(): Opportunity[] {
  return opportunities;
}
