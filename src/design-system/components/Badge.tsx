import { FC, ReactNode } from "react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";

export interface BadgeProps {
  children: ReactNode;
  color?: "orange" | "brown" | "gray";
  className?: string;
}

export const Badge: FC<BadgeProps> = ({ children, color = "orange", className = "" }) => {
  const colorMap = {
    orange: `bg-[${colors.orange}] text-[${colors.white}]`,
    brown: `bg-[${colors.brown}] text-[${colors.orange}]`,
    gray: `bg-[${colors.gray[500]}] text-[${colors.white}]`,
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-[${radius.full}] text-xs font-semibold ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
};
