
export type UnityRenderPipeline = 'builtin' | 'urp' | 'hdrp' | 'unknown';

export type UnityVersion =
  | '6000.0 (Unity 6)'
  | '2023.3 LTS'
  | '2022.3 LTS'
  | '2021.3 LTS'
  | '2020.3 LTS'
  | 'Other';

export type TargetPlatform =
  | 'Standalone (Windows/Mac/Linux)'
  | 'iOS'
  | 'Android'
  | 'WebGL'
  | 'Console'
  | 'Universal / Any';

export type SeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type FindingOrigin = 'direct_fact' | 'deterministic_rule' | 'ai_hypothesis';

export interface DeterministicRuleFinding {
  ruleId: string;
  title: string;
  finding: string;
  evidence: string;
  severity: SeverityLevel;
  suggestedNextStep: string;
  limitations: string;
}

export interface DiagnosticEvidenceItem {
  type: 'log_line' | 'stack_frame' | 'code_snippet' | 'manifest_entry' | 'configuration';
  content: string;
  location?: string;
  significance: string;
}

export interface SuggestedCodeChange {
  fileName?: string;
  originalSnippet?: string;
  proposedSnippet: string;
  explanation: string;
  diffType?: 'patch' | 'replacement' | 'addition';
}

export interface VerificationStep {
  id: string;
  instruction: string;
  expectedOutcome: string;
}

export interface DiagnosticReport {
  id: string;
  investigationId: string;
  createdAt: string;
  executiveSummary: string;
  likelyRootCause: string;
  severity: SeverityLevel;
  confidence: {
    level: ConfidenceLevel;
    calibrationReasoning: string;
  };
  ruleBasedFindings: DeterministicRuleFinding[];
  evidence: DiagnosticEvidenceItem[];
  recommendedFix: string[];
  suggestedCodeChanges: SuggestedCodeChange[];
  verificationSteps: VerificationStep[];
  alternativeCauses: string[];
  missingInformation: string[];
  analysisMode: 'ai_assisted' | 'deterministic_only' | 'fallback_diagnostic';
  providerNote?: string;
}

export interface UploadedFileContext {
  name: string;
  size: number;
  type: string;
  content: string;
}

export interface Investigation {
  id: string;
  userId: string;
  title: string;
  errorMessage: string;
  codeSnippet?: string;
  projectContext?: string;
  unityVersion: UnityVersion;
  renderPipeline: UnityRenderPipeline;
  targetPlatform?: TargetPlatform;
  attachedFiles: {
    name: string;
    size: number;
    type: string;
  }[];
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'completed' | 'failed';
  report?: DiagnosticReport;
  userFeedback?: {
    helpful: boolean;
    feedbackAt: string;
    comment?: string;
  };
}

export interface InvestigationCreateInput {
  title: string;
  errorMessage: string;
  codeSnippet?: string;
  projectContext?: string;
  unityVersion: UnityVersion;
  renderPipeline: UnityRenderPipeline;
  targetPlatform?: TargetPlatform;
  attachedFiles?: UploadedFileContext[];
}
