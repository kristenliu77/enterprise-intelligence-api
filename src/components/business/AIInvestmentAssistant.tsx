import { ClearOutlined, MessageOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Drawer, Input, Space, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productConfig } from "../../config";
import { enterprises, industries, opportunities, regions } from "../../mock/data";

interface AssistantMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  link?: string;
}

const examples = [
  "新能源汽车产业在华东地区的热度如何？",
  "哪些区域适合布局低空经济？",
  "帮我对比人工智能和生物医药的招商价值。",
  "找出政策匹配度大于85分的企业。",
  "生成某项目的招商分析摘要。"
];

function buildAnswer(question: string): AssistantMessage {
  const normalized = question.trim();
  const topIndustry = [...industries].sort((a, b) => b.heatScore - a.heatScore)[0];
  const topRegion = [...regions].sort((a, b) => b.heatScore - a.heatScore)[0];
  const highPolicy = enterprises.filter((item) => item.policyMatch >= 85).slice(0, 5);

  if (normalized.includes("低空")) {
    const regionsText = regions
      .filter((item) => item.keyIndustries.includes("人工智能") || item.heatScore > 78)
      .slice(0, 3)
      .map((item) => `${item.name}(${item.heatScore}分)`)
      .join("、");
    return {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      role: "assistant",
      content: `演示数据看，低空经济更适合优先评估 ${regionsText}。建议重点核验测试空域、制造配套、监管协同和运营场景成熟度。`,
      link: "/matching"
    };
  }

  if (normalized.includes("对比") || normalized.includes("人工智能") || normalized.includes("生物医药")) {
    const ai = industries.find((item) => item.name === "人工智能");
    const bio = industries.find((item) => item.name === "生物医药");
    return {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      role: "assistant",
      content: `人工智能综合热度约 ${ai?.heatScore ?? 0} 分，优势在搜索关注、算力服务和应用场景；生物医药约 ${bio?.heatScore ?? 0} 分，优势在研发转化和政策延续性。若目标是短期招商线索，建议人工智能优先；若目标是长期产业壁垒，建议生物医药同步培育。`,
      link: "/heat-calculation"
    };
  }

  if (normalized.includes("85") || normalized.includes("政策")) {
    return {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      role: "assistant",
      content: `政策匹配度大于85分的重点企业包括：${highPolicy.map((item) => `${item.name}(${item.policyMatch}分)`).join("、")}。建议进入企业项目库按行业和区域继续筛选。`,
      link: "/entities"
    };
  }

  if (normalized.includes("报告") || normalized.includes("摘要")) {
    const opportunity = opportunities[0];
    return {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      role: "assistant",
      content: `${opportunity.title}：综合热度 ${opportunity.heat} 分，政策匹配 ${opportunity.policyMatch} 分，主要机会来自产业链补强与研发奖补叠加；主要风险是供应链价格波动。可在报告中心生成打印版分析摘要。`,
      link: "/policies-reports"
    };
  }

  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    role: "assistant",
    content: `当前演示数据中，${topIndustry.name} 和 ${topRegion.name} 是热度较高的研判对象。建议从热度计算、政策匹配、产业链缺口和企业跟进状态四个维度继续拆解。`,
    link: "/dashboard"
  };
}

export default function AIInvestmentAssistant(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `我是招商智问。${productConfig.demoNotice}`
    }
  ]);

  const quickExamples = useMemo(() => examples.slice(0, 3), []);

  const send = (text: string): void => {
    if (!text.trim()) return;
    const userMessage: AssistantMessage = { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, role: "user", content: text.trim() };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, buildAnswer(text)]);
      setLoading(false);
    }, 420);
  };

  return (
    <>
      <Button className="assistant-fab no-print" type="primary" size="large" icon={<MessageOutlined />} onClick={() => setOpen(true)}>
        招商智问
      </Button>
      <Drawer
        className="assistant-panel no-print"
        title="招商智问"
        placement="right"
        width={420}
        open={open}
        onClose={() => setOpen(false)}
        extra={<Button icon={<ClearOutlined />} onClick={() => setMessages(messages.slice(0, 1))}>清空</Button>}
      >
        <div className="assistant-messages">
          <Tag color="blue">当前为演示模式</Tag>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            分析结果基于模拟数据，不能替代尽职调查。
          </Typography.Paragraph>
          <Space wrap style={{ marginBottom: 12 }}>
            {quickExamples.map((item) => (
              <Button key={item} size="small" onClick={() => send(item)}>
                {item}
              </Button>
            ))}
          </Space>
          {messages.map((message) => (
            <div key={message.id} className={`assistant-message ${message.role === "user" ? "user" : ""}`}>
              <Typography.Text>{message.content}</Typography.Text>
              {message.link ? (
                <div style={{ marginTop: 8 }}>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      navigate(message.link ?? "/dashboard");
                      setOpen(false);
                    }}
                  >
                    跳转相关页面
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
          {loading ? <div className="assistant-message">正在基于当前演示数据生成回答...</div> : null}
        </div>
        <div className="assistant-input">
          <Input.Search
            value={input}
            placeholder="输入招商研判问题"
            enterButton={<SendOutlined />}
            onChange={(event) => setInput(event.target.value)}
            onSearch={send}
          />
        </div>
      </Drawer>
    </>
  );
}
