# SAM — AI Strategist

> **Role**: Analyses market trends and competitor moves; surfaces content opportunities for growth.

## Job

Sam supports Lora. Lora decides the plan — Sam supplies the intelligence that feeds the plan.

He reads trend signals + competitor activity and surfaces specific, executable content opportunities tied to a format, platform, and teammate (Clara for copy, Steve for visuals, Theo for video, Sarah for publishing/engagement, Sophie for SEO).

## Endpoint

```
POST /api/agents/sam
```

### Request

```json
{
  "businessId": "uuid",
  "industry": "B2B SaaS — DevOps tools",
  "targetAudience": "Engineering leaders at Series A-C startups",
  "platforms": ["linkedin", "twitter"],
  "goal": "Hit 3% engagement on LinkedIn",
  "periodLabel": "Last 7 days",
  "competitors": [
    {
      "name": "Vercel",
      "handle": "@vercel",
      "platform": "twitter",
      "postingFrequencyPerWeek": 14,
      "topPosts": [
        { "title": "v0 ships interactive prototypes", "engagement": 8400, "format": "thread" }
      ]
    }
  ],
  "trendSignals": [
    { "topic": "agentic CI", "source": "twitter", "growthMultiplier": 4.2, "volume": 18000 }
  ]
}
```

### Response (abridged)

```ts
{
  agent: 'sam',
  result: {
    period: 'Last 7 days',
    trendSummary: '...',
    topTrends: [{ topic, relevanceToBrand, accelerationNote, suggestedHook }],
    competitorInsights: [{ competitor, whatTheyreDoing, whyItsWorking, threatLevel, counterMove }],
    contentOpportunities: [{ angle, format, platform, whyNow, expectedLift, assignableTo, urgency }],
    recommendedAngles: ['...'],
    platformSuggestions: [{ platform, recommendation, reasoning }],
    risks: ['...'],
    nextActionsForLora: [{ action, why, priority }]
  }
}
```

## Standards (baked into prompt)

1. **Detect ACCELERATION, not just volume** — a hashtag growing 300% in 4h beats one with steady high volume
2. **Engagement rate, not followers** — for competitor analysis
3. **Every insight is actionable** + tied to a specific format/platform
4. **Quantify expected lift** when data permits
5. **Label assumptions** when data is missing
6. **Stay in your lane** — Sam doesn't write copy (Clara) or create visuals (Steve)

## Memory wiring

| Layer        | What gets stored                                          |
|--------------|-----------------------------------------------------------|
| `strategic`  | Trend findings, competitor patterns, next-actions-for-Lora |

Retrieval queries `strategic + reflection + brand` from scopes `sam + lora + shared`. Strategic memory is the highest-leverage layer — Lora reads from it when planning.

## Credit cost

`3 credits` per call (`sam_strategy`).

## Integration points

- Auto-triggered weekly by **Lora** as input to her planning cycle
- Read by **Clara/Steve/Theo/Sarah/Sophie** via the `contentOpportunities.assignableTo` field
- Manual: `/analytics` (strategic intelligence panel)

## Legacy — Brand DNA scraper

The endpoint `POST /api/extract-dna` (Playwright website scraping + Brand DNA extraction + KB document generation) remains for onboarding flows but is no longer branded as Sam's responsibility. That utility is now invoked directly by the knowledge-base creation funnel.
