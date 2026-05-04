import { NextResponse } from 'next/server';
import { backendBrandRequest, normalizeBackendBrandProfile } from '@/lib/server/brand-backend';

export async function GET() {
  const profile = await backendBrandRequest<Record<string, unknown>>('');
  return NextResponse.json(normalizeBackendBrandProfile(profile));
}

export async function PUT(request: Request) {
  const body = await request.json();
  const profile = await backendBrandRequest<Record<string, unknown>>('', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return NextResponse.json(normalizeBackendBrandProfile(profile));
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const profile = await backendBrandRequest<Record<string, unknown>>('', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return NextResponse.json(normalizeBackendBrandProfile(profile));
}

export async function DELETE() {
  return NextResponse.json({ error: 'Reset is disabled for backend brand storage.' }, { status: 405 });
}
