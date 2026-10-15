import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  InvestigationCreateSchema,
  AiDiagnosticResponseSchema,
  UserFeedbackSchema,
} from '../src/lib/schemas';

describe('Validation Schemas & Models', () => {
  it('validates correct investigation input', () => {
    const valid = {
      title: 'Missing Material Shader in URP',
      errorMessage: 'Shader error in Custom/Water: UniversalForward undeclared',
      codeSnippet: 'Shader "Custom/Water" {}',
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
      targetPlatform: 'Standalone (Windows/Mac/Linux)',
    };

    const res = InvestigationCreateSchema.safeParse(valid);
    assert.equal(res.success, true);
  });

  it('rejects empty title or too short error message', () => {
    const invalid = {
      title: 'Hi',
      errorMessage: 'err',
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
    };

    const res = InvestigationCreateSchema.safeParse(invalid);
    assert.equal(res.success, false);
  });

  it('validates structured AI diagnostic response shape', () => {
    const aiResponse = {
      executiveSummary: 'The shader requires Universal Render Pipeline assets.',
      likelyRootCause: 'LightMode UniversalForward tag used in Built-in pipeline context.',
      severity: 'high',
      confidence: {
        level: 'high',
        calibrationReasoning: 'Direct keyword match in shader code.',
      },
      evidence: [
        {
          type: 'log_line',
          content: 'Shader error UniversalForward',
          significance: 'Primary compiler log',
        },
      ],
      recommendedFix: ['Upgrade to URP', 'Or replace pass with ForwardBase'],
      suggestedCodeChanges: [
        {
          fileName: 'Water.shader',
          proposedSnippet: 'Tags { "LightMode" = "ForwardBase" }',
          explanation: 'Switch to Built-in pass',
        },
      ],
      verificationSteps: [
        {
          id: 'v1',
          instruction: 'Recompile shader in Unity',
          expectedOutcome: 'Zero compilation errors',
        },
      ],
      alternativeCauses: ['Legacy shader cache corruption'],
      missingInformation: ['Graphics settings asset'],
    };

    const res = AiDiagnosticResponseSchema.safeParse(aiResponse);
    assert.equal(res.success, true);
  });

  it('validates feedback payload', () => {
    const feedback = {
      helpful: true,
      comment: 'Fixed my URP shader instantly.',
    };

    const res = UserFeedbackSchema.safeParse(feedback);
    assert.equal(res.success, true);
  });
});

