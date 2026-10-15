"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SeverityBadge, PipelineBadge, Skeleton } from "@/components/ui/Badges";
import { Investigation } from "@/lib/types";
import { formatDate } from "@/lib/utils";
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
  AlertCircle,
  FileSearch,
} from "lucide-react";

/* ============================================================
   Loading Skeleton
   ============================================================ */

function LoadingSkeleton() {
  return (
    <div
      className="space-y-3"
      aria-label="Loading investigations"
      aria-busy="true"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="fm-surface-card space-y-3 rounded-lg p-5"
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

/* ============================================================
   Empty State
   ============================================================ */

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="animate-scale-in flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/5">
        {hasFilter ? (
          <FileSearch className="h-6 w-6 text-brand" />
        ) : (
          <Sparkles className="h-6 w-6 text-brand" />
        )}
      </div>

      <h3 className="mb-1.5 text-base font-semibold tracking-tight text-foreground">
        {hasFilter ? "No matching investigations" : "No investigations yet"}
      </h3>

      <p className="mb-6 max-w-sm text-center text-sm leading-relaxed text-foreground-secondary">
        {hasFilter
          ? "Try a different search term or select another render pipeline."
          : "Create your first diagnostic investigation to start analyzing Unity errors with deterministic rules and AI."}
      </p>

      {hasFilter ? (
        <p className="text-xs text-foreground-muted">
          Adjust the filters above to see more results.
        </p>
      ) : (
        <Link
          href="/investigations/new"
          className="group inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-background shadow-sm shadow-brand/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-light active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
          Create First Investigation
        </Link>
      )}
    </div>
  );
}

/* ============================================================
   Metric Card
   ============================================================ */

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
      className="fm-surface-card space-y-1.5 rounded-lg p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-foreground-muted">
        {label}
      </p>

      <p className="text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>

      <p className="text-[11px] leading-relaxed text-foreground-secondary">
        {sub}
      </p>
    </div>
  );
}

/* ============================================================
   Investigation Row
   ============================================================ */

function InvestigationRow({
  item,
  onDelete,
  isDeleting,
  delay,
}: {
  item: Investigation;
  onDelete: (id: string, e: React.MouseEvent<HTMLButtonElement>) => void;
  isDeleting: boolean;
  delay: number;
}) {
  const severity = item.report?.severity ?? "medium";

  const severityColor =
    severity === "critical"
      ? "bg-[#ef7770]"
      : severity === "high"
        ? "bg-[#f97316]"
        : severity === "medium"
          ? "bg-[#e2ad54]"
          : "bg-[#34d399]";

  return (
    <Link
      href={`/investigations/${item.id}`}
      className="fm-row-hover group flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-surface p-4 transition-all duration-200 hover:border-border-active hover:bg-surface-elevated sm:gap-4 sm:px-5"
      style={{ animationDelay: `${Math.min(delay, 400)}ms` }}
    >
      {/* Severity indicator */}
      <div
        aria-hidden="true"
        className={`w-0.5 shrink-0 self-stretch rounded-full ${severityColor}`}
      />

      {/* Investigation information */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge level={severity as any} />
          <PipelineBadge pipeline={item.renderPipeline} />

          <span className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] font-mono text-foreground-muted">
            {item.unityVersion}
          </span>

          {item.report?.analysisMode === "deterministic_only" && (
            <span className="rounded border border-brand/20 bg-brand/5 px-1.5 py-0.5 text-[10px] font-mono text-brand">
              Deterministic
            </span>
          )}

          {item.userFeedback?.helpful && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-brand">
              <ThumbsUp className="h-3 w-3" />
              Helpful
            </span>
          )}
        </div>

        <p className="truncate text-sm font-medium tracking-[-0.01em] text-foreground transition-colors duration-150 group-hover:text-brand">
          {item.title}
        </p>

        <p className="truncate text-[11px] font-mono text-foreground-muted">
          {item.errorMessage.split("\n")[0]}
        </p>
      </div>

      {/* Row actions */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <time
          dateTime={item.createdAt}
          className="hidden text-[11px] font-mono text-foreground-muted sm:block"
        >
          {formatDate(item.createdAt)}
        </time>

        <button
          type="button"
          onClick={(e) => onDelete(item.id, e)}
          disabled={isDeleting}
          aria-label={`Delete investigation: ${item.title}`}
          title="Delete investigation"
          className="rounded-md p-2 text-foreground-muted opacity-100 transition-all duration-150 hover:bg-[rgba(239,119,112,0.08)] hover:text-[#ef7770] disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          {isDeleting ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>

        <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand" />
      </div>
    </Link>
  );
}

/* ============================================================
   Investigations Page
   ============================================================ */

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPipeline, setSelectedPipeline] = useState("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(
    async (q: string, pipeline: string, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q,
          pipeline,
        });

        const res = await fetch(`/api/investigations?${params.toString()}`, {
          signal,
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Request failed (${res.status}). Please try again.`);
        }

        const data = await res.json();

        if (!data.success || !Array.isArray(data.data)) {
          throw new Error(data.error || "Could not load investigations.");
        }

        setInvestigations(data.data as Investigation[]);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading investigations.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    void load(searchQuery, selectedPipeline, controller.signal);

    return () => controller.abort();
  }, [load, searchQuery, selectedPipeline, refreshKey]);

  const handleDelete = async (
    id: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeleting) return;

    const confirmed = window.confirm(
      "Delete this investigation report? This action cannot be undone.",
    );

    if (!confirmed) return;

    setIsDeleting(id);
    setError(null);

    try {
      const res = await fetch(`/api/investigations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(
          "Could not delete this investigation. Please try again.",
        );
      }

      const data = await res.json().catch(() => null);

      if (data && data.success === false) {
        throw new Error(data.error || "Could not delete this investigation.");
      }

      setInvestigations((previous) =>
        previous.filter((item) => item.id !== id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting the investigation.",
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((key) => key + 1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  /* Metrics */
  const total = investigations.length;

  const feedbackItems = investigations.filter((item) => item.userFeedback);
  const helpfulCount = feedbackItems.filter(
    (item) => item.userFeedback?.helpful,
  ).length;

  const resolutionRate = feedbackItems.length
    ? `${Math.round((helpfulCount / feedbackItems.length) * 100)}%`
    : "—";

  const urpCount = investigations.filter(
    (item) => item.renderPipeline === "urp",
  ).length;

  const builtinCount = investigations.filter(
    (item) => item.renderPipeline === "builtin",
  ).length;

  const hdrpCount = investigations.filter(
    (item) => item.renderPipeline === "hdrp",
  ).length;

  const hasFilter = searchQuery.trim() !== "" || selectedPipeline !== "all";

  return (
    <AppShell>
      <div className="fm-page-enter mx-auto max-w-5xl space-y-6">
        {/* Page heading */}
        <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-mono font-medium uppercase tracking-[0.15em] text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Workspace
            </div>

            <h1 className="text-xl font-bold tracking-[-0.025em] text-foreground sm:text-2xl">
              Diagnostic Investigations
            </h1>

            <p className="max-w-2xl text-xs leading-relaxed text-foreground-secondary sm:text-sm">
              Review previous Unity investigations, inspect findings, and
              explore your diagnostic history.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh investigations"
              title="Refresh"
              className="rounded-md border border-border bg-surface p-2.5 text-foreground-secondary transition-all duration-200 hover:border-border-active hover:bg-surface-elevated hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            <Link
              href="/investigations/new"
              className="group inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2.5 text-xs font-semibold text-background shadow-sm shadow-brand/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-light active:scale-[0.98] sm:text-sm"
            >
              <Plus className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
              New Investigation
            </Link>
          </div>
        </header>

        {/* Error feedback */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-[#ef7770]/25 bg-[#ef7770]/5 p-3.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef7770]" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Something needs attention
              </p>
              <p className="mt-1 break-words text-xs leading-relaxed text-foreground-secondary">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="rounded p-1 text-foreground-muted transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Metrics */}
        {loading && investigations.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="fm-surface-card space-y-3 rounded-lg p-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              label="Total"
              value={total}
              sub="Stored reports"
              delay={0}
            />
            <MetricCard
              label="Helpfulness"
              value={resolutionRate}
              sub={`${feedbackItems.length} rated`}
              delay={50}
            />
            <MetricCard
              label="URP"
              value={urpCount}
              sub="Universal Render Pipeline"
              delay={100}
            />
            <MetricCard
              label="Built-in / HDRP"
              value={`${builtinCount} / ${hdrpCount}`}
              sub="Legacy & High Definition"
              delay={150}
            />
          </div>
        )}

        {/* Search and filters */}
        <section
          aria-label="Search and filter investigations"
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />

            <input
              type="search"
              aria-label="Search investigations"
              placeholder="Search by title or error text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="fm-input w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-foreground-muted"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-foreground-muted transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-xs text-foreground-secondary transition-colors focus-within:border-brand/50">
            <Filter className="h-3.5 w-3.5 shrink-0" />

            <span className="sr-only">Render pipeline</span>

            <select
              value={selectedPipeline}
              onChange={(e) => setSelectedPipeline(e.target.value)}
              className="min-w-0 cursor-pointer bg-transparent font-mono text-foreground outline-none"
            >
              <option value="all">All Pipelines</option>
              <option value="urp">URP</option>
              <option value="builtin">Built-in</option>
              <option value="hdrp">HDRP</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
        </section>

        {/* Investigation list */}
        {loading ? (
          <LoadingSkeleton />
        ) : error && investigations.length === 0 ? (
          <div className="fm-surface-card rounded-lg">
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-[#ef7770]" />
              <h3 className="text-sm font-semibold text-foreground">
                Unable to load investigations
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-foreground-secondary">
                Check your connection and try loading your reports again.
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:border-border-active"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </button>
            </div>
          </div>
        ) : investigations.length === 0 ? (
          <div className="fm-surface-card rounded-lg">
            <EmptyState hasFilter={hasFilter} />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 pb-1">
              <p className="text-[11px] font-mono text-foreground-muted">
                {total} {total === 1 ? "INVESTIGATION" : "INVESTIGATIONS"}
              </p>

              {hasFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedPipeline("all");
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] text-foreground-secondary transition-colors hover:text-brand"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </button>
              )}
            </div>

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
