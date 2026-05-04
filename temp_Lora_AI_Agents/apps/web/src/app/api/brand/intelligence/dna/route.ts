import { NextResponse } from 'next/server';
import { backendBrandRequest } from '@/lib/server/brand-backend';

export async function GET() {
  const dna = await backendBrandRequest('/intelligence/dna');
  return NextResponse.json(dna);
}
