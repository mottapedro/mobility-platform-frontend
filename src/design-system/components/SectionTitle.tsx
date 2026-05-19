import { FC, ReactNode } from 'react';

export interface SectionTitleProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export const SectionTitle: FC<SectionTitleProps> = ({ children, className = '', accent = false }) => (
  <h2
    className={[
      'text-xl font-black tracking-[0.04em]',
      accent ? 'text-[#F28C28]' : 'text-[#F5ECD8]',
      className,
    ].filter(Boolean).join(' ')}
  >
    {children}
  </h2>
);
