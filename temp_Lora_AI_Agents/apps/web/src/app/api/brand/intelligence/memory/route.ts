import { NextResponse } from 'next/server';
import { backendBrandRequest } from '@/lib/server/brand-backend';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? '10');
  const memory = await backendBrandRequest(`/intelligence/memory?limit=${limit}`);
  return NextResponse.json(memory);
}
