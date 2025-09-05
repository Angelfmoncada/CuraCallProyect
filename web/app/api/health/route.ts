import { NextResponse } from 'next/server';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
  
  try {
    // Check if we have a production backend URL
    if (!process.env.NEXT_PUBLIC_API_BASE_URL && base.includes('localhost')) {
      // Demo mode - return mock health status
      return NextResponse.json({
        status: 'demo',
        message: 'CuraCall AI running in demo mode',
        timestamp: new Date().toISOString(),
        version: '1.0.0-demo'
      });
    }
    
    const r = await fetch(`${base}/api/health`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!r.ok) {
      throw new Error(`Backend responded with status: ${r.status}`);
    }
    
    const data = await r.json();
    return NextResponse.json(data);
  } catch (error) {
    // Fallback to demo mode if backend is not available
    return NextResponse.json({
      status: 'demo',
      message: 'Backend not available - running in demo mode',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      version: '1.0.0-demo'
    });
  }
}