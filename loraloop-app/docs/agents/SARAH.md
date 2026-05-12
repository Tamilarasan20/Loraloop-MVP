# SARAH — AI Social Media Manager

> **Role**: Schedules and publishes posts, replies to comments, nurtures community relationships.

## Job

Sarah owns the "post it + reply to it" loop across every social channel. She decides **when** to publish, **how often** to post without triggering audience fatigue, and **how** to respond to every comment, mention, and DM in a brand-authentic voice.

She also flags escalations — sentiment spikes, PR risks, viral negative content — so a human can step in before it becomes a fire.

## Endpoint

```
POST /api/agents/sarah
```

Three actions on one endpoint. The `action` field dispatches:

| `action`    | What it does                                               | Returns                 |
|-------------|------------------------------------------------------------|-------------------------|
| `schedule`  | Recommend an optimal publish time for ONE post             | `SarahScheduleOutput`   |
| `engage`    | Triage a single comment/mention/DM and draft a reply       | `SarahEngagementOutput` |
| `calendar`  | Plan a multi-post calendar across N days                   | `SarahCalendarPlan`     |

### `schedule` — request

```json
{
  "action": "schedule",
  "platform": "instagram",
  "timezone": "Europe/London",
  "preferredTime": "2026-05-15T18:30:00Z",
  "recentPostTimes": ["2026-05-14T10:00:00Z"],
  "businessId": "uuid"
}
```

### `engage` — request

```json
{
  "action": "engage",
  "item": {
    "id": "ig_comment_42",
    "platform": "instagram",
    "type": "comment",
    "text": "Does this work for SaaS too?",
    "authorUsername": "founder_jane",
    "authorFollowerCount": 12400,
    "postContext": "Carousel: 5 lessons from shipping our first agent"
  }
}
```

### `calendar` — request

```json
{
  "action": "calendar",
  "timezone": "Europe/London",
  "lookAheadDays": 7,
  "posts": [
    { "contentId": "p_001", "platform": "instagram", "priority": 9 },
    { "contentId": "p_002", "platform": "linkedin",  "priority": 7 }
  ]
}
```

## Standards (baked into prompt)

1. **Reply within 2 hours** to comments on posts in their first 24h — algorithm-critical
2. **Priority order**: questions > complaints > compliments > general
3. **Never generic** — always reference the specific content or user
4. **Match brand tone exactly** — never defensive or dismissive
5. **Complaints flow**: acknowledge → empathise → offer resolution → move to DM if sensitive
6. **Escalate** on: sentiment < -0.6, >5 negatives in 30 min, legal/PR mentions, viral negative, PII shared

## Memory wiring

| Action      | Memory layer  | What gets stored                                       |
|-------------|---------------|--------------------------------------------------------|
| `schedule`  | `preference`  | Cadence + timing patterns that work for this brand     |
| `engage`    | `reflection`  | What kinds of replies work / escalate by platform      |
| `calendar`  | `preference`  | Multi-post cadence patterns                            |

Memory is retrieved with an action-specific query and scoped to `sarah + shared`. All fact extraction is fire-and-forget — engagement responses never block on memory I/O.

## Credit cost

`2 credits` per call (`sarah_social`).

## Integration points

- Auto-triggered by **Lora** when a new post is approved (schedules publish)
- Auto-triggered by **Nick** post-analysis (replies to top-engagement comments)
- Manual: `/calendar` (multi-post planning), `/board` (engagement queue)
