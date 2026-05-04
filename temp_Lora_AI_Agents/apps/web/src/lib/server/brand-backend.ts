import type { BrandProfileRecord } from '@/lib/brand-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const DEV_BRAND_BASE = `${API_BASE}/v1/brand/dev/local`;

function createEmptyProfile(): BrandProfileRecord {
  const now = new Date().toISOString();
  return {
    brandName: '',
    industry: '',
    websiteUrl: '',
    targetAudience: '',
    tone: 'friendly',
    voiceCharacteristics: [],
    prohibitedWords: [],
    preferredHashtags: [],
    brandColors: { secondary: [] },
    competitors: [],
    logoUrl: '',
    referenceImages: [],
    productDescription: '',
    valueProposition: '',
    contentPillars: [],
    autoReplyEnabled: true,
    sentimentThreshold: -0.5,
    pagesScraped: [],
    lastValidatedAt: '',
    createdAt: now,
    updatedAt: now,
    documents: {
      business_profile: '',
      market_research: '',
      social_strategy: '',
      brand_guidelines: '',
      visual_intelligence: '',
    },
    validationHistory: [],
    memory: [],
    dna: { coreValues: [] },
  };
}

export async function backendBrandRequest<T>(path = '', init?: RequestInit): Promise<T> {
  const response = await fetch(`${DEV_BRAND_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? payload?.error ?? `Backend brand request failed: ${response.status}`);
  }

  const payload = await response.json().catch(() => null);
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

export function normalizeBackendBrandProfile(payload: Record<string, any>): BrandProfileRecord {
  const base = createEmptyProfile();
  const brandColors = payload.brandColors ?? {};
  const visualIntelligence = payload.visualIntelligence ?? {};
  const audiencePsychology = payload.audiencePsychology ?? {};
  const marketIntelligence = payload.marketIntelligence ?? {};
  const socialStrategy = payload.socialStrategy ?? {};

  return {
    ...base,
    ...payload,
    brandName: payload.brandName ?? '',
    industry: payload.industry ?? '',
    websiteUrl: payload.websiteUrl ?? '',
    targetAudience: payload.targetAudience ?? '',
    tone: payload.tone ?? 'friendly',
    voiceCharacteristics: Array.isArray(payload.voiceCharacteristics) ? payload.voiceCharacteristics : [],
    prohibitedWords: Array.isArray(payload.prohibitedWords) ? payload.prohibitedWords : [],
    preferredHashtags: Array.isArray(payload.preferredHashtags) ? payload.preferredHashtags : [],
    brandColors: {
      ...brandColors,
      secondary: Array.isArray(brandColors.secondary) ? brandColors.secondary : [],
    },
    competitors: Array.isArray(payload.competitors) ? payload.competitors : [],
    logoUrl: payload.logoUrl ?? '',
    referenceImages: Array.isArray(visualIntelligence.referenceImages) ? visualIntelligence.referenceImages : [],
    productDescription: payload.productDescription ?? '',
    valueProposition: payload.valueProposition ?? '',
    contentPillars: Array.isArray(payload.contentPillars) ? payload.contentPillars : [],
    autoReplyEnabled: payload.autoReplyEnabled ?? true,
    sentimentThreshold: payload.sentimentThreshold ?? -0.5,
    pagesScraped: Array.isArray(payload.pagesScraped) ? payload.pagesScraped : [],
    lastValidatedAt: payload.lastValidatedAt ?? '',
    createdAt: payload.createdAt ?? base.createdAt,
    updatedAt: payload.updatedAt ?? base.updatedAt,
    documents: base.documents,
    validationHistory: Array.isArray(payload.validationHistory) ? payload.validationHistory : [],
    memory: Array.isArray(payload.memory) ? payload.memory : [],
    dna: {
      coreValues: [],
      ...(payload.dna ?? {}),
    },
    audiencePsychology,
    marketIntelligence,
    socialStrategy,
    visualIntelligence,
  };
}
