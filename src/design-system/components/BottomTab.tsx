import { FC, ReactNode } from 'react';

export interface BottomTabProps {
  items: Array<{
    label: string;
    icon?: ReactNode;
    active?: boolean;
    onClick?: () => void;
  }>;
  className?: string;
}

export const BottomTab: FC<BottomTabProps> = ({ items, className = '' }) => (
  <nav className={`fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-[#2E1A08] bg-[#0D0700] py-2 ${className}`}>
    {items.map((item) => (
      <button
        key={item.label}
        className={`flex flex-col items-center px-2 py-1 text-xs font-semibold transition-colors focus:outline-none ${
          item.active ? 'text-[#F28C28]' : 'text-[#9A7D5A] hover:text-[#F5ECD8]/70'
        }`}
        onClick={item.onClick}
        aria-current={item.active ? 'page' : undefined}
      >
        {item.icon && <span className="mb-0.5 text-lg leading-none">{item.icon}</span>}
        <span>{item.label}</span>
      </button>
    ))}
  </nav>
);
