'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Logo } from '@/components/brand/Logo';
import { ArrowRight, Check, CheckCircle2, Shield } from 'lucide-react';

/* ============================================================
   Diagnostic Scan Visualization (pure CSS, client-only)
   ============================================================ */
function DiagnosticViz() {
  return (
    <div
      aria-hidden
      className="fm-scan-container hidden sm:block absolute inset-0 pointer-events-none overflow-hidden"
    >
      {/* Fine grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#92978f" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Scan sweep line */}
      <div className="fm-scan-line" />
    </div>
  );
}

/* ============================================================
   Hero — animated entrance on mount
   ============================================================ */
function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const baseClass = 'transition-all duration-700';
  const hidden = 'opacity-0 translate-y-4';
  const visible = 'opacity-100 translate-y-0';

  return (
    <section className="relative pt-20 pb-20 sm:pt-28 sm:pb-32 border-b border-border overflow-hidden">
      <DiagnosticViz />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 z-10">
        {/* Pill badge */}
        <div className={`${baseClass} delay-[0ms] ${mounted ? visible : hidden} inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-border bg-surface/80 text-[11px] font-mono tracking-wide text-foreground-secondary backdrop-blur-sm shadow-xs`}>
          <span className="w-1.5 h-1.5 rounded-full bg-brand fm-status-pulse shrink-0" />
          <span className="font-medium tracking-tight">AssetForge Intelligence System</span>
          <span className="text-border-active/40">/</span>
          <span className="text-brand font-medium">v0.1 Preview</span>
        </div>

        {/* H1 with clamp() */}
        <h1
          className={`${baseClass} delay-[80ms] ${mounted ? visible : hidden} text-[clamp(2.25rem,5.5vw,4.25rem)] font-bold tracking-[-0.035em] text-foreground leading-[1.08] max-w-4xl mx-auto`}
          style={{ transitionDelay: '80ms' }}
        >
          Understand your Unity project.{' '}
          <span className="text-brand block mt-1 sm:inline sm:mt-0">Solve problems smarter.</span>
        </h1>

        {/* Subtitle */}
        <p
          className={`${baseClass} ${mounted ? visible : hidden} text-base sm:text-lg text-foreground-secondary max-w-2xl mx-auto leading-relaxed sm:leading-[1.7] tracking-[-0.01em] font-normal`}
          style={{ transitionDelay: '160ms' }}
        >
          A specialized diagnostic workspace combining deterministic Unity engine rules,
          stack&nbsp;trace analysis, and context-aware AI to deliver traceable root-cause reports.
        </p>

        {/* CTAs */}
        <div
          className={`${baseClass} ${mounted ? visible : hidden} pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5`}
          style={{ transitionDelay: '240ms' }}
        >
          <Link
            href="/investigations/new"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-brand text-background hover:bg-brand-light font-medium text-sm tracking-[-0.01em] transition-all duration-150 shadow-md shadow-brand/15 active:scale-[0.98]"
          >
            <span>Start investigating</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/investigations"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-border bg-surface hover:bg-surface-elevated hover:border-border-active text-foreground text-sm font-medium tracking-[-0.01em] transition-all duration-150 active:scale-[0.98]"
          >
            View Dashboard
          </Link>
        </div>

        {/* Trust strip */}
        <div
          className={`${baseClass} ${mounted ? visible : hidden} pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 text-[11px] text-foreground-muted font-mono tracking-normal`}
          style={{ transitionDelay: '320ms' }}
        >
          {[
            'Deterministic Rules',
            'Zero Code Execution',
            'Evidence-Backed Reports',
            'Step-by-Step Verification',
          ].map((label) => (
            <span key={label} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-brand shrink-0" />
              <span>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Report Preview
   ============================================================ */
function ReportPreview() {
  return (
    <section className="py-20 sm:py-28 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-enter delay-100">
        {/* Section label */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-brand font-semibold">
              Product Preview
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-foreground">
              Structured Diagnostic Report
            </h2>
            <p className="text-sm text-foreground-secondary leading-relaxed tracking-[-0.01em]">
              Every investigation separates direct facts, deterministic rules, and AI hypotheses.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[rgba(226,173,84,0.25)] bg-[rgba(226,173,84,0.06)] text-[11px] font-mono tracking-tight text-[#e2ad54] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e2ad54]" />
            Example Mockup — Synthetic Data
          </span>
        </div>

        {/* Preview card */}
        <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-xl shadow-black/30 fm-scan-container">
          {/* Window chrome */}
          <div className="px-4 py-2.5 border-b border-border bg-surface-elevated flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef7770]/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#e2ad54]/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-brand/60" />
            <span className="ml-3 text-[11px] font-mono tracking-tight text-foreground-muted">
              ForgeMind — Investigation INV-4821
            </span>
          </div>

          {/* Report header */}
          <div className="px-5 py-4 border-b border-border bg-surface flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-mono font-medium tracking-tight px-1.5 py-0.5 rounded bg-brand/10 border border-brand/20 text-brand">
                  INV-4821
                </span>
                <h3 className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                  Shader error: &lsquo;UniversalForward&rsquo; pass undeclared in Built-in target
                </h3>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] font-mono tracking-tight text-foreground-muted flex-wrap">
                <span>Unity 2022.3 LTS</span>
                <span className="text-border-active">·</span>
                <span>Built-in Pipeline</span>
                <span className="text-border-active">·</span>
                <span>Standalone</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-high text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
                High Severity
              </span>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded text-brand bg-brand/10 border border-brand/20">
                High Confidence
              </span>
            </div>
          </div>

          {/* Report body */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Summary */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-foreground-muted font-medium">
                  Executive Summary
                </p>
                <p className="text-sm text-foreground leading-[1.65] tracking-[-0.01em]">
                  The custom water shader compiles a{' '}
                  <code className="text-brand font-mono text-[12px] px-1 py-0.5 bg-background rounded border border-brand/20">
                    UniversalForward
                  </code>{' '}
                  LightMode tag in a Built-in Render Pipeline project, causing a compilation failure and magenta
                  mesh rendering via{' '}
                  <code className="font-mono text-[12px] text-foreground-secondary">
                    Hidden/InternalErrorShader
                  </code>.
                </p>
              </div>

              {/* Rule finding */}
              <div className="p-3.5 rounded border border-brand/20 bg-brand/5 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-brand text-background text-[10px] uppercase tracking-wider">
                    Deterministic Rule
                  </span>
                  <span className="font-mono text-brand font-semibold tracking-tight">UNITY-RULE-PIPELINE-MISMATCH</span>
                </div>
                <p className="text-xs text-foreground-secondary leading-[1.6] tracking-[-0.005em]">
                  Detected URP HLSL pass directive{' '}
                  <code className="font-mono text-[11px] text-foreground">
                    LightMode = UniversalForward
                  </code>{' '}
                  in a project configured for the Built-in graphics tier.
                </p>
              </div>

              {/* Code diff */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-foreground-muted font-medium">
                  Suggested Code Change
                </p>
                <div className="rounded border border-border bg-background p-3.5 font-mono text-xs leading-[1.7] space-y-1 overflow-x-auto">
                  <div className="diff-remove px-1 rounded-sm">{'- Tags { "LightMode" = "UniversalForward" }'}</div>
                  <div className="diff-add    px-1 rounded-sm">{'+ Tags { "LightMode" = "ForwardBase" }'}</div>
                  <div className="diff-remove px-1 rounded-sm mt-1">
                    {'- #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"'}
                  </div>
                  <div className="diff-add    px-1 rounded-sm">{'+ #include "UnityCG.cginc"'}</div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5 lg:border-l lg:border-border lg:pl-6">
              <div className="space-y-2.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-foreground-muted font-medium">
                  Verification Steps
                </p>
                <div className="space-y-2">
                  {[
                    'Replace pass tags and save shader in Assets/Shaders.',
                    'Confirm Unity Editor finishes compilation with 0 errors.',
                    'Check Scene view — material must no longer render magenta.',
                  ].map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded border border-border bg-surface-elevated text-xs leading-[1.5] text-foreground-secondary tracking-[-0.005em]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                      <span>{i + 1}. {step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-foreground-muted font-medium">
                  Missing Information
                </p>
                <ul className="text-xs text-foreground-muted space-y-1.5 list-disc list-inside leading-[1.5] tracking-[-0.005em]">
                  <li>Full GraphicsSettings.asset tier settings</li>
                  <li>Shader target platform keywords</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   How it Works
   ============================================================ */
const HOW_STEPS = [
  {
    num: '01',
    title: 'Collect Unity Context',
    desc: 'Paste console errors, stack traces, C# scripts, Unity version, and render pipeline. Optionally attach manifest.json or shader files.',
  },
  {
    num: '02',
    title: 'Deterministic + AI Pipeline',
    desc: 'A rules engine checks assembly namespaces, package manifests, and shader compatibility before context reaches the AI provider.',
  },
  {
    num: '03',
    title: 'Traceable Verification',
    desc: 'Receive an actionable report with evidence-backed root cause, copyable code patches, and step-by-step Unity Editor verification.',
  },
];

function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2.5">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-brand font-semibold">
            Structured Process
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-foreground">
            How ForgeMind Works
          </h2>
          <p className="text-sm text-foreground-secondary max-w-xl mx-auto leading-relaxed tracking-[-0.01em]">
            No generic chat window. A dedicated developer investigation workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {HOW_STEPS.map((step) => (
            <div
              key={step.num}
              className="p-6 rounded-lg border border-border bg-surface hover:bg-surface-elevated hover:border-border-active transition-all duration-200 space-y-3.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded tracking-wide">
                  {step.num}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-brand/30 group-hover:bg-brand transition-colors duration-200" />
              </div>
              <h3 className="text-sm font-semibold tracking-[-0.01em] text-foreground">{step.title}</h3>
              <p className="text-xs text-foreground-secondary leading-[1.65] tracking-[-0.005em]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Privacy strip
   ============================================================ */
function PrivacyStrip() {
  return (
    <section className="py-16 border-b border-border bg-surface/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wide text-foreground-secondary">
          <Shield className="w-4 h-4 text-brand" />
          <span>Data Handling &amp; Safety</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] text-foreground">
          Designed for Proprietary Game Code
        </h2>
        <p className="text-sm text-foreground-secondary leading-relaxed sm:leading-[1.7] tracking-[-0.01em] max-w-2xl mx-auto">
          ForgeMind processes submitted scripts and logs in-memory on the server. We never execute
          arbitrary code on the web host, never run shell commands, and never claim local project
          file access unless files are explicitly provided by you.
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   Footer
   ============================================================ */
function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-7">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="tracking-[-0.01em]">© {new Date().getFullYear()} AssetForge. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/investigations" className="hover:text-foreground tracking-[-0.01em] transition-colors duration-150">
            Investigations
          </Link>
          <Link href="/settings" className="hover:text-foreground tracking-[-0.01em] transition-colors duration-150">
            Configuration
          </Link>
          <span className="font-mono text-[10px] text-foreground-muted/70 border border-border rounded px-1.5 py-0.5 tracking-tight">
            v0.1.0-mvp
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Page
   ============================================================ */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ReportPreview />
        <HowItWorks />
        <PrivacyStrip />
      </main>
      <Footer />
    </div>
  );
}
