'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusDot } from '@/components/ui/Badges';
import { Cpu, Database, Shield, Layers, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface SystemStatus {
  ai: { configured: boolean; model: string; baseUrl: string; maskedKey?: string; mode: string };
  storage: { mode: 'neon_postgresql' | 'local_persistent_json' | string; investigationsCount: number };
  engine: { activeRulesCount: number; rules: { id: string; name: string }[] };
}

function Card({
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
  className = '',
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-5 sm:p-6 rounded-lg border border-border bg-surface space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-border bg-surface-elevated flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ on, labelOn, labelOff }: { on: boolean; labelOn: string; labelOff: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border ${
      on
        ? 'text-brand border-brand/25 bg-brand/8'
        : 'text-[#e2ad54] border-[rgba(226,173,84,0.25)] bg-[rgba(226,173,84,0.06)]'
    }`}>
      <StatusDot status={on ? 'active' : 'warning'} />
      {on ? labelOn : labelOff}
    </div>
  );
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = () => {
    setLoading(true);
    setFetchError(null);
    fetch('/api/system/status')
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`Status unavailable (${r.status})`);
        }
        const d = await r.json();
        if (d && d.success && d.data) {
          setStatus(d.data);
        } else {
          throw new Error(d?.error || 'Status unavailable');
        }
      })
      .catch((err) => {
        console.error('Failed to load system status:', err);
        setFetchError(err instanceof Error ? err.message : 'Status unavailable');
        setStatus(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleClear = async () => {
    if (!confirm('Delete all stored investigations? This cannot be undone.')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/investigations');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        for (const item of data.data) {
          await fetch(`/api/investigations/${item.id}`, { method: 'DELETE' });
        }
      }
      setMessage('All investigations cleared.');
      fetchStatus();
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setClearing(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border animate-enter">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Configuration</h1>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Inspect AI provider, rules engine, storage, and security settings.
            </p>
          </div>
          <button
            onClick={fetchStatus}
            className="p-2 rounded-md border border-border bg-surface hover:bg-surface-elevated text-foreground-secondary hover:text-foreground transition-all duration-150"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {fetchError && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-md border border-[rgba(239,119,112,0.3)] bg-[rgba(239,119,112,0.06)] text-[#ef7770] text-xs animate-scale-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">System status unavailable: </span>
              {fetchError}
            </div>
            <button
              onClick={fetchStatus}
              className="text-xs font-mono underline hover:text-foreground transition-colors ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2.5 p-3 rounded-md border border-brand/25 bg-brand/8 text-brand text-xs animate-scale-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {message}
          </div>
        )}

        {/* AI Provider */}
        <Card
          icon={Cpu}
          title="AI Diagnostic Provider"
          subtitle="Server-side LLM for contextual root-cause reasoning"
          badge={
            loading ? (
              <span className="w-28 h-5 fm-skeleton" />
            ) : status ? (
              <StatusBadge
                on={status.ai.configured}
                labelOn={`Active · ${status.ai.model}`}
                labelOff="Deterministic Dev Mode"
              />
            ) : (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-surface-elevated text-foreground-muted">
                Status unavailable
              </span>
            )
          }
          className="animate-enter delay-50"
        >
          {/* Config values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            {[
              { label: 'Model', value: status?.ai.model },
              { label: 'Base URL', value: status?.ai.baseUrl },
              { label: 'API Key', value: status ? (status.ai.configured ? 'Configured (Server)' : 'Not Set') : undefined },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded border border-border bg-surface-elevated space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-foreground-muted">{label}</p>
                <p className="text-foreground font-semibold truncate">
                  {loading ? (
                    <span className="fm-skeleton inline-block w-20 h-3 rounded" />
                  ) : (
                    value ?? <span className="text-foreground-muted">—</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Dev mode callout */}
          {status && !status.ai.configured && (
            <div className="p-4 rounded border border-border bg-surface-muted text-xs space-y-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <AlertTriangle className="w-3.5 h-3.5 text-[#e2ad54]" />
                To enable AI-powered analysis, configure your provider:
              </div>
              <pre className="p-3 rounded bg-background font-mono text-[11px] text-foreground border border-border overflow-x-auto leading-relaxed">
{`# .env.local
AI_API_KEY="sk-..."
AI_MODEL="gpt-4o-mini"
AI_BASE_URL="https://api.openai.com/v1"`}
              </pre>
              <p className="text-foreground-secondary leading-relaxed">
                Restart the dev server after creating <code className="text-brand">.env.local</code>. Supports OpenAI, OpenRouter, local Ollama, or any OpenAI-compatible endpoint.
              </p>
            </div>
          )}
        </Card>

        {/* Rules Engine */}
        <Card
          icon={Layers}
          title="Deterministic Rules Engine"
          subtitle="Rule-based static checks that run before any LLM invocation"
          badge={
            loading ? (
              <span className="w-24 h-5 fm-skeleton" />
            ) : status ? (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-surface-elevated text-foreground-secondary">
                {status.engine.activeRulesCount} rules active
              </span>
            ) : (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-surface-elevated text-foreground-muted">
                Status unavailable
              </span>
            )
          }
          className="animate-enter delay-100"
        >
          <div className="space-y-1.5">
            {loading ? (
              <div className="space-y-1.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 fm-skeleton rounded" />
                ))}
              </div>
            ) : status ? (
              status.engine.rules.map((rule, i) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between px-3 py-2 rounded border border-border bg-surface-elevated text-xs font-mono animate-enter"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-brand font-semibold shrink-0">[{rule.id}]</span>
                    <span className="text-foreground truncate">{rule.name}</span>
                  </div>
                  <span className="text-[10px] text-brand uppercase shrink-0 ml-2">Active</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-foreground-muted py-2">
                Rule catalog could not be retrieved.
              </p>
            )}
          </div>
        </Card>

        {/* Storage */}
        <Card
          icon={Database}
          title="Storage Engine"
          subtitle="Investigation records and diagnostic report persistence"
          badge={
            loading ? (
              <span className="w-32 h-5 fm-skeleton" />
            ) : status ? (
              <StatusBadge
                on={status.storage.mode === 'neon_postgresql'}
                labelOn="Neon PostgreSQL"
                labelOff="Local JSON Store"
              />
            ) : (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-surface-elevated text-foreground-muted">
                Status unavailable
              </span>
            )
          }
          className="animate-enter delay-150"
        >
          <div className="space-y-2 text-xs leading-relaxed text-foreground-secondary">
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 w-3/4 fm-skeleton rounded" />
                <div className="h-4 w-1/2 fm-skeleton rounded" />
              </div>
            ) : status ? (
              status.storage.mode === 'neon_postgresql' ? (
                <p>
                  Connected to <span className="font-semibold text-foreground">Neon Serverless PostgreSQL</span>. Currently tracking{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {status.storage.investigationsCount}
                  </span>{' '}
                  persistent investigation {status.storage.investigationsCount === 1 ? 'record' : 'records'} with diagnostic reports and feedback.
                </p>
              ) : (
                <p>
                  Operating in <span className="font-semibold text-foreground">Local JSON Storage mode</span>. Currently storing{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {status.storage.investigationsCount}
                  </span>{' '}
                  investigation {status.storage.investigationsCount === 1 ? 'report' : 'reports'} in <code className="font-mono text-brand">data/forgemind.json</code>.
                  To activate Neon PostgreSQL persistence, configure <code className="font-mono text-brand">DATABASE_URL</code> in <code className="font-mono text-brand">.env.local</code>.
                </p>
              )
            ) : (
              <p className="text-foreground-muted">
                Storage engine status is currently unavailable. Check system logs or verify network connectivity.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-foreground-muted">Clear stored investigation records:</span>
            <button
              onClick={handleClear}
              disabled={clearing || !status || status.storage.investigationsCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(239,119,112,0.3)] bg-[rgba(239,119,112,0.06)] text-[#ef7770] hover:bg-[rgba(239,119,112,0.12)] text-xs font-mono transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {clearing ? 'Clearing…' : 'Clear All Records'}
            </button>
          </div>
        </Card>

        {/* Security */}
        <Card
          icon={Shield}
          title="Security & Privacy"
          subtitle="Execution isolation, data handling, and code safety"
          className="animate-enter delay-200"
        >
          <ul className="space-y-2.5 text-xs text-foreground-secondary">
            {[
              'Uploaded files and code snippets are parsed in-memory with strict 2 MB per-file limits.',
              'No shell execution, bytecode execution, or arbitrary script execution is performed on the server.',
              'ForgeMind never modifies local Unity project files or assets.',
              'All AI requests are mediated server-side with Zod schema validation to mitigate prompt-injection risks.',
              'API keys are stored exclusively in server-side environment variables and never exposed to the client.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
