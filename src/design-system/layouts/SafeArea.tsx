import { FC, ReactNode } from "react";

export interface SafeAreaProps {
  children: ReactNode;
  className?: string;
}

export const SafeArea: FC<SafeAreaProps> = ({ children, className = "" }) => (
  <div className={`pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${className}`}>{children}</div>
);
