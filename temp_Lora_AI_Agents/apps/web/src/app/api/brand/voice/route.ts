import { NextResponse } from 'next/server';
import { backendBrandRequest } from '@/lib/server/brand-backend';

export async function GET() {
  const voice = await backendBrandRequest('/voice');
  return NextResponse.json(voice);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const voice = await backendBrandRequest('/voice', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return NextResponse.json(voice);
}
