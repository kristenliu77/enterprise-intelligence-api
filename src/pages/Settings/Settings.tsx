import { Alert, Card, Descriptions, List, Space, Switch, Tag, Typography } from "antd";
import PageHeader from "../../components/common/PageHeader";
import { productConfig } from "../../config";
import { roleExamples } from "../../mock/data";

export default function Settings(): JSX.Element {
  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <PageHeader title="系统设置" description="展示产品配置、角色权限预留、数据安全与合规表达。" tags={["权限预留", "合规说明", "产品配置"]} />
      <Alert type="info" showIcon message={productConfig.demoNotice} />
      <Card title="产品配置">
        <Descriptions column={1}>
          <Descriptions.Item label="平台名称">{productConfig.fullName}</Descriptions.Item>
          <Descriptions.Item label="英文副标题">{productConfig.englishName}</Descriptions.Item>
          <Descriptions.Item label="所属机构">{productConfig.organization}</Descriptions.Item>
          <Descriptions.Item label="数据更新时间">{productConfig.dataUpdatedAt}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="角色示例">
        <Space wrap>
          {roleExamples.map((role) => <Tag key={role} color="blue">{role}</Tag>)}
        </Space>
      </Card>
      <Card title="安全与合规设置">
        <List
          dataSource={[
            "当前系统为招商决策辅助工具，计算结果不能替代人工尽职调查。",
            "演示数据不代表真实政府统计结果。",
            "敏感数据需要进行脱敏处理。",
            "用户只能访问其权限范围内的数据。",
            "数据导出行为应记录日志。",
            "政策变化可能影响分析结论。"
          ]}
          renderItem={(item) => (
            <List.Item actions={[<Switch key="switch" defaultChecked />]}>
              <Typography.Text>{item}</Typography.Text>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
