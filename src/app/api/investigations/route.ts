import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { InvestigationCreateSchema } from '@/lib/schemas';
import { runDeterministicAnalysis } from '@/lib/diagnostic-engine';
import { isAiConfigured, requestAiDiagnosis, buildDeterministicFallbackReport } from '@/lib/ai/provider';
import { getAllInvestigations, saveInvestigation } from '@/lib/db';
import { Investigation, DiagnosticReport } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase();
    const pipeline = searchParams.get('pipeline')?.toLowerCase();

    let investigations = await getAllInvestigations();

    if (search) {
      investigations = investigations.filter(
        (inv) =>
          inv.title.toLowerCase().includes(search) ||
          inv.errorMessage.toLowerCase().includes(search)
      );
    }

    if (pipeline && pipeline !== 'all') {
      investigations = investigations.filter((inv) => inv.renderPipeline === pipeline);
    }

    return NextResponse.json({
      success: true,
      data: investigations,
      total: investigations.length,
    });
  } catch (error: any) {
    console.error('Failed to list investigations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve investigations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate request body with Zod
    const validation = InvestigationCreateSchema.safeParse(body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${issue?.path.join('.') || 'field'} - ${issue?.message || 'Invalid input'}`,
        },
        { status: 400 }
      );
    }

    const input = validation.data;
    const investigationId = randomUUID();
    const reportId = randomUUID();
    const timestamp = new Date().toISOString();

    // 2. Safe file inspection & validation
    const sanitizedFiles = (input.attachedFiles || []).map((f) => ({
      name: f.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
      size: f.size,
      type: f.type,
      content: f.content,
    }));

    // 3. Run Deterministic Unity Analysis Rules
    const deterministicResult = runDeterministicAnalysis({
      errorMessage: input.errorMessage,
      codeSnippet: input.codeSnippet,
      projectContext: input.projectContext,
      unityVersion: input.unityVersion,
      renderPipeline: input.renderPipeline,
      attachedFiles: sanitizedFiles,
    });

    // 4. Diagnostic Orchestration: AI or Deterministic
    let reportData: Omit<DiagnosticReport, 'id' | 'investigationId' | 'createdAt'>;

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
      } catch (aiErr: any) {
        console.warn('AI Provider failed, falling back to deterministic synthesis:', aiErr);
        // Fallback with clear disclosure
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
          `AI Provider Error: ${aiErr.message || 'Upstream provider failed'}`
        );
      }
    } else {
      // Deterministic diagnostic fallback
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

    // 5. Persist to storage
    await saveInvestigation(newInvestigation);

    return NextResponse.json(
      {
        success: true,
        data: newInvestigation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create investigation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error while processing investigation',
      },
      { status: 500 }
    );
  }
}

