import { FC, ReactNode } from "react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { shadows } from "../tokens/shadows";

export interface NetworkCardProps {
  avatar?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const NetworkCard: FC<NetworkCardProps> = ({ avatar, title, subtitle, action, className = "" }) => (
  <div className={`flex items-center gap-4 p-4 rounded-[${radius.md}] bg-[${colors.brown}] shadow-[${shadows.card}] ${className}`}>
    {avatar && <div>{avatar}</div>}
    <div className="flex-1 min-w-0">
      <div className={`text-[${colors.orange}] font-semibold truncate`}>{title}</div>
      {subtitle && <div className={`text-[${colors.gray[200]}] text-xs truncate`}>{subtitle}</div>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
