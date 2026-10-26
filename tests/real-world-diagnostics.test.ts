
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  cs0246Rule,
  nullRefRule,
  pipelineShaderRule,
  packageManifestRule,
  cs0103Rule,
  monobehaviourNameRule,
  type DiagnosticInputContext,
} from "../src/lib/diagnostic-engine/rules";

const baseContext: DiagnosticInputContext = {
  errorMessage: "",
  unityVersion: "2022.3 LTS",
  renderPipeline: "urp",
};

describe("ForgeMind real-world Unity diagnostic evaluation", () => {
  describe("CS0246 — missing type or namespace", () => {
    it("identifies a missing TextMeshPro type", () => {
      const finding = cs0246Rule.evaluate({
        ...baseContext,
        errorMessage:
          "Assets/Scripts/ScoreUI.cs(12,10): error CS0246: The type or namespace name 'TextMeshProUGUI' could not be found (are you missing a using directive or an assembly reference?)",
        codeSnippet: "public TextMeshProUGUI scoreLabel;",
      });

      assert.ok(finding);
      assert.equal(finding.ruleId, "UNITY-RULE-CS0246");
      assert.match(finding.suggestedNextStep, /using TMPro;/);
    });

    it("handles a missing custom project type without inventing its namespace", () => {
      const finding = cs0246Rule.evaluate({
        ...baseContext,
        errorMessage:
          "Assets/Scripts/EnemySpawner.cs(18,9): error CS0246: The type or namespace name 'EnemyConfig' could not be found",
      });

      assert.ok(finding);
      assert.match(finding.finding, /EnemyConfig/);
      assert.match(finding.suggestedNextStep, /namespace|Assembly Definition|assembly/i);
    });

    it("does not trigger for an unrelated compiler error", () => {
      const finding = cs0246Rule.evaluate({
        ...baseContext,
        errorMessage:
          "Assets/Scripts/Player.cs(10,5): error CS0165: Use of unassigned local variable 'speed'",
      });

      assert.equal(finding, null);
    });
  });

  describe("CS0103 — unresolved identifier", () => {
    it("identifies an undeclared variable", () => {
      const finding = cs0103Rule.evaluate({
        ...baseContext,
        errorMessage:
          "Assets/Scripts/PlayerController.cs(20,13): error CS0103: The name 'scoreText' does not exist in the current context",
        codeSnippet: "scoreText.text = score.ToString();",
      });

      assert.ok(finding);
      assert.equal(finding.ruleId, "UNITY-RULE-CS0103");
      assert.match(finding.finding, /scoreText/);
    });

    it("does not misclassify a different compiler error as CS0103", () => {
      const finding = cs0103Rule.evaluate({
        ...baseContext,
        errorMessage:
          "Assets/Scripts/Player.cs(10,5): error CS0618: 'SomeApi' is obsolete",
      });

      assert.equal(finding, null);
    });
  });

  describe("NullReferenceException — stack trace analysis", () => {
    it("extracts the user's script and line from a Unity stack trace", () => {
      const finding = nullRefRule.evaluate({
        ...baseContext,
        errorMessage: [
          "NullReferenceException: Object reference not set to an instance of an object",
          "  at PlayerController.Update () [0x00010] in Assets/Scripts/PlayerController.cs:line 42",
          "  at UnityEngine.Debug.Log (System.Object message) [0x00000] in <unknown>:0",
        ].join("\n"),
      });

      assert.ok(finding);
      assert.equal(finding.ruleId, "UNITY-RULE-NULLREF");
      assert.match(finding.evidence, /PlayerController\.cs/i);
      assert.match(finding.evidence, /42/);
      assert.match(finding.finding, /not which reference was null/i);
    });

    it("does not pretend to know the exact null reference without a usable location", () => {
      const finding = nullRefRule.evaluate({
        ...baseContext,
        errorMessage:
          "NullReferenceException: Object reference not set to an instance of an object",
      });

      assert.ok(finding);
      assert.match(finding.finding, /exact null reference remains unknown/i);
      assert.match(finding.suggestedNextStep, /stack trace/i);
    });

    it("ignores a plain mention of null that is not an exception", () => {
      const finding = nullRefRule.evaluate({
        ...baseContext,
        errorMessage: "The configuration value is null.",
      });

      assert.equal(finding, null);
    });
  });

  describe("Shader and render-pipeline compatibility", () => {
    it("flags legacy Built-in shader includes in a URP project", () => {
      const finding = pipelineShaderRule.evaluate({
        ...baseContext,
        renderPipeline: "urp",
        errorMessage: "Shader error in 'Custom/Surface': failed to compile",
        codeSnippet: '#include "UnityCG.cginc"\nCGPROGRAM',
      });

      assert.ok(finding);
      assert.equal(finding.ruleId, "UNITY-RULE-PIPELINE-MISMATCH");
      assert.match(finding.title, /Shader incompatible with Scriptable Render Pipeline \(URP\)/);
    });

    it("flags URP-specific shader code in a Built-in project", () => {
      const finding = pipelineShaderRule.evaluate({
        ...baseContext,
        renderPipeline: "builtin",
        errorMessage: "Shader error in 'Water': UniversalForward pass undeclared",
        codeSnippet:
          '#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"',
      });

      assert.ok(finding);
      assert.match(finding.title, /URP Shader used in Built-in Render Pipeline project/);
    });

    it("does not infer a shader issue from an unrelated pink UI element", () => {
      const finding = pipelineShaderRule.evaluate({
        ...baseContext,
        errorMessage: "The settings panel background is pink.",
        codeSnippet: 'const label = "pink";',
      });

      assert.equal(finding, null);
    });

    it("does not infer a pipeline mismatch from a generic shader mention alone", () => {
      const finding = pipelineShaderRule.evaluate({
        ...baseContext,
        renderPipeline: "urp",
        errorMessage: "Shader compilation completed.",
        codeSnippet: "float4 color = float4(1, 0, 0, 1);",
      });

      assert.equal(finding, null);
    });
  });

  describe("Package manifest dependency checks", () => {
    it("flags an absent Input System dependency when the error supports that hypothesis", () => {
      const finding = packageManifestRule.evaluate({
        ...baseContext,
        errorMessage:
          "error CS0246: The type or namespace name 'InputAction' could not be found",
        attachedFiles: [
          {
            name: "manifest.json",
            size: 100,
            type: "application/json",
            content: JSON.stringify({
              dependencies: {
                "com.unity.textmeshpro": "3.0.6",
              },
            }),
          },
        ],
      });

      assert.ok(finding);
      assert.equal(finding.ruleId, "UNITY-RULE-MANIFEST-DEPS");
      assert.match(finding.finding, /com\.unity\.inputsystem/);
      assert.match(finding.limitations, /cannot confirm Unity's resolved package state/i);
    });

    it("does not report a missing package when the manifest includes it", () => {
      const finding = packageManifestRule.evaluate({
        ...baseContext,
        errorMessage:
          "error CS0246: The type or namespace name 'InputAction' could not be found",
        attachedFiles: [
          {
            name: "manifest.json",
            size: 100,
            type: "application/json",
            content: JSON.stringify({
              dependencies: {
                "com.unity.inputsystem": "1.7.0",
              },
            }),
          },
        ],
      });

      assert.equal(finding, null);
    });

    it("does not report a missing dependency from an informational mention alone", () => {
      const finding = packageManifestRule.evaluate({
        ...baseContext,
        errorMessage: "InputAction is an API available in Unity projects.",
        attachedFiles: [
          {
            name: "manifest.json",
            size: 100,
            type: "application/json",
            content: JSON.stringify({ dependencies: {} }),
          },
        ],
      });

      assert.equal(finding, null);
    });

    it("does not infer a missing package from malformed manifest JSON", () => {
      const finding = packageManifestRule.evaluate({
        ...baseContext,
        errorMessage:
          "error CS0246: The type or namespace name 'InputAction' could not be found",
        attachedFiles: [
          {
            name: "manifest.json",
            size: 20,
            type: "application/json",
            content: "{ invalid json",
          },
        ],
      });

      assert.equal(finding, null);
    });
  });

  describe("MonoBehaviour class and filename agreement", () => {
    it("flags a MonoBehaviour whose class and file names differ", () => {
      const finding = monobehaviourNameRule.evaluate({
        ...baseContext,
        errorMessage: "The script class cannot be found in EnemyAI.cs",
        codeSnippet: "public class MonsterBoss : MonoBehaviour { }",
        attachedFiles: [
          {
            name: "EnemyAI.cs",
            size: 200,
            type: "text/x-csharp",
            content: "public class MonsterBoss : MonoBehaviour { }",
          },
        ],
      });

      assert.ok(finding);
      assert.equal(finding.ruleId, "UNITY-RULE-MONOBEHAVIOUR-NAME");
      assert.match(finding.title, /EnemyAI\.cs/);
      assert.match(finding.title, /MonsterBoss/);
    });

    it("does not flag matching MonoBehaviour class and filename", () => {
      const finding = monobehaviourNameRule.evaluate({
        ...baseContext,
        codeSnippet: "public class EnemyAI : MonoBehaviour { }",
        attachedFiles: [
          {
            name: "EnemyAI.cs",
            size: 200,
            type: "text/x-csharp",
            content: "public class EnemyAI : MonoBehaviour { }",
          },
        ],
      });

      assert.equal(finding, null);
    });

    it("does not infer a filename mismatch when no C# file is supplied", () => {
      const finding = monobehaviourNameRule.evaluate({
        ...baseContext,
        codeSnippet: "public class EnemyAI : MonoBehaviour { }",
      });

      assert.equal(finding, null);
    });
  });
});
