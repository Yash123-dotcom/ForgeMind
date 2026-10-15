import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function Logo({ className = '', size = 'md', showTagline = false }: LogoProps) {
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 36 : 26;
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Restrained geometric intelligence mark: nested faceted hexagon with diamond core */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105"
      >
        {/* Outer dark faceted hex border */}
        <polygon
          points="16,2 29,9.5 29,24.5 16,32 3,24.5 3,9.5"
          stroke="#12A873"
          strokeWidth="1.75"
          fill="#0D100D"
        />
        {/* Internal geometric cross-beams */}
        <line x1="16" y1="2" x2="16" y2="12" stroke="#12A873" strokeWidth="1.2" strokeOpacity="0.5" />
        <line x1="29" y1="24.5" x2="20" y2="19.5" stroke="#12A873" strokeWidth="1.2" strokeOpacity="0.5" />
        <line x1="3" y1="24.5" x2="12" y2="19.5" stroke="#12A873" strokeWidth="1.2" strokeOpacity="0.5" />
        {/* Center glowing diagnostic nexus */}
        <polygon points="16,12 21,16 16,20 11,16" fill="#12A873" />
        <circle cx="16" cy="16" r="1.5" fill="#F2F2ED" />
      </svg>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-semibold tracking-tight text-foreground ${textSize}`}>
            Forge<span className="text-brand">Mind</span>
          </span>
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
    </div>
  );
}

