import { Skeleton } from "antd";

export default function LoadingState(): JSX.Element {
  return <Skeleton active paragraph={{ rows: 4 }} />;
}
