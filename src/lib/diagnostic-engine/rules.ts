
import {
  DeterministicRuleFinding,
  UnityRenderPipeline,
  UnityVersion,
  UploadedFileContext,
} from "../types";

export interface DiagnosticInputContext {
  errorMessage: string;
  codeSnippet?: string;
  projectContext?: string;
  unityVersion: UnityVersion;
  renderPipeline: UnityRenderPipeline;
  attachedFiles?: UploadedFileContext[];
}

export type UnityDiagnosticRule = {
  id: string;
  name: string;
  evaluate: (ctx: DiagnosticInputContext) => DeterministicRuleFinding | null;
};

// 1. CS0246: unresolved type or namespace.

export const cs0246Rule: UnityDiagnosticRule = {
  id: "UNITY-RULE-CS0246",
  name: "Unresolved Type or Missing Namespace Directive",

  evaluate: (ctx) => {
    const match = ctx.errorMessage.match(
      /CS0246:\s*(?:The type or namespace name\s*['"]?([A-Za-z0-9_.]+)['"]?)/i,
    );

    if (!match) return null;

    const missingType = match[1];

    const knownNamespaces: Record<string, string> = {
      TextMeshPro: "using TMPro;",
      TextMeshProUGUI: "using TMPro;",
      TMP_Text: "using TMPro;",
      InputAction: "using UnityEngine.InputSystem;",
      InputActionReference: "using UnityEngine.InputSystem;",
      PlayerInput: "using UnityEngine.InputSystem;",
      Volume: "using UnityEngine.Rendering;",
      UniversalRenderPipelineAsset:
        "using UnityEngine.Rendering.Universal;",
      ScriptableRendererFeature:
        "using UnityEngine.Rendering.Universal;",
      CinemachineVirtualCamera:
        "using Unity.Cinemachine; (or Cinemachine in older package versions)",
      NetworkBehaviour: "using Unity.Netcode;",
      NetworkManager: "using Unity.Netcode;",
      NavMeshAgent: "using UnityEngine.AI;",
      Image: "using UnityEngine.UI;",
      Button: "using UnityEngine.UI;",
      Slider: "using UnityEngine.UI;",
      Toggle: "using UnityEngine.UI;",
    };

    const namespaceHint = knownNamespaces[missingType];

    const suggestedNextStep = namespaceHint
      ? `Check whether '${namespaceHint}' is the correct namespace for '${missingType}' in your installed package version. If so, add the directive and verify that the required package and assembly references are available.`
      : `Check whether '${missingType}' is spelled correctly, whether its declaring namespace is imported, and whether the required package, DLL, or assembly-definition reference is available.`;

    return {
      ruleId: "UNITY-RULE-CS0246",
      title: `CS0246: Unresolved Type '${missingType}'`,
      finding:
        `The compiler reports that it cannot resolve '${missingType}'. Possible causes include an incorrect type name, a missing namespace import, a missing assembly reference, or an unavailable package. The error signature alone does not distinguish these causes.`,
      evidence: match[0],
      severity: "high",
      suggestedNextStep,
      limitations:
        "This rule matches the compiler error pattern; it does not inspect the full project symbol table, package resolution state, assembly-definition graph, or third-party DLL contents.",
    };
  },
};

// 2. NullReferenceException: inspect stack-trace location.

export const nullRefRule: UnityDiagnosticRule = {
  id: "UNITY-RULE-NULLREF",
  name: "NullReferenceException Call Stack Analyzer",

  evaluate: (ctx) => {
    const error = ctx.errorMessage;

    if (!/NullReferenceException/i.test(error)) {
      return null;
    }

    const unityFrame = error.match(
      /([A-Za-z0-9_.<>]+)\.([A-Za-z0-9_<>]+)\s*\([^)]*\)\s*\(at\s+(.+?):(\d+)\)/i,
    );

    const inFrame = error.match(
      /at\s+([A-Za-z0-9_.<>]+)\.([A-Za-z0-9_<>]+)\s*\([^)]*\)\s+in\s+(.+?):line\s*(\d+)/i,
    );

    const locationFrame = error.match(
      /((?:Assets|Packages)[/\\][^\r\n()]*?\.cs)\s*:\s*(?:line\s*)?(\d+)/i,
    );

    const frame = unityFrame || inFrame;
    const method = frame ? `${frame[1]}.${frame[2]}()` : null;
    const file = frame?.[3] ?? locationFrame?.[1] ?? null;
    const line = frame?.[4] ?? locationFrame?.[2] ?? null;
    const hasLocation = Boolean(file && line);

    const finding = hasLocation
      ? `A NullReferenceException was reported${method ? ` at ${method}` : ""}, line ${line} of ${file}. This identifies a reported failure location, but not which reference was null.`
      : "A NullReferenceException was detected, but the supplied text does not identify a usable project-code location. The exact null reference remains unknown.";

    const evidence = hasLocation
      ? `${file} (Line ${line})`
      : "Observed evidence: NullReferenceException appears in the supplied error message. Project-code line not found in the provided stack trace.";

    const suggestedNextStep = hasLocation
      ? `Open ${file} at line ${line}. Inspect each dereference on that line, including chained expressions and component lookups. Check Inspector assignments and initialization order, then confirm which reference is null before changing the code.`
      : "Copy the complete Unity Console stack trace and find the first frame that points to your own script. Inspect that line and the relevant references. Without a code location, the exact cause cannot yet be confirmed.";

    return {
      ruleId: "UNITY-RULE-NULLREF",
      title: "Runtime NullReferenceException Detected",
      finding,
      evidence,
      severity: "medium",
      suggestedNextStep,
      limitations:
        "A stack trace can identify where an exception occurred, but not necessarily which reference was null. The relevant source code and runtime object state are needed to confirm the exact cause.",
    };
  },
};

// 3. Render-pipeline and shader compatibility.

export const pipelineShaderRule: UnityDiagnosticRule = {
  id: "UNITY-RULE-PIPELINE-MISMATCH",
  name: "Shader & Render Pipeline Compatibility Inspector",

  evaluate: (ctx) => {
    const text = `${ctx.errorMessage}\n${ctx.codeSnippet ?? ""}`.toLowerCase();

    const isUrp = ctx.renderPipeline === "urp";
    const isHdrp = ctx.renderPipeline === "hdrp";
    const isBuiltin = ctx.renderPipeline === "builtin";

    const hasBuiltinIncludes =
      text.includes("unitycg.cginc") ||
      text.includes("lighting.cginc") ||
      text.includes("autolight.cginc");

    const hasLegacyShader =
      text.includes("standard") &&
      (text.includes("shader") || text.includes("material")) &&
      (isUrp || isHdrp);

    const hasInternalErrorShader = text.includes("hidden/internalerror");

    const hasPinkShaderMention =
      hasInternalErrorShader ||
      /(?:\b(?:shader|material|render pipeline|rendering)\b.{0,80}\b(?:pink|magenta)\b|\b(?:pink|magenta)\b.{0,80}\b(?:shader|material|render pipeline|rendering)\b)/i.test(
        text,
      );

    if (
      (isUrp || isHdrp) &&
      (hasBuiltinIncludes || hasLegacyShader || hasPinkShaderMention)
    ) {
      const evidence = hasBuiltinIncludes
        ? "Found legacy includes (UnityCG.cginc / Lighting.cginc) in the supplied error or code."
        : hasLegacyShader
          ? "Detected a legacy Standard shader/material reference while the project uses an SRP."
          : hasInternalErrorShader
            ? "The supplied error text references Hidden/InternalErrorShader."
            : "The supplied text links a pink/magenta symptom to a shader, material, or render-pipeline context.";

      return {
        ruleId: "UNITY-RULE-PIPELINE-MISMATCH",
        title: `Shader incompatible with Scriptable Render Pipeline (${ctx.renderPipeline.toUpperCase()})`,
        finding:
          `The supplied input contains shader or material clues that may be incompatible with the configured ${ctx.renderPipeline.toUpperCase()} render pipeline. This can contribute to shader compilation errors or pink/magenta materials, but the active shader and full compilation output have not been inspected.`,
        evidence,
        severity: "high",
        suggestedNextStep: isUrp
          ? "Inspect the exact shader compilation error and its includes. If it is a Built-in shader, consider porting it to URP HLSL or Shader Graph. The Render Pipeline Converter may help with supported assets, but custom shaders may require manual changes."
          : "Inspect the shader compilation error and determine whether the shader supports HDRP. Consider an HDRP-compatible shader or Shader Graph; custom shaders may require manual porting.",
        limitations:
          "Text-pattern matching cannot establish the active pipeline asset, shader pass behavior, material assignment, or whether a custom shader is fully compatible. A pink material alone does not prove a pipeline mismatch.",
      };
    }

    const hasUrpIncludes =
      text.includes("com.unity.render-pipelines.universal") ||
      text.includes("core.hlsl") ||
      text.includes("universalforward");

    if (isBuiltin && hasUrpIncludes) {
      return {
        ruleId: "UNITY-RULE-PIPELINE-MISMATCH",
        title: "URP Shader used in Built-in Render Pipeline project",
        finding:
          "The supplied shader or error text references URP libraries or passes, while the selected project pipeline is Built-in. This suggests a possible pipeline mismatch, but the active Graphics settings and complete shader source have not been inspected.",
        evidence:
          "Detected URP HLSL include or pass indicators in the supplied input while the selected render pipeline is Built-in.",
        severity: "high",
        suggestedNextStep:
          "Confirm the active render pipeline in Project Settings > Graphics and inspect the shader's compilation error. If the project intentionally uses Built-in, use a compatible shader; if it should use URP, verify the package and pipeline asset configuration before switching pipelines.",
        limitations:
          "The selected pipeline value may not reflect the project's actual active configuration. Shader source and Unity Graphics settings are required to confirm the mismatch.",
      };
    }

    return null;
  },
};

// 4. Package manifest dependency checks.

export const packageManifestRule: UnityDiagnosticRule = {
  id: "UNITY-RULE-MANIFEST-DEPS",
  name: "Package Manifest Dependency Verifier",

  evaluate: (ctx) => {
    const manifestFile = ctx.attachedFiles?.find((file) => {
      const normalized = file.name.replace(/\\/g, "/").toLowerCase();
      return (
        normalized === "manifest.json" ||
        normalized.endsWith("/manifest.json")
      );
    });

    if (!manifestFile) return null;

    const error = ctx.errorMessage;

    const hasMissingDependencySignal =
      /\bCS0246\b/i.test(error) ||
      /\b(?:type|namespace|assembly|package)\b.{0,120}\b(?:could not be found|not found|missing|unresolved)\b/i.test(
        error,
      );

    if (!hasMissingDependencySignal) return null;

    const packageSignatures = [
      {
        name: "com.unity.inputsystem",
        pattern: /UnityEngine\.InputSystem|InputAction/i,
        label: "Unity New Input System",
      },
      {
        name: "com.unity.textmeshpro",
        pattern: /TMPro|TextMeshPro/i,
        label: "TextMesh Pro",
      },
      {
        name: "com.unity.render-pipelines.universal",
        pattern: /UnityEngine\.Rendering\.Universal|UniversalRenderPipelineAsset|\bURP\b/i,
        label: "Universal Render Pipeline",
      },
      {
        name: "com.unity.cinemachine",
        pattern: /Cinemachine/i,
        label: "Cinemachine",
      },
      {
        name: "com.unity.netcode.gameobjects",
        pattern: /Unity\.Netcode/i,
        label: "Netcode for GameObjects",
      },
    ];

    const relevantPackage = packageSignatures.find(
      (signature) =>
        signature.pattern.test(error) ||
        Boolean(
          ctx.codeSnippet && signature.pattern.test(ctx.codeSnippet),
        ),
    );

    if (!relevantPackage) return null;

    try {
      const manifest = JSON.parse(manifestFile.content);
      const dependencies = manifest?.dependencies;

      if (
        !dependencies ||
        typeof dependencies !== "object" ||
        Array.isArray(dependencies)
      ) {
        return null;
      }

      if (Object.prototype.hasOwnProperty.call(
        dependencies,
        relevantPackage.name,
      )) {
        return null;
      }

      return {
        ruleId: "UNITY-RULE-MANIFEST-DEPS",
        title: `Possible Missing Package Dependency: ${relevantPackage.name}`,
        finding:
          `The uploaded manifest.json does not list '${relevantPackage.name}' (${relevantPackage.label}). This may explain the unresolved type or error, but the absent entry alone does not prove that the package is required or unavailable.`,
        evidence:
          `Inspected manifest.json: '${relevantPackage.name}' is absent from its dependencies dictionary.`,
        severity: "high",
        suggestedNextStep:
          `Open Window > Package Manager and check whether '${relevantPackage.label}' (${relevantPackage.name}) is installed and resolved. If the error and project configuration confirm that the package is required and missing, install a compatible version through Package Manager. Do not guess a package version.`,
        limitations:
          "Scoped registry packages, embedded packages, local packages, and assembly-definition issues may explain the error. This rule checks the supplied manifest's dependencies object only; it cannot confirm Unity's resolved package state.",
      };
    } catch {
      // Malformed JSON cannot support a reliable dependency conclusion.
      return null;
    }
  },
};

// 5. CS0103: unresolved identifier or method.

export const cs0103Rule: UnityDiagnosticRule = {
  id: "UNITY-RULE-CS0103",
  name: "Unresolved Identifier / Scope Violation (CS0103)",

  evaluate: (ctx) => {
    const match = ctx.errorMessage.match(
      /CS0103:\s*The name ['"]?([A-Za-z0-9_]+)['"]? does not exist in the current context/i,
    );

    if (!match) return null;

    const identifier = match[1];

    return {
      ruleId: "UNITY-RULE-CS0103",
      title: `CS0103: Identifier '${identifier}' Not Found`,
      finding:
        `The compiler reports that '${identifier}' does not exist in the current context. Possible causes include a spelling or casing mismatch, a missing declaration, an out-of-scope variable, or an unavailable symbol. The error text alone does not distinguish these causes.`,
      evidence: match[0],
      severity: "medium",
      suggestedNextStep:
        `Search the relevant script and its base classes for '${identifier}'. Check spelling, casing, declaration scope, and whether the intended API or member is available in the current context. If the identifier is an API, verify the correct signature and namespace for the installed Unity/package version.`,
      limitations:
        "Cannot inspect unprovided project symbols, inherited members, generated code, assembly references, or the complete project AST. An API deprecation does not by itself explain a CS0103 error.",
    };
  },
};

// 6. MonoBehaviour class and C# filename agreement.

export const monobehaviourNameRule: UnityDiagnosticRule = {
  id: "UNITY-RULE-MONOBEHAVIOUR-NAME",
  name: "MonoBehaviour Class & Filename Agreement",

  evaluate: (ctx) => {
    const codeFiles = (ctx.attachedFiles ?? []).filter((file) =>
      file.name.toLowerCase().endsWith(".cs"),
    );

    const codeSources = [
      ...(ctx.codeSnippet
        ? [
            {
              name: undefined as string | undefined,
              content: ctx.codeSnippet,
            },
          ]
        : []),
      ...codeFiles.map((file) => ({
        name: file.name.replace(/\\/g, "/").split("/").pop(),
        content: file.content,
      })),
    ];

    for (const source of codeSources) {
      const classMatch = source.content.match(
        /\bclass\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?:[\w.]+\.)?MonoBehaviour\b/,
      );

      if (!classMatch || !source.name) continue;

      const className = classMatch[1];
      const fileBaseName = source.name.replace(/\.cs$/i, "");

      if (fileBaseName === className) continue;

      return {
        ruleId: "UNITY-RULE-MONOBEHAVIOUR-NAME",
        title: `Possible Script Filename Mismatch: ${source.name} vs ${className}`,
        finding:
          `The supplied file is named '${source.name}', while the detected MonoBehaviour declaration is '${className}'. Unity's attachable MonoBehaviour scripts generally require the script filename and class name to match. This check only evaluates the provided source and may not account for multiple classes or more complex declarations.`,
        evidence:
          `File name: '${source.name}', class declaration: '${className}'`,
        severity: "high",
        suggestedNextStep:
          `Check whether '${className}' is the intended attachable MonoBehaviour in '${source.name}'. If it is, align the filename and class name, then allow Unity to recompile. If the file intentionally contains multiple classes, inspect the complete script before renaming anything.`,
        limitations:
          "This is a source-text heuristic. It does not parse the complete C# syntax tree or account for every valid class/file arrangement. Only supplied snippets and attached C# files are inspected.",
      };
    }

    return null;
  },
};

export const allRules: UnityDiagnosticRule[] = [
  cs0246Rule,
  nullRefRule,
  pipelineShaderRule,
  packageManifestRule,
  cs0103Rule,
  monobehaviourNameRule,
];
