'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
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
  CheckCircle2,
  LoaderCircle,
  Clock,
  HelpCircle,
} from 'lucide-react';

/* ============================================================
   Configuration
   ============================================================ */

const MAX_FILES = 5;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_CONTENT_LENGTH = 500000;

const ALLOWED_EXTENSIONS = [
  '.cs',
  '.json',
  '.shader',
  '.hlsl',
  '.txt',
  '.log',
  '.asmdef',
];

const SAMPLE_CASES = [
  {
    name: 'CS0246: TMPro Missing',
    title:
      'CS0246 Unresolved namespace: TextMeshProUGUI in DamagePopup.cs',
    error: `Assets/Scripts/UI/DamagePopup.cs(14,13): error CS0246: The type or namespace name 'TextMeshProUGUI' could not be found (are you missing a using directive or an assembly reference?)
Assets/Scripts/UI/DamagePopup.cs(22,9): error CS0103: The name 'damageText' does not exist in the current context`,
    code: `using UnityEngine;

public class DamagePopup : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI damageText;

    public void Setup(int damageAmount)
    {
        damageText.text = damageAmount.ToString();
    }
}`,
    version: '2022.3 LTS' as UnityVersion,
    pipeline: 'urp' as UnityRenderPipeline,
    platform:
      'Standalone (Windows/Mac/Linux)' as TargetPlatform,
    files: [] as UploadedFileContext[],
  },
  {
    name: 'Pipeline: URP in Built-in',
    title:
      'Shader compile failure: UniversalForward in Built-in project',
    error: `Shader error in 'Custom/WaterSurface': 'UniversalForward' pass undeclared or invalid LightMode for current pipeline at line 24 (on d3d11)
WARNING: Shader is falling back to Hidden/InternalErrorShader (Rendering magenta).`,
    code: `Shader "Custom/WaterSurface"
{
    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" }
        Pass
        {
            Tags { "LightMode"="UniversalForward" }
            HLSLPROGRAM
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            ENDHLSL
        }
    }
}`,
    version: '2022.3 LTS' as UnityVersion,
    pipeline: 'builtin' as UnityRenderPipeline,
    platform:
      'Standalone (Windows/Mac/Linux)' as TargetPlatform,
    files: [] as UploadedFileContext[],
  },
  {
    name: 'NullReferenceException',
    title:
      'NullReferenceException when accessing Camera reference in PlayerMovement.Start()',
    error: `NullReferenceException: Object reference not set to an instance of an object
  at PlayerMovement.Start () [0x00018] in Assets/Scripts/PlayerMovement.cs:28`,
    code: `using UnityEngine;

public class PlayerMovement : MonoBehaviour
{
    [SerializeField] private Camera playerCamera;
    private Vector3 cameraOffset;

    void Start()
    {
        cameraOffset = transform.position - playerCamera.transform.position;
    }
}`,
    version: '6000.0 (Unity 6)' as UnityVersion,
    pipeline: 'urp' as UnityRenderPipeline,
    platform:
      'Standalone (Windows/Mac/Linux)' as TargetPlatform,
    files: [] as UploadedFileContext[],
  },
  {
    name: 'Manifest: Input System',
    title:
      'CS0246 UnityEngine.InputSystem missing from Packages/manifest.json',
    error: `Assets/Scripts/PlayerController.cs(6,7): error CS0246: The type or namespace name 'UnityEngine' could not be found — check the relevant assembly references and package dependencies.`,
    code: `using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerController : MonoBehaviour
{
    public InputActionReference moveAction;
}`,
    version: '2023.3 LTS' as UnityVersion,
    pipeline: 'urp' as UnityRenderPipeline,
    platform:
      'Standalone (Windows/Mac/Linux)' as TargetPlatform,
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
    ] as UploadedFileContext[],
  },
];

/* ============================================================
   File Reader
   ============================================================ */

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error(`Could not read "${file.name}" as text.`));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read "${file.name}".`));
    };

    reader.onabort = () => {
      reject(new Error(`Reading "${file.name}" was cancelled.`));
    };

    reader.readAsText(file);
  });
}

/* ============================================================
   Form Field
   ============================================================ */

function Field({
  id,
  label,
  required,
  hint,
  children,
  charCount,
}: {
  id?: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  charCount?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-foreground-secondary"
        >
          {label}
          {required && (
            <span className="ml-1 text-brand" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <div className="flex items-center gap-3 text-[11px] font-mono text-foreground-muted">
          {hint && <span>{hint}</span>}

          {charCount !== undefined && (
            <span className="tabular-nums">
              {charCount.toLocaleString()} chars
            </span>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

/* ============================================================
   New Investigation Page
   ============================================================ */

export default function NewInvestigationPage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachedFilesRef = useRef<UploadedFileContext[]>([]);
  const pendingFileReads = useRef(0);
  const submittingRef = useRef(false);
  const progressIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const [title, setTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [projectContext, setProjectContext] = useState('');

  const [unityVersion, setUnityVersion] =
    useState<UnityVersion>('2022.3 LTS');

  const [renderPipeline, setRenderPipeline] =
    useState<UnityRenderPipeline>('urp');

  const [targetPlatform, setTargetPlatform] =
    useState<TargetPlatform>(
      'Standalone (Windows/Mac/Linux)'
    );

  const [attachedFiles, setAttachedFiles] =
    useState<UploadedFileContext[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [validationError, setValidationError] =
    useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  /* Keep the state and ref in sync so rapid file selections
     cannot exceed the attachment limit. */
  const updateAttachedFiles = useCallback(
    (
      next:
        | UploadedFileContext[]
        | ((
            previous: UploadedFileContext[]
          ) => UploadedFileContext[])
    ) => {
      const resolved =
        typeof next === 'function'
          ? next(attachedFilesRef.current)
          : next;

      attachedFilesRef.current = resolved;
      setAttachedFiles(resolved);
    },
    []
  );

  const clearTimerInterval = useCallback(() => {
    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  /* ============================================================
     Sample Scenarios
     ============================================================ */

  const applySample = (
    sample: (typeof SAMPLE_CASES)[number]
  ) => {
    if (isSubmitting) return;

    setTitle(sample.title);
    setErrorMessage(sample.error);
    setCodeSnippet(sample.code);
    setProjectContext('');
    setUnityVersion(sample.version);
    setRenderPipeline(sample.pipeline);
    setTargetPlatform(sample.platform);

    updateAttachedFiles(sample.files);

    setValidationError(null);
  };

  /* ============================================================
     File Uploads
     ============================================================ */

  const processFiles = async (fileList: FileList | File[]) => {
    if (isSubmitting) return;

    setValidationError(null);

    const files = Array.from(fileList);

    for (const file of files) {
      const extensionIndex = file.name.lastIndexOf('.');
      const extension =
        extensionIndex >= 0
          ? file.name.slice(extensionIndex).toLowerCase()
          : '';

      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        setValidationError(
          `Unsupported file type "${extension || 'none'}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setValidationError(
          `"${file.name}" exceeds the 2 MB file-size limit.`
        );
        continue;
      }

      const alreadyAttached = attachedFilesRef.current.some(
        (attached) => attached.name === file.name
      );

      if (alreadyAttached) {
        setValidationError(
          `"${file.name}" is already attached.`
        );
        continue;
      }

      if (
        attachedFilesRef.current.length + pendingFileReads.current >=
        MAX_FILES
      ) {
        setValidationError(
          `You can attach a maximum of ${MAX_FILES} files per investigation.`
        );
        break;
      }

      pendingFileReads.current += 1;

      try {
        const content = await readFileAsText(file);

        if (content.length > MAX_CONTENT_LENGTH) {
          setValidationError(
            `"${file.name}" exceeds the 500,000-character content limit.`
          );
          continue;
        }

        const duplicateAfterRead =
          attachedFilesRef.current.some(
            (attached) => attached.name === file.name
          );

        if (duplicateAfterRead) {
          setValidationError(
            `"${file.name}" is already attached.`
          );
          continue;
        }

        if (attachedFilesRef.current.length >= MAX_FILES) {
          setValidationError(
            `You can attach a maximum of ${MAX_FILES} files per investigation.`
          );
          break;
        }

        const uploadedFile: UploadedFileContext = {
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          content,
        };

        updateAttachedFiles((previous) => [
          ...previous,
          uploadedFile,
        ]);
      } catch (err) {
        setValidationError(
          err instanceof Error
            ? err.message
            : `Could not read "${file.name}".`
        );
      } finally {
        pendingFileReads.current = Math.max(
          0,
          pendingFileReads.current - 1
        );
      }
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.currentTarget;
    const files = input.files;

    if (files?.length) {
      void processFiles(files);
    }

    // Allow the user to select the same file again after removal.
    input.value = '';
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setDragOver(false);

    if (event.dataTransfer.files.length) {
      void processFiles(event.dataTransfer.files);
    }
  };

  const removeFile = (name: string) => {
    updateAttachedFiles((previous) =>
      previous.filter((file) => file.name !== name)
    );

    setValidationError(null);
  };

  /* ============================================================
     Submission
     ============================================================ */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submittingRef.current) return;

    setValidationError(null);

    if (title.trim().length < 3) {
      setValidationError(
        'Enter an investigation title with at least 3 characters.'
      );
      return;
    }

    if (errorMessage.trim().length < 5) {
      setValidationError(
        'Paste the Unity Console error or stack trace before continuing.'
      );
      return;
    }

    if (pendingFileReads.current > 0) {
      setValidationError(
        'Please wait for attached files to finish reading before submitting.'
      );
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setElapsedSeconds(0);

    clearTimerInterval();

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 500);

    try {
      const response = await fetch('/api/investigations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          errorMessage: errorMessage.trim(),
          codeSnippet: codeSnippet.trim() || undefined,
          projectContext: projectContext.trim() || undefined,
          unityVersion,
          renderPipeline,
          targetPlatform,
          attachedFiles: attachedFilesRef.current,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : `Investigation failed (${response.status}). Please try again.`
        );
      }

      const investigationId = data?.data?.id;

      if (
        typeof investigationId !== 'string' ||
        investigationId.length === 0
      ) {
        throw new Error(
          'The server response did not include an investigation ID.'
        );
      }

      router.push(
        `/investigations/${encodeURIComponent(investigationId)}`
      );
    } catch (err) {
      setValidationError(
        err instanceof Error
          ? err.message
          : 'Diagnostic failed. Check your inputs and try again.'
      );
    } finally {
      clearTimerInterval();
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  /* ============================================================
     Evidence Coverage Heuristics
     ============================================================ */

  const evidenceCoverage = React.useMemo(() => {
    const combinedText = `${errorMessage} ${codeSnippet} ${projectContext}`.toLowerCase();
    const attachedNames = attachedFiles.map((f) => f.name.toLowerCase());
    const hasAttached = (ext: string) => attachedNames.some((n) => n.endsWith(ext));
    const hasName = (name: string) => attachedNames.some((n) => n === name.toLowerCase());

    const items: Array<{
      id: string;
      label: string;
      status: 'Provided' | 'Recommended' | 'Optional';
      detail: string;
    }> = [];

    // 1. C# Script recommendation (NullReferenceException, stack trace, or CS errors)
    const hasStackOrNullRef =
      combinedText.includes('nullreferenceexception') ||
      combinedText.includes('stack trace') ||
      combinedText.includes('at ') ||
      combinedText.includes('.cs:');
    if (hasStackOrNullRef) {
      const provided = hasAttached('.cs') || codeSnippet.trim().length > 0;
      items.push({
        id: 'csharp_script',
        label: 'C# Script',
        status: provided ? 'Provided' : 'Recommended',
        detail: provided
          ? 'Script or snippet included for call stack analysis.'
          : 'Attach relevant .cs script or paste snippet for stack frame analysis.',
      });
    }

    // 2. Shader / HLSL file recommendation
    const hasShaderSignal =
      combinedText.includes('shader') ||
      combinedText.includes('hlsl') ||
      combinedText.includes('urp') ||
      combinedText.includes('hdrp') ||
      combinedText.includes('universalforward') ||
      combinedText.includes('pink') ||
      combinedText.includes('magenta');
    if (hasShaderSignal) {
      const provided = hasAttached('.shader') || hasAttached('.hlsl');
      items.push({
        id: 'shader_file',
        label: 'Shader / HLSL File',
        status: provided ? 'Provided' : 'Recommended',
        detail: provided
          ? 'Shader source attached for pass and include inspection.'
          : 'Attach .shader or .hlsl file to verify pass tags and include directives.',
      });
    }

    // 3. Package manifest / Assembly definition
    const hasDependencySignal =
      combinedText.includes('cs0246') ||
      combinedText.includes('namespace') ||
      combinedText.includes('assembly') ||
      combinedText.includes('package') ||
      combinedText.includes('dependency');
    if (hasDependencySignal) {
      const manifestProvided = hasName('manifest.json') || hasAttached('.json');
      items.push({
        id: 'manifest_json',
        label: 'Packages Manifest (manifest.json)',
        status: manifestProvided ? 'Provided' : 'Recommended',
        detail: manifestProvided
          ? 'Package manifest attached for package dependency verification.'
          : 'Attach Packages/manifest.json to verify missing package references.',
      });

      const asmdefProvided = hasAttached('.asmdef');
      items.push({
        id: 'asmdef_file',
        label: 'Assembly Definition (.asmdef)',
        status: asmdefProvided ? 'Provided' : 'Optional',
        detail: asmdefProvided
          ? 'Assembly definition attached for compilation references.'
          : 'Optional: attach .asmdef if the script belongs to a custom assembly.',
      });
    }

    // 4. Reproduction details
    const hasReproDetails = projectContext.trim().length > 20;
    if (errorMessage.trim().length >= 5) {
      items.push({
        id: 'reproduction_context',
        label: 'Reproduction & Changes Context',
        status: hasReproDetails ? 'Provided' : 'Optional',
        detail: hasReproDetails
          ? 'Reproduction context and recent changes provided.'
          : 'Optional: provide reproduction steps or recent changes (e.g. Unity upgrade).',
      });
    }

    return items;
  }, [errorMessage, codeSnippet, projectContext, attachedFiles]);

  /* ============================================================
     Shared Styles
     ============================================================ */

  const selectClass =
    'fm-input w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2.5 text-xs font-mono text-foreground transition-colors';

  const textareaClass =
    'fm-input w-full min-h-[120px] resize-y rounded-md border border-border bg-surface p-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-foreground-muted transition-colors';

  const inputClass =
    'fm-input w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted transition-colors';

  /* ============================================================
     Render
     ============================================================ */

  return (
    <AppShell>
      <div className="fm-page-enter mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <header className="space-y-2 border-b border-border pb-5">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-mono font-medium uppercase tracking-[0.15em] text-brand">
            <Cpu className="h-3.5 w-3.5" />
            <span>Diagnostic Workbench</span>
          </div>

          <h1 className="text-xl font-bold tracking-[-0.025em] text-foreground sm:text-2xl">
            New Unity Project Investigation
          </h1>

          <p className="max-w-2xl text-xs leading-relaxed text-foreground-secondary sm:text-sm">
            Submit a console error or stack trace with project
            context to generate an evidence-backed diagnostic report.
          </p>

          <div className="flex items-start gap-2 rounded-md border border-border/80 bg-surface/50 p-2.5 text-[11px] leading-relaxed text-foreground-muted">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-secondary" />
            <span>
              ForgeMind analyzes submitted error logs, code snippets, and supported text evidence files. It does not open local Unity projects, execute code, import assets, or compile projects.
            </span>
          </div>
        </header>

        {/* Starter Scenarios */}
        <section className="fm-card animate-enter space-y-3 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-brand/20 bg-brand/5">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
            </div>

            <div>
              <h2 className="text-xs font-semibold text-foreground">
                Start with an example
              </h2>
              <p className="text-[11px] text-foreground-muted">
                Populate the form with a sample Unity issue.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {SAMPLE_CASES.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => applySample(sample)}
                disabled={isSubmitting}
                className="rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-[11px] font-mono text-foreground-secondary transition-all duration-200 hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </section>

        {/* Validation Error */}
        {validationError && (
          <div
            role="alert"
            aria-live="polite"
            className="animate-scale-in flex items-start gap-2.5 rounded-md border border-[rgba(239,119,112,0.3)] bg-[rgba(239,119,112,0.06)] p-3.5 text-xs text-[#ef7770]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <p className="flex-1 leading-relaxed">
              {validationError}
            </p>

            <button
              type="button"
              onClick={() => setValidationError(null)}
              aria-label="Dismiss error"
              className="rounded p-0.5 transition-colors hover:bg-white/5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Submission Progress */}
        {isSubmitting ? (
          <section
            aria-live="polite"
            aria-busy="true"
            className="fm-card animate-scale-in space-y-6 rounded-lg px-5 py-14 text-center sm:px-8"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/5">
              <LoaderCircle className="h-7 w-7 animate-spin text-brand" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                Running Diagnostics
              </h2>

              <p className="mx-auto max-w-md text-xs leading-relaxed text-foreground-secondary sm:text-sm">
                Executing deterministic Unity rules and synthesizing diagnostic findings. Please wait while your report is generated.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-mono text-foreground-secondary">
              <Clock className="h-3.5 w-3.5 text-brand" />
              <span>Elapsed: {elapsedSeconds}s</span>
            </div>

            <p className="text-[11px] font-mono text-foreground-muted">
              Keep this window open. Results will open automatically upon completion.
            </p>
          </section>
        ) : (
          /* Investigation Form */
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Required Evidence */}
            <section className="fm-card animate-enter space-y-5 rounded-lg p-4 sm:p-5">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Investigation Details
                </h2>
                <p className="text-xs leading-relaxed text-foreground-secondary">
                  Start with the issue you are experiencing in Unity.
                </p>
              </div>

              <Field
                id="investigation-title"
                label="Investigation Title"
                required
              >
                <input
                  id="investigation-title"
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  autoComplete="off"
                  placeholder="e.g. CS0246 unresolved namespace in PlayerController"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </Field>

              <Field
                id="unity-error"
                label="Unity Console Error / Stack Trace"
                required
                charCount={errorMessage.length}
              >
                <textarea
                  id="unity-error"
                  required
                  minLength={5}
                  rows={7}
                  placeholder={`Paste Unity Console output, compiler errors, or a runtime stack trace...\n\nExample:\nNullReferenceException: Object reference not set to an instance of an object`}
                  value={errorMessage}
                  onChange={(event) =>
                    setErrorMessage(event.target.value)
                  }
                  disabled={isSubmitting}
                  className={textareaClass}
                />

                <p className="text-[11px] leading-relaxed text-foreground-muted">
                  Include the full error message and stack trace when
                  available. Remove passwords, API keys, and other secrets.
                </p>
              </Field>
            </section>

            {/* Environment */}
            <section
              className="fm-card animate-enter space-y-5 rounded-lg p-4 sm:p-5"
              style={{ animationDelay: '60ms' }}
            >
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Project Environment
                </h2>
                <p className="text-xs leading-relaxed text-foreground-secondary">
                  Provide the environment details needed to interpret
                  compatibility issues.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="unity-version"
                  label="Unity Version"
                  required
                >
                  <select
                    id="unity-version"
                    required
                    value={unityVersion}
                    onChange={(event) =>
                      setUnityVersion(
                        event.target.value as UnityVersion
                      )
                    }
                    disabled={isSubmitting}
                    className={selectClass}
                  >
                    <option value="6000.0 (Unity 6)">
                      6000.0 (Unity 6)
                    </option>
                    <option value="2023.3 LTS">2023.3 LTS</option>
                    <option value="2022.3 LTS">2022.3 LTS</option>
                    <option value="2021.3 LTS">2021.3 LTS</option>
                    <option value="2020.3 LTS">2020.3 LTS</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field
                  id="render-pipeline"
                  label="Render Pipeline"
                  required
                >
                  <select
                    id="render-pipeline"
                    required
                    value={renderPipeline}
                    onChange={(event) =>
                      setRenderPipeline(
                        event.target.value as UnityRenderPipeline
                      )
                    }
                    disabled={isSubmitting}
                    className={selectClass}
                  >
                    <option value="urp">
                      Universal Render Pipeline
                    </option>
                    <option value="builtin">
                      Built-in Render Pipeline
                    </option>
                    <option value="hdrp">
                      High Definition RP
                    </option>
                    <option value="unknown">
                      Unknown / Default
                    </option>
                  </select>
                </Field>

                <div className="sm:col-span-2">
                  <Field
                    id="target-platform"
                    label="Target Platform"
                    hint="Optional"
                  >
                    <select
                      id="target-platform"
                      value={targetPlatform}
                      onChange={(event) =>
                        setTargetPlatform(
                          event.target.value as TargetPlatform
                        )
                      }
                      disabled={isSubmitting}
                      className={selectClass}
                    >
                      <option value="Standalone (Windows/Mac/Linux)">
                        Standalone (Windows / Mac / Linux)
                      </option>
                      <option value="iOS">iOS</option>
                      <option value="Android">Android</option>
                      <option value="WebGL">WebGL</option>
                      <option value="Console">Console</option>
                      <option value="Universal / Any">
                        Universal / Any
                      </option>
                    </select>
                  </Field>
                </div>
              </div>
            </section>

            {/* Additional Context */}
            <section
              className="fm-card animate-enter space-y-5 rounded-lg p-4 sm:p-5"
              style={{ animationDelay: '100ms' }}
            >
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Additional Context
                </h2>
                <p className="text-xs leading-relaxed text-foreground-secondary">
                  Optional details can help narrow down the likely root cause.
                </p>
              </div>

              <Field
                id="code-snippet"
                label="Relevant C# Code"
                hint="Optional"
                charCount={codeSnippet.length}
              >
                <textarea
                  id="code-snippet"
                  rows={6}
                  placeholder={`// Paste the relevant script or method...\npublic void Start()\n{\n    // Relevant code\n}`}
                  value={codeSnippet}
                  onChange={(event) =>
                    setCodeSnippet(event.target.value)
                  }
                  disabled={isSubmitting}
                  className={textareaClass}
                />
              </Field>

              <Field
                id="project-context"
                label="Project & Reproduction Context"
                hint="Optional"
              >
                <textarea
                  id="project-context"
                  rows={3}
                  placeholder="e.g. The issue started after upgrading Unity or switching render pipelines..."
                  value={projectContext}
                  onChange={(event) =>
                    setProjectContext(event.target.value)
                  }
                  disabled={isSubmitting}
                  className={`${inputClass} min-h-[90px] resize-y`}
                />
              </Field>
            </section>

            {/* Evidence Coverage */}
            {evidenceCoverage.length > 0 && (
              <section
                className="fm-card animate-enter space-y-3.5 rounded-lg p-4 sm:p-5"
                style={{ animationDelay: '120ms' }}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-semibold text-foreground">
                      Evidence Coverage
                    </h2>
                    <p className="text-xs text-foreground-secondary">
                      Advisory recommendations based on your error signals and context.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-foreground-muted">
                    Advisory only
                  </span>
                </div>

                <div className="space-y-2">
                  {evidenceCoverage.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface-elevated p-2.5 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground-muted">
                          {item.detail}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[10px] font-medium ${
                          item.status === 'Provided'
                            ? 'border border-brand/30 bg-brand/10 text-brand'
                            : item.status === 'Recommended'
                            ? 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
                            : 'border border-border bg-surface text-foreground-muted'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* File Attachments */}
            <section
              className="fm-card animate-enter space-y-4 rounded-lg p-4 sm:p-5"
              style={{ animationDelay: '140ms' }}
            >
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">
                  Evidence Files
                </h2>
                <p className="text-xs leading-relaxed text-foreground-secondary">
                  Attach scripts, manifests, or shader files relevant to
                  your investigation.
                </p>
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!isSubmitting) setDragOver(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                }}
                onDrop={handleDrop}
                className={`rounded-lg border border-dashed p-6 text-center transition-all duration-200 sm:p-8 ${
                  dragOver
                    ? 'border-brand bg-brand/5'
                    : 'border-border bg-surface/50 hover:border-border-active hover:bg-surface'
                } ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
              >
                <div className="pointer-events-none flex flex-col items-center gap-2">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                      dragOver
                        ? 'border-brand/30 bg-brand/10 text-brand'
                        : 'border-border bg-surface text-foreground-muted'
                    }`}
                  >
                    <UploadCloud className="h-5 w-5" />
                  </div>

                  <p className="text-xs font-medium text-foreground">
                    {dragOver
                      ? 'Drop files to attach them'
                      : 'Drag and drop your files here'}
                  </p>

                  <p className="text-[11px] text-foreground-muted">
                    or select files from your computer
                  </p>
                </div>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-elevated px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:border-brand/40 hover:text-brand">
                  <FileCode className="h-3.5 w-3.5" />
                  Browse Files

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".cs,.json,.shader,.hlsl,.txt,.log,.asmdef"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    className="sr-only"
                  />
                </label>

                <p className="mt-4 text-[10px] font-mono leading-relaxed text-foreground-muted">
                  {MAX_FILES} files max · 2 MB each ·{' '}
                  {ALLOWED_EXTENSIONS.join(', ')}
                </p>
              </div>

              {/* Attachment list */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-foreground-muted">
                      Attached Files
                    </p>
                    <span className="text-[10px] font-mono text-foreground-muted">
                      {attachedFiles.length}/{MAX_FILES}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {attachedFiles.map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center gap-3 rounded-md border border-border bg-surface-elevated p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-brand/20 bg-brand/5">
                          <FileCode className="h-4 w-4 text-brand" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">
                            {file.name}
                          </p>
                          <p className="mt-0.5 text-[10px] font-mono text-foreground-muted">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>

                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />

                        <button
                          type="button"
                          onClick={() => removeFile(file.name)}
                          disabled={isSubmitting}
                          aria-label={`Remove ${file.name}`}
                          className="rounded-md p-2 text-foreground-muted transition-colors hover:bg-[#ef7770]/10 hover:text-[#ef7770] disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] leading-relaxed text-foreground-muted">
                Only attach files relevant to the issue. File contents
                are submitted to the server for analysis; avoid including
                credentials, private keys, or other sensitive information.
              </p>
            </section>

            {/* Submit */}
            <div className="space-y-4 border-t border-border pt-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    Ready to investigate?
                  </p>
                  <p className="max-w-sm text-[11px] leading-relaxed text-foreground-muted">
                    ForgeMind will analyze the provided evidence and
                    generate a diagnostic report.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    title.trim().length < 3 ||
                    errorMessage.trim().length < 5 ||
                    pendingFileReads.current > 0
                  }
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-background shadow-md shadow-brand/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-light active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:w-auto"
                >
                  <span>Analyze with ForgeMind</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>

              <p className="text-center text-[10px] leading-relaxed text-foreground-muted sm:text-left">
                Diagnostic results are generated from the evidence and
                context you provide. Always verify suggested changes in
                your Unity project.
              </p>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}