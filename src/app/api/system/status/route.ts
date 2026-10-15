import { NextResponse } from 'next/server';
import { getAiConfig, isAiConfigured } from '@/lib/ai/provider';
import { getAllInvestigations, isSupabaseConfigured } from '@/lib/db';
import { allRules } from '@/lib/diagnostic-engine/rules';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const aiConfig = getAiConfig();
    const aiReady = isAiConfigured();
    const investigations = await getAllInvestigations();
    const supabaseReady = isSupabaseConfigured();

    const maskedKey = aiConfig.apiKey
      ? `${aiConfig.apiKey.slice(0, 3)}...${aiConfig.apiKey.slice(-4)}`
      : 'Not set';

    return NextResponse.json({
      success: true,
      data: {
        ai: {
          configured: aiReady,
          model: aiConfig.model,
          baseUrl: aiConfig.baseUrl,
          maskedKey,
          mode: aiReady ? 'ai_provider' : 'deterministic_development_mode',
        },
        storage: {
          mode: supabaseReady ? 'supabase_postgresql' : 'local_persistent_json',
          investigationsCount: investigations.length,
        },
        engine: {
          activeRulesCount: allRules.length,
          rules: allRules.map((r) => ({ id: r.id, name: r.name })),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve system status' },
      { status: 500 }
    );
  }
}

