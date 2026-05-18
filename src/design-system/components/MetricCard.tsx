import { FC, ReactNode } from "react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { shadows } from "../tokens/shadows";

export interface MetricCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

export const MetricCard: FC<MetricCardProps> = ({ icon, label, value, className = "" }) => (
  <div className={`flex flex-col items-center justify-center p-4 rounded-[${radius.md}] bg-[${colors.brown}] shadow-[${shadows.card}] ${className}`}>
    {icon && <div className="mb-2">{icon}</div>}
    <span className={`text-[${colors.orange}] text-lg font-bold`}>{value}</span>
    <span className={`text-[${colors.gray[200]}] text-xs mt-1`}>{label}</span>
  </div>
);
