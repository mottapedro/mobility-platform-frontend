import { FC, ReactNode } from 'react';

export interface GradientCardProps {
  children: ReactNode;
  className?: string;
}

export const GradientCard: FC<GradientCardProps> = ({ children, className = '' }) => (
  <div
    className={[
      'rounded-[20px]',
      'border border-[#F28C28]/20',
      'bg-gradient-to-br from-[#F28C28]/10 via-[#1A0E04] to-[#0D0700]',
      'shadow-[0_0_32px_rgba(242,140,40,0.12)]',
      className,
    ].filter(Boolean).join(' ')}
  >
    {children}
  </div>
);
