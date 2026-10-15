'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { DiagnosticProgress } from '@/components/ui/DiagnosticProgress';
import {
  UnityRenderPipeline,
  UnityVersion,
  TargetPlatform,
  UploadedFileContext,
} from '@/lib/types';
import {
  ArrowRight,
  UploadCloud,
  FileCode,
  X,
  AlertCircle,
  Sparkles,
  Cpu,
} from 'lucide-react';

/* ─── Sample starter scenarios ───────────────────────────────────────────── */
const SAMPLE_CASES = [
  {
    name: 'CS0246: TMPro Missing',
    title: 'CS0246 Unresolved namespace: TextMeshProUGUI in DamagePopup.cs',
    error: `Assets/Scripts/UI/DamagePopup.cs(14,13): error CS0246: The type or namespace name 'TextMeshProUGUI' could not be found (are you missing a using directive or an assembly reference?)
Assets/Scripts/UI/DamagePopup.cs(22,9): error CS0103: The name 'damageText' does not exist in the current context`,
    code: `using UnityEngine;\n\npublic class DamagePopup : MonoBehaviour\n{\n    [SerializeField] private TextMeshProUGUI damageText;\n\n    public void Setup(int damageAmount)\n    {\n        damageText.text = damageAmount.ToString();\n    }\n}`,
    version: '2022.3 LTS' as UnityVersion,
    pipeline: 'urp' as UnityRenderPipeline,
    platform: 'Standalone (Windows/Mac/Linux)' as TargetPlatform,
    files: [] as UploadedFileContext[],
  },
  {
    name: 'Pipeline: URP shader in Built-in',
    title: 'Shader compile failure: UniversalForward in Built-in project',
    error: `Shader error in 'Custom/WaterSurface': 'UniversalForward' pass undeclared or invalid LightMode for current pipeline at line 24 (on d3d11)
WARNING: Shader is falling back to Hidden/InternalErrorShader (Rendering magenta).`,
    code: `Shader "Custom/WaterSurface"\n{\n    SubShader\n    {\n        Tags { "RenderPipeline"="UniversalPipeline" }\n        Pass\n        {\n            Tags { "LightMode"="UniversalForward" }\n            HLSLPROGRAM\n            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"\n            ENDHLSL\n        }\n    }\n}`,
    version: '2022.3 LTS' as UnityVersion,
    pipeline: 'builtin' as UnityRenderPipeline,
    platform: 'Standalone (Windows/Mac/Linux)' as TargetPlatform,
    files: [],
  },
  {
    name: 'NullReferenceException in Start()',
    title: 'NullReferenceException when accessing Camera reference in PlayerMovement.Start()',
    error: `NullReferenceException: Object reference not set to an instance of an object\n  at PlayerMovement.Start () [0x00018] in Assets/Scripts/PlayerMovement.cs:28`,
    code: `using UnityEngine;\n\npublic class PlayerMovement : MonoBehaviour\n{\n    [SerializeField] private Camera playerCamera;\n    private Vector3 cameraOffset;\n\n    void Start()\n    {\n        cameraOffset = transform.position - playerCamera.transform.position;\n    }\n}`,
    version: '6000.0 (Unity 6)' as UnityVersion,
    pipeline: 'urp' as UnityRenderPipeline,
    platform: 'Standalone (Windows/Mac/Linux)' as TargetPlatform,
    files: [],
  },
  {
    name: 'Manifest: Missing InputSystem',
    title: 'CS0246 UnityEngine.InputSystem missing from Packages/manifest.json',
    error: `Assets/Scripts/PlayerController.cs(6,7): error CS0246: The type or namespace name 'UnityEngine' could not be found — are you missing 'using UnityEngine.InputSystem;'?`,
    code: `using UnityEngine;\nusing UnityEngine.InputSystem;\n\npublic class PlayerController : MonoBehaviour\n{\n    public InputActionReference moveAction;\n}`,
    version: '2023.3 LTS' as UnityVersion,
    pipeline: 'urp' as UnityRenderPipeline,
    platform: 'Standalone (Windows/Mac/Linux)' as TargetPlatform,
    files: [
      {
        name: 'manifest.json',
        size: 300,
        type: 'application/json',
        content: JSON.stringify(
          {
            dependencies: {
              'com.unity.collab-proxy': '2.0.5',
              'com.unity.render-pipelines.universal': '14.0.9',
              'com.unity.textmeshpro': '3.0.6',
            },
          },
          null,
          2
        ),
      },
    ],
  },
];

const STAGES = [
  'Validating parameters & uploaded evidence',
  'Running deterministic Unity rules engine',
  'Synthesizing diagnostic context with AI provider',
  'Compiling evidence-backed report & verification steps',
];

/* ─── Field wrapper ──────────────────────────────────────────────────────── */
function Field({
  label,
  required,
  hint,
  children,
  charCount,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  charCount?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-mono uppercase tracking-widest text-foreground-secondary">
          {label}
          {required && <span className="text-brand ml-1">*</span>}
        </label>
        <div className="flex items-center gap-3 text-[11px] font-mono text-foreground-muted">
          {hint && <span>{hint}</span>}
          {charCount !== undefined && <span>{charCount.toLocaleString()} chars</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function NewInvestigationPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [unityVersion, setUnityVersion] = useState<UnityVersion>('2022.3 LTS');
  const [renderPipeline, setRenderPipeline] = useState<UnityRenderPipeline>('urp');
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>('Standalone (Windows/Mac/Linux)');
  const [attachedFiles, setAttachedFiles] = useState<UploadedFileContext[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const applySample = (s: (typeof SAMPLE_CASES)[0]) => {
    setTitle(s.title);
    setErrorMessage(s.error);
    setCodeSnippet(s.code);
    setUnityVersion(s.version);
    setRenderPipeline(s.pipeline);
    setTargetPlatform(s.platform);
    setAttachedFiles(s.files);
    setValidationError(null);
  };

  const processFiles = (fileList: FileList) => {
    const allowed = ['.cs', '.json', '.shader', '.hlsl', '.txt', '.log', '.asmdef'];
    const maxSize = 2 * 1024 * 1024;

    for (let i = 0; i < fileList.length; i++) {
      if (attachedFiles.length >= 5) {
        setValidationError('Maximum 5 files per investigation.');
        return;
      }
      const file = fileList[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowed.includes(ext)) {
        setValidationError(`Unsupported extension ${ext}. Allowed: ${allowed.join(', ')}`);
        continue;
      }
      if (file.size > maxSize) {
        setValidationError(`"${file.name}" exceeds the 2 MB limit.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachedFiles((prev) => [
          ...prev,
          { name: file.name, size: file.size, type: file.type || 'text/plain', content: e.target?.result as string },
        ]);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (title.trim().length < 3) {
      setValidationError('Title must be at least 3 characters.');
      return;
    }
    if (errorMessage.trim().length < 5) {
      setValidationError('Please paste the Unity console error or stack trace.');
      return;
    }

    setIsSubmitting(true);
    setCurrentStage(0);

    const interval = setInterval(() => {
      setCurrentStage((p) => (p < STAGES.length - 1 ? p + 1 : p));
    }, 1400);

    try {
      const res = await fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          errorMessage: errorMessage.trim(),
          codeSnippet: codeSnippet.trim() || undefined,
          projectContext: projectContext.trim() || undefined,
          unityVersion,
          renderPipeline,
          targetPlatform,
          attachedFiles,
        }),
      });
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Investigation failed');
      router.push(`/investigations/${data.data.id}`);
    } catch (err: any) {
      clearInterval(interval);
      setIsSubmitting(false);
      setValidationError(err.message || 'Diagnostic failed. Check your inputs and try again.');
    }
  };

  /* Select class helper */
  const selectClass =
    'fm-input w-full px-3 py-2 rounded-md border border-border bg-surface text-xs font-mono text-foreground cursor-pointer';

  /* Textarea class helper */
  const textareaClass =
    'fm-input w-full p-3 rounded-md border border-border bg-surface font-mono text-xs text-foreground placeholder:text-foreground-muted leading-relaxed resize-y min-h-[100px]';

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-border animate-enter">
          <div className="flex items-center gap-2 text-[11px] font-mono text-brand mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>DIAGNOSTIC WORKBENCH</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            New Unity Project Investigation
          </h1>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Submit a console error or stack trace with project context to generate an evidence-backed diagnostic report.
          </p>
        </div>

        {/* Starter scenarios */}
        <div className="p-3.5 rounded-lg border border-border bg-surface animate-enter delay-100">
          <div className="flex items-center gap-1.5 text-xs text-foreground-secondary mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span className="font-mono">Load a sample scenario:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_CASES.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applySample(s)}
                className="px-2.5 py-1 text-[11px] font-mono rounded border border-border bg-surface-elevated hover:bg-surface-hover hover:border-brand/40 hover:text-brand text-foreground-secondary transition-all duration-150"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="flex items-center gap-2.5 p-3 rounded-md border border-[rgba(239,119,112,0.3)] bg-[rgba(239,119,112,0.08)] text-[#ef7770] text-xs animate-scale-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* ── Loading State ────────────────────────────────────────────────── */}
        {isSubmitting ? (
          <div className="py-12 px-6 rounded-lg border border-border bg-surface text-center space-y-8 animate-scale-in">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Analyzing Investigation
              </h3>
              <p className="text-xs text-foreground-secondary">
                ForgeMind is processing your Unity error and project context.
              </p>
            </div>
            <DiagnosticProgress stages={STAGES} currentStage={currentStage} />
            <p className="text-[11px] font-mono text-foreground-muted">
              Do not close this tab — results will appear momentarily.
            </p>
          </div>
        ) : (
          /* ── Form ─────────────────────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-5 animate-enter delay-150">
            {/* Title */}
            <Field label="Investigation Title" required>
              <input
                type="text"
                required
                placeholder="e.g. CS0246 Unresolved namespace in PlayerController"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="fm-input w-full px-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted"
              />
            </Field>

            {/* Error Log */}
            <Field label="Unity Console Error / Stack Trace" required charCount={errorMessage.length}>
              <textarea
                required
                rows={6}
                placeholder="Paste Unity Console output, compiler errors, or runtime stack trace…"
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                className={textareaClass}
              />
            </Field>

            {/* Environment Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Unity Version" required>
                <select value={unityVersion} onChange={(e) => setUnityVersion(e.target.value as UnityVersion)} className={selectClass}>
                  <option value="6000.0 (Unity 6)">6000.0 (Unity 6)</option>
                  <option value="2023.3 LTS">2023.3 LTS</option>
                  <option value="2022.3 LTS">2022.3 LTS</option>
                  <option value="2021.3 LTS">2021.3 LTS</option>
                  <option value="2020.3 LTS">2020.3 LTS</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Render Pipeline" required>
                <select value={renderPipeline} onChange={(e) => setRenderPipeline(e.target.value as UnityRenderPipeline)} className={selectClass}>
                  <option value="urp">Universal Render Pipeline (URP)</option>
                  <option value="builtin">Built-in Render Pipeline</option>
                  <option value="hdrp">High Definition RP (HDRP)</option>
                  <option value="unknown">Unknown / Default</option>
                </select>
              </Field>
              <Field label="Target Platform">
                <select value={targetPlatform} onChange={(e) => setTargetPlatform(e.target.value as TargetPlatform)} className={selectClass}>
                  <option value="Standalone (Windows/Mac/Linux)">Standalone</option>
                  <option value="iOS">iOS</option>
                  <option value="Android">Android</option>
                  <option value="WebGL">WebGL</option>
                  <option value="Console">Console</option>
                  <option value="Universal / Any">Universal / Any</option>
                </select>
              </Field>
            </div>

            {/* Code Snippet */}
            <Field label="Relevant C# Code Snippet" hint="Optional" charCount={codeSnippet.length}>
              <textarea
                rows={5}
                placeholder="// Paste the relevant script section or method…"
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                className={textareaClass}
              />
            </Field>

            {/* Context */}
            <Field label="Project & Reproduction Context" hint="Optional">
              <input
                type="text"
                placeholder="e.g. Occurs when switching scenes after upgrading from 2021 LTS"
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value)}
                className="fm-input w-full px-3.5 py-2.5 rounded-md border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted"
              />
            </Field>

            {/* File Upload */}
            <Field label="Attach Evidence Files" hint="Max 5 files · 2 MB each · .cs .json .shader .hlsl .txt .log .asmdef">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative border rounded-lg p-5 text-center transition-all duration-150 ${
                  dragOver
                    ? 'border-brand bg-brand/5'
                    : 'border-dashed border-border bg-surface/50 hover:bg-surface'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept=".cs,.json,.shader,.hlsl,.txt,.log,.asmdef"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="pointer-events-none flex flex-col items-center gap-1.5">
                  <UploadCloud className={`w-5 h-5 transition-colors duration-150 ${dragOver ? 'text-brand' : 'text-foreground-muted'}`} />
                  <span className="text-xs font-medium text-foreground">
                    {dragOver ? 'Drop files here' : 'Click or drag & drop files'}
                  </span>
                  <span className="text-[11px] text-foreground-muted">
                    Processed in-memory · Never executed on server
                  </span>
                </div>
              </div>

              {/* Attached files */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-surface-elevated text-[11px] font-mono text-foreground animate-scale-in"
                    >
                      <FileCode className="w-3 h-3 text-brand shrink-0" />
                      <span className="truncate max-w-[180px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((p) => p.filter((_, idx) => idx !== i))}
                        className="text-foreground-muted hover:text-[#ef7770] transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {/* Submit */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
              <p className="text-[11px] text-foreground-muted">
                Processing happens server-side. Your code is never stored or executed.
              </p>
              <button
                type="submit"
                disabled={isSubmitting || title.trim().length < 3 || errorMessage.trim().length < 5}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand text-background hover:bg-brand-light font-semibold text-sm transition-all duration-150 shadow-md shadow-brand/15 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <span>Analyze with ForgeMind</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 group-disabled:translate-x-0" />
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
