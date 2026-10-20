
import { z } from 'zod';

export const UnityVersionSchema = z.enum([
  '6000.0 (Unity 6)',
  '2023.3 LTS',
  '2022.3 LTS',
  '2021.3 LTS',
  '2020.3 LTS',
  'Other',
]);

export const UnityRenderPipelineSchema = z.enum([
  'builtin',
  'urp',
  'hdrp',
  'unknown',
]);

export const TargetPlatformSchema = z.enum([
  'Standalone (Windows/Mac/Linux)',
  'iOS',
  'Android',
  'WebGL',
  'Console',
  'Universal / Any',
]);

export const ALLOWED_EVIDENCE_EXTENSIONS = [
  '.cs',
  '.json',
  '.shader',
  '.hlsl',
  '.txt',
  '.log',
  '.asmdef',
] as const;

const MAX_EVIDENCE_FILE_SIZE = 2 * 1024 * 1024;
const MAX_EVIDENCE_CONTENT_LENGTH = 500000;

export const UploadedFileSchema = z.object({
  name: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name cannot exceed 255 characters')
    .refine(
      (name) =>
        ALLOWED_EVIDENCE_EXTENSIONS.some((extension) =>
          name.toLowerCase().endsWith(extension)
        ),
      'Unsupported evidence file extension'
    ),

  size: z
    .number()
    .int('File size must be an integer')
    .nonnegative('File size cannot be negative')
    .max(
      MAX_EVIDENCE_FILE_SIZE,
      'File size must not exceed 2 MB'
    ),

  type: z.string().max(100, 'File type is too long'),

  content: z
    .string()
    .max(
      MAX_EVIDENCE_CONTENT_LENGTH,
      'File content exceeds the 500,000-character inspection limit'
    ),
});

export const InvestigationCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters'),

  errorMessage: z
    .string()
    .trim()
    .min(
      5,
      'Error message or stack trace must be at least 5 characters'
    )
    .max(
      50000,
      'Error log exceeds maximum character limit of 50,000'
    ),

  codeSnippet: z
    .string()
    .max(
      100000,
      'Code snippet exceeds maximum character limit of 100,000'
    )
    .optional(),

  projectContext: z
    .string()
    .max(
      5000,
      'Project context exceeds maximum character limit of 5,000'
    )
    .optional(),

  unityVersion: UnityVersionSchema,

  renderPipeline: UnityRenderPipelineSchema,

  targetPlatform: TargetPlatformSchema.optional(),

  attachedFiles: z
    .array(UploadedFileSchema)
    .max(5, 'Maximum of 5 files per investigation')
    .optional(),
});

export const DeterministicFindingSchema = z.object({
  ruleId: z.string(),
  title: z.string(),
  finding: z.string(),
  evidence: z.string(),
  severity: z.enum([
    'info',
    'low',
    'medium',
    'high',
    'critical',
  ]),
  suggestedNextStep: z.string(),
  limitations: z.string(),
});

export const DiagnosticEvidenceItemSchema = z.object({
  type: z.enum([
    'log_line',
    'stack_frame',
    'code_snippet',
    'manifest_entry',
    'configuration',
  ]),
  content: z.string(),
  location: z.string().optional(),
  significance: z.string(),
});

export const SuggestedCodeChangeSchema = z.object({
  fileName: z.string().optional(),
  originalSnippet: z.string().optional(),
  proposedSnippet: z.string(),
  explanation: z.string(),
  diffType: z
    .enum(['patch', 'replacement', 'addition'])
    .optional(),
});

export const VerificationStepSchema = z.object({
  id: z.string(),
  instruction: z.string(),
  expectedOutcome: z.string(),
});

export const AiDiagnosticResponseSchema = z.object({
  executiveSummary: z.string().min(10),
  likelyRootCause: z.string().min(10),

  severity: z.enum([
    'info',
    'low',
    'medium',
    'high',
    'critical',
  ]),

  confidence: z.object({
    level: z.enum(['high', 'medium', 'low']),
    calibrationReasoning: z.string().min(10),
  }),

  evidence: z.array(DiagnosticEvidenceItemSchema),

  recommendedFix: z.array(z.string()).min(1),

  suggestedCodeChanges: z.array(SuggestedCodeChangeSchema),

  verificationSteps: z.array(VerificationStepSchema).min(1),

  alternativeCauses: z.array(z.string()),

  missingInformation: z.array(z.string()),
});

export const UserFeedbackSchema = z.object({
  helpful: z.boolean(),
  comment: z.string().max(500).optional(),
});
