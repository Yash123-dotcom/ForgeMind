
import Link from 'next/link';
import { ArrowRight, Check, CheckCircle2, Shield } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Logo } from '@/components/brand/Logo';
import { Reveal } from '@/components/ui/Reveal';

/* ============================================================
   Diagnostic Scan Visualization
   ============================================================ */

function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="fm-hero-backdrop pointer-events-none absolute inset-0"
    >
      <div className="fm-hero-grid" />

      <div className="fm-hero-wireframe-corner -top-12 -left-12 hidden md:block" />
      <div className="fm-hero-wireframe-corner -top-12 -right-12 hidden md:block" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}

/* ============================================================
   Hero
   ============================================================ */

function Hero() {
  const entrance = 'animate-enter';

  return (
    <section className="relative overflow-hidden border-b border-border py-20 sm:py-28 sm:pb-32">
      <HeroBackground />

      <div className="relative z-10 mx-auto max-w-5xl space-y-8 px-4 text-center sm:px-6 lg:px-8">
        <div
          className={`${entrance} mx-auto inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-[11px] font-mono tracking-wide text-foreground-secondary shadow-xs backdrop-blur-sm`}
        >
          <span className="fm-status-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />

          <span className="font-medium tracking-tight">
            AssetForge Intelligence System
          </span>

          <span className="text-border-active/40">/</span>

          <span className="font-medium text-brand">v0.1 Preview</span>
        </div>

        <h1
          className={`${entrance} mx-auto max-w-4xl text-[clamp(2.5rem,6vw,4.75rem)] font-semibold leading-[1.08] tracking-[-0.05em] text-foreground`}
          style={{ animationDelay: '70ms' }}
        >
          Understand your Unity project.
          <span className="mt-2 block text-brand sm:mt-1">
            <em className="font-medium not-italic sm:italic">
              Solve problems smarter.
            </em>
          </span>
        </h1>

        <p
          className={`${entrance} mx-auto max-w-2xl text-[15px] font-normal leading-7 tracking-[-0.015em] text-foreground-secondary sm:text-lg sm:leading-8`}
          style={{ animationDelay: '140ms' }}
        >
          A specialized diagnostic workspace combining deterministic Unity
          engine rules, stack trace analysis, and context-aware AI to deliver
          traceable root-cause reports.
        </p>

        <div
          className={`${entrance} flex flex-col items-center justify-center gap-3.5 pt-2 sm:flex-row`}
          style={{ animationDelay: '210ms' }}
        >
          <Link
            href="/investigations/new"
            className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-semibold tracking-[-0.01em] text-background shadow-md shadow-brand/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-light active:translate-y-0 active:scale-[0.98] sm:w-auto"
          >
            <span>Start investigating</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/investigations"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium tracking-[-0.01em] text-foreground transition-all duration-200 hover:border-border-active hover:bg-surface-elevated active:scale-[0.98] sm:w-auto"
          >
            View Dashboard
          </Link>
        </div>

        <div
          className={`${entrance} flex flex-wrap items-center justify-center gap-x-7 gap-y-3 pt-6 text-[11px] font-mono tracking-normal text-foreground-muted sm:gap-x-8`}
          style={{ animationDelay: '280ms' }}
        >
          {[
            'Deterministic Rules',
            'Zero Code Execution',
            'Evidence-Backed Reports',
            'Step-by-Step Verification',
          ].map((label) => (
            <span key={label} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
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
    <section className="border-b border-border py-20 sm:py-28">
      <Reveal className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              Product Preview
            </p>

            <h2 className="text-2xl font-semibold leading-tight tracking-[-0.04em] text-foreground sm:text-3xl">
              Structured Diagnostic Report
            </h2>

            <p className="max-w-2xl text-sm leading-7 tracking-[-0.01em] text-foreground-secondary">
              Every investigation separates direct facts, deterministic rules,
              and AI hypotheses.
            </p>
          </div>

          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded border border-[rgba(226,173,84,0.25)] bg-[rgba(226,173,84,0.06)] px-2.5 py-1.5 text-[11px] font-mono tracking-tight text-[#e2ad54]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e2ad54]" />
            Example Mockup — Synthetic Data
          </span>
        </div>

        <div className="fm-surface-card overflow-hidden rounded-lg">
          <div className="flex items-center gap-2 border-b border-border bg-surface-elevated px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef7770]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e2ad54]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand/60" />

            <span className="ml-3 truncate text-[11px] font-mono tracking-tight text-foreground-muted">
              ForgeMind — Example Investigation INV-4821
            </span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface px-5 py-5 sm:px-6">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded border border-brand/20 bg-brand/10 px-1.5 py-0.5 text-[11px] font-mono font-medium tracking-tight text-brand">
                  INV-4821
                </span>

                <h3 className="text-sm font-semibold leading-6 tracking-[-0.02em] text-foreground">
                  Shader error: &lsquo;UniversalForward&rsquo; pass undeclared
                  in Built-in target
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono tracking-tight text-foreground-muted">
                <span>Unity 2022.3 LTS</span>
                <span className="text-border-active">·</span>
                <span>Built-in Pipeline</span>
                <span className="text-border-active">·</span>
                <span>Standalone</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-high rounded px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider">
                High Severity
              </span>

              <span className="rounded border border-brand/20 bg-brand/10 px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-brand">
                High Confidence
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-7 p-5 sm:p-6 lg:grid-cols-3">
            <div className="min-w-0 space-y-6 lg:col-span-2">
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-medium uppercase tracking-[0.15em] text-foreground-muted">
                  Executive Summary
                </p>

                <p className="text-sm leading-7 tracking-[-0.01em] text-foreground-secondary">
                  The custom water shader compiles a{' '}
                  <code className="rounded border border-brand/20 bg-background px-1 py-0.5 text-[12px] font-mono text-brand">
                    UniversalForward
                  </code>{' '}
                  LightMode tag in a Built-in Render Pipeline project, causing a
                  compilation failure and magenta mesh rendering via{' '}
                  <code className="break-words text-[12px] font-mono text-foreground">
                    Hidden/InternalErrorShader
                  </code>
                  .
                </p>
              </div>

              <div className="space-y-2 rounded-md border border-brand/20 bg-brand/5 p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded bg-brand px-1.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-background">
                    Deterministic Rule
                  </span>

                  <span className="break-all font-mono text-[11px] font-semibold tracking-tight text-brand">
                    UNITY-RULE-PIPELINE-MISMATCH
                  </span>
                </div>

                <p className="text-xs leading-6 tracking-[-0.005em] text-foreground-secondary">
                  Detected URP HLSL pass directive{' '}
                  <code className="break-words text-[11px] font-mono text-foreground">
                    LightMode = UniversalForward
                  </code>{' '}
                  in a project configured for the Built-in graphics tier.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono font-medium uppercase tracking-[0.15em] text-foreground-muted">
                  Suggested Code Change
                </p>

                <div className="space-y-1 overflow-x-auto rounded-md border border-border bg-background p-3.5 text-xs font-mono leading-6">
                  <div className="diff-remove break-all rounded-sm px-1.5 py-0.5">
                    {'- Tags { "LightMode" = "UniversalForward" }'}
                  </div>

                  <div className="diff-add break-all rounded-sm px-1.5 py-0.5">
                    {'+ Tags { "LightMode" = "ForwardBase" }'}
                  </div>

                  <div className="diff-remove mt-2 break-all rounded-sm px-1.5 py-0.5">
                    {
                      '- #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"'
                    }
                  </div>

                  <div className="diff-add break-all rounded-sm px-1.5 py-0.5">
                    {'+ #include "UnityCG.cginc"'}
                  </div>
                </div>

                <p className="text-[11px] leading-5 text-foreground-muted">
                  Example only. Validate shader passes, includes, and rendering
                  behavior against the actual project before applying changes.
                </p>
              </div>
            </div>

            <div className="min-w-0 space-y-6 lg:border-l lg:border-border lg:pl-6">
              <div className="space-y-3">
                <p className="text-[10px] font-mono font-medium uppercase tracking-[0.15em] text-foreground-muted">
                  Verification Steps
                </p>

                <div className="space-y-2">
                  {[
                    'Review the shader pass tags and includes for the selected render pipeline.',
                    'Confirm the Unity Editor finishes compilation without errors.',
                    'Check the Scene view and verify the material renders correctly.',
                  ].map((step, i) => (
                    <div
                      key={step}
                      className="flex items-start gap-2.5 rounded-md border border-border bg-surface-elevated p-3 text-xs leading-6 tracking-[-0.005em] text-foreground-secondary"
                    >
                      <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-brand" />
                      <span>
                        <span className="mr-1 font-mono text-foreground-muted">
                          {String(i + 1).padStart(2, '0')}.
                        </span>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-mono font-medium uppercase tracking-[0.15em] text-foreground-muted">
                  Missing Information
                </p>

                <ul className="list-inside list-disc space-y-2 text-xs leading-6 text-foreground-muted marker:text-brand/70">
                  <li>Full GraphicsSettings.asset tier settings</li>
                  <li>Shader target platform keywords</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================
   How It Works
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
    <section className="border-b border-border py-20 sm:py-28">
      <Reveal className="mx-auto max-w-5xl space-y-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            Structured Process
          </p>

          <h2 className="text-2xl font-semibold leading-tight tracking-[-0.04em] text-foreground sm:text-3xl">
            How ForgeMind Works
          </h2>

          <p className="mx-auto max-w-xl text-sm leading-7 tracking-[-0.01em] text-foreground-secondary">
            No generic chat window. A dedicated developer investigation
            workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {HOW_STEPS.map((step) => (
            <div
              key={step.num}
              className="fm-surface-card fm-interactive-card group rounded-lg p-6 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="rounded border border-brand/20 bg-brand/10 px-2 py-1 text-xs font-mono font-semibold tracking-wide text-brand">
                  {step.num}
                </span>

                <div className="h-1.5 w-1.5 rounded-full bg-brand/30 transition-colors duration-200 group-hover:bg-brand" />
              </div>

              <h3 className="mt-5 text-base font-semibold leading-snug tracking-[-0.025em] text-foreground">
                {step.title}
              </h3>

              <p className="mt-3 text-[13px] leading-7 tracking-[-0.005em] text-foreground-secondary">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================
   Privacy Strip
   ============================================================ */

function PrivacyStrip() {
  return (
    <section className="border-b border-border bg-surface/30 py-16 sm:py-20">
      <Reveal className="mx-auto max-w-4xl space-y-5 px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wide text-foreground-secondary">
          <Shield className="h-4 w-4 text-brand" />
          <span>Data Handling &amp; Safety</span>
        </div>

        <h2 className="text-xl font-semibold leading-tight tracking-[-0.035em] text-foreground sm:text-2xl">
          Designed for Proprietary Game Code
        </h2>

        <p className="mx-auto max-w-2xl text-sm leading-7 tracking-[-0.01em] text-foreground-secondary">
          ForgeMind analyzes submitted scripts and logs to help diagnose Unity
          issues. It does not execute arbitrary code on the web host or run
          shell commands. Project files are only available when explicitly
          provided through the product&apos;s supported input workflow.
        </p>
      </Reveal>
    </section>
  );
}

/* ============================================================
   Footer
   ============================================================ */

function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-7">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-foreground-muted sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Logo size="sm" />

          <span className="tracking-[-0.01em]">
            © {new Date().getFullYear()} AssetForge. All rights reserved.
          </span>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          <Link
            href="/investigations"
            className="transition-colors duration-150 hover:text-foreground"
          >
            Dashboard
          </Link>

          <Link
            href="/settings"
            className="transition-colors duration-150 hover:text-foreground"
          >
            Settings
          </Link>

          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono tracking-tight text-foreground-muted/70">
            v0.1.0-mvp
          </span>
        </nav>
      </div>
    </footer>
  );
}

/* ============================================================
   Landing Page — Server Component
   ============================================================ */

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
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
