import React from 'react';
import { cn } from '@/lib/utils';

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type ConfidenceLevel = 'high' | 'medium' | 'low';
type AnalysisMode = 'ai_assisted' | 'deterministic_only' | 'fallback_diagnostic';

interface SeverityBadgeProps {
  level: SeverityLevel;
  className?: string;
}

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  className?: string;
}

interface AnalysisModeBadgeProps {
  mode: AnalysisMode;
  className?: string;
}

interface PipelineBadgeProps {
  pipeline: string;
  className?: string;
}

interface TagBadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'mono' | 'default';
}

const SEVERITY_STYLES: Record<SeverityLevel, string> = {
  critical: 'badge-critical',
  high:     'badge-high',
  medium:   'badge-medium',
  low:      'badge-low',
  info:     'badge-info',
};

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  high:   'text-brand bg-brand/8 border border-brand/20',
  medium: 'text-[#e2ad54] bg-[#e2ad54]/8 border border-[#e2ad54]/20',
  low:    'text-foreground-secondary bg-surface-elevated border border-border',
};

const PIPELINE_STYLES: Record<string, string> = {
  urp:     'text-[#4e97ff] bg-[#4e97ff]/8 border border-[#4e97ff]/20',
  hdrp:    'text-[#a78bfa] bg-[#a78bfa]/8 border border-[#a78bfa]/20',
  builtin: 'text-foreground-secondary bg-surface-elevated border border-border',
  unknown: 'text-foreground-muted bg-surface-elevated border border-border',
};

export function SeverityBadge({ level, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded',
        SEVERITY_STYLES[level],
        className
      )}
    >
      {level}
    </span>
  );
}

export function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded',
        CONFIDENCE_STYLES[level],
        className
      )}
    >
      {level} confidence
    </span>
  );
}

export function PipelineBadge({ pipeline, className }: PipelineBadgeProps) {
  const style = PIPELINE_STYLES[pipeline.toLowerCase()] ?? PIPELINE_STYLES.unknown;
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-mono px-2 py-0.5 rounded uppercase',
        style,
        className
      )}
    >
      {pipeline.toUpperCase()}
    </span>
  );
}

export function AnalysisModeBadge({ mode, className }: AnalysisModeBadgeProps) {
  const isAI = mode === 'ai_assisted';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded',
        isAI
          ? 'text-brand bg-brand/8 border border-brand/20'
          : 'text-[#e2ad54] bg-[rgba(226,173,84,0.08)] border border-[rgba(226,173,84,0.2)]',
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          isAI ? 'bg-brand fm-status-pulse' : 'bg-[#e2ad54]'
        )}
      />
      {isAI ? 'AI Reasoning Engine' : 'Deterministic Engine'}
    </span>
  );
}

export function TagBadge({ children, className, variant = 'default' }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] px-2 py-0.5 rounded border border-border bg-surface-elevated text-foreground-secondary',
        variant === 'mono' && 'font-mono',
        className
      )}
    >
      {children}
    </span>
  );
}

/** Small inline status dot */
export function StatusDot({
  status,
  className,
}: {
  status: 'active' | 'warning' | 'error' | 'idle';
  className?: string;
}) {
  const color =
    status === 'active'  ? 'bg-brand fm-status-pulse' :
    status === 'warning' ? 'bg-[#e2ad54]' :
    status === 'error'   ? 'bg-[#ef7770]' :
                           'bg-foreground-muted';
  return (
    <span className={cn('inline-block w-1.5 h-1.5 rounded-full shrink-0', color, className)} />
  );
}

/** Loading skeleton block */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('fm-skeleton rounded', className)} />;
}

