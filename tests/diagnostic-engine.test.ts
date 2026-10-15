import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  cs0246Rule,
  nullRefRule,
  pipelineShaderRule,
  packageManifestRule,
  cs0103Rule,
  monobehaviourNameRule,
} from '../src/lib/diagnostic-engine/rules';
import { runDeterministicAnalysis } from '../src/lib/diagnostic-engine/index';

describe('Unity Deterministic Rules Engine', () => {
  it('identifies CS0246 missing namespace for TMPro and provides using directive', () => {
    const finding = cs0246Rule.evaluate({
      errorMessage: `Assets/Scripts/ScoreUI.cs(12,10): error CS0246: The type or namespace name 'TextMeshProUGUI' could not be found (are you missing a using directive or an assembly reference?)`,
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
    });

    assert.ok(finding !== null, 'Finding should not be null');
    assert.equal(finding.ruleId, 'UNITY-RULE-CS0246');
    assert.equal(finding.severity, 'high');
    assert.match(finding.suggestedNextStep, /using TMPro;/);
  });

  it('parses NullReferenceException call stack and identifies script and line number', () => {
    const errorStack = `NullReferenceException: Object reference not set to an instance of an object
  at PlayerController.Awake () [0x00010] in Assets/Scripts/PlayerController.cs:42
  at UnityEngine.Component.CallAwakeOrStart () [0x00000] in <unknown>:0`;

    const finding = nullRefRule.evaluate({
      errorMessage: errorStack,
      unityVersion: '6000.0 (Unity 6)',
      renderPipeline: 'urp',
    });

    assert.ok(finding !== null);
    assert.equal(finding.ruleId, 'UNITY-RULE-NULLREF');
    assert.equal(finding.severity, 'high');
    assert.match(finding.evidence, /Assets\/Scripts\/PlayerController\.cs \(Line 42\)/);
  });

  it('detects URP shader passes used in Built-in render pipeline projects', () => {
    const finding = pipelineShaderRule.evaluate({
      errorMessage: "Shader error in 'Water': UniversalForward pass undeclared",
      codeSnippet: `Pass { Tags { "LightMode" = "UniversalForward" } }`,
      unityVersion: '2022.3 LTS',
      renderPipeline: 'builtin',
    });

    assert.ok(finding !== null);
    assert.equal(finding.ruleId, 'UNITY-RULE-PIPELINE-MISMATCH');
    assert.equal(finding.severity, 'high');
    assert.match(finding.title, /URP Shader used in Built-in Render Pipeline project/);
  });

  it('detects legacy Built-in shader includes (UnityCG.cginc) used in URP projects', () => {
    const finding = pipelineShaderRule.evaluate({
      errorMessage: "Shader error in 'Custom/Surface': Hidden/InternalErrorShader",
      codeSnippet: `#include "UnityCG.cginc"`,
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
    });

    assert.ok(finding !== null);
    assert.equal(finding.ruleId, 'UNITY-RULE-PIPELINE-MISMATCH');
    assert.match(finding.title, /Shader incompatible with Scriptable Render Pipeline \(URP\)/);
  });

  it('verifies missing package in uploaded manifest.json', () => {
    const manifestJson = JSON.stringify({
      dependencies: {
        'com.unity.collab-proxy': '2.0.5',
      },
    });

    const finding = packageManifestRule.evaluate({
      errorMessage: 'error CS0246: The type or namespace name UnityEngine.InputSystem could not be found',
      unityVersion: '2023.3 LTS',
      renderPipeline: 'urp',
      attachedFiles: [
        {
          name: 'manifest.json',
          size: 100,
          type: 'application/json',
          content: manifestJson,
        },
      ],
    });

    assert.ok(finding !== null);
    assert.equal(finding.ruleId, 'UNITY-RULE-MANIFEST-DEPS');
    assert.match(finding.finding, /com\.unity\.inputsystem/);
  });

  it('detects MonoBehaviour class name mismatch with C# filename', () => {
    const finding = monobehaviourNameRule.evaluate({
      errorMessage: 'The script class cannot be found in EnemyAI.cs',
      codeSnippet: 'public class MonsterBoss : MonoBehaviour { }',
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
      attachedFiles: [
        {
          name: 'EnemyAI.cs',
          size: 200,
          type: 'text/x-csharp',
          content: 'public class MonsterBoss : MonoBehaviour { }',
        },
      ],
    });

    assert.ok(finding !== null);
    assert.equal(finding.ruleId, 'UNITY-RULE-MONOBEHAVIOUR-NAME');
    assert.match(finding.title, /Script Filename Mismatch/);
  });

  it('runs aggregated deterministic analysis successfully across rules', () => {
    const result = runDeterministicAnalysis({
      errorMessage: `Assets/Scripts/PlayerController.cs(10,5): error CS0246: The type or namespace name 'InputAction' could not be found`,
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
    });

    assert.equal(result.analyzedRulesCount, 6);
    assert.ok(result.findings.length >= 1);
    assert.equal(result.findings[0].ruleId, 'UNITY-RULE-CS0246');
  });

    it('does not flag an unrelated mention of pink as a shader mismatch', () => {
    const finding = pipelineShaderRule.evaluate({
      errorMessage: 'The settings panel background is pink.',
      codeSnippet: 'const label = "pink";',
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
    });

    assert.equal(finding, null);
  });

  it('detects a pink material explicitly linked to a shader problem', () => {
    const finding = pipelineShaderRule.evaluate({
      errorMessage: 'Material renders pink because its shader is unsupported in URP.',
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
    });

    assert.ok(finding !== null);
    assert.equal(finding.ruleId, 'UNITY-RULE-PIPELINE-MISMATCH');
  });


  it('uses medium severity when a NullReferenceException has no project stack frame', () => {
  const finding = nullRefRule.evaluate({
    errorMessage:
      'NullReferenceException: Object reference not set to an instance of an object',
    unityVersion: '2022.3 LTS',
    renderPipeline: 'urp',
  });

  assert.ok(finding !== null);
  assert.equal(finding.severity, 'medium');
  assert.match(finding.evidence, /line not found/i);
});
});

