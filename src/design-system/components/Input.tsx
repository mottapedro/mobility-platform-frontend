import { FC, InputHTMLAttributes } from "react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { shadows } from "../tokens/shadows";
import { typography } from "../tokens/typography";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: FC<InputProps> = ({ label, error, className = "", ...props }) => (
  <label className="block w-full">
    {label && <span className="block mb-2 text-sm font-medium text-[${colors.gray[200]}]">{label}</span>}
    <input
      className={`w-full bg-[${colors.black}] border border-[${colors.gray[600]}] rounded-[${radius.md}] px-4 py-3 text-[${colors.white}] placeholder-[${colors.gray[400]}] shadow-[${shadows.input}] focus:outline-none focus:ring-2 focus:ring-[${colors.orange}] ${className}`}
      {...props}
    />
    {error && <span className="block mt-1 text-xs text-[${colors.error}]">{error}</span>}
  </label>
);
