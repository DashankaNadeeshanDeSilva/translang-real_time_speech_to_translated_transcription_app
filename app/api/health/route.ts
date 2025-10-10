import { NextResponse } from 'next/server';

/**
 * Health Check API Route
 * 
 * Used by Docker healthcheck and AWS load balancers
 * to verify the application is running correctly.
 * 
 * Phase 7 Implementation
 */

export async function GET() {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    };

    // Check if Soniox API key is configured
    const hasApiKey = !!process.env.SONIOX_SECRET_KEY;
    
    if (!hasApiKey) {
      return NextResponse.json(
        {
          ...health,
          status: 'degraded',
          warning: 'SONIOX_SECRET_KEY not configured',
        },
        { status: 200 } // Still return 200 for health check
      );
    }

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

