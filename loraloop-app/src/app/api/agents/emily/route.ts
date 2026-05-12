/**
 * POST /api/agents/emily
 *
 * Emily, AI Email Marketer — two actions on one endpoint:
 *   { action: 'email',    ... }  → compose a single email (subject variants + body + plaintext)
 *   { action: 'sequence', ... }  → design a multi-step lifecycle email flow
 */

import { NextResponse } from 'next/server';
import {
  runEmilyEmail,
  runEmilySequence,
  type EmilyEmailRequest,
  type EmilySequenceRequest,
} from '@/lib/agents/emily';
import { loadBrandContext } from '@/lib/agents/_loadBrand';
import { meterIfAuthed } from '@/lib/withCredits';
import { getCurrentUser } from '@/lib/supabase-server';
import { getMemoryContext, extractFacts } from '@/lib/agents/_memoryContext';

export const maxDuration = 60;

type EmilyAction = 'email' | 'sequence';

type EmilyBody =
  | ({ action: 'email';    businessId?: string } & Partial<Omit<EmilyEmailRequest,    'businessName' | 'brandVoice'>>)
  | ({ action: 'sequence'; businessId?: string } & Partial<Omit<EmilySequenceRequest, 'businessName' | 'brandVoice'>>);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EmilyBody;
    const action = body.action as EmilyAction;

    if (!action || !['email', 'sequence'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid `action`. Expected: email | sequence' },
        { status: 400 },
      );
    }

    const metered = await meterIfAuthed('emily', 'email');
    if (!metered.ok) return metered.response;

    const brand = await loadBrandContext(body.businessId);
    const user = await getCurrentUser();

    const memoryQuery =
      action === 'email'
        ? `email ${(body as any).goal ?? ''} ${(body as any).segment ?? ''} ${(body as any).topic ?? ''}`
        : `email sequence ${(body as any).flowGoal ?? ''} ${(body as any).segment ?? ''}`;

    const memoryContext = user
      ? await getMemoryContext({
          workspaceId: user.id,
          query:       memoryQuery,
          layers:      ['brand', 'preference', 'reflection', 'campaign'],
          agentScopes: ['emily', 'shared'],
          limit:       6,
        })
      : '';

    let result: unknown;

    if (action === 'email') {
      const b = body as Extract<EmilyBody, { action: 'email' }>;
      if (!b.goal || !b.segment || !b.topic) {
        return NextResponse.json(
          { error: 'email requires goal, segment, topic' },
          { status: 400 },
        );
      }
      result = await runEmilyEmail({
        businessName: brand.businessName,
        brandVoice: brand.brandVoice,
        goal: b.goal,
        segment: b.segment,
        customSegmentDescription: b.customSegmentDescription,
        topic: b.topic,
        keyPoints: b.keyPoints,
        cta: b.cta,
        productOrOfferContext: b.productOrOfferContext,
        audienceTimezone: b.audienceTimezone,
        recentSubjectLinesUsed: b.recentSubjectLinesUsed,
        memoryContext,
      });

      // Subject lines + send patterns → preference memory
      if (user) {
        extractFacts({
          workspaceId: user.id,
          agentScope:  'emily',
          layer:       'preference',
          raw:         JSON.stringify({ goal: b.goal, segment: b.segment, topic: b.topic, output: result }),
          sourceType:  'emily-email',
          metadata:    { goal: b.goal, segment: b.segment },
        });
      }
    } else {
      const b = body as Extract<EmilyBody, { action: 'sequence' }>;
      if (!b.flowName || !b.flowGoal || !b.segment) {
        return NextResponse.json(
          { error: 'sequence requires flowName, flowGoal, segment' },
          { status: 400 },
        );
      }
      result = await runEmilySequence({
        businessName: brand.businessName,
        brandVoice: brand.brandVoice,
        flowName: b.flowName,
        flowGoal: b.flowGoal,
        segment: b.segment,
        stepCount: b.stepCount,
        productContext: b.productContext,
        memoryContext,
      });

      // Lifecycle flow design → campaign memory
      if (user) {
        extractFacts({
          workspaceId: user.id,
          agentScope:  'emily',
          layer:       'campaign',
          raw:         JSON.stringify({ flowName: b.flowName, flowGoal: b.flowGoal, output: result }),
          sourceType:  'emily-sequence',
          metadata:    { flowGoal: b.flowGoal, segment: b.segment },
        });
      }
    }

    return NextResponse.json({
      agent: 'emily',
      action,
      remaining: metered.remaining,
      result,
    });
  } catch (error) {
    console.error('[API/emily] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Emily failed' },
      { status: 500 },
    );
  }
}
