import { FC, ReactNode } from "react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { shadows } from "../tokens/shadows";

export interface GradientCardProps {
  children: ReactNode;
  className?: string;
}

export const GradientCard: FC<GradientCardProps> = ({ children, className = "" }) => (
  <div
    className={`p-6 rounded-[${radius.lg}] shadow-[${shadows.card}] bg-gradient-to-br from-[${colors.orangeGlow}] via-[${colors.brown}] to-[${colors.black}] ${className}`}
  >
    {children}
  </div>
);
