import { NextResponse } from 'next/server';
export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
  const r = await fetch(`${base}/api/health`, { cache: 'no-store' });
  const data = await r.json();
  return NextResponse.json(data);
}