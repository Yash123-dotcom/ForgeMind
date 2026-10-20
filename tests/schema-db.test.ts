
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  InvestigationCreateSchema,
  UploadedFileSchema,
  AiDiagnosticResponseSchema,
  UserFeedbackSchema,
} from '../src/lib/schemas';

describe('Validation Schemas & Models', () => {
  const validInvestigation = {
    title: 'Missing Material Shader in URP',
    errorMessage:
      'Shader error in Custom/Water: UniversalForward undeclared',
    codeSnippet: 'Shader "Custom/Water" {}',
    unityVersion: '2022.3 LTS',
    renderPipeline: 'urp',
    targetPlatform: 'Standalone (Windows/Mac/Linux)',
  };

  it('validates correct investigation input', () => {
    const result =
      InvestigationCreateSchema.safeParse(validInvestigation);

    assert.equal(result.success, true);
  });

  it('allows an investigation without optional evidence files', () => {
    const result =
      InvestigationCreateSchema.safeParse(validInvestigation);

    assert.equal(result.success, true);

    if (result.success) {
      assert.equal(result.data.attachedFiles, undefined);
    }
  });

  it('rejects an empty title or too-short error message', () => {
    const result = InvestigationCreateSchema.safeParse({
      title: 'Hi',
      errorMessage: 'err',
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
    });

    assert.equal(result.success, false);
  });

  it('rejects a title longer than 120 characters', () => {
    const result = InvestigationCreateSchema.safeParse({
      ...validInvestigation,
      title: 'A'.repeat(121),
    });

    assert.equal(result.success, false);
  });

  it('accepts a supported C# evidence file', () => {
    const result = UploadedFileSchema.safeParse({
      name: 'PlayerController.cs',
      size: 120,
      type: 'text/plain',
      content: 'public class PlayerController {}',
    });

    assert.equal(result.success, true);
  });

  it('accepts supported shader and configuration extensions', () => {
    const supportedFiles = [
      'Water.shader',
      'Common.hlsl',
      'manifest.json',
      'Gameplay.asmdef',
      'Editor.log',
      'Readme.txt',
    ];

    for (const name of supportedFiles) {
      const result = UploadedFileSchema.safeParse({
        name,
        size: 100,
        type: 'text/plain',
        content: 'sample evidence',
      });

      assert.equal(
        result.success,
        true,
        `${name} should be accepted`
      );
    }
  });

  it('rejects an unsupported evidence file extension', () => {
    const result = UploadedFileSchema.safeParse({
      name: 'payload.exe',
      size: 100,
      type: 'application/octet-stream',
      content: 'not executable',
    });

    assert.equal(result.success, false);
  });

  it('rejects a file larger than 2 MB', () => {
    const result = UploadedFileSchema.safeParse({
      name: 'PlayerController.cs',
      size: 2 * 1024 * 1024 + 1,
      type: 'text/plain',
      content: 'sample',
    });

    assert.equal(result.success, false);
  });

  it('rejects a negative file size', () => {
    const result = UploadedFileSchema.safeParse({
      name: 'PlayerController.cs',
      size: -1,
      type: 'text/plain',
      content: 'sample',
    });

    assert.equal(result.success, false);
  });

  it('rejects a non-integer file size', () => {
    const result = UploadedFileSchema.safeParse({
      name: 'PlayerController.cs',
      size: 12.5,
      type: 'text/plain',
      content: 'sample',
    });

    assert.equal(result.success, false);
  });

  it('rejects evidence content exceeding 500,000 characters', () => {
    const result = UploadedFileSchema.safeParse({
      name: 'PlayerController.cs',
      size: 100,
      type: 'text/plain',
      content: 'x'.repeat(500001),
    });

    assert.equal(result.success, false);
  });

  it('accepts evidence content at the 500,000-character limit', () => {
    const result = UploadedFileSchema.safeParse({
      name: 'PlayerController.cs',
      size: 100,
      type: 'text/plain',
      content: 'x'.repeat(500000),
    });

    assert.equal(result.success, true);
  });

  it('rejects more than five evidence files', () => {
    const attachedFiles = Array.from({ length: 6 }, (_, index) => ({
      name: `Script${index}.cs`,
      size: 100,
      type: 'text/plain',
      content: `// Script ${index}`,
    }));

    const result = InvestigationCreateSchema.safeParse({
      ...validInvestigation,
      attachedFiles,
    });

    assert.equal(result.success, false);
  });

  it('accepts five valid evidence files', () => {
    const attachedFiles = Array.from({ length: 5 }, (_, index) => ({
      name: `Script${index}.cs`,
      size: 100,
      type: 'text/plain',
      content: `// Script ${index}`,
    }));

    const result = InvestigationCreateSchema.safeParse({
      ...validInvestigation,
      attachedFiles,
    });

    assert.equal(result.success, true);
  });

  it('validates structured AI diagnostic response shape', () => {
    const aiResponse = {
      executiveSummary:
        'The shader requires Universal Render Pipeline assets.',
      likelyRootCause:
        'LightMode UniversalForward tag used in Built-in pipeline context.',
      severity: 'high',
      confidence: {
        level: 'high',
        calibrationReasoning:
          'Direct keyword match in shader code.',
      },
      evidence: [
        {
          type: 'log_line',
          content: 'Shader error UniversalForward',
          significance: 'Primary compiler log',
        },
      ],
      recommendedFix: [
        'Upgrade to URP',
        'Or replace pass with ForwardBase',
      ],
      suggestedCodeChanges: [
        {
          fileName: 'Water.shader',
          proposedSnippet:
            'Tags { "LightMode" = "ForwardBase" }',
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

    const result =
      AiDiagnosticResponseSchema.safeParse(aiResponse);

    assert.equal(result.success, true);
  });

  it('validates feedback payload', () => {
    const result = UserFeedbackSchema.safeParse({
      helpful: true,
      comment: 'Fixed my URP shader instantly.',
    });

    assert.equal(result.success, true);
  });
});
