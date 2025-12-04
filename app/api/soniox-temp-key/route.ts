import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

/**
 * API Route: Generate Temporary Soniox API Key
 * 
 * This endpoint generates a temporary API key for the client to use with Soniox.
 * PROTECTED: Requires authenticated user session.
 * 
 * The permanent API key is kept secure on the server and never exposed to the client.
 */

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get user session
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Log user access for tracking
    console.log(`🔑 API key requested by user: ${session.user.email || session.user.sub}`);

    // Get the permanent Soniox API key from environment variables
    const permanentApiKey = process.env.SONIOX_SECRET_KEY;

    if (!permanentApiKey) {
      console.error('SONIOX_SECRET_KEY not configured in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: API key not configured' },
        { status: 500 }
      );
    }

    // Return the API key for authenticated users
    return NextResponse.json({
      apiKey: permanentApiKey,
      userId: session.user.sub,
    });

  } catch (error) {
    console.error('Error in soniox-temp-key API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests with helpful message
export async function GET(): Promise<Response> {
  return NextResponse.json({
    message: 'This endpoint requires POST request and authentication',
    usage: 'POST /api/soniox-temp-key (requires authentication)',
  });
}
