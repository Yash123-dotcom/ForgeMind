
'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import type { Investigation } from '@/lib/types';
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
  Play,
  Pause,
  Square,
  Volume2,
} from 'lucide-react';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">
      {children}
    </p>
  );
}

function SourcePill({
  origin,
}: {
  origin: 'direct_fact' | 'deterministic_rule' | 'ai_hypothesis' | string;
}) {
  const configs: Record<string, { label: string; cls: string }> = {
    direct_fact: {
      label: 'Direct Fact',
      cls: 'text-[#4e97ff] bg-[rgba(78,151,255,0.08)] border-[rgba(78,151,255,0.2)]',
    },
    deterministic_rule: {
      label: 'Deterministic Rule',
      cls: 'text-brand bg-brand/8 border-brand/20',
    },
    ai_hypothesis: {
      label: 'AI Hypothesis',
      cls: 'text-[#e2ad54] bg-[rgba(226,173,84,0.06)] border-[rgba(226,173,84,0.2)]',
    },
  };

  const config = configs[origin] ?? {
    label: origin,
    cls: 'text-foreground-muted border-border',
  };

  return (
    <span
      className={`inline-flex text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${config.cls}`}
    >
      {config.label}
    </span>
  );
}

function CopyButton({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
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

function VerificationItem({
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
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`fm-check-row w-full text-left p-3 rounded border cursor-pointer select-none transition-all duration-150 ${
        checked
          ? 'checked'
          : 'border-border bg-surface-elevated hover:bg-surface-hover'
      }`}
    >
      <span className="flex items-start gap-3">
        <span
          className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all duration-150 ${
            checked ? 'bg-brand border-brand' : 'border-border bg-surface'
          }`}
        >
          {checked && (
            <svg
              viewBox="0 0 10 10"
              fill="none"
              className="w-2.5 h-2.5"
              aria-hidden="true"
            >
              <path
                d="M2 5l2 2 4-4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>

        <span className="space-y-1 flex-1">
          <span
            className={`block text-xs font-medium transition-colors duration-150 ${
              checked
                ? 'line-through text-foreground-muted'
                : 'text-foreground'
            }`}
          >
            {instruction}
          </span>

          <span className="block text-[11px] text-foreground-secondary">
            <span className="text-brand font-semibold">Expected: </span>
            {expectedOutcome}
          </span>
        </span>
      </span>
    </button>
  );
}

/**
 * Browser-native voice narration for a diagnostic report.
 * No external voice API or additional package is required.
 */
function VoiceOutput({
  title,
  rootCause,
  recommendedFix,
  executiveSummary,
}: {
  title: string;
  rootCause: string;
  recommendedFix: string[];
  executiveSummary: string;
}) {
  const [status, setStatus] = useState<
    'idle' | 'speaking' | 'paused'
  >('idle');
  const [message, setMessage] = useState(
    'Playback starts only when you press Play.',
  );

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sessionRef = useRef(0);

  useEffect(() => {
    return () => {
      // Invalidate pending callbacks before stopping speech.
      sessionRef.current += 1;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const buildSpeechText = () => {
    const fixes =
      recommendedFix.length > 0
        ? `Recommended fixes. ${recommendedFix
            .map((step, index) => `Step ${index + 1}. ${step}`)
            .join('. ')}`
        : 'No recommended fix steps were provided.';

    return [
      `ForgeMind diagnostic report: ${title}.`,
      `Executive summary. ${executiveSummary}`,
      `Likely root cause. ${rootCause}`,
      fixes,
      'Please verify the proposed diagnosis and changes in your Unity project before applying them.',
    ]
      .filter(Boolean)
      .join('\n\n');
  };

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) {
      setMessage(
        'Speech playback is not supported in this browser. Try a recent version of Chrome or Edge.',
      );
      return;
    }

    if (status === 'paused') {
      window.speechSynthesis.resume();
      setStatus('speaking');
      setMessage('Resuming diagnostic narration.');
      return;
    }

    if (status === 'speaking') return;

    const text = buildSpeechText().trim();

    if (!text) {
      setMessage('There is no report content available to read.');
      return;
    }

    // Invalidate any previous utterance callbacks.
    const session = ++sessionRef.current;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      if (sessionRef.current !== session) return;

      setStatus('speaking');
      setMessage('Reading your diagnostic report.');
    };

    utterance.onend = () => {
      if (sessionRef.current !== session) return;

      utteranceRef.current = null;
      setStatus('idle');
      setMessage('Narration completed.');
    };

    utterance.onerror = (event) => {
      if (sessionRef.current !== session) return;

      utteranceRef.current = null;
      setStatus('idle');

      if (
        event.error === 'canceled' ||
        event.error === 'interrupted'
      ) {
        setMessage('Narration stopped.');
      } else {
        setMessage('Speech playback failed. Please try again.');
      }
    };

    utteranceRef.current = utterance;
    setMessage('Preparing narration.');
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (!('speechSynthesis' in window)) return;
    if (status !== 'speaking') return;

    window.speechSynthesis.pause();
    setStatus('paused');
    setMessage('Narration paused.');
  };

  const handleStop = () => {
    // Invalidate callbacks from the active utterance.
    sessionRef.current += 1;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    utteranceRef.current = null;
    setStatus('idle');
    setMessage('Narration stopped.');
  };

  return (
    <section
      aria-label="Voice narration"
      className="rounded-lg border border-brand/20 bg-brand/5 p-4 sm:p-5 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg border border-brand/20 bg-brand/10 flex items-center justify-center shrink-0">
          <Volume2 className="w-4 h-4 text-brand" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            Listen to your diagnosis
          </h2>
          <p className="text-xs text-foreground-secondary mt-1 leading-relaxed">
            Listen to the executive summary, likely root cause, and
            recommended fixes. Verify the diagnosis in your Unity
            project before applying changes.
          </p>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted shrink-0">
          {status === 'speaking'
            ? 'Playing'
            : status === 'paused'
              ? 'Paused'
              : 'Voice'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePlay}
          disabled={status === 'speaking'}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-brand text-background hover:bg-brand-light text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'paused' ? (
            <Play className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {status === 'paused' ? 'Resume' : 'Play narration'}
        </button>

        <button
          type="button"
          onClick={handlePause}
          disabled={status !== 'speaking'}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-surface hover:bg-surface-elevated text-xs font-medium text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Pause className="w-3.5 h-3.5" />
          Pause
        </button>

        <button
          type="button"
          onClick={handleStop}
          disabled={status === 'idle'}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-surface hover:bg-surface-elevated text-xs font-medium text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Square className="w-3 h-3" />
          Stop
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="text-[11px] text-foreground-muted min-h-4"
      >
        {message}
      </p>
    </section>
  );
}

export default function ReportPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [investigation, setInvestigation] =
    useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const [feedbackState, setFeedbackState] = useState<
    'idle' | 'submitting' | 'done'
  >('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Missing investigation ID.');
      return;
    }

    let cancelled = false;

    async function loadInvestigation() {
      try {
        const response = await fetch(`/api/investigations/${id}`);
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok || !data.success) {
          setError(data.error || 'Unable to load this investigation.');
          return;
        }

        setInvestigation(data.data);
        setError(null);
      } catch {
        if (!cancelled) {
          setError(
            'Unable to load the report. Check your connection and retry.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInvestigation();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleFeedback = async (helpful: boolean) => {
    if (!id || feedbackState !== 'idle') return;

    setFeedbackState('submitting');
    setFeedbackMessage(null);

    try {
      const response = await fetch(`/api/investigations/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.success === false) {
        throw new Error('Feedback could not be saved.');
      }

      setInvestigation((previous) =>
        previous
          ? {
              ...previous,
              userFeedback: {
                helpful,
                feedbackAt: new Date().toISOString(),
              },
            }
          : null,
      );

      setFeedbackMessage(
        helpful ? 'Marked as helpful — thank you!' : 'Feedback recorded.',
      );
      setFeedbackState('done');
    } catch {
      setFeedbackMessage('Feedback could not be saved. Please try again.');
      setFeedbackState('idle');
    }
  };

  const handleExport = () => {
    if (!investigation?.report) return;

    const r = investigation.report;

    const ruleFindings = r.ruleBasedFindings
      .map(
        (rule) =>
          `### ${rule.title} (${rule.ruleId})\n\n` +
          `- Severity: ${rule.severity}\n` +
          `- Finding: ${rule.finding}\n` +
          `- Evidence: ${rule.evidence}\n` +
          `- Next step: ${rule.suggestedNextStep}`,
      )
      .join('\n\n');

    const evidence = r.evidence
      .map(
        (item, index) =>
          `### Evidence ${index + 1}\n\n` +
          `${item.location ? `Location: ${item.location}\n\n` : ''}` +
          `\`\`\`text\n${item.content}\n\`\`\`\n\n` +
          `Significance: ${item.significance}`,
      )
      .join('\n\n');

    const fixes = r.recommendedFix
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n');

    const patches = r.suggestedCodeChanges
      .map(
        (change) =>
          `### ${change.fileName || 'Recommended Change'}\n\n` +
          `${change.explanation ? `${change.explanation}\n\n` : ''}` +
          `\`\`\`\n${change.proposedSnippet}\n\`\`\``,
      )
      .join('\n\n');

    const checklist = r.verificationSteps
      .map(
        (step) =>
          `- [ ] ${step.instruction}\n  - Expected outcome: ${step.expectedOutcome}`,
      )
      .join('\n');

    const alternativeCauses = r.alternativeCauses
      .map((cause) => `- ${cause}`)
      .join('\n');

    const missingInformation = r.missingInformation
      .map((item) => `- ${item}`)
      .join('\n');

    const md = `# ForgeMind Diagnostic Report

**Title:** ${investigation.title}
**Date:** ${formatDate(investigation.createdAt)}
**Unity Version:** ${investigation.unityVersion}
**Render Pipeline:** ${investigation.renderPipeline.toUpperCase()}
**Target Platform:** ${investigation.targetPlatform || 'Not specified'}
**Severity:** ${r.severity.toUpperCase()}
**Confidence:** ${r.confidence.level.toUpperCase()}
**Analysis Mode:** ${r.analysisMode}

---

## Original Unity Error

\`\`\`text
${investigation.errorMessage}
\`\`\`

## Likely Root Cause

${r.likelyRootCause}

> Treat the proposed cause as a diagnosis to verify against your project and the evidence below.

## Recommended Fix

${fixes}

## Deterministic Rule Findings

${ruleFindings || 'No deterministic rule findings were recorded.'}

## Observed Evidence

${evidence || 'No separate evidence items were recorded.'}

## Suggested Code Changes

${patches || 'No code patch was suggested.'}

## Verification Checklist

${checklist || 'No verification steps were recorded.'}

## Alternative Hypotheses

${alternativeCauses || 'No alternative hypotheses were recorded.'}

## Missing Context

${missingInformation || 'No additional context was listed.'}

## Executive Summary

${r.executiveSummary}

## Confidence Calibration

${r.confidence.calibrationReasoning}

---

Generated by ForgeMind.
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `ForgeMind-${investigation.id.slice(0, 8)}.md`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-foreground-secondary">
            Loading diagnostic report…
          </p>
        </div>
      </AppShell>
    );
  }

  if (error || !investigation) {
    return (
      <AppShell>
        <div className="py-16 flex flex-col items-center gap-4 text-center">
          <XCircle className="w-10 h-10 text-[#ef7770]" />
          <h2 className="text-lg font-semibold text-foreground">
            Investigation Not Found
          </h2>
          <p className="max-w-md text-sm text-foreground-secondary">
            {error || 'This investigation could not be found.'}
          </p>
          <Link
            href="/investigations"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border bg-surface hover:bg-surface-elevated text-sm font-medium text-foreground transition-all duration-150"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Investigations
          </Link>
        </div>
      </AppShell>
    );
  }

  const report = investigation.report;

  if (!report) {
    return (
      <AppShell>
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-[#e2ad54]" />
          <h2 className="text-base font-semibold text-foreground">
            Report Pending
          </h2>
          <p className="text-sm text-foreground-secondary">
            This investigation does not have a completed report yet.
          </p>
          <Link
            href="/investigations"
            className="text-xs text-brand hover:underline"
          >
            Return to investigations
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-start gap-3 min-w-0">
            <Link
              href="/investigations"
              aria-label="Back to investigations"
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

              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground break-words">
                {investigation.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pl-9 sm:pl-0">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface hover:bg-surface-elevated text-xs font-mono text-foreground-secondary hover:text-foreground transition-all duration-150"
            >
              <Download className="w-3.5 h-3.5" />
              Export .md
            </button>

            <Link
              href="/investigations/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-brand text-background hover:bg-brand-light text-xs font-semibold transition-all duration-150"
            >
              New Diagnostic
            </Link>
          </div>
        </header>

        {/* Metadata */}
        <section className="p-4 rounded-lg border border-border bg-surface space-y-3">
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
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">
                Confidence calibration:{' '}
              </span>
              {report.confidence.calibrationReasoning}
            </p>
          </div>
        </section>

        {/* Voice narration */}
        <VoiceOutput
          title={investigation.title}
          rootCause={report.likelyRootCause}
          recommendedFix={report.recommendedFix}
          executiveSummary={report.executiveSummary}
        />

        {/* 1. Original error */}
        <section className="rounded-lg border border-[#ef7770]/25 bg-surface overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ef7770] shrink-0" />
              <h2 className="text-sm font-semibold text-foreground">
                Original Unity Error
              </h2>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted">
              Submitted input
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <pre className="font-mono text-xs sm:text-sm text-foreground bg-background p-4 rounded-md border border-border overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
              {investigation.errorMessage}
            </pre>
          </div>
        </section>

        {/* 2. Root cause */}
        <section className="p-5 rounded-lg border border-border bg-surface space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Likely Root Cause
            </h2>

            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#e2ad54]">
              <ShieldAlert className="w-3.5 h-3.5" />
              Verify in Unity
            </span>
          </div>

          <p className="text-sm text-foreground leading-relaxed">
            {report.likelyRootCause}
          </p>

          <p className="text-xs text-foreground-muted leading-relaxed">
            This is the proposed cause based on the available input and
            analysis. Confirm it against the evidence and your Unity project
            before applying changes.
          </p>
        </section>

        {/* 3. Recommended fix */}
        <section className="p-5 rounded-lg border border-brand/20 bg-brand/5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
            <h2 className="text-sm font-semibold text-foreground">
              Recommended Fix
            </h2>
          </div>

          {report.recommendedFix.length > 0 ? (
            <ol className="space-y-3">
              {report.recommendedFix.map((step, index) => (
                <li key={`${index}-${step}`} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-md border border-brand/30 bg-brand/10 flex items-center justify-center text-xs font-mono font-semibold text-brand shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm text-foreground leading-relaxed pt-0.5">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-foreground-secondary">
              No fix steps were provided for this report.
            </p>
          )}
        </section>

        {/* 4. Deterministic rule findings */}
        {report.ruleBasedFindings.length > 0 && (
          <section className="p-5 rounded-lg border border-brand/20 bg-brand/5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand text-background uppercase">
                  Rule matched
                </span>
                <h2 className="text-sm font-semibold text-foreground">
                  Unity Rules Engine Findings
                </h2>
              </div>

              <span className="text-[11px] font-mono text-brand">
                {report.ruleBasedFindings.length}{' '}
                {report.ruleBasedFindings.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            <p className="text-xs text-foreground-secondary leading-relaxed">
              These findings come from ForgeMind&apos;s deterministic rules.
              A rule match is evidence of a detected pattern, not proof that
              every aspect of the diagnosis is correct.
            </p>

            <div className="space-y-2.5">
              {report.ruleBasedFindings.map((rule) => (
                <article
                  key={rule.ruleId}
                  className="p-3.5 rounded border border-border bg-surface space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-mono font-semibold text-foreground">
                      [{rule.ruleId}] {rule.title}
                    </span>
                    <SeverityBadge level={rule.severity as any} />
                  </div>

                  <p className="text-xs text-foreground-secondary leading-relaxed">
                    {rule.finding}
                  </p>

                  <div className="p-2 rounded bg-background font-mono text-[11px] text-brand border border-brand/15 whitespace-pre-wrap break-words">
                    <span className="font-semibold">Evidence: </span>
                    {rule.evidence}
                  </div>

                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    <span className="font-semibold text-foreground-secondary">
                      Next step:{' '}
                    </span>
                    {rule.suggestedNextStep}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 5. Observed evidence */}
        {report.evidence.length > 0 && (
          <section className="space-y-3">
            <SectionLabel>Observed Evidence</SectionLabel>

            <div className="space-y-2">
              {report.evidence.map((item, index) => (
                <article
                  key={`${item.location || 'evidence'}-${index}`}
                  className="p-3 rounded border border-border bg-surface space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono flex-wrap gap-2">
                    <SourcePill origin="direct_fact" />

                    {item.location && (
                      <span className="text-foreground-muted">
                        {item.location}
                      </span>
                    )}
                  </div>

                  <pre className="font-mono text-xs text-foreground bg-background p-3 rounded overflow-x-auto whitespace-pre-wrap break-words border border-border leading-relaxed">
                    {item.content}
                  </pre>

                  <p className="text-[11px] text-foreground-secondary leading-relaxed">
                    {item.significance}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 6. Suggested code changes */}
        {report.suggestedCodeChanges.length > 0 && (
          <section className="space-y-3">
            <SectionLabel>Suggested Code Patch</SectionLabel>

            <div className="space-y-4">
              {report.suggestedCodeChanges.map((change, index) => (
                <article
                  key={`${change.fileName || 'patch'}-${index}`}
                  className="rounded-lg border border-border bg-surface overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-border bg-surface-elevated flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-foreground min-w-0">
                      <FileCode className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span className="truncate">
                        {change.fileName || 'Recommended Change'}
                      </span>
                    </div>

                    <CopyButton text={change.proposedSnippet} />
                  </div>

                  <pre className="p-4 bg-background font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
                    {change.proposedSnippet}
                  </pre>

                  {change.explanation && (
                    <div className="px-4 py-3 border-t border-border bg-surface text-xs text-foreground-secondary leading-relaxed">
                      <span className="font-semibold text-foreground-secondary">
                        Rationale:{' '}
                      </span>
                      {change.explanation}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 7. Verification checklist */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <SectionLabel>Verification Checklist</SectionLabel>

            <span className="text-[11px] text-foreground-muted">
              Check each step after testing in Unity
            </span>
          </div>

          <div className="space-y-2">
            {report.verificationSteps.map((step) => (
              <VerificationItem
                key={step.id}
                id={step.id}
                instruction={step.instruction}
                expectedOutcome={step.expectedOutcome}
                checked={!!checkedSteps[step.id]}
                onToggle={() =>
                  setCheckedSteps((previous) => ({
                    ...previous,
                    [step.id]: !previous[step.id],
                  }))
                }
              />
            ))}
          </div>

          {report.verificationSteps.length > 0 && (
            <p className="text-[11px] font-mono text-foreground-muted text-right">
              {report.verificationSteps.filter((step) => checkedSteps[step.id])
                .length}{' '}
              / {report.verificationSteps.length} steps checked
            </p>
          )}
        </section>

        {/* 8. Secondary diagnostic details */}
        <section className="space-y-3">
          <SectionLabel>Additional Diagnostic Context</SectionLabel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-lg border border-border bg-surface space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                Alternative Hypotheses
              </h2>

              {report.alternativeCauses.length > 0 ? (
                <ul className="text-xs text-foreground-secondary space-y-2">
                  {report.alternativeCauses.map((cause, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 leading-relaxed"
                    >
                      <span className="w-1 h-1 rounded-full bg-foreground-muted shrink-0 mt-1.5" />
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-foreground-muted">
                  No alternative hypotheses were recorded.
                </p>
              )}
            </div>

            <div className="p-5 rounded-lg border border-border bg-surface space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                Missing Context
              </h2>

              {report.missingInformation.length > 0 ? (
                <ul className="text-xs text-foreground-secondary space-y-2">
                  {report.missingInformation.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 leading-relaxed"
                    >
                      <span className="w-1 h-1 rounded-full bg-brand/50 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-foreground-muted">
                  No additional context was listed.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 9. Executive summary */}
        <details className="rounded-lg border border-border bg-surface group">
          <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3 text-xs font-mono text-foreground-secondary hover:text-foreground">
            <span>Executive Summary</span>
            <span className="text-foreground-muted group-open:rotate-180 transition-transform">
              ↓
            </span>
          </summary>

          <div className="px-4 pb-4 space-y-3">
            <p className="text-sm text-foreground-secondary leading-relaxed">
              {report.executiveSummary}
            </p>

            <div className="border-t border-border pt-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">
                Confidence Calibration
              </p>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                {report.confidence.calibrationReasoning}
              </p>
            </div>
          </div>
        </details>

        {/* Feedback */}
        <section className="p-5 rounded-lg border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Did this diagnosis help resolve the problem?
            </p>
            <p className="text-xs text-foreground-secondary">
              Your feedback helps us evaluate diagnostic usefulness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {feedbackMessage && (
              <span
                role="status"
                className="text-xs text-foreground-secondary"
              >
                {feedbackMessage}
              </span>
            )}

            <button
              type="button"
              onClick={() => void handleFeedback(true)}
              disabled={
                feedbackState !== 'idle' ||
                investigation.userFeedback?.helpful === true
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-150 disabled:opacity-40 ${
                investigation.userFeedback?.helpful === true
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border bg-surface-elevated hover:bg-surface-hover hover:border-border-active text-foreground'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              This helped
            </button>

            <button
              type="button"
              onClick={() => void handleFeedback(false)}
              disabled={
                feedbackState !== 'idle' ||
                investigation.userFeedback?.helpful === false
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-150 disabled:opacity-40 ${
                investigation.userFeedback?.helpful === false
                  ? 'border-[#ef7770] bg-[rgba(239,119,112,0.08)] text-[#ef7770]'
                  : 'border-border bg-surface-elevated hover:bg-surface-hover hover:border-border-active text-foreground'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              Didn&apos;t help
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
