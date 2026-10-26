
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
  DeterministicRuleFinding,
  DiagnosticEvidenceItem,
} from "../src/lib/types";

import {
  calibrateDiagnosisConfidence,
  collectDirectEvidence,
  keepGroundedAiEvidence,
} from "../src/lib/diagnostic-engine/evidence";

import type { EvidenceContext } from "../src/lib/diagnostic-engine/evidence";

function makeContext(
  overrides: Partial<EvidenceContext> = {},
): EvidenceContext {
  return {
    title: "Test Unity diagnosis",
    errorMessage:
      "Assets/Scripts/PlayerController.cs:42 NullReferenceException: Object reference not set to an instance of an object",
    unityVersion: "2022.3 LTS",
    renderPipeline: "urp",
    ...overrides,
  };
}

function makeFinding(
  overrides: Partial<DeterministicRuleFinding> = {},
): DeterministicRuleFinding {
  return {
    ruleId: "UNITY-RULE-NULLREF",
    title: "Runtime NullReferenceException Detected",
    finding:
      "A NullReferenceException was detected, but the exact null reference is unknown.",
    evidence: "NullReferenceException",
    severity: "medium",
    suggestedNextStep: "Inspect the failing line and referenced objects.",
    limitations:
      "The stack trace does not identify which reference was null.",
    ...overrides,
  };
}

describe("Evidence grounding", () => {
  it("extracts submitted error lines and stack-frame evidence", () => {
    const context = makeContext({
      errorMessage: [
        "NullReferenceException: Object reference not set to an instance of an object",
        "at PlayerController.Update() in Assets/Scripts/PlayerController.cs:line 42",
      ].join("\n"),
    });

    const evidence = collectDirectEvidence(context);

    assert.ok(
      evidence.some(
        (item) =>
          item.type === "log_line" &&
          item.content.includes("NullReferenceException"),
      ),
    );

    assert.ok(
      evidence.some(
        (item) =>
          item.type === "stack_frame" &&
          item.content.includes("PlayerController.Update"),
      ),
    );
  });

  it("extracts supplied code and configuration context", () => {
    const context = makeContext({
      codeSnippet: "var target = GetComponent<Rigidbody>();",
      projectContext: "The error occurs when the player enters the scene.",
    });

    const evidence = collectDirectEvidence(context);

    assert.ok(
      evidence.some(
        (item) =>
          item.type === "code_snippet" &&
          item.content.includes("GetComponent<Rigidbody>"),
      ),
    );

    assert.ok(
      evidence.some(
        (item) =>
          item.type === "configuration" &&
          item.content.includes("enters the scene"),
      ),
    );
  });

  it("does not accept AI evidence absent from all supplied inputs", () => {
    const context = makeContext({
      errorMessage: "NullReferenceException occurred.",
      codeSnippet: "transform.position = Vector3.zero;",
    });

    const aiEvidence: DiagnosticEvidenceItem[] = [
      {
        type: "code_snippet",
        content: "transform.position = Vector3.zero;",
        significance: "AI quoted a supplied line.",
      },
      {
        type: "code_snippet",
        content: "player.health = 100;",
        significance: "AI invented a line not present in the inputs.",
      },
    ];

    const grounded = keepGroundedAiEvidence(aiEvidence, context);

    assert.equal(grounded.length, 1);
    assert.equal(
      grounded[0].content,
      "transform.position = Vector3.zero;",
    );
  });

  it("rejects AI evidence that references a nonexistent source file", () => {
    const context = makeContext({
      errorMessage: "CS0103: The name 'player' does not exist in the current context",
    });

    const aiEvidence: DiagnosticEvidenceItem[] = [
      {
        type: "log_line",
        content:
          "CS0103: The name 'player' does not exist in the current context",
        location: "Assets/Scripts/Player.cs",
        significance: "Claimed to come from a project source file.",
      },
    ];

    assert.deepEqual(
      keepGroundedAiEvidence(aiEvidence, context),
      [],
    );
  });

  it("does not give high confidence when no deterministic rule matched", () => {
    const result = calibrateDiagnosisConfidence(
      makeContext(),
      [],
      "high",
    );

    assert.equal(result.level, "low");
    assert.match(result.calibrationReasoning, /no deterministic rule matched/i);
  });

  it("caps exact compiler-signature confidence at medium", () => {
    const context = makeContext({
      errorMessage:
        "error CS0246: The type or namespace name 'InputAction' could not be found",
    });

    const result = calibrateDiagnosisConfidence(
      context,
      [
        makeFinding({
          ruleId: "UNITY-RULE-CS0246",
          title: "CS0246: Unresolved Type 'InputAction'",
        }),
      ],
      "high",
    );

    assert.equal(result.level, "medium");
    assert.match(result.calibrationReasoning, /does not.*establish|does not.*determine/i);
  });

  it("keeps a NullReferenceException at low confidence without code or a usable location", () => {
    const context = makeContext({
      errorMessage:
        "NullReferenceException: Object reference not set to an instance of an object",
      codeSnippet: undefined,
    });

    const result = calibrateDiagnosisConfidence(
      context,
      [makeFinding()],
      "high",
    );

    assert.equal(result.level, "low");
    assert.match(result.calibrationReasoning, /exact null reference is unknown/i);
  });

  it("does not conclude a manifest package is missing from its presence alone", () => {
    const context = makeContext({
      errorMessage:
        "error CS0246: The type or namespace name 'InputAction' could not be found",
      attachedFiles: [
        {
          name: "manifest.json",
          size: 70,
          type: "application/json",
          content: JSON.stringify({
            dependencies: {
              "com.unity.inputsystem": "1.7.0",
            },
          }),
        },
      ],
    });

    const evidence = collectDirectEvidence(context);

    assert.ok(
      evidence.some(
        (item) =>
          item.type === "manifest_entry" &&
          item.content.includes("com.unity.inputsystem"),
      ),
    );
  });
});
