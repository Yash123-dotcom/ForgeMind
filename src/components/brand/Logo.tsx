import React from 'react';
import Image from 'next/image';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  theme?: 'light' | 'dark'; // 'dark' = for dark surfaces (light logo); 'light' = for light surfaces (dark logo)
  showTagline?: boolean;
  priority?: boolean;
}

export function Logo({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'dark',
  showTagline = false,
  priority = false,
}: LogoProps) {
  // Dimensions for full wordmark (aspect ratio 978 : 256 ≈ 3.82 : 1)
  const fullDimensions = {
    sm: { width: 107, height: 28 },
    md: { width: 122, height: 32 },
    lg: { width: 153, height: 40 },
  }[size];

  // Dimensions for icon-only (aspect ratio 1 : 1)
  const iconDimensions = {
    sm: { width: 22, height: 22 },
    md: { width: 28, height: 28 },
    lg: { width: 36, height: 36 },
  }[size];

  const logoSrc =
    theme === 'light'
      ? '/brand/forgemind-logo-dark.png' // Dark text for light surfaces
      : '/brand/forgemind-logo-light.png'; // Light text for dark surfaces

  const iconSrc =
    theme === 'light'
      ? '/brand/forgemind-icon-dark.png' // Dark mark for light surfaces
      : '/brand/forgemind-icon-light.png'; // Light mark for dark surfaces

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
        <Image
          src={iconSrc}
          alt="ForgeMind"
          width={iconDimensions.width}
          height={iconDimensions.height}
          priority={priority}
          className="h-auto w-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-2">
        <Image
          src={logoSrc}
          alt="ForgeMind"
          width={fullDimensions.width}
          height={fullDimensions.height}
          priority={priority}
          className="h-auto w-auto object-contain"
        />
        <span className="text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border border-border bg-surface-muted text-foreground-muted">
          Intelligence
        </span>
      </div>
      {showTagline && (
        <span className="text-xs text-foreground-muted mt-1">
          Understand your Unity project. Solve problems smarter.
        </span>
      )}
    </div>
  );
}
