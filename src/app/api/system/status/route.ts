
import { NextResponse } from 'next/server';
import { getAiConfig, isAiConfigured } from '@/lib/ai/provider';
import {
  getInvestigationCount,
  isNeonConfigured,
} from '@/lib/db';
import { allRules } from '@/lib/diagnostic-engine/rules';
import { blockUnauthenticatedProductionApi } from '@/lib/security/public-launch-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const blocked = blockUnauthenticatedProductionApi();
  if (blocked) return blocked;

  try {
    const aiConfig = getAiConfig();
    const aiReady = isAiConfigured();

    const investigationsCount = await getInvestigationCount();

    return NextResponse.json(
      {
        success: true,
        data: {
          ai: {
            configured: aiReady,
            model: aiConfig.model,
            baseUrl: aiConfig.baseUrl,
            mode: aiReady
              ? 'ai_provider'
              : 'deterministic_development_mode',
          },
          storage: {
            mode: isNeonConfigured()
              ? 'neon_postgresql'
              : 'local_persistent_json',
            investigationsCount,
          },
          engine: {
            activeRulesCount: allRules.length,
            rules: allRules.map((rule) => ({
              id: rule.id,
              name: rule.name,
            })),
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('System status error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve system status',
      },
      { status: 500 }
    );
  }
}
