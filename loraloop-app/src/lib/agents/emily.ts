/**
 * EMILY — AI Email Marketer
 *
 * Writes email campaigns and sequences. Owns subject line testing, segment
 * targeting, send-time recommendations, and lifecycle nurture flows.
 *
 * Emily handles email; Sarah handles social. They share the same brand
 * voice but optimise for very different inboxes.
 */

import { callGemini } from '../gemini';
import { buildBrandContext } from '../brandVoiceEngine';
import type { BrandVoice } from '@/types/agents';

export type EmailGoal =
  | 'awareness'
  | 'lead-nurture'
  | 'conversion'
  | 'retention'
  | 'reactivation'
  | 'announcement'
  | 'transactional';

export type EmailSegment =
  | 'all-subscribers'
  | 'new-signups'
  | 'engaged-30d'
  | 'inactive-90d'
  | 'purchasers'
  | 'free-trial'
  | 'paid-customers'
  | 'churned'
  | 'custom';

// ─── Single email ────────────────────────────────────────────────────
export interface EmilyEmailRequest {
  businessName: string;
  brandVoice: BrandVoice;
  goal: EmailGoal;
  segment: EmailSegment;
  customSegmentDescription?: string;
  topic: string;
  keyPoints?: string[];
  cta?: string;
  productOrOfferContext?: string;
  audienceTimezone?: string;
  recentSubjectLinesUsed?: string[];   // avoid reuse
  memoryContext?: string;
}

export interface EmilyEmailOutput {
  subjectLineVariants: { line: string; rationale: string; predictedOpenRate: string }[];
  preheader: string;
  body: {
    greeting: string;
    paragraphs: string[];
    cta: { text: string; href?: string; buttonStyle: 'primary' | 'secondary' | 'text' };
    signOff: string;
  };
  plainTextVersion: string;
  recommendedSendTime: string;     // ISO8601
  sendTimeReasoning: string;
  expectedMetrics: {
    openRate: string;
    clickRate: string;
    conversionRate: string;
  };
  abTestSuggestion: string;
}

// ─── Sequence ────────────────────────────────────────────────────────
export interface EmilySequenceStep {
  stepNumber: number;
  triggerDelay: string;     // e.g. "0 days", "3 days", "on signup"
  goal: EmailGoal;
  topic: string;
  emphasis: string;         // what this email uniquely contributes
}

export interface EmilySequenceRequest {
  businessName: string;
  brandVoice: BrandVoice;
  flowName: string;
  flowGoal: 'onboard' | 'nurture' | 'reactivate' | 'cart-abandon' | 'post-purchase' | 'win-back';
  segment: EmailSegment;
  stepCount?: number;       // default 5
  productContext?: string;
  memoryContext?: string;
}

export interface EmilySequencePlan {
  flowName: string;
  flowGoal: string;
  steps: {
    stepNumber: number;
    triggerDelay: string;
    subjectLine: string;
    preheader: string;
    bodySummary: string;
    cta: string;
    successMetric: string;
  }[];
  exitCriteria: string[];
  expectedFlowConversion: string;
}

const EMILY_PRINCIPLES = `Emily's principles:
- Subject line: 4-7 words, no all-caps, no spam triggers, curiosity > clickbait
- Preheader: 30-90 chars, must NOT repeat the subject line
- Body: scannable — short paragraphs (≤3 lines), one idea per paragraph, ONE primary CTA
- Mobile-first: assume 60-70% read on phones
- Personalisation > generic greetings (use first name only when data confirms it)
- Plain-text version always provided (deliverability + accessibility)
- Match brand voice exactly; email is more intimate than social, lean into it
- For nurture flows: each email must do ONE job — never overload`;

export async function runEmilyEmail(input: EmilyEmailRequest): Promise<EmilyEmailOutput> {
  const {
    businessName, brandVoice, goal, segment, customSegmentDescription,
    topic, keyPoints, cta, productOrOfferContext, audienceTimezone,
    recentSubjectLinesUsed, memoryContext,
  } = input;

  const brandContext = buildBrandContext(brandVoice, businessName);
  const memoryBlock = memoryContext ? `\n${memoryContext}\n` : '';

  const prompt = `You are EMILY, AI email marketer for ${businessName}.
${memoryBlock}
Brand: ${brandContext}
Email goal: ${goal}
Segment: ${segment}${customSegmentDescription ? ` — ${customSegmentDescription}` : ''}
Topic: ${topic}
${keyPoints?.length ? `Key points to cover:\n${keyPoints.map(p => `- ${p}`).join('\n')}` : ''}
${cta ? `Desired CTA: ${cta}` : ''}
${productOrOfferContext ? `Product/offer context: ${productOrOfferContext}` : ''}
${audienceTimezone ? `Audience primary timezone: ${audienceTimezone}` : ''}
${recentSubjectLinesUsed?.length ? `Recently used subject lines (avoid reuse):\n${recentSubjectLinesUsed.map(s => `- ${s}`).join('\n')}` : ''}

${EMILY_PRINCIPLES}

Return STRICT JSON:
{
  "subjectLineVariants": [
    {"line": "≤7 words", "rationale": "Why this works", "predictedOpenRate": "X%"}
  ],
  "preheader": "30-90 chars, complements but does not repeat subject",
  "body": {
    "greeting": "Hi [Name]," or contextual,
    "paragraphs": ["≤3 lines each, scannable"],
    "cta": {"text": "...", "href": "optional", "buttonStyle": "primary | secondary | text"},
    "signOff": "Brand-authentic sign-off + name"
  },
  "plainTextVersion": "Full plain-text version with line breaks preserved",
  "recommendedSendTime": "ISO8601",
  "sendTimeReasoning": "Why this slot for this segment",
  "expectedMetrics": {
    "openRate": "X-Y%",
    "clickRate": "X-Y%",
    "conversionRate": "X-Y%"
  },
  "abTestSuggestion": "What specific element to A/B test on this send"
}`;

  try {
    const result = await callGemini({
      taskType: 'social-strategy',
      prompt,
      mimeType: 'application/json',
      minLength: 300,
    });
    return JSON.parse(result.text);
  } catch (e) {
    console.error('[EMILY/email] Error:', e);
    throw e;
  }
}

export async function runEmilySequence(input: EmilySequenceRequest): Promise<EmilySequencePlan> {
  const {
    businessName, brandVoice, flowName, flowGoal, segment,
    stepCount = 5, productContext, memoryContext,
  } = input;

  const brandContext = buildBrandContext(brandVoice, businessName);
  const memoryBlock = memoryContext ? `\n${memoryContext}\n` : '';

  const prompt = `You are EMILY, email marketer for ${businessName}.
${memoryBlock}
Brand: ${brandContext}

Design a ${stepCount}-step ${flowGoal} email sequence named "${flowName}".
Segment: ${segment}
${productContext ? `Product context: ${productContext}` : ''}

${EMILY_PRINCIPLES}

Rules for sequences:
- Each email does ONE job — never overload
- Increase intimacy/specificity as the sequence progresses
- Trigger delays must match the flow goal (e.g. cart-abandon = 1h, 24h, 72h; onboard = 0, 1d, 3d, 7d, 14d)
- Include explicit exit criteria (when a user should be removed from the flow)

Return STRICT JSON:
{
  "flowName": "${flowName}",
  "flowGoal": "${flowGoal}",
  "steps": [
    {
      "stepNumber": 1,
      "triggerDelay": "e.g. 0 days, 1 day, on signup",
      "subjectLine": "≤7 words",
      "preheader": "30-90 chars",
      "bodySummary": "What this email accomplishes",
      "cta": "Primary CTA text",
      "successMetric": "What signals this step worked"
    }
  ],
  "exitCriteria": ["When to remove a contact from this flow"],
  "expectedFlowConversion": "X-Y% end-to-end conversion estimate"
}`;

  try {
    const result = await callGemini({
      taskType: 'social-strategy',
      prompt,
      mimeType: 'application/json',
      minLength: 400,
    });
    return JSON.parse(result.text);
  } catch (e) {
    console.error('[EMILY/sequence] Error:', e);
    throw e;
  }
}
