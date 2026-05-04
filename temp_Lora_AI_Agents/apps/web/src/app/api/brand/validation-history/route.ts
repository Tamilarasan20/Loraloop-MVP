import { NextResponse } from 'next/server';
import { backendBrandRequest } from '@/lib/server/brand-backend';

export async function GET() {
  const history = await backendBrandRequest('/validation-history');
  return NextResponse.json(history);
}
