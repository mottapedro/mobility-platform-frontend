import { FC, ReactNode } from 'react';

export interface MetricCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  className?: string;
}

export const MetricCard: FC<MetricCardProps> = ({
  icon,
  label,
  value,
  sub,
  highlight = false,
  className = '',
}) => (
  <div
    className={[
      'flex flex-col gap-1 rounded-[16px] border p-4',
      highlight
        ? 'border-[#F28C28]/25 bg-[#1A0E04] shadow-[0_0_24px_rgba(242,140,40,0.12)]'
        : 'border-[#2E1A08] bg-[#1A0E04]',
      className,
    ].join(' ')}
  >
    {icon && <div className="mb-1 text-xl">{icon}</div>}
    <span className={`text-2xl font-black ${highlight ? 'text-[#F28C28]' : 'text-[#F5ECD8]'}`}>
      {value}
    </span>
    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9A7D5A]">{label}</span>
    {sub && <span className="text-xs text-[#5A3F22]">{sub}</span>}
  </div>
);
