'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import {
  SeverityBadge,
  ConfidenceBadge,
  PipelineBadge,
  AnalysisModeBadge,
  TagBadge,
} from '@/components/ui/Badges';
import { Investigation } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Download,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  FileCode,
  Sparkles,
} from 'lucide-react';

/* ─── Section heading ────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">
      {children}
    </p>
  );
}

/* ─── Source type pill ───────────────────────────────────────────────────── */
function SourcePill({ origin }: { origin: 'direct_fact' | 'deterministic_rule' | 'ai_hypothesis' | string }) {
  const configs: Record<string, { label: string; cls: string }> = {
    direct_fact:        { label: 'Direct Fact',        cls: 'text-[#4e97ff] bg-[rgba(78,151,255,0.08)] border-[rgba(78,151,255,0.2)]' },
    deterministic_rule: { label: 'Deterministic Rule', cls: 'text-brand bg-brand/8 border-brand/20' },
    ai_hypothesis:      { label: 'AI Hypothesis',      cls: 'text-[#e2ad54] bg-[rgba(226,173,84,0.06)] border-[rgba(226,173,84,0.2)]' },
  };
  const { label, cls } = configs[origin] ?? { label: origin, cls: 'text-foreground-muted border-border' };
  return (
    <span className={`inline-flex text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  );
}

/* ─── Copy button ────────────────────────────────────────────────────────── */
function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-elevated text-[11px] font-mono text-foreground-secondary hover:text-foreground transition-all duration-150 ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-brand" />
          <span className="text-brand">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

/* ─── Verification item ──────────────────────────────────────────────────── */
function VerificationItem({
  id,
  instruction,
  expectedOutcome,
  checked,
  onToggle,
}: {
  id: string;
  instruction: string;
  expectedOutcome: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`fm-check-row p-3 rounded border cursor-pointer select-none transition-all duration-150 ${
        checked ? 'checked' : 'border-border bg-surface-elevated hover:bg-surface-hover'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all duration-150 ${
            checked
              ? 'bg-brand border-brand'
              : 'border-border bg-surface'
          }`}
        >
          {checked && (
            <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5 animate-check-in" aria-hidden>
              <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="space-y-0.5 flex-1">
          <p className={`text-xs font-medium transition-colors duration-150 ${checked ? 'line-through text-foreground-muted' : 'text-foreground'}`}>
            {instruction}
          </p>
          <p className="text-[11px] text-foreground-secondary">
            <span className="text-brand font-semibold">Expected: </span>
            {expectedOutcome}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [feedbackState, setFeedbackState] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/investigations/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInvestigation(d.data);
        else setError(d.error || 'Not found');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFeedback = async (helpful: boolean) => {
    if (feedbackState !== 'idle') return;
    setFeedbackState('submitting');
    try {
      await fetch(`/api/investigations/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });
      setInvestigation((p) => p ? { ...p, userFeedback: { helpful, feedbackAt: new Date().toISOString() } } : null);
      setFeedbackMessage(helpful ? 'Marked as helpful — thank you!' : 'Feedback recorded.');
      setFeedbackState('done');
    } catch {
      setFeedbackState('idle');
    }
  };

  const handleExport = () => {
    if (!investigation?.report) return;
    const r = investigation.report;
    const md = `# ForgeMind Diagnostic Report\n**Title:** ${investigation.title}\n**Date:** ${formatDate(investigation.createdAt)}\n**Unity:** ${investigation.unityVersion} · ${investigation.renderPipeline.toUpperCase()}\n**Severity:** ${r.severity.toUpperCase()}\n**Confidence:** ${r.confidence.level.toUpperCase()}\n\n---\n\n## Executive Summary\n${r.executiveSummary}\n\n## Likely Root Cause\n${r.likelyRootCause}\n\n## Recommended Fix\n${r.recommendedFix.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n## Verification Checklist\n${r.verificationSteps.map((v) => `- [ ] ${v.instruction}`).join('\n')}\n\n---\n*Generated by ForgeMind Intelligence*\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    a.download = `ForgeMind-${investigation.id.slice(0, 8)}.md`;
    a.click();
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center gap-3 text-center animate-fade">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-foreground-secondary">Loading diagnostic report…</p>
        </div>
      </AppShell>
    );
  }

  /* ── Error ── */
  if (error || !investigation) {
    return (
      <AppShell>
        <div className="py-16 flex flex-col items-center gap-4 text-center animate-scale-in">
          <XCircle className="w-10 h-10 text-[#ef7770]" />
          <h2 className="text-lg font-semibold text-foreground">Investigation Not Found</h2>
          <p className="text-sm text-foreground-secondary">{error}</p>
          <Link href="/investigations" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border bg-surface hover:bg-surface-elevated text-sm font-medium text-foreground transition-all duration-150">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Investigations
          </Link>
        </div>
      </AppShell>
    );
  }

  const report = investigation.report;
  if (!report) {
    return (
      <AppShell>
        <div className="py-16 flex flex-col items-center gap-3 text-center animate-scale-in">
          <AlertTriangle className="w-8 h-8 text-[#e2ad54]" />
          <h2 className="text-base font-semibold text-foreground">Report Pending</h2>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8 pb-16">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border animate-enter">
          <div className="flex items-start gap-3 min-w-0">
            <Link
              href="/investigations"
              className="p-1.5 rounded hover:bg-surface-elevated text-foreground-secondary hover:text-foreground transition-all duration-150 shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-mono text-foreground-muted mb-1 flex-wrap">
                <span>ID: {investigation.id.slice(0, 8)}</span>
                <span className="text-border-active">·</span>
                <span>{formatDate(investigation.createdAt)}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {investigation.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-elevated text-xs font-mono text-foreground-secondary hover:text-foreground transition-all duration-150"
            >
              <Download className="w-3.5 h-3.5" /> Export .md
            </button>
            <Link
              href="/investigations/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-brand text-background hover:bg-brand-light text-xs font-semibold transition-all duration-150"
            >
              New Diagnostic
            </Link>
          </div>
        </div>

        {/* ── Metadata Banner ── */}
        <div className="p-4 rounded-lg border border-border bg-surface space-y-3 animate-enter delay-50">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge level={report.severity as any} />
            <ConfidenceBadge level={report.confidence.level} />
            <PipelineBadge pipeline={investigation.renderPipeline} />
            <TagBadge variant="mono">{investigation.unityVersion}</TagBadge>
            {investigation.targetPlatform && (
              <TagBadge>{investigation.targetPlatform}</TagBadge>
            )}
            <AnalysisModeBadge mode={report.analysisMode as any} />
          </div>
          <div className="flex items-start gap-2 text-xs text-foreground-secondary border-t border-border pt-3">
            <HelpCircle className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold text-foreground">Calibration: </span>
              {report.confidence.calibrationReasoning}
            </p>
          </div>
        </div>

        {/* ── Summary + Root Cause ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-enter delay-100">
          <div className="p-5 rounded-lg border border-border bg-surface space-y-2">
            <div className="flex items-center justify-between">
              <SectionLabel>Executive Summary</SectionLabel>
              <span className="text-[10px] font-mono text-foreground-muted bg-surface-elevated border border-border rounded px-1.5 py-0.5">
                Synthesized
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{report.executiveSummary}</p>
          </div>
          <div className="p-5 rounded-lg border border-border bg-surface space-y-2">
            <div className="flex items-center justify-between">
              <SectionLabel>Likely Root Cause</SectionLabel>
              <ShieldAlert className="w-3.5 h-3.5 text-[#f97316]" />
            </div>
            <p className="text-sm text-foreground leading-relaxed">{report.likelyRootCause}</p>
          </div>
        </div>

        {/* ── Deterministic Rule Findings ── */}
        {report.ruleBasedFindings.length > 0 && (
          <div className="p-5 rounded-lg border border-brand/20 bg-brand/5 space-y-3 animate-enter delay-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand text-background uppercase">
                  Verified Finding
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  Unity Rules Engine Assertions
                </h3>
              </div>
              <span className="text-[11px] font-mono text-brand">
                {report.ruleBasedFindings.length} match{report.ruleBasedFindings.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className="space-y-2.5">
              {report.ruleBasedFindings.map((rule) => (
                <div key={rule.ruleId} className="p-3.5 rounded border border-border bg-surface space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-mono font-semibold text-foreground">
                      [{rule.ruleId}] {rule.title}
                    </span>
                    <SeverityBadge level={rule.severity as any} />
                  </div>
                  <p className="text-xs text-foreground-secondary leading-relaxed">{rule.finding}</p>
                  <div className="p-2 rounded bg-background font-mono text-[11px] text-brand border border-brand/15">
                    Evidence: {rule.evidence}
                  </div>
                  <p className="text-[11px] text-foreground-muted">
                    <span className="font-semibold text-foreground-secondary">Next step: </span>
                    {rule.suggestedNextStep}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Evidence Panel ── */}
        {report.evidence.length > 0 && (
          <div className="space-y-3 animate-enter delay-200">
            <SectionLabel>Observed Evidence</SectionLabel>
            <div className="space-y-2">
              {report.evidence.map((item, i) => (
                <div key={i} className="p-3 rounded border border-border bg-surface space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono flex-wrap gap-2">
                    <SourcePill origin="direct_fact" />
                    {item.location && (
                      <span className="text-foreground-muted">{item.location}</span>
                    )}
                  </div>
                  <pre className="font-mono text-xs text-foreground bg-background p-2.5 rounded overflow-x-auto whitespace-pre-wrap border border-border leading-relaxed">
                    {item.content}
                  </pre>
                  <p className="text-[11px] text-foreground-secondary">{item.significance}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recommended Fix ── */}
        <div className="space-y-3 animate-enter delay-200">
          <SectionLabel>Recommended Fix Sequence</SectionLabel>
          <div className="p-5 rounded-lg border border-border bg-surface space-y-3">
            {report.recommendedFix.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full border border-brand/30 bg-brand/10 flex items-center justify-center text-[11px] font-mono font-semibold text-brand shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Code Changes ── */}
        {report.suggestedCodeChanges.length > 0 && (
          <div className="space-y-3 animate-enter delay-250">
            <SectionLabel>Suggested Code Patch</SectionLabel>
            <div className="space-y-4">
              {report.suggestedCodeChanges.map((change, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border bg-surface-elevated flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-foreground min-w-0">
                      <FileCode className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span className="truncate">{change.fileName || 'Recommended Change'}</span>
                    </div>
                    <CopyButton text={change.proposedSnippet} />
                  </div>
                  <pre className="p-4 bg-background font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {change.proposedSnippet}
                  </pre>
                  {change.explanation && (
                    <div className="px-4 py-2.5 border-t border-border bg-surface text-xs text-foreground-secondary">
                      <span className="font-semibold text-foreground-secondary">Rationale: </span>
                      {change.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Verification Checklist ── */}
        <div className="space-y-3 animate-enter delay-300">
          <div className="flex items-center justify-between">
            <SectionLabel>Verification Checklist</SectionLabel>
            <span className="text-[11px] font-mono text-foreground-muted">
              Check each step after resolving in the Unity Editor
            </span>
          </div>
          <div className="space-y-2">
            {report.verificationSteps.map((v) => (
              <VerificationItem
                key={v.id}
                id={v.id}
                instruction={v.instruction}
                expectedOutcome={v.expectedOutcome}
                checked={!!checkedSteps[v.id]}
                onToggle={() => setCheckedSteps((p) => ({ ...p, [v.id]: !p[v.id] }))}
              />
            ))}
          </div>
        </div>

        {/* ── Alt Causes + Missing Info ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-enter delay-300">
          <div className="p-5 rounded-lg border border-border bg-surface space-y-2">
            <SectionLabel>Alternative Hypotheses</SectionLabel>
            <ul className="text-xs text-foreground-secondary space-y-2">
              {report.alternativeCauses.map((a, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-foreground-muted shrink-0 mt-1.5" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5 rounded-lg border border-border bg-surface space-y-2">
            <SectionLabel>Missing Context for Greater Precision</SectionLabel>
            <ul className="text-xs text-foreground-secondary space-y-2">
              {report.missingInformation.map((m, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-brand/50 shrink-0 mt-1.5" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Feedback ── */}
        <div className="p-5 rounded-lg border border-border bg-surface flex flex-col sm:flex-row items-center justify-between gap-4 animate-enter delay-400">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="text-sm font-semibold text-foreground">
              Did this diagnosis help resolve the problem?
            </p>
            <p className="text-xs text-foreground-secondary">
              Your feedback improves heuristic weighting in future analyses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {feedbackMessage && (
              <span className="text-xs font-mono text-brand animate-fade">{feedbackMessage}</span>
            )}
            <button
              onClick={() => handleFeedback(true)}
              disabled={feedbackState !== 'idle' || investigation.userFeedback?.helpful === true}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-150 ${
                investigation.userFeedback?.helpful === true
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border bg-surface-elevated hover:bg-surface-hover hover:border-border-active text-foreground disabled:opacity-40'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" /> This helped
            </button>
            <button
              onClick={() => handleFeedback(false)}
              disabled={feedbackState !== 'idle' || investigation.userFeedback?.helpful === false}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-150 ${
                investigation.userFeedback?.helpful === false
                  ? 'border-[#ef7770] bg-[rgba(239,119,112,0.08)] text-[#ef7770]'
                  : 'border-border bg-surface-elevated hover:bg-surface-hover hover:border-border-active text-foreground disabled:opacity-40'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" /> Didn&apos;t help
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
