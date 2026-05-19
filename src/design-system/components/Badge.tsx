import { FC, ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'orange' | 'success' | 'danger' | 'muted';
  className?: string;
}

export const Badge: FC<BadgeProps> = ({ children, variant = 'orange', className = '' }) => {
  const variants = {
    orange:  'bg-[#F28C28]/15 text-[#F28C28] border border-[#F28C28]/30',
    success: 'bg-[#3DB87A]/12 text-[#3DB87A] border border-[#3DB87A]/30',
    danger:  'bg-[#E05050]/12 text-[#E05050] border border-[#E05050]/30',
    muted:   'bg-[#2E1A08] text-[#9A7D5A] border border-[#2E1A08]',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
