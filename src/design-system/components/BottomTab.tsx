import { FC, ReactNode } from "react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { shadows } from "../tokens/shadows";

export interface BottomTabProps {
  items: Array<{
    label: string;
    icon?: ReactNode;
    active?: boolean;
    onClick?: () => void;
  }>;
  className?: string;
}

export const BottomTab: FC<BottomTabProps> = ({ items, className = "" }) => (
  <nav className={`fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-[${colors.brown}] py-2 shadow-[${shadows.card}] rounded-t-[${radius.lg}] ${className}`}>
    {items.map((item, idx) => (
      <button
        key={item.label}
        className={`flex flex-col items-center px-2 py-1 focus:outline-none ${item.active ? `text-[${colors.orange}]` : `text-[${colors.gray[300]}]`}`}
        onClick={item.onClick}
        aria-current={item.active ? "page" : undefined}
      >
        {item.icon && <span className="mb-1">{item.icon}</span>}
        <span className="text-xs font-medium">{item.label}</span>
      </button>
    ))}
  </nav>
);
