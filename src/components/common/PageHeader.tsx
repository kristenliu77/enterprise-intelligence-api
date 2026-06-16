import { Breadcrumb, Space, Tag, Typography } from "antd";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: string[];
  tags?: string[];
}

export default function PageHeader({ title, description, breadcrumb = ["首页"], tags = [] }: PageHeaderProps): JSX.Element {
  return (
    <div className="page-header">
      <Breadcrumb items={[...breadcrumb, title].map((item) => ({ title: item }))} />
      <Space direction="vertical" size={4}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
        {tags.length > 0 ? (
          <Space wrap>
            {tags.map((tag) => (
              <Tag key={tag} color="blue">
                {tag}
              </Tag>
            ))}
          </Space>
        ) : null}
      </Space>
    </div>
  );
}
