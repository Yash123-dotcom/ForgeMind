'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { SeverityBadge, PipelineBadge, Skeleton } from '@/components/ui/Badges';
import { Investigation } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';

/* ─── Skeleton Rows ──────────────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-fade">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-lg border border-border bg-surface space-y-3"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 animate-scale-in">
      <div className="w-14 h-14 rounded-full border border-border bg-surface-elevated flex items-center justify-center mb-5">
        <Sparkles className="w-6 h-6 text-brand" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">
        {hasFilter ? 'No matching investigations' : 'No investigations yet'}
      </h3>
      <p className="text-sm text-foreground-secondary text-center max-w-sm mb-6">
        {hasFilter
          ? 'Try adjusting your search or pipeline filter.'
          : 'Create your first diagnostic investigation to start analysing Unity errors with the rules engine and AI.'}
      </p>
      {!hasFilter && (
        <Link
          href="/investigations/new"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand text-background hover:bg-brand-light font-semibold text-sm transition-all duration-150 shadow-sm shadow-brand/15 active:scale-[0.97]"
        >
          <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-150 group-hover:rotate-90" />
          Create First Investigation
        </Link>
      )}
    </div>
  );
}

/* ─── Metric Card ────────────────────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  sub,
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub: string;
  delay?: number;
}) {
  return (
    <div
      className="p-4 rounded-lg border border-border bg-surface space-y-1 animate-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">{label}</p>
      <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
      <p className="text-[11px] text-foreground-secondary">{sub}</p>
    </div>
  );
}

/* ─── Investigation Row ──────────────────────────────────────────────────── */
function InvestigationRow({
  item,
  onDelete,
  isDeleting,
  delay,
}: {
  item: Investigation;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isDeleting: boolean;
  delay: number;
}) {
  const severity = (item.report?.severity ?? 'medium') as any;

  return (
    <Link
      href={`/investigations/${item.id}`}
      className="fm-row-hover group flex items-center gap-4 p-4 sm:px-5 rounded-lg border border-border bg-surface hover:bg-surface-elevated hover:border-border-active transition-colors duration-150 animate-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Severity stripe */}
      <div
        className={`w-0.5 self-stretch rounded-full shrink-0 ${
          severity === 'critical' ? 'bg-[#ef7770]' :
          severity === 'high'     ? 'bg-[#f97316]' :
          severity === 'medium'   ? 'bg-[#e2ad54]' :
                                    'bg-[#34d399]'
        }`}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityBadge level={severity} />
          <PipelineBadge pipeline={item.renderPipeline} />
          <span className="text-[11px] font-mono text-foreground-muted border border-border rounded px-1.5 py-0.5 bg-surface-elevated">
            {item.unityVersion}
          </span>
          {item.report?.analysisMode === 'deterministic_only' && (
            <span className="text-[10px] font-mono text-brand bg-brand/8 border border-brand/20 rounded px-1.5 py-0.5">
              Deterministic
            </span>
          )}
          {item.userFeedback?.helpful && (
            <span className="inline-flex items-center gap-1 text-[10px] text-brand font-mono">
              <ThumbsUp className="w-2.5 h-2.5" /> Helpful
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-foreground group-hover:text-brand transition-colors duration-150 truncate">
          {item.title}
        </p>

        <p className="text-[11px] font-mono text-foreground-muted truncate">
          {item.errorMessage.split('\n')[0]}
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden sm:block text-[11px] font-mono text-foreground-muted">
          {formatDate(item.createdAt)}
        </span>

        <button
          onClick={(e) => onDelete(item.id, e)}
          disabled={isDeleting}
          className="p-1.5 rounded text-foreground-muted hover:text-[#ef7770] hover:bg-[rgba(239,119,112,0.08)] transition-all duration-150 opacity-0 group-hover:opacity-100"
          title="Delete investigation"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-brand transition-all duration-150 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const load = async (q = searchQuery, pipe = selectedPipeline) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/investigations?q=${encodeURIComponent(q)}&pipeline=${pipe}`
      );
      const data = await res.json();
      if (data.success) setInvestigations(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this investigation report?')) return;
    setIsDeleting(id);
    try {
      await fetch(`/api/investigations/${id}`, { method: 'DELETE' });
      setInvestigations((p) => p.filter((i) => i.id !== id));
    } finally {
      setIsDeleting(null);
    }
  };

  /* Metrics */
  const total = investigations.length;
  const feedbackItems = investigations.filter((i) => i.userFeedback);
  const helpfulCount = feedbackItems.filter((i) => i.userFeedback?.helpful).length;
  const resolutionRate = feedbackItems.length
    ? `${Math.round((helpfulCount / feedbackItems.length) * 100)}%`
    : '—';
  const urpCount = investigations.filter((i) => i.renderPipeline === 'urp').length;
  const builtinCount = investigations.filter((i) => i.renderPipeline === 'builtin').length;
  const hdrpCount = investigations.filter((i) => i.renderPipeline === 'hdrp').length;

  const hasFilter = searchQuery.trim() !== '' || selectedPipeline !== 'all';

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border animate-enter">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Diagnostic Investigations
            </h1>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Review prior Unity project investigations, inspect findings, and re-run analysis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load()}
              className="p-2 rounded-md border border-border bg-surface hover:bg-surface-elevated text-foreground-secondary hover:text-foreground transition-all duration-150"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              href="/investigations/new"
              className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brand text-background hover:bg-brand-light font-semibold text-xs sm:text-sm transition-all duration-150 shadow-sm shadow-brand/15 active:scale-[0.97]"
            >
              <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-150 group-hover:rotate-90" />
              New Investigation
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total" value={loading ? '—' : total} sub="Stored reports" delay={0} />
          <MetricCard label="Helpfulness" value={loading ? '—' : resolutionRate} sub={`${feedbackItems.length} rated`} delay={50} />
          <MetricCard label="URP" value={loading ? '—' : urpCount} sub="Universal RP" delay={100} />
          <MetricCard label="Built-in / HDRP" value={loading ? '—' : `${builtinCount} / ${hdrpCount}`} sub="Legacy & High Def" delay={150} />
        </div>

        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-2 animate-enter delay-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title or error text…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              className="fm-input w-full pl-9 pr-4 py-2 rounded-md border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); load('', selectedPipeline); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-surface text-xs text-foreground-secondary">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedPipeline}
              onChange={(e) => { setSelectedPipeline(e.target.value); load(searchQuery, e.target.value); }}
              className="bg-transparent text-foreground font-mono focus:outline-none cursor-pointer"
            >
              <option value="all">All Pipelines</option>
              <option value="urp">URP</option>
              <option value="builtin">Built-in</option>
              <option value="hdrp">HDRP</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <LoadingSkeleton />
        ) : investigations.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface">
            <EmptyState hasFilter={hasFilter} />
          </div>
        ) : (
          <div className="space-y-2">
            {investigations.map((item, i) => (
              <InvestigationRow
                key={item.id}
                item={item}
                onDelete={handleDelete}
                isDeleting={isDeleting === item.id}
                delay={i * 40}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
