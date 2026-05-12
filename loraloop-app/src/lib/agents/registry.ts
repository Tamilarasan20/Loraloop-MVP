/**
 * Single source of truth for every Loraloop AI agent.
 *
 * The UI agent grid, pricing page, and credit accounting all read from this
 * registry. Add a new agent here and it shows up everywhere automatically.
 */

export type AgentCategory =
  | 'research'
  | 'strategy'
  | 'copy'
  | 'visual'
  | 'video'
  | 'seo'
  | 'ads'
  | 'analytics'
  | 'social'
  | 'email'
  | 'autonomous';

export interface AgentMeta {
  id: string;
  name: string;
  role: string;
  tagline: string;
  category: AgentCategory;
  /** Cost-key used in AGENT_CREDIT_COST (`{agent}_{action}`) */
  costKey: string;
  credits: number;
  endpoint: string;
  docPath: string;
}

export const AGENT_REGISTRY: AgentMeta[] = [
  {
    id: 'sam',
    name: 'Sam',
    role: 'AI Strategist',
    tagline: 'Analyses market trends and competitor moves; surfaces content opportunities for growth.',
    category: 'strategy',
    costKey: 'sam_strategy',
    credits: 3,
    endpoint: '/api/agents/sam',
    docPath: 'docs/agents/SAM.md',
  },
  {
    id: 'lora',
    name: 'Lora',
    role: 'AI Marketing Lead',
    tagline: 'Turns business goals into an execution plan and assigns tasks across the team.',
    category: 'strategy',
    costKey: 'lora_strategy',
    credits: 2,
    endpoint: '/api/agents/orchestrate',
    docPath: 'docs/agents/LORA.md',
  },
  {
    id: 'clara',
    name: 'Clara',
    role: 'AI Content Writer',
    tagline: 'Writes blogs, emails, threads, newsletters, social posts — persuasive content that drives action.',
    category: 'copy',
    costKey: 'clara_content',
    credits: 2,
    endpoint: '/api/agents/orchestrate',
    docPath: 'docs/agents/CLARA.md',
  },
  {
    id: 'steve',
    name: 'Steve',
    role: 'AI Visual Designer',
    tagline: 'Designs scroll-stopping posts and carousels that reflect your brand on every platform.',
    category: 'visual',
    costKey: 'steve_image',
    credits: 3,
    endpoint: '/api/agents/orchestrate',
    docPath: 'docs/agents/STEVE.md',
  },
  {
    id: 'sophie',
    name: 'Sophie',
    role: 'AI SEO + GEO Manager',
    tagline: 'Optimises your content for SEO and GEO so people find you on Google and on ChatGPT, Claude, Perplexity.',
    category: 'seo',
    costKey: 'sophie_seo',
    credits: 3,
    endpoint: '/api/agents/sophie',
    docPath: 'docs/agents/SOPHIE.md',
  },
  {
    id: 'theo',
    name: 'Theo',
    role: 'AI Video Producer',
    tagline: 'Plans and scripts short-form videos for TikTok, Instagram, YouTube — turns ideas into engaging video.',
    category: 'video',
    costKey: 'theo_video',
    credits: 4,
    endpoint: '/api/agents/theo',
    docPath: 'docs/agents/THEO.md',
  },
  {
    id: 'elena',
    name: 'Elena',
    role: 'AI Ads Manager',
    tagline: 'Runs and scales your ad campaigns across Meta, Google, TikTok, LinkedIn — optimising for ROI.',
    category: 'ads',
    costKey: 'elena_ads',
    credits: 4,
    endpoint: '/api/agents/elena',
    docPath: 'docs/agents/ELENA.md',
  },
  {
    id: 'nick',
    name: 'Nick',
    role: 'AI Analyst',
    tagline: 'Tracks content, posts and ads — reports what worked, what didn\'t, and what to improve next.',
    category: 'analytics',
    costKey: 'nick_analyze',
    credits: 2,
    endpoint: '/api/agents/nick',
    docPath: 'docs/agents/NICK.md',
  },
  {
    id: 'sarah',
    name: 'Sarah',
    role: 'AI Social Media Manager',
    tagline: 'Schedules and publishes posts, replies to comments, and nurtures community relationships.',
    category: 'social',
    costKey: 'sarah_social',
    credits: 2,
    endpoint: '/api/agents/sarah',
    docPath: 'docs/agents/SARAH.md',
  },
  {
    id: 'emily',
    name: 'Emily',
    role: 'AI Email Marketer',
    tagline: 'Writes and sequences email campaigns — subject-line testing, segments, and lifecycle flows.',
    category: 'email',
    costKey: 'emily_email',
    credits: 2,
    endpoint: '/api/agents/emily',
    docPath: 'docs/agents/EMILY.md',
  },
  {
    id: 'aura',
    name: 'Aura',
    role: 'Brand Strategist (autonomous)',
    tagline: 'Continuously checks brand consistency across all active content.',
    category: 'autonomous',
    costKey: 'aura_check',
    credits: 0,
    endpoint: '(simulated via Mission Control)',
    docPath: 'docs/agents/MISSION-CONTROL.md',
  },
  {
    id: 'echo',
    name: 'Echo',
    role: 'Content Creator (autonomous)',
    tagline: 'Generates high-volume content ideas and drafts on a loop.',
    category: 'autonomous',
    costKey: 'echo_ideate',
    credits: 0,
    endpoint: '(simulated via Mission Control)',
    docPath: 'docs/agents/MISSION-CONTROL.md',
  },
  {
    id: 'nexus',
    name: 'Nexus',
    role: 'Ops Manager (autonomous)',
    tagline: 'Syncs the calendar and schedules posts across platforms.',
    category: 'autonomous',
    costKey: 'nexus_schedule',
    credits: 0,
    endpoint: '(simulated via Mission Control)',
    docPath: 'docs/agents/MISSION-CONTROL.md',
  },
];

export function getAgent(id: string): AgentMeta | undefined {
  return AGENT_REGISTRY.find((a) => a.id === id);
}

export function getAgentsByCategory(category: AgentCategory): AgentMeta[] {
  return AGENT_REGISTRY.filter((a) => a.category === category);
}
