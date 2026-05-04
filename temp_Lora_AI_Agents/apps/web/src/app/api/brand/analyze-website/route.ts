import { NextResponse } from 'next/server';
import { backendBrandRequest, normalizeBackendBrandProfile } from '@/lib/server/brand-backend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.websiteUrl) {
      return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 });
    }

    const result = await backendBrandRequest<Record<string, unknown>>('/analyze-website', {
      method: 'POST',
      body: JSON.stringify({ websiteUrl: body.websiteUrl }),
    });
    return NextResponse.json(normalizeBackendBrandProfile(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
