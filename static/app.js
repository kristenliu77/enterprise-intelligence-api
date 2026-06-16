const state = {
  lastResult: null,
};

const colors = ["#0d7f68", "#3156a3", "#a75f00", "#7d3f98"];

function byId(id) {
  return document.getElementById(id);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `请求失败：${response.status}`);
  }
  return payload;
}

function formValues() {
  return {
    companyName: byId("companyName").value.trim(),
    investmentAmount: Number(byId("investmentAmount").value || 0),
  };
}

function showRaw(payload) {
  byId("rawOutput").textContent = JSON.stringify(payload, null, 2);
}

function setStatus(text) {
  byId("serviceStatus").textContent = text;
}

function renderHotness(payload) {
  const details = payload.details || {};
  byId("scoreValue").textContent = payload.score ?? "--";
  byId("hotnessDetails").innerHTML = [
    ["招聘活跃度", details.hiring_score],
    ["专利增长", details.patent_score],
    ["融资信号", details.funding_signal],
    ["新闻代理分", details.news_score],
    ["基准行业", details.industry],
  ]
    .map(([label, value]) => (
      `<div class="metric-item"><span class="metric-label">${label}</span><span class="metric-value">${value ?? "--"}</span></div>`
    ))
    .join("");
}

function renderChain(payload) {
  byId("chainName").textContent = payload.chain_name || "--";
  const actions = payload.suggested_actions || [];
  byId("chainDetails").innerHTML = `
    <p><strong>匹配节点：</strong>${payload.matched_node || "无"}</p>
    <p><strong>匹配度：</strong>${payload.match_score ?? 0}</p>
    <p><strong>建议：</strong>${actions.join("；") || "暂无建议"}</p>
  `;
}

function renderPolicies(payload) {
  byId("policyMax").textContent = `${payload.total_max ?? 0} 万`;
  const policies = payload.eligible_policies || [];
  if (!policies.length) {
    byId("policyDetails").innerHTML = "<p>暂无匹配政策。</p>";
    return;
  }
  byId("policyDetails").innerHTML = policies
    .map((policy) => (
      `<div class="policy-item"><span>${policy.name}</span><span class="policy-amount">${policy.amount_max} 万</span></div>`
    ))
    .join("");
}

function radarPoint(cx, cy, radius, index, total, value) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total;
  const scaled = radius * (value / 100);
  return [cx + Math.cos(angle) * scaled, cy + Math.sin(angle) * scaled];
}

function polygon(points) {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function renderRadar(payload) {
  const svg = byId("radarChart");
  const legend = byId("radarLegend");
  const indicators = payload.indicator || [];
  const series = payload.series || [];
  const cx = 180;
  const cy = 156;
  const radius = 112;
  const rings = [0.25, 0.5, 0.75, 1];

  const grid = rings
    .map((ring) => {
      const points = indicators.map((_, index) => radarPoint(cx, cy, radius * ring, index, indicators.length, 100));
      return `<polygon points="${polygon(points)}" fill="none" stroke="#dbe4e2" stroke-width="1" />`;
    })
    .join("");

  const axes = indicators
    .map((indicator, index) => {
      const [x, y] = radarPoint(cx, cy, radius, index, indicators.length, 100);
      const [tx, ty] = radarPoint(cx, cy, radius + 24, index, indicators.length, 100);
      return `
        <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#dbe4e2" />
        <text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" fill="#5f6f6d" font-size="12">${indicator.name}</text>
      `;
    })
    .join("");

  const shapes = series
    .map((item, itemIndex) => {
      const points = item.value.map((value, index) => radarPoint(cx, cy, radius, index, indicators.length, value));
      const color = colors[itemIndex % colors.length];
      return `<polygon points="${polygon(points)}" fill="${color}22" stroke="${color}" stroke-width="2" />`;
    })
    .join("");

  svg.innerHTML = `${grid}${axes}${shapes}`;
  legend.innerHTML = series
    .map((item, index) => (
      `<div class="legend-item"><span class="legend-swatch" style="background:${colors[index % colors.length]}"></span>${item.name}</div>`
    ))
    .join("");
}

function renderFullAnalysis(payload) {
  state.lastResult = payload;
  renderHotness(payload.hotness || {});
  renderChain(payload.chain_match || {});
  renderPolicies(payload.policy_package || {});
  showRaw(payload);
}

async function runFullAnalysis(event) {
  event.preventDefault();
  const values = formValues();
  setStatus("分析中");
  try {
    const payload = await requestJson("/full-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: values.companyName,
        investment_amount: values.investmentAmount,
      }),
    });
    setStatus("正常");
    renderFullAnalysis(payload);
  } catch (error) {
    setStatus("异常");
    byId("rawOutput").innerHTML = `<span class="error">${error.message}</span>`;
  }
}

async function loadHealth() {
  try {
    await requestJson("/health");
    setStatus("正常");
  } catch {
    setStatus("异常");
  }
}

async function loadRadar() {
  const payload = await requestJson("/radar");
  renderRadar(payload);
}

async function loadHotness() {
  const values = formValues();
  const payload = await requestJson("/hotness", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_name: values.companyName }),
  });
  renderHotness(payload);
  showRaw(payload);
}

async function loadMatch() {
  const payload = await requestJson("/match?industry=光电子&sub_sector=激光雷达");
  renderChain(payload);
  showRaw(payload);
}

async function loadPolicy() {
  const values = formValues();
  const payload = await requestJson("/policy-calc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_type: "制造业",
      investment_amount: values.investmentAmount,
    }),
  });
  renderPolicies(payload);
  showRaw(payload);
}

function bindEvents() {
  byId("analysisForm").addEventListener("submit", runFullAnalysis);
  byId("radarButton").addEventListener("click", loadRadar);
  byId("hotnessButton").addEventListener("click", loadHotness);
  byId("matchButton").addEventListener("click", loadMatch);
  byId("policyButton").addEventListener("click", loadPolicy);
  byId("clearButton").addEventListener("click", () => showRaw({}));
}

async function init() {
  bindEvents();
  await loadHealth();
  await loadRadar();
}

init();
