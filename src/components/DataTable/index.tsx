import { Empty, Table } from 'antd';
import type { TableProps } from 'antd';

export type DataTableProps<RecordType extends object> = TableProps<RecordType>;

export function DataTable<RecordType extends object>({
  locale,
  pagination,
  scroll,
  size = 'middle',
  ...props
}: DataTableProps<RecordType>) {
  return (
    <Table
      {...props}
      locale={{ emptyText: <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />, ...locale }}
      pagination={
        pagination === false
          ? false
          : {
              showQuickJumper: true,
              showSizeChanger: true,
              showTotal: (total) => `共${total}条`,
              ...pagination
            }
      }
      scroll={{ x: 'max-content', scrollToFirstRowOnChange: true, ...scroll }}
      size={size}
    />
  );
}
