import { FC, ReactNode } from "react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { shadows } from "../tokens/shadows";

export interface MobileContainerProps {
  children: ReactNode;
  className?: string;
}

export const MobileContainer: FC<MobileContainerProps> = ({ children, className = "" }) => (
  <div
    className={`max-w-[420px] min-h-screen mx-auto bg-[${colors.black}] rounded-[${radius.lg}] shadow-[${shadows.card}] flex flex-col relative ${className}`}
    style={{ boxShadow: shadows.card }}
  >
    {children}
  </div>
);
