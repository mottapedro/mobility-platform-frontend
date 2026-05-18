import { FC, ReactNode } from "react";
import { colors } from "../tokens/colors";
import { typography } from "../tokens/typography";

export interface SectionTitleProps {
  children: ReactNode;
  className?: string;
}

export const SectionTitle: FC<SectionTitleProps> = ({ children, className = "" }) => (
  <h2 className={`text-[${colors.orange}] text-xl font-bold mb-4 ${className}`}>{children}</h2>
);
