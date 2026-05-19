import { FC, ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center rounded-[20px] border border-[#2E1A08] bg-[#1A0E04] p-8 text-center ${className}`}>
    {icon && <div className="mb-4 text-3xl">{icon}</div>}
    <h3 className="text-base font-bold text-[#F5ECD8] mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-[#9A7D5A] mb-4">{description}</p>
    )}
    {action}
  </div>
);
