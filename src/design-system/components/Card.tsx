import { FC, ReactNode } from "react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { shadows } from "../tokens/shadows";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: FC<CardProps> = ({ children, className = "" }) => (
  <div
    className={`bg-[${colors.brown}] rounded-[${radius.lg}] shadow-[${shadows.card}] p-6 ${className}`}
  >
    {children}
  </div>
);
