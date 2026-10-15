import { DeterministicRuleFinding } from '../types';
import { allRules, DiagnosticInputContext } from './rules';

export interface DeterministicAnalysisResult {
  findings: DeterministicRuleFinding[];
  summary: string;
  hasCriticalFindings: boolean;
  analyzedRulesCount: number;
}

export function runDeterministicAnalysis(ctx: DiagnosticInputContext): DeterministicAnalysisResult {
  const findings: DeterministicRuleFinding[] = [];

  for (const rule of allRules) {
    try {
      const finding = rule.evaluate(ctx);
      if (finding) {
        findings.push(finding);
      }
    } catch (err) {
      console.error(`Rule ${rule.id} failed evaluation:`, err);
    }
  }

  const hasCriticalFindings = findings.some(
    (f) => f.severity === 'critical' || f.severity === 'high'
  );

  let summary = 'No deterministic rule triggers detected.';
  if (findings.length > 0) {
    summary = `Identified ${findings.length} rule-based issue${findings.length === 1 ? '' : 's'}: ${findings
      .map((f) => f.title)
      .join('; ')}`;
  }

  return {
    findings,
    summary,
    hasCriticalFindings,
    analyzedRulesCount: allRules.length,
  };
}

