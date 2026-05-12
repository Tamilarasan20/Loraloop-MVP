# EMILY — AI Email Marketer

> **Role**: Writes and sequences email campaigns — subject-line testing, segment targeting, lifecycle flows.

## Job

Emily writes emails — single sends and multi-step sequences. She owns subject-line variants (with predicted open rates), preheader copy, scannable mobile-first body layout, send-time recommendations per segment, and the full plain-text version for deliverability.

For lifecycle flows (onboarding, nurture, cart-abandon, win-back, post-purchase) she designs the step cadence, the per-step subject + preheader + CTA, and the exit criteria.

Emily handles **email**. Sarah handles **social**. They share brand voice but optimise for very different inboxes.

## Endpoint

```
POST /api/agents/emily
```

Two actions on one endpoint:

| `action`    | What it does                                                  | Returns               |
|-------------|---------------------------------------------------------------|-----------------------|
| `email`     | Compose one email (subject variants + body + plaintext + send time) | `EmilyEmailOutput`    |
| `sequence`  | Design a full lifecycle email flow (N steps)                  | `EmilySequencePlan`   |

### `email` — request

```json
{
  "action": "email",
  "goal": "lead-nurture",
  "segment": "new-signups",
  "topic": "How to deploy your first agent in under 10 minutes",
  "keyPoints": [
    "Why deploys hang for first-time users (DB indexes)",
    "Concrete checklist they can run before deploy",
    "Link to template repo"
  ],
  "cta": "Open the deploy checklist",
  "audienceTimezone": "America/New_York",
  "recentSubjectLinesUsed": ["Get to first deploy"],
  "businessId": "uuid"
}
```

### `sequence` — request

```json
{
  "action": "sequence",
  "flowName": "Free trial onboarding",
  "flowGoal": "onboard",
  "segment": "free-trial",
  "stepCount": 5,
  "productContext": "14-day trial; activation = first deployed agent"
}
```

## Standards (baked into prompt)

1. **Subject line**: 4-7 words, no all-caps, no spam triggers, curiosity > clickbait
2. **Preheader**: 30-90 chars, must NOT repeat the subject
3. **Body**: scannable — short paragraphs (≤3 lines), one idea per paragraph, ONE primary CTA
4. **Mobile-first**: assume 60-70% read on phones
5. **Plain-text version** always provided (deliverability + accessibility)
6. **For sequences**: each email does ONE job — never overload; trigger delays match the flow goal

## Memory wiring

| Action      | Memory layer  | What gets stored                                          |
|-------------|---------------|-----------------------------------------------------------|
| `email`     | `preference`  | Subject-line patterns, send times, formats that work      |
| `sequence`  | `campaign`    | Flow design + step cadence per goal type                  |

Retrieval queries `brand + preference + reflection + campaign` from scopes `emily + shared`. Send-time and subject-line learnings compound — Emily gets noticeably sharper after ~10 sends per segment.

## Credit cost

`2 credits` per call (`emily_email`).

## Integration points

- Auto-triggered by **Lora** when she plans a lifecycle campaign
- Reads winners from **Nick** to learn what subject lines perform
- Manual: `/content` (single-email composer), `/automation` (sequence builder)

## Output shape (abridged)

### `email`
```ts
{
  subjectLineVariants: [{ line, rationale, predictedOpenRate }],
  preheader: string,
  body: { greeting, paragraphs, cta: { text, href, buttonStyle }, signOff },
  plainTextVersion: string,
  recommendedSendTime: ISO8601,
  sendTimeReasoning: string,
  expectedMetrics: { openRate, clickRate, conversionRate },
  abTestSuggestion: string
}
```

### `sequence`
```ts
{
  flowName, flowGoal,
  steps: [{ stepNumber, triggerDelay, subjectLine, preheader, bodySummary, cta, successMetric }],
  exitCriteria: string[],
  expectedFlowConversion: string
}
```
