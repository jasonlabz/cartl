import { Popconfirm } from 'antd';
import type { PopconfirmProps } from 'antd';
import type { ReactElement } from 'react';

export interface ConfirmActionProps extends Omit<PopconfirmProps, 'children'> {
  children: ReactElement;
}

export function ConfirmAction({
  cancelText = '取消',
  children,
  okText = '确认',
  title = '确认执行此操作？',
  ...props
}: ConfirmActionProps) {
  return (
    <Popconfirm cancelText={cancelText} okText={okText} title={title} {...props}>
      {children}
    </Popconfirm>
  );
}
