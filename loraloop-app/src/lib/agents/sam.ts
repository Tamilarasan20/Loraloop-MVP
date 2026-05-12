/**
 * SAM — AI Strategist
 *
 * Identifies what's trending and what competitors are doing. Sam analyses
 * market signals + competitor actions and surfaces the content types,
 * formats, and angles most likely to grow the business right now.
 *
 * Sam supports Lora — Lora decides the plan, Sam supplies the intelligence
 * that feeds the plan.
 */

import { callGemini } from '../gemini';
import { buildBrandContext } from '../brandVoiceEngine';
import type { BrandVoice } from '@/types/agents';

export type SamPlatform = 'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'facebook' | 'youtube';

export interface SamCompetitor {
  name: string;
  handle?: string;
  platform: SamPlatform;
  topPosts?: { title?: string; engagement?: number; postedAt?: string; format?: string }[];
  postingFrequencyPerWeek?: number;
}

export interface SamTrendSignal {
  topic: string;
  source: string;         // platform or report
  growthMultiplier?: number;  // e.g. 3 = 3× growth in last 24-48h
  volume?: number;
  observedAt?: string;
}

export interface SamInput {
  businessName: string;
  brandVoice: BrandVoice;
  industry: string;
  targetAudience?: string;
  platforms: SamPlatform[];
  competitors?: SamCompetitor[];
  trendSignals?: SamTrendSignal[];
  goal?: string;
  periodLabel?: string;
  memoryContext?: string;
}

export interface SamCompetitorInsight {
  competitor: string;
  whatTheyreDoing: string;
  whyItsWorking: string;
  threatLevel: 'high' | 'medium' | 'low';
  counterMove: string;
}

export interface SamContentOpportunity {
  angle: string;
  format: string;        // reel, carousel, thread, long-form, etc.
  platform: SamPlatform;
  whyNow: string;
  expectedLift: string;  // e.g. "2-3× engagement vs baseline"
  assignableTo: 'clara' | 'steve' | 'theo' | 'sarah' | 'sophie' | 'lora';
  urgency: 'this-week' | 'this-month' | 'monitor';
}

export interface SamOutput {
  period: string;
  trendSummary: string;
  topTrends: {
    topic: string;
    relevanceToBrand: number;  // 0-1
    accelerationNote: string;  // why this trend matters NOW vs steady volume
    suggestedHook: string;
  }[];
  competitorInsights: SamCompetitorInsight[];
  contentOpportunities: SamContentOpportunity[];
  recommendedAngles: string[];
  platformSuggestions: {
    platform: SamPlatform;
    recommendation: string;
    reasoning: string;
  }[];
  risks: string[];
  nextActionsForLora: {
    action: string;
    why: string;
    priority: 'do-now' | 'this-week' | 'this-month';
  }[];
}

function compactCompetitors(comps: SamCompetitor[] = []): string {
  if (!comps.length) return 'None provided.';
  return comps.slice(0, 10).map(c => {
    const posts = (c.topPosts ?? []).slice(0, 3)
      .map(p => `[${p.format ?? 'post'}] ${p.title?.slice(0, 60) ?? ''} (eng:${p.engagement ?? 'n/a'})`)
      .join(' | ');
    return `${c.name} on ${c.platform} (${c.postingFrequencyPerWeek ?? '?'} posts/wk): ${posts}`;
  }).join('\n');
}

function compactTrends(trends: SamTrendSignal[] = []): string {
  if (!trends.length) return 'None provided.';
  return trends.slice(0, 20).map(t =>
    `${t.topic} (source: ${t.source}, growth: ${t.growthMultiplier ?? '?'}×, vol: ${t.volume ?? '?'})`
  ).join('\n');
}

export async function runSam(input: SamInput): Promise<SamOutput> {
  const {
    businessName, brandVoice, industry, targetAudience,
    platforms, competitors, trendSignals, goal,
    periodLabel = 'Last 7 days', memoryContext,
  } = input;

  const brandContext = buildBrandContext(brandVoice, businessName);
  const memoryBlock = memoryContext ? `\n${memoryContext}\n` : '';

  const prompt = `You are SAM, AI Strategist for ${businessName}.
${memoryBlock}
Brand: ${brandContext}
Industry: ${industry}
${targetAudience ? `Target audience: ${targetAudience}` : ''}
Platforms in play: ${platforms.join(', ')}
${goal ? `Stated goal: ${goal}` : ''}
Period: ${periodLabel}

Your job is intelligence — what's trending, what competitors are doing, and which moves will grow this business. You support Lora. Lora decides the plan.

Rules:
- Trend detection: look for ACCELERATION (300% growth in 4h beats steady high volume)
- Competitor analysis: focus on engagement rate, not raw followers
- Every insight must be actionable AND tied to a specific format/platform
- Recommend angles executable by the right teammate (Clara=copy, Steve=visuals, Theo=video, Sarah=publish/engage, Sophie=SEO)
- Quantify expected lift when possible
- If data is missing, label assumptions explicitly
- Do not write final marketing copy — that's Clara's job
- Do not create visual concepts — that's Steve's job

Competitor data (${competitors?.length ?? 0}):
${compactCompetitors(competitors)}

Trend signals (${trendSignals?.length ?? 0}):
${compactTrends(trendSignals)}

Return STRICT JSON:
{
  "period": "${periodLabel}",
  "trendSummary": "2-3 sentence executive view of the trend landscape",
  "topTrends": [
    {
      "topic": "...",
      "relevanceToBrand": 0.0-1.0,
      "accelerationNote": "Why this matters NOW",
      "suggestedHook": "Concrete angle the brand can use"
    }
  ],
  "competitorInsights": [
    {
      "competitor": "name",
      "whatTheyreDoing": "Specific observation",
      "whyItsWorking": "Diagnosis",
      "threatLevel": "high | medium | low",
      "counterMove": "Specific action"
    }
  ],
  "contentOpportunities": [
    {
      "angle": "...",
      "format": "reel | carousel | thread | long-form | story | live",
      "platform": "${platforms[0]}",
      "whyNow": "Why this window",
      "expectedLift": "e.g. 2-3× engagement vs baseline",
      "assignableTo": "clara | steve | theo | sarah | sophie | lora",
      "urgency": "this-week | this-month | monitor"
    }
  ],
  "recommendedAngles": ["Short angle one-liners"],
  "platformSuggestions": [
    {"platform": "...", "recommendation": "...", "reasoning": "..."}
  ],
  "risks": ["Risk + how to mitigate"],
  "nextActionsForLora": [
    {"action": "...", "why": "...", "priority": "do-now | this-week | this-month"}
  ]
}`;

  try {
    const result = await callGemini({
      taskType: 'market-research',
      prompt,
      mimeType: 'application/json',
      minLength: 400,
    });
    return JSON.parse(result.text);
  } catch (e) {
    console.error('[SAM] Error:', e);
    return {
      period: periodLabel,
      trendSummary: 'Strategy intelligence service temporarily degraded.',
      topTrends: [],
      competitorInsights: [],
      contentOpportunities: [],
      recommendedAngles: [],
      platformSuggestions: platforms.map(p => ({
        platform: p,
        recommendation: 'Re-run when intelligence service recovers',
        reasoning: 'Service degradation',
      })),
      risks: [],
      nextActionsForLora: [{
        action: 'Re-run Sam when intelligence service recovers',
        why: 'No live data this cycle',
        priority: 'this-week',
      }],
    };
  }
}
