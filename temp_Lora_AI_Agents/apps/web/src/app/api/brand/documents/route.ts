import { NextResponse } from 'next/server';
import { backendBrandRequest } from '@/lib/server/brand-backend';

export async function GET() {
  const docs = await backendBrandRequest<Record<string, string | null>>('/documents');
  return NextResponse.json(docs);
}
