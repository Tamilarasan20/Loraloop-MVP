/**
 * SARAH — AI Distribution & Engagement Manager
 *
 * Schedules and publishes content, manages cross-platform cadence, monitors
 * comments / mentions / DMs, drafts brand-authentic replies, and flags
 * escalations. Sarah owns the "post it + reply to it" loop.
 */

import { callGemini } from '../gemini';
import { buildBrandContext } from '../brandVoiceEngine';
import type { BrandVoice } from '@/types/agents';

export type SocialPlatform = 'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'facebook' | 'youtube';
export type EngagementType = 'comment' | 'mention' | 'dm' | 'reply';

// ─── Publish scheduling ──────────────────────────────────────────────
export interface SarahScheduleRequest {
  businessName: string;
  brandVoice: BrandVoice;
  platform: SocialPlatform;
  timezone: string;
  preferredTime?: string;     // ISO8601 — if omitted, Sarah picks
  audienceTimezones?: string[];
  recentPostTimes?: string[]; // ISO8601 — for cadence checks
  memoryContext?: string;
}

export interface SarahScheduleOutput {
  scheduledFor: string;
  reasoning: string;
  confidenceScore: number;
  alternativeSlots: string[];
  cadenceWarning?: string;
}

// ─── Engagement triage ───────────────────────────────────────────────
export interface SarahEngagementItem {
  id: string;
  platform: SocialPlatform;
  type: EngagementType;
  text: string;
  authorUsername: string;
  authorFollowerCount?: number;
  postContext: string;
}

export interface SarahEngagementRequest {
  businessName: string;
  brandVoice: BrandVoice;
  item: SarahEngagementItem;
  memoryContext?: string;
}

export interface SarahEngagementOutput {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  sentimentScore: number;   // -1 to 1
  category: 'question' | 'complaint' | 'compliment' | 'spam' | 'opportunity' | 'general';
  shouldEscalate: boolean;
  escalationReason?: string;
  replyText: string;
  replyApproved: boolean;   // false → human review required
  followUpAction?: 'move-to-dm' | 'tag-user' | 'pin-comment' | 'none';
}

// ─── Calendar planning ───────────────────────────────────────────────
export interface SarahCalendarSlot {
  contentId: string;
  platform: SocialPlatform;
  priority: number;    // 1-10
  earliestPublish?: string;
  latestPublish?: string;
}

export interface SarahCalendarRequest {
  businessName: string;
  brandVoice: BrandVoice;
  posts: SarahCalendarSlot[];
  timezone: string;
  lookAheadDays: number;
  memoryContext?: string;
}

export interface SarahCalendarPlan {
  schedule: {
    contentId: string;
    platform: SocialPlatform;
    scheduledFor: string;
    reasoning: string;
  }[];
  cadenceNotes: string[];
}

// ─── Implementations ─────────────────────────────────────────────────
const SARAH_PRINCIPLES = `Sarah's principles:
- Reply within 2 hours to comments on posts in their first 24 hours (algorithm-critical)
- Priority: questions > complaints > compliments > general
- Never generic — always reference the specific content or user
- Match brand tone exactly; never defensive or dismissive
- Complaints: acknowledge → empathise → offer resolution → move to DM if sensitive
- Escalate on sentiment < -0.6, >5 negative comments in 30 min, legal/PR mentions, viral negative, PII shared`;

export async function runSarahSchedule(input: SarahScheduleRequest): Promise<SarahScheduleOutput> {
  const { businessName, brandVoice, platform, timezone, preferredTime, recentPostTimes, memoryContext } = input;
  const brandContext = buildBrandContext(brandVoice, businessName);
  const memoryBlock = memoryContext ? `\n${memoryContext}\n` : '';

  const prompt = `You are SARAH, distribution + engagement manager for ${businessName}.
${memoryBlock}
Brand: ${brandContext}
Platform: ${platform}
Brand timezone: ${timezone}
${preferredTime ? `Preferred time: ${preferredTime} — validate, suggest a significantly better slot only if data justifies it.` : 'No preferred time given — recommend the best slot in the next 7 days.'}
${recentPostTimes?.length ? `Recent posts at: ${recentPostTimes.join(', ')}` : ''}

${SARAH_PRINCIPLES}

Platform peak times (default baselines):
- Instagram: 8-10am, 7-9pm local
- LinkedIn: Tue-Thu 8-10am
- Twitter: 8am-3pm
- TikTok: 7-9pm
- Facebook: 1-4pm
- YouTube: Thu-Sun 5-9pm

Return STRICT JSON:
{
  "scheduledFor": "ISO8601",
  "reasoning": "Why this slot — specific to platform, audience, and cadence",
  "confidenceScore": 0.0-1.0,
  "alternativeSlots": ["ISO8601", "ISO8601"],
  "cadenceWarning": "string if posting too close to another post, else omit"
}`;

  try {
    const result = await callGemini({
      taskType: 'social-strategy',
      prompt,
      mimeType: 'application/json',
      minLength: 80,
    });
    return JSON.parse(result.text);
  } catch (e) {
    console.error('[SARAH/schedule] Error:', e);
    const fallback = new Date(Date.now() + 24 * 3600_000).toISOString();
    return {
      scheduledFor: fallback,
      reasoning: 'Fallback: scheduling service degraded, defaulting to +24h.',
      confidenceScore: 0.3,
      alternativeSlots: [],
    };
  }
}

export async function runSarahEngage(input: SarahEngagementRequest): Promise<SarahEngagementOutput> {
  const { businessName, brandVoice, item, memoryContext } = input;
  const brandContext = buildBrandContext(brandVoice, businessName);
  const memoryBlock = memoryContext ? `\n${memoryContext}\n` : '';

  const prompt = `You are SARAH, engagement manager for ${businessName}.
${memoryBlock}
Brand: ${brandContext}

Incoming ${item.type} on ${item.platform}:
- Author: @${item.authorUsername}${item.authorFollowerCount ? ` (${item.authorFollowerCount} followers)` : ''}
- Message: "${item.text}"
- Post context: ${item.postContext}

${SARAH_PRINCIPLES}

Return STRICT JSON:
{
  "sentiment": "positive | neutral | negative | mixed",
  "sentimentScore": -1.0 to 1.0,
  "category": "question | complaint | compliment | spam | opportunity | general",
  "shouldEscalate": boolean,
  "escalationReason": "string if escalating, else omit",
  "replyText": "Brand-authentic reply, never generic, always referencing this user/post",
  "replyApproved": "true if safe to auto-send, false if needs human review",
  "followUpAction": "move-to-dm | tag-user | pin-comment | none"
}`;

  try {
    const result = await callGemini({
      taskType: 'social-strategy',
      prompt,
      mimeType: 'application/json',
      minLength: 80,
    });
    return JSON.parse(result.text);
  } catch (e) {
    console.error('[SARAH/engage] Error:', e);
    return {
      sentiment: 'neutral',
      sentimentScore: 0,
      category: 'general',
      shouldEscalate: true,
      escalationReason: 'Engagement processing service degraded — flagged for human review',
      replyText: '',
      replyApproved: false,
      followUpAction: 'none',
    };
  }
}

export async function runSarahCalendar(input: SarahCalendarRequest): Promise<SarahCalendarPlan> {
  const { businessName, brandVoice, posts, timezone, lookAheadDays, memoryContext } = input;
  const brandContext = buildBrandContext(brandVoice, businessName);
  const memoryBlock = memoryContext ? `\n${memoryContext}\n` : '';

  const prompt = `You are SARAH, content calendar planner for ${businessName}.
${memoryBlock}
Brand: ${brandContext}
Timezone: ${timezone}
Look-ahead window: ${lookAheadDays} days

Posts to schedule (${posts.length}):
${posts.map(p => `- ${p.contentId} on ${p.platform} (priority ${p.priority})${p.earliestPublish ? ` from ${p.earliestPublish}` : ''}${p.latestPublish ? ` by ${p.latestPublish}` : ''}`).join('\n')}

${SARAH_PRINCIPLES}

Distribute posts to:
- Maximise algorithm engagement (use platform peak times)
- Avoid audience fatigue (min 4-6 hours between posts on same platform)
- Respect priority (higher priority → better slots)
- Honour earliestPublish / latestPublish windows

Return STRICT JSON:
{
  "schedule": [
    {"contentId": "...", "platform": "...", "scheduledFor": "ISO8601", "reasoning": "..."}
  ],
  "cadenceNotes": ["Observations or warnings about the resulting cadence"]
}`;

  try {
    const result = await callGemini({
      taskType: 'social-strategy',
      prompt,
      mimeType: 'application/json',
      minLength: 100,
    });
    return JSON.parse(result.text);
  } catch (e) {
    console.error('[SARAH/calendar] Error:', e);
    return {
      schedule: posts.map((p, i) => ({
        contentId: p.contentId,
        platform: p.platform,
        scheduledFor: new Date(Date.now() + (i + 1) * 6 * 3600_000).toISOString(),
        reasoning: 'Fallback: even 6h spacing — calendar service degraded.',
      })),
      cadenceNotes: ['Calendar AI unavailable; applied naive 6h spacing.'],
    };
  }
}
