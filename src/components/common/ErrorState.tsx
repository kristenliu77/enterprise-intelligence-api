import { Alert } from "antd";

interface ErrorStateProps {
  message: string;
}

export default function ErrorState({ message }: ErrorStateProps): JSX.Element {
  return <Alert type="error" showIcon message="数据加载失败" description={message} />;
}
