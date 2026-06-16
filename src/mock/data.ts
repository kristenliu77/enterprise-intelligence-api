import type {
  DataSourceItem,
  Enterprise,
  HeatRawMetrics,
  Industry,
  InvestmentProject,
  Lead,
  LeadStage,
  Opportunity,
  Policy,
  Region
} from "../types";

const baseMetrics = (seed: number): HeatRawMetrics => ({
  searchIndex: 4200 + seed * 520,
  searchGrowthRate: 8 + seed * 1.7,
  exposure: 68000 + seed * 9300,
  keywordCount: 35 + seed * 4,
  likes: 3200 + seed * 600,
  comments: 780 + seed * 130,
  shares: 560 + seed * 95,
  newsCount: 45 + seed * 7,
  interactionRate: 42 + seed * 3,
  positiveSentiment: Math.min(0.92, 0.58 + seed * 0.035),
  investmentAmount: 28 + seed * 7,
  projectCount: 18 + seed * 3,
  newEnterpriseCount: 120 + seed * 18,
  financingEvents: 4 + seed,
  investmentGrowthRate: 5 + seed * 2.2,
  chainActivity: 52 + seed * 4,
  policyTextMatch: Math.min(0.95, 0.52 + seed * 0.04),
  taxBenefit: 45 + seed * 4,
  subsidyAmount: 1600 + seed * 320,
  costAdvantage: 48 + seed * 3,
  approvalConvenience: 55 + seed * 4,
  policyStability: 62 + seed * 3,
  infrastructure: 58 + seed * 3,
  talentSupply: 52 + seed * 4,
  logistics: 56 + seed * 2,
  industrialSupport: 50 + seed * 4,
  researchResource: 46 + seed * 4,
  marketSize: 55 + seed * 5,
  policyRisk: 26 + seed,
  marketRisk: 32 + seed,
  creditRisk: 22 + seed,
  overheatRisk: 30 + seed,
  dataUncertainty: 18 + seed,
  dataCompleteness: Math.min(0.96, 0.72 + seed * 0.02),
  sourceCount: Math.min(8, 4 + seed),
  updatedDaysAgo: Math.max(1, 8 - seed),
  growthRate: 6 + seed * 2
});

export const industries: Industry[] = [
  ["ai", "人工智能", "成长期", 91, 4200, 88, 620, 78, 86, 82, "中"],
  ["nev", "新能源汽车", "成熟扩张期", 88, 5100, 92, 760, 84, 83, 76, "中"],
  ["ic", "集成电路", "攻坚期", 86, 3800, 81, 410, 69, 90, 79, "高"],
  ["bio", "生物医药", "成长期", 82, 3300, 76, 390, 72, 84, 73, "中"],
  ["low", "低空经济", "导入期", 79, 2100, 74, 170, 48, 80, 66, "高"],
  ["equip", "智能制造", "成熟期", 76, 2900, 67, 540, 82, 74, 70, "中"],
  ["material", "新材料", "成长期", 74, 2600, 64, 360, 70, 78, 68, "中"],
  ["culture", "数字文创", "成长期", 68, 1800, 58, 520, 61, 62, 72, "低"]
].map(([id, name, lifecycle, heatScore, marketSize, investmentActivity, enterpriseCount, chainCompleteness, policySupport, talentSupply, risk], index) => ({
  id: String(id),
  name: String(name),
  lifecycle: String(lifecycle),
  heatScore: Number(heatScore),
  marketSize: Number(marketSize),
  investmentActivity: Number(investmentActivity),
  enterpriseCount: Number(enterpriseCount),
  chainCompleteness: Number(chainCompleteness),
  policySupport: Number(policySupport),
  talentSupply: Number(talentSupply),
  risk: String(risk),
  regionFocus: ["光谷", "张江", "苏州工业园"].slice(0, 2 + (index % 2)),
  heatMetrics: baseMetrics(index + 1)
}));

export const regions: Region[] = [
  ["r1", "光谷", "湖北", 90, 92, 86, 88, 82, 87, 80, 83, 78, 31],
  ["r2", "张江", "上海", 88, 86, 90, 86, 80, 84, 58, 92, 74, 39],
  ["r3", "苏州工业园", "江苏", 84, 82, 78, 84, 88, 86, 70, 80, 81, 35],
  ["r4", "合肥高新区", "安徽", 78, 80, 76, 79, 75, 74, 84, 72, 70, 30],
  ["r5", "成都高新区", "四川", 75, 76, 80, 77, 74, 72, 82, 70, 68, 26],
  ["r6", "西安高新区", "陕西", 72, 73, 78, 76, 70, 71, 86, 66, 65, 28],
  ["r7", "深圳南山", "广东", 92, 84, 88, 87, 78, 86, 45, 95, 76, 42],
  ["r8", "南京江北新区", "江苏", 77, 79, 74, 76, 76, 75, 78, 71, 69, 29],
  ["r9", "杭州滨江", "浙江", 83, 80, 83, 81, 74, 79, 62, 86, 72, 34],
  ["r10", "重庆两江新区", "重庆", 70, 74, 69, 73, 82, 70, 88, 64, 67, 27],
  ["r11", "青岛高新区", "山东", 66, 70, 65, 72, 78, 68, 86, 61, 63, 24],
  ["r12", "厦门火炬高新区", "福建", 73, 75, 72, 75, 73, 72, 76, 69, 66, 25]
].map(([id, name, province, heatScore, policyEnvironment, talentResource, infrastructure, logistics, industrialSupport, cost, marketSize, attractionEfficiency, risk, enterpriseCount]) => ({
  id: String(id),
  name: String(name),
  province: String(province),
  heatScore: Number(heatScore),
  policyEnvironment: Number(policyEnvironment),
  talentResource: Number(talentResource),
  infrastructure: Number(infrastructure),
  logistics: Number(logistics),
  industrialSupport: Number(industrialSupport),
  cost: Number(cost),
  marketSize: Number(marketSize),
  attractionEfficiency: Number(attractionEfficiency),
  risk: Number(risk),
  enterpriseCount: Number(enterpriseCount),
  keyIndustries: industries.slice(0, 3).map((item) => item.name)
}));

const enterpriseNames = [
  "华工激光", "长江存储", "高德红外", "明德生物", "斗鱼科技", "小米汽车华中基地",
  "联影医疗", "烽火通信", "华星光电", "亿咖通科技", "蔚来能源", "极目智能",
  "禾元生物", "芯动科技", "路特斯科技", "天马微电子", "光迅科技", "精测电子",
  "海康机器人", "中创新航", "宁德时代华中中心", "商汤科技", "云从科技", "科大讯飞",
  "比亚迪电子", "迈瑞医疗", "三安光电", "寒武纪", "华大智造", "金山办公"
];

export const enterprises: Enterprise[] = enterpriseNames.map((name, index) => {
  const industry = industries[index % industries.length].name;
  const region = regions[index % regions.length].name;
  const heatScore = 62 + ((index * 7) % 36);
  return {
    id: `e${index + 1}`,
    name,
    industry,
    region,
    scale: ["规上企业", "专精特新", "上市公司", "高新技术企业"][index % 4],
    financingStage: ["未融资", "A轮", "B轮", "战略融资", "已上市"][index % 5],
    heatScore,
    policyMatch: 58 + ((index * 9) % 38),
    investmentActivity: 54 + ((index * 11) % 42),
    riskLevel: ["低", "中", "中", "高"][index % 4],
    leadStatus: ["待评估", "初步接触", "需求确认", "方案洽谈", "实地考察"][index % 5],
    updatedAt: `2026-06-${String(1 + (index % 14)).padStart(2, "0")}`
  };
});

export const projects: InvestmentProject[] = Array.from({ length: 20 }, (_, index) => {
  const industry = industries[index % industries.length].name;
  const region = regions[(index + 2) % regions.length].name;
  return {
    id: `p${index + 1}`,
    name: `${region}${industry}招商项目${index + 1}`,
    industry,
    targetRegion: region,
    expectedInvestment: 8000 + index * 2300,
    landRequirement: 20 + (index % 7) * 8,
    stage: ["线索储备", "方案论证", "企业对接", "签约推进", "落地服务"][index % 5],
    heatScore: 60 + ((index * 6) % 39),
    feasibilityScore: 58 + ((index * 8) % 40),
    owner: ["张敏", "陈伟", "李婷", "王磊"][index % 4],
    updatedAt: `2026-06-${String(2 + (index % 12)).padStart(2, "0")}`
  };
});

export const policies: Policy[] = Array.from({ length: 15 }, (_, index) => ({
  id: `pol${index + 1}`,
  name: `${regions[index % regions.length].name}${industries[index % industries.length].name}专项扶持政策`,
  agency: ["省发改委", "高新区管委会", "经信局", "科技局"][index % 4],
  region: regions[index % regions.length].name,
  industries: [industries[index % industries.length].name, industries[(index + 1) % industries.length].name],
  type: ["固投", "研发", "租金", "人才", "融资"][index % 5],
  publishedAt: `2026-0${1 + (index % 6)}-10`,
  status: (["有效", "有效", "即将到期"] as Policy["status"][])[index % 3],
  matchedEnterpriseCount: 12 + index * 3,
  summary: "面向重点产业项目提供分阶段奖补，需结合项目投资强度、研发投入和落地进度综合申报。"
}));

export const leads: Lead[] = Array.from({ length: 30 }, (_, index) => ({
  id: `l${index + 1}`,
  title: `${enterprises[index % enterprises.length].name}招商跟进`,
  enterpriseName: enterprises[index % enterprises.length].name,
  industry: enterprises[index % enterprises.length].industry,
  region: enterprises[index % enterprises.length].region,
  stage: (["待评估", "初步接触", "需求确认", "方案洽谈", "实地考察", "签约推进", "已落地", "暂缓"] as LeadStage[])[index % 8],
  priority: (["高", "中", "低"] as Lead["priority"][])[index % 3],
  owner: ["张敏", "陈伟", "李婷", "王磊"][index % 4],
  followDate: `2026-06-${String(15 + (index % 10)).padStart(2, "0")}`,
  updatedAt: `2026-06-${String(1 + (index % 14)).padStart(2, "0")}`
}));

export const opportunities: Opportunity[] = [
  ["o1", "光谷新能源汽车零部件产业链补强", "光谷", "新能源汽车", 88, 91, 84, "整车与电池企业带动配套需求，政策侧具备固投和研发支持。", "需关注产能重复建设和供应链价格波动。"],
  ["o2", "合肥低空经济测试验证基地", "合肥高新区", "低空经济", 81, 86, 76, "区域制造基础较强，适合布局飞控、传感器和低空运营平台。", "行业监管政策仍在完善。"],
  ["o3", "张江生物医药研发转化项目", "张江", "生物医药", 86, 82, 88, "研发资源与资本活跃度高，适合高端研发和临床转化。", "成本较高，落地需评估长期运营压力。"],
  ["o4", "苏州工业园智能装备制造集群", "苏州工业园", "智能制造", 79, 78, 72, "供应链完整度高，适合引入关键零部件和系统集成项目。", "需避免低附加值项目同质化。"],
  ["o5", "光谷人工智能算力服务平台", "光谷", "人工智能", 92, 89, 83, "算力需求和应用场景同步增长，适合平台招商与生态运营。", "需关注能耗指标和数据合规。"]
].map(([id, title, region, industry, heat, policyMatch, investmentActivity, reason, risk]) => ({
  id: String(id),
  title: String(title),
  region: String(region),
  industry: String(industry),
  heat: Number(heat),
  policyMatch: Number(policyMatch),
  investmentActivity: Number(investmentActivity),
  reason: String(reason),
  risk: String(risk)
}));

export const trendMonths = Array.from({ length: 12 }, (_, index) => `2025-${String(index + 7).padStart(2, "0")}`);

export const heatTrends = industries.slice(0, 5).map((industry, industryIndex) => ({
  name: industry.name,
  values: trendMonths.map((_, monthIndex) => Math.round(industry.heatScore - 12 + monthIndex * 1.5 + industryIndex * 1.2))
}));

export const dataSources: DataSourceItem[] = [
  "公开统计数据", "企业工商数据", "投融资数据", "搜索趋势数据", "新闻媒体数据", "政策文件数据", "园区内部数据", "人工上传数据"
].map((name, index) => ({
  id: `ds${index + 1}`,
  name,
  status: ["正常", "正常", "延迟", "正常", "正常", "正常", "异常", "正常"][index] as DataSourceItem["status"],
  lastSyncAt: `2026-06-15 0${index}:30`,
  recordCount: 12000 + index * 4300,
  quality: 72 + ((index * 5) % 24),
  frequency: ["每日", "每周", "每小时", "每日"][index % 4],
  owner: ["数据中台", "招商专班", "产业研究组"][index % 3]
}));

export const roleExamples = ["系统管理员", "招商主管", "招商专员", "数据分析员", "只读访客"];
