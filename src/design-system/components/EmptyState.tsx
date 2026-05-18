import { FC, ReactNode } from "react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { shadows } from "../tokens/shadows";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({ icon, title, description, action, className = "" }) => (
  <div className={`flex flex-col items-center justify-center text-center p-8 rounded-[${radius.lg}] bg-[${colors.brown}] shadow-[${shadows.card}] ${className}`}>
    {icon && <div className="mb-4">{icon}</div>}
    <h3 className={`text-[${colors.orange}] text-lg font-bold mb-2`}>{title}</h3>
    {description && <p className="text-[${colors.gray[200]}] mb-4 text-sm">{description}</p>}
    {action}
  </div>
);
