/**
 * POST /api/agents/sam
 *
 * Sam, AI Strategist — analyses trends + competitor moves and surfaces
 * content opportunities the team can act on this week. Output is
 * structured and routed to teammates (Clara / Steve / Theo / Sarah /
 * Sophie) via the `assignableTo` field on each opportunity.
 */

import { NextResponse } from 'next/server';
import { runSam, type SamInput } from '@/lib/agents/sam';
import { loadBrandContext } from '@/lib/agents/_loadBrand';
import { meterIfAuthed } from '@/lib/withCredits';
import { getCurrentUser } from '@/lib/supabase-server';
import { getMemoryContext, extractFacts } from '@/lib/agents/_memoryContext';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<SamInput> & { businessId?: string };

    if (!body.industry || !Array.isArray(body.platforms) || body.platforms.length === 0) {
      return NextResponse.json(
        { error: 'industry and platforms[] are required' },
        { status: 400 },
      );
    }

    const metered = await meterIfAuthed('sam', 'strategy');
    if (!metered.ok) return metered.response;

    const brand = await loadBrandContext(body.businessId);
    const user = await getCurrentUser();

    const memoryQuery = `trends competitors ${body.industry} ${body.platforms.join(' ')} ${body.goal ?? ''}`;

    const memoryContext = user
      ? await getMemoryContext({
          workspaceId: user.id,
          query:       memoryQuery,
          layers:      ['strategic', 'reflection', 'brand'],
          agentScopes: ['sam', 'lora', 'shared'],
          limit:       8,
        })
      : '';

    const result = await runSam({
      businessName: brand.businessName,
      brandVoice: brand.brandVoice,
      industry: body.industry,
      targetAudience: body.targetAudience,
      platforms: body.platforms,
      competitors: body.competitors,
      trendSignals: body.trendSignals,
      goal: body.goal,
      periodLabel: body.periodLabel,
      memoryContext,
    });

    // Strategy intelligence is the highest-leverage memory layer — these are
    // the inputs Lora uses to plan future campaigns.
    if (user && (result.topTrends?.length || result.competitorInsights?.length)) {
      extractFacts({
        workspaceId: user.id,
        agentScope:  'sam',
        layer:       'strategic',
        raw: JSON.stringify({
          period:               result.period,
          trendSummary:         result.trendSummary,
          topTrends:            result.topTrends,
          competitorInsights:   result.competitorInsights,
          contentOpportunities: result.contentOpportunities,
          nextActionsForLora:   result.nextActionsForLora,
        }),
        sourceType: 'sam-strategy',
        metadata: {
          industry: body.industry,
          platforms: body.platforms,
          period: result.period,
        },
      });
    }

    return NextResponse.json({
      agent: 'sam',
      remaining: metered.remaining,
      result,
    });
  } catch (error) {
    console.error('[API/sam] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sam failed' },
      { status: 500 },
    );
  }
}
