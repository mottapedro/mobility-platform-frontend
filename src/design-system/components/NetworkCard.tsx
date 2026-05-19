import { FC, ReactNode } from 'react';

export interface NetworkCardProps {
  avatar?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const NetworkCard: FC<NetworkCardProps> = ({
  avatar,
  title,
  subtitle,
  action,
  className = '',
}) => (
  <div className={`flex items-center gap-4 rounded-[16px] border border-[#2E1A08] bg-[#1A0E04] p-4 ${className}`}>
    {avatar && <div className="shrink-0">{avatar}</div>}
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-[#F5ECD8] truncate">{title}</div>
      {subtitle && <div className="text-xs text-[#9A7D5A] truncate">{subtitle}</div>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
