import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveInvestigation,
  getAllInvestigations,
  getInvestigationById,
  updateInvestigationFeedback,
  deleteInvestigation,
  clearAllInvestigations,
} from '../src/lib/db/index';
import { runDeterministicAnalysis } from '../src/lib/diagnostic-engine/index';
import { buildDeterministicFallbackReport } from '../src/lib/ai/provider';
import { Investigation } from '../src/lib/types';
import { randomUUID } from 'crypto';

describe('End-to-End Investigation Workflow & Persistence', () => {
  it('creates, saves, retrieves, and updates feedback for an investigation', async () => {
    // 1. Prepare input
    const title = 'Integration Test: CS0246 TMPro Missing';
    const errorMsg = 'Assets/Scripts/ScoreUI.cs(12,10): error CS0246: The type or namespace name TextMeshProUGUI could not be found';
    const code = 'using UnityEngine;\npublic class ScoreUI : MonoBehaviour { TextMeshProUGUI score; }';

    // 2. Run deterministic engine
    const detResult = runDeterministicAnalysis({
      errorMessage: errorMsg,
      codeSnippet: code,
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
    });

    assert.equal(detResult.findings.length, 1);
    assert.equal(detResult.findings[0].ruleId, 'UNITY-RULE-CS0246');

    // 3. Build diagnostic report
    const reportData = buildDeterministicFallbackReport({
      title,
      errorMessage: errorMsg,
      codeSnippet: code,
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
      deterministicResult: detResult,
    });

    const invId = randomUUID();
    const timestamp = new Date().toISOString();

    const inv: Investigation = {
      id: invId,
      title,
      errorMessage: errorMsg,
      codeSnippet: code,
      unityVersion: '2022.3 LTS',
      renderPipeline: 'urp',
      attachedFiles: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'completed',
      report: {
        id: randomUUID(),
        investigationId: invId,
        createdAt: timestamp,
        ...reportData,
      },
    };

    // 4. Save to persistent DB
    await saveInvestigation(inv);

    // 5. Retrieve by ID
    const retrieved = await getInvestigationById(invId);
    assert.ok(retrieved !== null);
    assert.equal(retrieved.id, invId);
    assert.equal(retrieved.title, title);
    assert.equal(retrieved.report?.ruleBasedFindings[0].ruleId, 'UNITY-RULE-CS0246');

    // 6. Record feedback
    const feedbackUpdated = await updateInvestigationFeedback(invId, true, 'Resolved in 2 minutes');
    assert.ok(feedbackUpdated !== null);
    assert.equal(feedbackUpdated.userFeedback?.helpful, true);

    // 7. List all
    const all = await getAllInvestigations();
    assert.ok(all.some((item) => item.id === invId));

    // 8. Delete
    const deleted = await deleteInvestigation(invId);
    assert.equal(deleted, true);

    const retrievedAfterDelete = await getInvestigationById(invId);
    assert.equal(retrievedAfterDelete, null);
  });
});

