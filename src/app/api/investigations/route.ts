
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { InvestigationCreateSchema } from '@/lib/schemas';
import { runDeterministicAnalysis } from '@/lib/diagnostic-engine';
import {
  isAiConfigured,
  requestAiDiagnosis,
  buildDeterministicFallbackReport,
} from '@/lib/ai/provider';
import { getAllInvestigations, saveInvestigation } from '@/lib/db';
import { Investigation, DiagnosticReport } from '@/lib/types';
import { requireUserId } from '@/lib/auth';
import { blockUnauthenticatedProductionApi } from '@/lib/security/public-launch-guard';
import {
  readLimitedJson,
  RequestBodyTooLargeError,
  InvalidJsonBodyError,
} from '@/lib/security/read-limited-json';
import {
  checkRateLimit,
  RateLimitUnavailableError,
} from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const blocked = blockUnauthenticatedProductionApi();
  if (blocked) return blocked;

  const authResult = await requireUserId();
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase();
    const pipeline = searchParams.get('pipeline')?.toLowerCase();

    let investigations = await getAllInvestigations(authResult.userId);

    if (search) {
      investigations = investigations.filter(
        (inv) =>
          inv.title.toLowerCase().includes(search) ||
          inv.errorMessage.toLowerCase().includes(search)
      );
    }

    if (pipeline && pipeline !== 'all') {
      investigations = investigations.filter(
        (inv) => inv.renderPipeline === pipeline
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: investigations,
        total: investigations.length,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch {
    console.error('Failed to list investigations');

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve investigations' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  const blocked = blockUnauthenticatedProductionApi();
  if (blocked) return blocked;

  const authResult = await requireUserId();
  if (authResult.response) return authResult.response;

  // Apply per-user rate limiting before reading or processing the body.
  try {
    const rateLimit = await checkRateLimit(
      authResult.userId,
      'investigation'
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Investigation limit reached. Try again later.',
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: rateLimit.reset,
        },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Retry-After': String(
              Math.max(
                1,
                Math.ceil((rateLimit.reset - Date.now()) / 1000)
              )
            ),
          },
        }
      );
    }
  } catch (error) {
    if (error instanceof RateLimitUnavailableError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service temporarily unavailable. Please try again later.',
        },
        {
          status: 503,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    console.error('Investigation rate limit check failed');

    return NextResponse.json(
      {
        success: false,
        error: 'Service temporarily unavailable. Please try again later.',
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  try {
    const body = await readLimitedJson(req);

    const validation = InvestigationCreateSchema.safeParse(body);

    if (!validation.success) {
      const issue = validation.error.issues[0];

      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${issue?.path.join('.') || 'field'} - ${issue?.message || 'Invalid input'}`,
        },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const input = validation.data;
    const investigationId = randomUUID();
    const reportId = randomUUID();
    const timestamp = new Date().toISOString();

    const sanitizedFiles = (input.attachedFiles || []).map((f) => ({
      name: f.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
      size: f.size,
      type: f.type,
      content: f.content,
    }));

    const deterministicResult = runDeterministicAnalysis({
      errorMessage: input.errorMessage,
      codeSnippet: input.codeSnippet,
      projectContext: input.projectContext,
      unityVersion: input.unityVersion,
      renderPipeline: input.renderPipeline,
      attachedFiles: sanitizedFiles,
    });

    let reportData: Omit<
      DiagnosticReport,
      'id' | 'investigationId' | 'createdAt'
    >;

    const aiConfigured = isAiConfigured();

    if (aiConfigured) {
      try {
        const aiResult = await requestAiDiagnosis({
          title: input.title,
          errorMessage: input.errorMessage,
          codeSnippet: input.codeSnippet,
          projectContext: input.projectContext,
          unityVersion: input.unityVersion,
          renderPipeline: input.renderPipeline,
          targetPlatform: input.targetPlatform,
          attachedFiles: sanitizedFiles,
          deterministicResult,
        });

        reportData = aiResult.report;
      } catch {
        // Do not expose or persist provider exception details.
        console.warn(
          'AI diagnosis failed; using deterministic fallback.'
        );

        reportData = buildDeterministicFallbackReport(
          {
            title: input.title,
            errorMessage: input.errorMessage,
            codeSnippet: input.codeSnippet,
            projectContext: input.projectContext,
            unityVersion: input.unityVersion,
            renderPipeline: input.renderPipeline,
            targetPlatform: input.targetPlatform,
            attachedFiles: sanitizedFiles,
            deterministicResult,
          },
          'AI diagnosis was unavailable. Deterministic analysis was used.'
        );
      }
    } else {
      reportData = buildDeterministicFallbackReport({
        title: input.title,
        errorMessage: input.errorMessage,
        codeSnippet: input.codeSnippet,
        projectContext: input.projectContext,
        unityVersion: input.unityVersion,
        renderPipeline: input.renderPipeline,
        targetPlatform: input.targetPlatform,
        attachedFiles: sanitizedFiles,
        deterministicResult,
      });
    }

    const report: DiagnosticReport = {
      id: reportId,
      investigationId,
      createdAt: timestamp,
      ...reportData,
    };

    const newInvestigation: Investigation = {
      id: investigationId,
      userId: authResult.userId,
      title: input.title,
      errorMessage: input.errorMessage,
      codeSnippet: input.codeSnippet,
      projectContext: input.projectContext,
      unityVersion: input.unityVersion,
      renderPipeline: input.renderPipeline,
      targetPlatform: input.targetPlatform,
      attachedFiles: sanitizedFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'completed',
      report,
    };

    const savedInvestigation = await saveInvestigation(newInvestigation);

    return NextResponse.json(
      {
        success: true,
        data: savedInvestigation,
      },
      {
        status: 201,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { success: false, error: 'Request body exceeds the 4 MB limit' },
        {
          status: 413,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    if (error instanceof InvalidJsonBodyError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    console.error('Failed to create investigation');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process investigation. Please try again later.',
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
