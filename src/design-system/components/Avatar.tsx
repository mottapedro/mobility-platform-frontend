import { FC } from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  fallback?: string;
  className?: string;
  highlight?: boolean;
}

export const Avatar: FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 48,
  fallback,
  className = '',
  highlight = false,
}) => (
  <div
    className={[
      'inline-flex items-center justify-center rounded-full overflow-hidden',
      'border-2',
      highlight ? 'border-[#F28C28] bg-[#F28C28]' : 'border-[#2E1A08] bg-[#1A0E04]',
      className,
    ].join(' ')}
    style={{ width: size, height: size }}
  >
    {src ? (
      <img src={src} alt={alt} className="object-cover w-full h-full" />
    ) : (
      <span className={`text-sm font-bold ${highlight ? 'text-[#0D0700]' : 'text-[#F28C28]'}`}>
        {fallback || alt?.[0]}
      </span>
    )}
  </div>
);
