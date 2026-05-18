import { FC } from "react";
import { colors } from "../tokens/colors";

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  fallback?: string;
  className?: string;
}

export const Avatar: FC<AvatarProps> = ({ src, alt = "Avatar", size = 48, fallback, className = "" }) => (
  <div
    className={`inline-flex items-center justify-center rounded-full bg-[${colors.brown}] border-2 border-[${colors.orange}] overflow-hidden ${className}`}
    style={{ width: size, height: size }}
  >
    {src ? (
      <img src={src} alt={alt} className="object-cover w-full h-full" />
    ) : (
      <span className="text-[${colors.orange}] text-lg font-bold">{fallback || alt?.[0]}</span>
    )}
  </div>
);
