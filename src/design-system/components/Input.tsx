import { FC, InputHTMLAttributes, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9A7D5A]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full',
          'rounded-[12px]',
          'border border-[#2E1A08]',
          'bg-[#150B02]',
          'px-4 py-3.5',
          'text-sm text-[#F5ECD8]',
          'placeholder:text-[#5A3F22]',
          'transition-colors duration-150',
          'focus:border-[#F28C28]/60 focus:outline-none focus:ring-1 focus:ring-[#F28C28]/25',
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      />
      {error && (
        <p className="text-xs text-[#E05050]">{error}</p>
      )}
    </div>
  );
};
