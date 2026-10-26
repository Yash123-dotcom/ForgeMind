
import type {
  ConfidenceLevel,
  DeterministicRuleFinding,
  DiagnosticEvidenceItem,
  UnityRenderPipeline,
  UnityVersion,
  UploadedFileContext,
} from "../types";

export interface EvidenceContext {
  title: string;
  errorMessage: string;
  codeSnippet?: string;
  projectContext?: string;
  unityVersion: UnityVersion;
  renderPipeline: UnityRenderPipeline;
  targetPlatform?: string;
  attachedFiles?: UploadedFileContext[];
}

function addUnique(
  evidence: DiagnosticEvidenceItem[],
  item: DiagnosticEvidenceItem,
): void {
  const exists = evidence.some(
    (existing) =>
      existing.type === item.type &&
      existing.content === item.content &&
      existing.location === item.location,
  );

  if (!exists) {
    evidence.push(item);
  }
}

function nonEmptyLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findStackFrames(errorMessage: string): string[] {
  return nonEmptyLines(errorMessage).filter((line) => {
    return (
      /^\s*at\s+.+/i.test(line) ||
      /\(at\s+(?:Assets|Packages)[/\\].+\.cs:\d+\)/i.test(line) ||
      /(?:Assets|Packages)[/\\].+\.cs\s*:\s*(?:line\s*)?\d+/i.test(line)
    );
  });
}

/**
 * Collect evidence that can be directly traced to user-supplied input.
 * This function does not infer a root cause.
 */
export function collectDirectEvidence(
  payload: EvidenceContext,
): DiagnosticEvidenceItem[] {
  const evidence: DiagnosticEvidenceItem[] = [];
  const errorLines = nonEmptyLines(payload.errorMessage);

  for (const line of errorLines.slice(0, 12)) {
    addUnique(evidence, {
      type: "log_line",
      content: line,
      significance:
        "Directly observed in the error message or stack trace supplied by the user.",
    });
  }

  for (const frame of findStackFrames(payload.errorMessage).slice(0, 10)) {
    addUnique(evidence, {
      type: "stack_frame",
      content: frame,
      significance:
        "Directly observed stack-frame text. It may identify a location, but does not alone prove which value or operation caused the failure.",
    });
  }

  if (payload.codeSnippet?.trim()) {
    const snippetLines = nonEmptyLines(payload.codeSnippet);

    for (const line of snippetLines.slice(0, 8)) {
      addUnique(evidence, {
        type: "code_snippet",
        content: line,
        significance:
          "Directly observed in the C# or shader snippet supplied by the user; surrounding code may be needed to interpret it.",
      });
    }
  }

  if (payload.projectContext?.trim()) {
    addUnique(evidence, {
      type: "configuration",
      content: payload.projectContext.trim().slice(0, 1500),
      location: "User-provided project context",
      significance:
        "Project details supplied by the user. These details have not been independently inspected in the Unity Editor.",
    });
  }

  for (const file of payload.attachedFiles ?? []) {
    const fileName = file.name.replace(/\\/g, "/");
    const lowerName = fileName.toLowerCase();

    if (lowerName.endsWith("/manifest.json") || lowerName === "manifest.json") {
      try {
        const parsed = JSON.parse(file.content);
        const dependencies = parsed?.dependencies;

        if (
          dependencies &&
          typeof dependencies === "object" &&
          !Array.isArray(dependencies)
        ) {
          const dependencyNames = Object.keys(dependencies);

          addUnique(evidence, {
            type: "manifest_entry",
            content:
              dependencyNames.length > 0
                ? `manifest.json dependencies: ${dependencyNames.slice(0, 40).join(", ")}`
                : "manifest.json contains an empty dependencies object.",
            location: file.name,
            significance:
              "Directly parsed from the supplied manifest.json. This confirms the file contents, not whether Unity successfully resolved or loaded each package.",
          });
        } else {
          addUnique(evidence, {
            type: "configuration",
            content:
              "The supplied manifest.json does not contain a valid dependencies object.",
            location: file.name,
            significance:
              "The uploaded manifest structure could not be used to confirm package declarations.",
          });
        }
      } catch {
        addUnique(evidence, {
          type: "configuration",
          content: "The supplied manifest.json could not be parsed as JSON.",
          location: file.name,
          significance:
            "Package declarations cannot be reliably inferred from malformed JSON.",
        });
      }
    } else if (lowerName.endsWith(".asmdef")) {
      addUnique(evidence, {
        type: "configuration",
        content: file.content.slice(0, 1500),
        location: file.name,
        significance:
          "Assembly-definition file supplied by the user. Its contents may help explain assembly references, but the complete project assembly graph has not been inspected.",
      });
    } else if (
      lowerName.endsWith(".json") ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".log")
    ) {
      addUnique(evidence, {
        type: "configuration",
        content: file.content.slice(0, 1000),
        location: file.name,
        significance:
          "Configuration or text content directly supplied by the user. Its meaning depends on the surrounding project context.",
      });
    }
  }

  return evidence;
}

/**
 * Keep AI evidence only when its quoted content occurs verbatim in
 * a supplied input. This is a grounding filter, not a root-cause validator.
 */
export function keepGroundedAiEvidence(
  items: DiagnosticEvidenceItem[],
  payload: EvidenceContext,
): DiagnosticEvidenceItem[] {
  const sources: Array<{ name: string; content: string }> = [
    { name: "error message", content: payload.errorMessage },
  ];

  if (payload.codeSnippet) {
    sources.push({
      name: "code snippet",
      content: payload.codeSnippet,
    });
  }

  if (payload.projectContext) {
    sources.push({
      name: "project context",
      content: payload.projectContext,
    });
  }

  for (const file of payload.attachedFiles ?? []) {
    sources.push({
      name: file.name,
      content: file.content,
    });
  }

  return items.filter((item) => {
    const quote = item.content.trim();

    if (!quote) return false;

    const source = sources.find((candidate) =>
      candidate.content.includes(quote),
    );

    if (!source) return false;

    if (item.location) {
      const normalizedLocation = item.location
        .replace(/\\/g, "/")
        .toLowerCase();

      const looksLikeFilePath =
        normalizedLocation.includes("/") ||
        /\.(cs|json|shader|hlsl|asmdef|txt|log)$/i.test(normalizedLocation);

      if (looksLikeFilePath) {
        const matchingFile = (payload.attachedFiles ?? []).some(
          (file) =>
            file.name.replace(/\\/g, "/").toLowerCase() ===
            normalizedLocation,
        );

        const isInputLocation =
          normalizedLocation === "error message" ||
          normalizedLocation === "code snippet" ||
          normalizedLocation === "project context";

        if (!matchingFile && !isInputLocation) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Confidence is about diagnostic support, not severity or how specific
 * the AI sounds. A high confidence score requires strong, matching evidence.
 */
export function calibrateDiagnosisConfidence(
  payload: EvidenceContext,
  findings: DeterministicRuleFinding[],
  requestedLevel: ConfidenceLevel,
): { level: ConfidenceLevel; calibrationReasoning: string } {
  const error = payload.errorMessage;
  const topFinding = findings[0];

  const exactCompilerMatch =
    (/\bCS0246\b/i.test(error) &&
      findings.some((finding) => finding.ruleId === "UNITY-RULE-CS0246")) ||
    (/\bCS0103\b/i.test(error) &&
      findings.some((finding) => finding.ruleId === "UNITY-RULE-CS0103"));

  if (!topFinding) {
    return {
      level: "low",
      calibrationReasoning:
        "Low confidence: no deterministic rule matched the supplied input. An AI-generated hypothesis may be useful, but the available evidence does not independently establish a specific root cause.",
    };
  }

  if (
    topFinding.ruleId === "UNITY-RULE-NULLREF" &&
    !/(?:Assets|Packages)[/\\].+\.cs\s*:\s*(?:line\s*)?\d+/i.test(error) &&
    !payload.codeSnippet?.trim()
  ) {
    return {
      level: "low",
      calibrationReasoning:
        "Low confidence in the exact root cause: a NullReferenceException was detected, but no relevant code snippet or usable project-code location was supplied. The exact null reference is unknown.",
    };
  }

  if (exactCompilerMatch) {
    return {
      level: "medium",
      calibrationReasoning:
        `Medium confidence in the compiler-error category: the supplied error contains an exact compiler signature matching ${topFinding.ruleId}. The signature does not by itself determine whether the cause is a missing namespace, assembly reference, symbol, or package, and does not verify a proposed fix. The AI requested ${requestedLevel} confidence, but this evidence does not justify high confidence.`,
    };
  }

  if (
    topFinding.ruleId === "UNITY-RULE-MANIFEST-DEPS" &&
    (payload.attachedFiles ?? []).some((file) =>
      /(^|[/\\])manifest\.json$/i.test(file.name),
    )
  ) {
    return {
      level: "medium",
      calibrationReasoning:
        "Medium confidence: the supplied manifest and error text support investigating a possible package dependency issue. Manifest contents alone do not establish whether a package is available through another source or successfully resolved by Unity.",
    };
  }

  return {
    level: "medium",
    calibrationReasoning:
      `Medium confidence: deterministic rule ${topFinding.ruleId} matched the supplied input. This supports the issue category, but does not independently prove the precise root cause or verify the proposed fix. The AI requested ${requestedLevel} confidence; confidence is capped until stronger evidence is available.`,
  };
}
