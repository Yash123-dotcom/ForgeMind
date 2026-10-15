'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface DiagnosticProgressProps {
  stages: string[];
  currentStage: number;
  className?: string;
}

const ICONS = [
  /* shield-check */ (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden>
      <path d="M8 1.5L13 4v4c0 3-2 5-5 6.5C5 13 3 11 3 8V4l5-2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5.5 8l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  /* cpu */ (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden>
      <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M6 1v2M10 1v2M6 13v2M10 13v2M1 6h2M1 10h2M13 6h2M13 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  /* sparkles */ (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden>
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 5a3 3 0 100 6 3 3 0 000-6z" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4.5 4.5l1 1M10.5 10.5l1 1M10.5 4.5l1-1M4.5 10.5l-1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  /* file-check */ (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden>
      <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6l-4-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M6 9.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
];

export function DiagnosticProgress({ stages, currentStage, className }: DiagnosticProgressProps) {
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    setProgressKey((k) => k + 1);
  }, [currentStage]);

  const pct = Math.round(((currentStage + 1) / stages.length) * 100);

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Overall progress bar */}
      <div className="mb-6 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-foreground-muted">
          <span>Diagnostic pipeline</span>
          <span className="text-brand">{pct}%</span>
        </div>
        <div className="h-0.5 w-full rounded-full bg-surface-elevated overflow-hidden">
          <div
            key={`bar-${progressKey}`}
            className="h-full rounded-full bg-brand fm-stage-progress"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <div className="space-y-2">
        {stages.map((stage, i) => {
          const isDone    = i < currentStage;
          const isCurrent = i === currentStage;
          const isPending = i > currentStage;

          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md border text-xs transition-all duration-200',
                isDone
                  ? 'border-brand/20 bg-brand/5 text-foreground'
                  : isCurrent
                  ? 'border-border-active bg-surface-elevated text-foreground shadow-sm'
                  : 'border-border bg-surface text-foreground-muted'
              )}
            >
              {/* Status icon */}
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
                  isDone
                    ? 'bg-brand text-background animate-check-in'
                    : isCurrent
                    ? 'bg-surface-hover text-brand ring-1 ring-brand/40'
                    : 'bg-surface-muted text-foreground-muted'
                )}
              >
                {isDone ? (
                  <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5" aria-hidden>
                    <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isCurrent ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-foreground-muted/50" />
                )}
              </span>

              {/* Stage icon + label */}
              <span className={cn(
                'flex items-center gap-2 flex-1',
                isCurrent && 'text-brand font-medium'
              )}>
                <span className={cn(
                  isDone    ? 'text-brand/70' :
                  isCurrent ? 'text-brand'    :
                              'text-foreground-muted/40'
                )}>
                  {ICONS[i] ?? null}
                </span>
                <span>{stage}</span>
              </span>

              {/* Current processing spinner */}
              {isCurrent && (
                <span className="w-3 h-3 border border-brand border-t-transparent rounded-full animate-spin shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

