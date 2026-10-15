import {
  DeterministicRuleFinding,
  UnityRenderPipeline,
  UnityVersion,
  UploadedFileContext,
} from '../types';

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

// 1. Missing Type or Namespace (CS0246)
export const cs0246Rule: UnityDiagnosticRule = {
  id: 'UNITY-RULE-CS0246',
  name: 'Unresolved Type or Missing Namespace Directive',
  evaluate: (ctx) => {
    const error = ctx.errorMessage;
    const match = error.match(/CS0246:\s*(?:The type or namespace name\s*['"]?([A-Za-z0-9_.]+)['"]?)/i);
    if (!match) return null;

    const missingType = match[1];
    let suggestion = `Ensure the namespace declaring '${missingType}' is imported via 'using <Namespace>;' and its Assembly Definition (.asmdef) or package is referenced.`;
    
    // Check known Unity types
    const knownNamespaces: Record<string, string> = {
      TextMeshPro: 'using TMPro;',
      TextMeshProUGUI: 'using TMPro;',
      TMP_Text: 'using TMPro;',
      InputAction: 'using UnityEngine.InputSystem;',
      InputActionReference: 'using UnityEngine.InputSystem;',
      PlayerInput: 'using UnityEngine.InputSystem;',
      Volume: 'using UnityEngine.Rendering;',
      UniversalRenderPipelineAsset: 'using UnityEngine.Rendering.Universal;',
      ScriptableRendererFeature: 'using UnityEngine.Rendering.Universal;',
      CinemachineVirtualCamera: 'using Unity.Cinemachine; (or Cinemachine in older packages)',
      NetworkBehaviour: 'using Unity.Netcode;',
      NetworkManager: 'using Unity.Netcode;',
      NavMeshAgent: 'using UnityEngine.AI;',
      Image: 'using UnityEngine.UI;',
      Button: 'using UnityEngine.UI;',
      Slider: 'using UnityEngine.UI;',
      Toggle: 'using UnityEngine.UI;',
    };

    if (knownNamespaces[missingType]) {
      suggestion = `Type '${missingType}' belongs to Unity subsystem. Add '${knownNamespaces[missingType]}' at the top of your script and verify the corresponding package is installed in Package Manager.`;
    }

    return {
      ruleId: 'UNITY-RULE-CS0246',
      title: `CS0246: Unresolved Type '${missingType}'`,
      finding: `The C# compiler failed to resolve type '${missingType}'. The script is missing an explicit namespace import, an assembly definition reference (.asmdef), or a required Unity package.`,
      evidence: match[0],
      severity: 'high',
      suggestedNextStep: suggestion,
      limitations:
        'Deterministic rule only verifies pattern match on the compiler error; project-specific custom namespaces or 3rd party DLL assembly names cannot be determined without full assembly index.',
    };
  },
};

// 2. NullReferenceException Trace Analyzer
export const nullRefRule: UnityDiagnosticRule = {
  id: 'UNITY-RULE-NULLREF',
  name: 'NullReferenceException Call Stack Analyzer',
  evaluate: (ctx) => {
    const error = ctx.errorMessage;
    if (!error.includes('NullReferenceException')) return null;

    // Extract stack frame
    const stackFrameMatch = error.match(/at\s+([A-Za-z0-9_.]+)\.([A-Za-z0-9_<>]+)\s*\([^)]*\)\s*(?:\[[^\]]*\])?\s*(?:in\s+([^:]+):line\s*(\d+)|in\s+([^:]+):(\d+))/i);

    let locationInfo = 'Exact line not found in stack trace.';
    let file = '';
    let line = '';
    let method = '';

    if (stackFrameMatch) {
      method = `${stackFrameMatch[1]}.${stackFrameMatch[2]}()`;
      file = stackFrameMatch[3] || stackFrameMatch[5] || '';
      line = stackFrameMatch[4] || stackFrameMatch[6] || '';
      locationInfo = `Identified in method ${method} at ${file} (Line ${line})`;
    }

    return {
      ruleId: 'UNITY-RULE-NULLREF',
      title: 'Runtime NullReferenceException Detected',
      finding: `A runtime NullReferenceException was triggered. In Unity, this typically occurs when: (1) A serialized field [SerializeField] is unassigned in the Inspector, (2) GetComponent<T>() failed to locate the component and was dereferenced immediately, or (3) A Singleton/Manager instance is accessed before its Awake() initialization.`,
      evidence: locationInfo !== 'Exact line not found in stack trace.' ? locationInfo : 'NullReferenceException: Object reference not set to an instance of an object',
      severity: 'critical',
      suggestedNextStep: file && line 
        ? `Inspect ${file} at line ${line}. Add null-conditional checks (?.) or explicit guard assertions: 'if (target == null) { Debug.LogError("Missing reference...", this); return; }'`
        : 'Check Inspector references for unlinked GameObjects/Components and verify GetComponent() return values before accessing members.',
      limitations: 'Exact variable name cannot be pinpointed without inspecting the compiled IL or executing debug stepping on the GameObject state in the scene hierarchy.',
    };
  },
};

// 3. Render Pipeline & Shader Compatibility
export const pipelineShaderRule: UnityDiagnosticRule = {
  id: 'UNITY-RULE-PIPELINE-MISMATCH',
  name: 'Shader & Render Pipeline Compatibility Inspector',
  evaluate: (ctx) => {
    const text = `${ctx.errorMessage} ${ctx.codeSnippet || ''}`.toLowerCase();
    const isUrp = ctx.renderPipeline === 'urp';
    const isHdrp = ctx.renderPipeline === 'hdrp';
    const isBuiltin = ctx.renderPipeline === 'builtin';

    // Case 1: Built-in Shader used in SRP (URP/HDRP)
    const hasBuiltinIncludes = text.includes('unitycg.cginc') || text.includes('lighting.cginc') || text.includes('autolight.cginc');
    const hasLegacyShader = text.includes('standard') && (text.includes('shader') || text.includes('material')) && (isUrp || isHdrp);
    const hasPinkShaderMention = text.includes('hidden/internalerror') || text.includes('pink') || text.includes('magenta');

    if ((isUrp || isHdrp) && (hasBuiltinIncludes || hasLegacyShader || hasPinkShaderMention)) {
      return {
        ruleId: 'UNITY-RULE-PIPELINE-MISMATCH',
        title: `Shader incompatible with Scriptable Render Pipeline (${ctx.renderPipeline.toUpperCase()})`,
        finding: `The error or code references legacy Built-in Render Pipeline shader includes (UnityCG.cginc) or materials that do not compile under ${ctx.renderPipeline.toUpperCase()}. This is the primary cause of magenta/pink textures or black geometry.`,
        evidence: hasBuiltinIncludes 
          ? 'Found legacy includes (UnityCG.cginc / Lighting.cginc)'
          : `Active pipeline is set to ${ctx.renderPipeline.toUpperCase()} while shader/material uses Built-in pipeline conventions.`,
        severity: 'high',
        suggestedNextStep: isUrp
          ? "Upgrade shader to URP HLSL: replace 'CGPROGRAM...ENDCG' with 'HLSLPROGRAM...ENDHLSL', include 'Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl', or run Window > Rendering > Render Pipeline Converter > Built-in to URP."
          : "Upgrade shader for HDRP: use HDRP Lit shader or Shader Graph, as Built-in CG shaders are unsupported in HDRP.",
        limitations: 'Custom multi-pass shaders require manual porting as SRP handles shadow/depth passes differently from Built-in.',
      };
    }

    // Case 2: URP shaders in Built-in
    const hasUrpIncludes = text.includes('com.unity.render-pipelines.universal') || text.includes('core.hlsl') || text.includes('universalforward');
    if (isBuiltin && hasUrpIncludes) {
      return {
        ruleId: 'UNITY-RULE-PIPELINE-MISMATCH',
        title: 'URP Shader used in Built-in Render Pipeline project',
        finding: 'The shader requires the Universal Render Pipeline package and libraries, but the project is configured with Built-in Render Pipeline.',
        evidence: 'Detected URP HLSL includes or passes (Core.hlsl / UniversalForward) in a Built-in pipeline project.',
        severity: 'high',
        suggestedNextStep: 'Install URP via Package Manager and assign a Universal Render Pipeline Asset in Project Settings > Graphics, or replace the shader with a standard Built-in shader.',
        limitations: 'Requires switching the active graphics pipeline asset in Unity Project Settings.',
      };
    }

    return null;
  },
};

// 4. Missing Package Manifest Dependencies
export const packageManifestRule: UnityDiagnosticRule = {
  id: 'UNITY-RULE-MANIFEST-DEPS',
  name: 'Package Manifest Dependency Verifier',
  evaluate: (ctx) => {
    // Check if manifest.json was uploaded
    const manifestFile = ctx.attachedFiles?.find(
      (f) => f.name.toLowerCase() === 'manifest.json' || f.name.toLowerCase().endsWith('packages.json')
    );

    const error = ctx.errorMessage;

    // Check common missing packages hinted by errors
    const packageSignatures = [
      { name: 'com.unity.inputsystem', pattern: /UnityEngine\.InputSystem|InputAction/i, label: 'Unity New Input System' },
      { name: 'com.unity.textmeshpro', pattern: /TMPro|TextMeshPro/i, label: 'TextMesh Pro' },
      { name: 'com.unity.render-pipelines.universal', pattern: /UnityEngine\.Rendering\.Universal|URP/i, label: 'Universal RP' },
      { name: 'com.unity.cinemachine', pattern: /Cinemachine/i, label: 'Cinemachine' },
      { name: 'com.unity.netcode.gameobjects', pattern: /Unity\.Netcode/i, label: 'Netcode for GameObjects' },
    ];

    for (const sig of packageSignatures) {
      if (sig.pattern.test(error) || (ctx.codeSnippet && sig.pattern.test(ctx.codeSnippet))) {
        if (manifestFile) {
          try {
            const manifest = JSON.parse(manifestFile.content);
            const dependencies = manifest.dependencies || {};
            if (!dependencies[sig.name]) {
              return {
                ruleId: 'UNITY-RULE-MANIFEST-DEPS',
                title: `Missing Package Dependency: ${sig.name}`,
                finding: `The uploaded manifest.json lacks '${sig.name}' (${sig.label}), which is directly required by the code or error stack.`,
                evidence: `Inspected manifest.json: '${sig.name}' is absent from dependencies dictionary.`,
                severity: 'critical',
                suggestedNextStep: `Open Unity Window > Package Manager and install '${sig.label}' (${sig.name}), or add '"${sig.name}": "1.x.x"' to Packages/manifest.json.`,
                limitations: 'Scoped registry packages or local embedded packages might be linked outside the main manifest.',
              };
            }
          } catch {
            // Ignored if json malformed
          }
        }
      }
    }

    return null;
  },
};

// 5. CS0103: Variable or Method Does Not Exist in Current Context
export const cs0103Rule: UnityDiagnosticRule = {
  id: 'UNITY-RULE-CS0103',
  name: 'Unresolved Identifier / Scope Violation (CS0103)',
  evaluate: (ctx) => {
    const error = ctx.errorMessage;
    const match = error.match(/CS0103:\s*The name ['"]?([A-Za-z0-9_]+)['"]? does not exist in the current context/i);
    if (!match) return null;

    const identifier = match[1];
    let note = `The identifier '${identifier}' is inaccessible in this scope.`;

    // Unity version-specific deprecations
    if (identifier === 'FindObjectOfType' && ctx.unityVersion.includes('6000')) {
      note = `'FindObjectOfType' is deprecated in Unity 6. Replace with 'FindFirstObjectByType<T>()' or 'FindAnyObjectByType<T>()'.`;
    }

    return {
      ruleId: 'UNITY-RULE-CS0103',
      title: `CS0103: Identifier '${identifier}' Not Found`,
      finding: note,
      evidence: match[0],
      severity: 'medium',
      suggestedNextStep: `Check spelling and casing of '${identifier}', verify variable scope (e.g. local variable used outside block, or member declared in another class), and verify Unity version API compatibility.`,
      limitations: 'Cannot inspect unprovided project symbols or inherited base class members without complete project AST.',
    };
  },
};

// 6. Monobehaviour Script File Name Mismatch
export const monobehaviourNameRule: UnityDiagnosticRule = {
  id: 'UNITY-RULE-MONOBEHAVIOUR-NAME',
  name: 'MonoBehaviour Class & Filename Agreement',
  evaluate: (ctx) => {
    if (!ctx.codeSnippet && !ctx.attachedFiles?.length) return null;

    // Check code snippet for class declaration
    const code = ctx.codeSnippet || '';
    const classMatch = code.match(/class\s+([A-Za-z0-9_]+)\s*:\s*MonoBehaviour/);
    if (!classMatch) return null;

    const className = classMatch[1];
    
    // Check attached file names
    const csFile = ctx.attachedFiles?.find((f) => f.name.endsWith('.cs'));
    if (csFile) {
      const fileBaseName = csFile.name.replace(/\.cs$/i, '');
      if (fileBaseName !== className) {
        return {
          ruleId: 'UNITY-RULE-MONOBEHAVIOUR-NAME',
          title: `Script Filename Mismatch: ${csFile.name} vs class ${className}`,
          finding: `Unity requires MonoBehaviour class names to match the C# file name exactly. Here file is '${csFile.name}' but the class is declared as 'class ${className} : MonoBehaviour'. Unity will fail to attach this component to GameObjects with "The script class cannot be found".`,
          evidence: `File name: '${csFile.name}', Class declaration: '${className}'`,
          severity: 'high',
          suggestedNextStep: `Rename file to '${className}.cs' or rename the C# class declaration to match '${fileBaseName}'.`,
          limitations: 'Applies specifically to classes inheriting from UnityEngine.MonoBehaviour.',
        };
      }
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

