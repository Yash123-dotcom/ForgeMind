import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import type { Investigation, DiagnosticReport } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'forgemind.json');

interface DatabaseShape {
  investigations: Record<string, Investigation>;
}

interface DbRow {
  id: string;
  user_id: string | null;
  title: string;
  error_message: string;
  code_snippet: string | null;
  project_context: string | null;
  unity_version: string;
  render_pipeline: string;
  target_platform: string | null;
  attached_files: unknown;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
  user_feedback: unknown;
  report_row?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function parseArray<T>(value: unknown): T[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function toIsoString(value: string | Date | null | undefined): string {
  if (!value) return new Date().toISOString();

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

function initLocalDb(): DatabaseShape {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      const initial: DatabaseShape = { investigations: {} };

      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(initial, null, 2),
        'utf8'
      );

      return initial;
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseShape;

    if (!parsed || !isRecord(parsed.investigations)) {
      return { investigations: {} };
    }

    return parsed;
  } catch (error) {
    console.error('Failed to read local database:', error);
    return { investigations: {} };
  }
}

function saveLocalDb(data: DatabaseShape): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const tempFile = `${DATA_FILE}.tmp`;

    fs.writeFileSync(
      tempFile,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    fs.renameSync(tempFile, DATA_FILE);
  } catch (error) {
    console.error('Failed to write local database:', error);
    throw error;
  }
}

export function isNeonConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/**
 * Kept for compatibility with any existing code that uses this name.
 * Neon is the active database provider in this implementation.
 */
export function isSupabaseConfigured(): boolean {
  return isNeonConfigured();
}

function getSql() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  return neon(connectionString);
}

function mapReport(value: unknown): DiagnosticReport | undefined {
  const parsed = parseJson(value);

  if (!isRecord(parsed) || !parsed.id || !parsed.investigation_id) {
    return undefined;
  }

  return {
    id: String(parsed.id),
    investigationId: String(parsed.investigation_id),
    createdAt: toIsoString(
      parsed.created_at as string | Date | undefined
    ),
    executiveSummary: String(parsed.executive_summary ?? ''),
    likelyRootCause: String(parsed.likely_root_cause ?? ''),
    severity: String(parsed.severity ?? 'medium') as DiagnosticReport['severity'],
    confidence: (
      parseJson(parsed.confidence) ?? {
        level: 'medium',
        calibrationReasoning: '',
      }
    ) as DiagnosticReport['confidence'],
    ruleBasedFindings: parseArray(parsed.rule_based_findings),
    evidence: parseArray(parsed.evidence),
    recommendedFix: parseArray(parsed.recommended_fix),
    suggestedCodeChanges: parseArray(parsed.suggested_code_changes),
    verificationSteps: parseArray(parsed.verification_steps),
    alternativeCauses: parseArray(parsed.alternative_causes),
    missingInformation: parseArray(parsed.missing_information),
    analysisMode: String(
      parsed.analysis_mode ?? 'deterministic_only'
    ) as DiagnosticReport['analysisMode'],
    ...(parsed.provider_note
      ? { providerNote: String(parsed.provider_note) }
      : {}),
  };
}

function mapInvestigation(row: DbRow): Investigation {
  if (!row.user_id) {
    throw new Error('Cannot map an investigation without an owner');
  }

  const feedback = parseJson(row.user_feedback);

  const userFeedback = isRecord(feedback)
    ? {
        helpful: Boolean(feedback.helpful),
        feedbackAt: String(feedback.feedbackAt ?? ''),
        ...(typeof feedback.comment === 'string'
          ? { comment: feedback.comment }
          : {}),
      }
    : undefined;

  return {
    id: String(row.id),
    userId: row.user_id,
    title: String(row.title ?? ''),
    errorMessage: String(row.error_message ?? ''),
    ...(row.code_snippet != null
      ? { codeSnippet: String(row.code_snippet) }
      : {}),
    ...(row.project_context != null
      ? { projectContext: String(row.project_context) }
      : {}),
    unityVersion: String(
      row.unity_version ?? 'Other'
    ) as Investigation['unityVersion'],
    renderPipeline: String(
      row.render_pipeline ?? 'unknown'
    ) as Investigation['renderPipeline'],
    ...(row.target_platform != null
      ? {
          targetPlatform: String(
            row.target_platform
          ) as Investigation['targetPlatform'],
        }
      : {}),
    attachedFiles: parseArray(row.attached_files).map((file) => {
      if (!isRecord(file)) {
        return { name: '', size: 0, type: '' };
      }

      return {
        name: String(file.name ?? ''),
        size: Number(file.size ?? 0),
        type: String(file.type ?? ''),
      };
    }),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    status: String(
      row.status ?? 'pending'
    ) as Investigation['status'],
    ...(row.report_row
      ? { report: mapReport(row.report_row) }
      : {}),
    ...(userFeedback ? { userFeedback } : {}),
  };
}

/**
 * Returns the count of investigations belonging to one user.
 */
export async function getInvestigationCount(
  userId: string
): Promise<number> {
  if (!isNeonConfigured()) {
    return (await getAllInvestigations(userId)).length;
  }

  const sql = getSql();

  const result = (await sql`
    SELECT COUNT(*)::int AS count
    FROM public.investigations
    WHERE user_id = ${userId}
  `) as { count: number }[];

  return Number(result[0]?.count ?? 0);
}

/**
 * Returns only investigations belonging to the specified user.
 */
export async function getAllInvestigations(
  userId: string
): Promise<Investigation[]> {
  if (!isNeonConfigured()) {
    const db = initLocalDb();

    return Object.values(db.investigations)
      .filter((investigation) => investigation.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }

  const sql = getSql();

  const rows = (await sql`
    SELECT
      i.*,
      row_to_json(dr) AS report_row
    FROM public.investigations AS i
    LEFT JOIN public.diagnostic_reports AS dr
      ON dr.investigation_id = i.id
    WHERE i.user_id = ${userId}
    ORDER BY i.created_at DESC
  `) as DbRow[];

  return rows.map(mapInvestigation);
}

/**
 * Fetches an investigation only when it belongs to the specified user.
 */
export async function getInvestigationById(
  id: string,
  userId: string
): Promise<Investigation | null> {
  if (!isNeonConfigured()) {
    const db = initLocalDb();
    const investigation = db.investigations[id];

    if (!investigation || investigation.userId !== userId) {
      return null;
    }

    return investigation;
  }

  const sql = getSql();

  const rows = (await sql`
    SELECT
      i.*,
      row_to_json(dr) AS report_row
    FROM public.investigations AS i
    LEFT JOIN public.diagnostic_reports AS dr
      ON dr.investigation_id = i.id
    WHERE i.id = ${id}::uuid
      AND i.user_id = ${userId}
    LIMIT 1
  `) as DbRow[];

  return rows.length > 0 ? mapInvestigation(rows[0]) : null;
}

/**
 * Saves an investigation without allowing ownership to be transferred
 * through an ID conflict.
 */
export async function saveInvestigation(
  investigation: Investigation
): Promise<Investigation> {
  if (!investigation.userId) {
    throw new Error('Investigation owner is required');
  }

  const now = new Date().toISOString();

  const saved: Investigation = {
    ...investigation,
    updatedAt: now,
  };

  if (!isNeonConfigured()) {
    const db = initLocalDb();
    const existing = db.investigations[saved.id];

    if (existing && existing.userId !== saved.userId) {
      throw new Error('Investigation ownership conflict');
    }

    db.investigations[saved.id] = saved;
    saveLocalDb(db);

    return saved;
  }

  const sql = getSql();

  const inserted = (await sql`
    INSERT INTO public.investigations (
      id,
      user_id,
      title,
      error_message,
      code_snippet,
      project_context,
      unity_version,
      render_pipeline,
      target_platform,
      attached_files,
      status,
      created_at,
      updated_at,
      user_feedback
    )
    VALUES (
      ${saved.id}::uuid,
      ${saved.userId},
      ${saved.title},
      ${saved.errorMessage},
      ${saved.codeSnippet ?? null},
      ${saved.projectContext ?? null},
      ${saved.unityVersion},
      ${saved.renderPipeline},
      ${saved.targetPlatform ?? null},
      ${JSON.stringify(saved.attachedFiles ?? [])}::jsonb,
      ${saved.status},
      ${saved.createdAt},
      ${saved.updatedAt},
      ${saved.userFeedback ? JSON.stringify(saved.userFeedback) : null}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      error_message = EXCLUDED.error_message,
      code_snippet = EXCLUDED.code_snippet,
      project_context = EXCLUDED.project_context,
      unity_version = EXCLUDED.unity_version,
      render_pipeline = EXCLUDED.render_pipeline,
      target_platform = EXCLUDED.target_platform,
      attached_files = EXCLUDED.attached_files,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at,
      user_feedback = EXCLUDED.user_feedback
    WHERE public.investigations.user_id = EXCLUDED.user_id
    RETURNING id
  `) as { id: string }[];

  if (inserted.length === 0) {
    throw new Error('Investigation ownership conflict');
  }

  if (saved.report) {
    const report = saved.report;

    await sql`
      INSERT INTO public.diagnostic_reports (
        id,
        investigation_id,
        executive_summary,
        likely_root_cause,
        severity,
        confidence,
        rule_based_findings,
        evidence,
        recommended_fix,
        suggested_code_changes,
        verification_steps,
        alternative_causes,
        missing_information,
        analysis_mode,
        provider_note,
        created_at
      )
      VALUES (
        ${report.id}::uuid,
        ${saved.id}::uuid,
        ${report.executiveSummary},
        ${report.likelyRootCause},
        ${report.severity},
        ${JSON.stringify(report.confidence)}::jsonb,
        ${JSON.stringify(report.ruleBasedFindings)}::jsonb,
        ${JSON.stringify(report.evidence)}::jsonb,
        ${JSON.stringify(report.recommendedFix)}::jsonb,
        ${JSON.stringify(report.suggestedCodeChanges)}::jsonb,
        ${JSON.stringify(report.verificationSteps)}::jsonb,
        ${JSON.stringify(report.alternativeCauses)}::jsonb,
        ${JSON.stringify(report.missingInformation)}::jsonb,
        ${report.analysisMode},
        ${report.providerNote ?? null},
        ${report.createdAt}
      )
      ON CONFLICT (investigation_id) DO UPDATE SET
        executive_summary = EXCLUDED.executive_summary,
        likely_root_cause = EXCLUDED.likely_root_cause,
        severity = EXCLUDED.severity,
        confidence = EXCLUDED.confidence,
        rule_based_findings = EXCLUDED.rule_based_findings,
        evidence = EXCLUDED.evidence,
        recommended_fix = EXCLUDED.recommended_fix,
        suggested_code_changes = EXCLUDED.suggested_code_changes,
        verification_steps = EXCLUDED.verification_steps,
        alternative_causes = EXCLUDED.alternative_causes,
        missing_information = EXCLUDED.missing_information,
        analysis_mode = EXCLUDED.analysis_mode,
        provider_note = EXCLUDED.provider_note,
        created_at = EXCLUDED.created_at
    `;
  }

  const result = await getInvestigationById(saved.id, saved.userId);

  if (!result) {
    throw new Error(
      `Investigation ${saved.id} was saved but could not be retrieved`
    );
  }

  return result;
}

/**
 * Updates feedback only for an investigation owned by the specified user.
 */
export async function updateInvestigationFeedback(
  id: string,
  userId: string,
  helpful: boolean,
  comment?: string
): Promise<Investigation | null> {
  const feedback = {
    helpful,
    feedbackAt: new Date().toISOString(),
    ...(comment !== undefined ? { comment } : {}),
  };

  if (!isNeonConfigured()) {
    const db = initLocalDb();
    const existing = db.investigations[id];

    if (!existing || existing.userId !== userId) {
      return null;
    }

    const updated: Investigation = {
      ...existing,
      userFeedback: feedback,
      updatedAt: new Date().toISOString(),
    };

    db.investigations[id] = updated;
    saveLocalDb(db);

    return updated;
  }

  const sql = getSql();

  const rows = (await sql`
    UPDATE public.investigations
    SET
      user_feedback = ${JSON.stringify(feedback)}::jsonb,
      updated_at = ${feedback.feedbackAt}
    WHERE id = ${id}::uuid
      AND user_id = ${userId}
    RETURNING id
  `) as { id: string }[];

  if (rows.length === 0) return null;

  return getInvestigationById(id, userId);
}

/**
 * Deletes only an investigation belonging to the specified user.
 */
export async function deleteInvestigation(
  id: string,
  userId: string
): Promise<boolean> {
  if (!isNeonConfigured()) {
    const db = initLocalDb();
    const existing = db.investigations[id];

    if (!existing || existing.userId !== userId) {
      return false;
    }

    delete db.investigations[id];
    saveLocalDb(db);

    return true;
  }

  const sql = getSql();

  const rows = (await sql`
    DELETE FROM public.investigations
    WHERE id = ${id}::uuid
      AND user_id = ${userId}
    RETURNING id
  `) as { id: string }[];

  return rows.length > 0;
}

/**
 * Clears only the specified user's investigations.
 */
export async function clearAllInvestigations(
  userId: string
): Promise<void> {
  if (!isNeonConfigured()) {
    const db = initLocalDb();

    const remaining = Object.fromEntries(
      Object.entries(db.investigations).filter(
        ([, investigation]) => investigation.userId !== userId
      )
    );

    saveLocalDb({ investigations: remaining });
    return;
  }

  const sql = getSql();

  await sql`
    DELETE FROM public.investigations
    WHERE user_id = ${userId}
  `;
}