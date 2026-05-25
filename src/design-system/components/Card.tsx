import { FC, ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: FC<CardProps> = ({ children, className = '', glow = false }) => (
  <div
    className={[
      'rounded-[20px]',
      'border border-[#2E1A08]',
      'bg-[#1A0E04]',
      glow ? 'shadow-[0_0_32px_rgba(242,140,40,0.14)]' : '',
      className,
    ].filter(Boolean).join(' ')}
  >
    {children}
  </div>
);
