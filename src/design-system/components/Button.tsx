import { FC, ButtonHTMLAttributes } from "react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { shadows } from "../tokens/shadows";
import { typography } from "../tokens/typography";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  fullWidth?: boolean;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const base = `
    font-semibold
    rounded-[${radius.md}]
    px-6 py-3
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    transition
    duration-150
    ease-in-out
    shadow-[${shadows.glow}]
    text-base
    ${fullWidth ? "w-full" : "w-auto"}
  `;
  const variants = {
    primary: `bg-[${colors.orange}] text-[${colors.white}] hover:bg-orange-500 focus:ring-[${colors.orange}]`,
    secondary: `bg-[${colors.brown}] text-[${colors.orange}] border border-[${colors.orange}] hover:bg-orange-950`,
    ghost: `bg-transparent text-[${colors.orange}] hover:bg-orange-900`,
  };
  const sizes = {
    md: "text-base py-3 px-6",
    lg: "text-lg py-4 px-8",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
