/**
 * POST /api/agents/sarah
 *
 * Sarah, AI Social Media Manager — three actions on one endpoint:
 *   { action: 'schedule', ... }  → optimal publish-time recommendation
 *   { action: 'engage',   ... }  → triage + reply to a comment/DM/mention
 *   { action: 'calendar', ... }  → plan a multi-post calendar
 */

import { NextResponse } from 'next/server';
import {
  runSarahSchedule,
  runSarahEngage,
  runSarahCalendar,
  type SarahScheduleRequest,
  type SarahEngagementRequest,
  type SarahCalendarRequest,
} from '@/lib/agents/sarah';
import { loadBrandContext } from '@/lib/agents/_loadBrand';
import { meterIfAuthed } from '@/lib/withCredits';
import { getCurrentUser } from '@/lib/supabase-server';
import { getMemoryContext, extractFacts } from '@/lib/agents/_memoryContext';

export const maxDuration = 60;

type SarahAction = 'schedule' | 'engage' | 'calendar';

type SarahBody =
  | ({ action: 'schedule'; businessId?: string } & Partial<Omit<SarahScheduleRequest, 'businessName' | 'brandVoice'>>)
  | ({ action: 'engage';   businessId?: string } & Partial<Omit<SarahEngagementRequest, 'businessName' | 'brandVoice'>>)
  | ({ action: 'calendar'; businessId?: string } & Partial<Omit<SarahCalendarRequest, 'businessName' | 'brandVoice'>>);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SarahBody;
    const action = body.action as SarahAction;

    if (!action || !['schedule', 'engage', 'calendar'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid `action`. Expected: schedule | engage | calendar' },
        { status: 400 },
      );
    }

    const metered = await meterIfAuthed('sarah', 'social');
    if (!metered.ok) return metered.response;

    const brand = await loadBrandContext(body.businessId);
    const user = await getCurrentUser();

    // Memory query is action-specific to keep retrieval focused
    const memoryQuery =
      action === 'schedule'
        ? `posting time ${(body as any).platform ?? ''}`
        : action === 'engage'
          ? `engagement ${(body as any).item?.platform ?? ''} ${(body as any).item?.type ?? ''}`
          : `content calendar ${((body as any).posts ?? []).map((p: any) => p.platform).join(' ')}`;

    const memoryContext = user
      ? await getMemoryContext({
          workspaceId: user.id,
          query:       memoryQuery,
          layers:      ['brand', 'preference', 'reflection'],
          agentScopes: ['sarah', 'shared'],
          limit:       6,
        })
      : '';

    let result: unknown;

    if (action === 'schedule') {
      const b = body as Extract<SarahBody, { action: 'schedule' }>;
      if (!b.platform || !b.timezone) {
        return NextResponse.json({ error: 'schedule requires platform + timezone' }, { status: 400 });
      }
      result = await runSarahSchedule({
        businessName: brand.businessName,
        brandVoice: brand.brandVoice,
        platform: b.platform,
        timezone: b.timezone,
        preferredTime: b.preferredTime,
        audienceTimezones: b.audienceTimezones,
        recentPostTimes: b.recentPostTimes,
        memoryContext,
      });
    } else if (action === 'engage') {
      const b = body as Extract<SarahBody, { action: 'engage' }>;
      if (!b.item) {
        return NextResponse.json({ error: 'engage requires an `item` payload' }, { status: 400 });
      }
      result = await runSarahEngage({
        businessName: brand.businessName,
        brandVoice: brand.brandVoice,
        item: b.item,
        memoryContext,
      });

      // Engagement learnings → preference + reflection memory
      if (user && (result as any)?.sentiment) {
        extractFacts({
          workspaceId: user.id,
          agentScope:  'sarah',
          layer:       'reflection',
          raw:         JSON.stringify({ engagement: b.item, decision: result }),
          sourceType:  'sarah-engagement',
          metadata: {
            platform: b.item.platform,
            category: (result as any).category,
            escalated: (result as any).shouldEscalate,
          },
        });
      }
    } else {
      const b = body as Extract<SarahBody, { action: 'calendar' }>;
      if (!Array.isArray(b.posts) || !b.timezone || !b.lookAheadDays) {
        return NextResponse.json(
          { error: 'calendar requires posts[], timezone, lookAheadDays' },
          { status: 400 },
        );
      }
      result = await runSarahCalendar({
        businessName: brand.businessName,
        brandVoice: brand.brandVoice,
        posts: b.posts,
        timezone: b.timezone,
        lookAheadDays: b.lookAheadDays,
        memoryContext,
      });
    }

    // Schedule + calendar outputs → cadence/timing preference memory
    if (user && (action === 'schedule' || action === 'calendar')) {
      extractFacts({
        workspaceId: user.id,
        agentScope:  'sarah',
        layer:       'preference',
        raw:         JSON.stringify({ action, request: body, output: result }),
        sourceType:  `sarah-${action}`,
        metadata:    { action },
      });
    }

    return NextResponse.json({
      agent: 'sarah',
      action,
      remaining: metered.remaining,
      result,
    });
  } catch (error) {
    console.error('[API/sarah] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sarah failed' },
      { status: 500 },
    );
  }
}
