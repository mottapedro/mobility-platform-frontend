import { FC, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const base = [
    'inline-flex items-center justify-center',
    'font-bold tracking-[0.03em]',
    'rounded-[14px]',
    'transition-all duration-150',
    'focus:outline-none',
    'active:scale-[0.97]',
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
  ].filter(Boolean).join(' ');

  const variants = {
    primary: [
      'bg-gradient-to-br from-[#F28C28] to-[#C96E10]',
      'text-white',
      'shadow-[0_4px_24px_rgba(242,140,40,0.28)]',
      'hover:shadow-[0_6px_32px_rgba(242,140,40,0.36)]',
      'hover:opacity-90',
    ].join(' '),
    secondary: [
      'bg-transparent',
      'border border-[#F28C28]/50',
      'text-[#F28C28]',
      'hover:bg-[#F28C28]/10',
      'hover:border-[#F28C28]/80',
    ].join(' '),
    ghost: [
      'bg-transparent',
      'text-[#F28C28]',
      'hover:bg-[#F28C28]/10',
    ].join(' '),
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3.5 text-[15px]',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
