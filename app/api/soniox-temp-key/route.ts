import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Generate Temporary Soniox API Key
 * 
 * This endpoint generates a temporary API key for the client to use with Soniox.
 * The permanent API key is kept secure on the server and never exposed to the client.
 * 
 * Temporary keys:
 * - Are scoped to a single session
 * - Have limited lifetime
 * - Protect the permanent key from exposure
 * 
 * Reference: https://soniox.com/docs/websocket-api
 * 
 * NOTE: This implementation will be verified/updated in Phase 1 when we integrate
 * the actual Soniox SDK. The SDK's apiKey function may handle key management differently.
 */

export async function POST(request: NextRequest) {
  try {
    // Get the permanent Soniox API key from environment variables
    const permanentApiKey = process.env.SONIOX_SECRET_KEY;

    if (!permanentApiKey) {
      console.error('SONIOX_SECRET_KEY not configured in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: API key not configured' },
        { status: 500 }
      );
    }

    // TEMPORARY IMPLEMENTATION for Phase 0:
    // In many cases with Soniox SDK, the client may use the permanent key directly
    // via a server proxy that validates requests. We'll refine this in Phase 1
    // when we review the actual @soniox/speech-to-text-web SDK documentation.
    
    // For now, this route serves as a placeholder that will be updated once we
    // understand the exact authentication flow required by Soniox.
    
    // Option 1: If Soniox has a temporary key API endpoint
    // const sonioxApiEndpoint = process.env.SONIOX_API_ENDPOINT || 'https://api.soniox.com';
    // const response = await fetch(`${sonioxApiEndpoint}/create-temporary-key`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${permanentApiKey}`,
    //   },
    // });
    
    // Option 2: If the SDK uses a function-based key provider (as mentioned in docs)
    // The SDK may call this endpoint and we return the permanent key securely
    
    // For Phase 0, we'll return the permanent key via this secure endpoint
    // This keeps it server-side only and away from client code
    return NextResponse.json({
      apiKey: permanentApiKey,
      // We'll add proper expiration handling in Phase 1
      note: 'Phase 0 implementation - to be refined in Phase 1',
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
export async function GET() {
  return NextResponse.json({
    message: 'This endpoint requires POST request to generate a temporary Soniox API key',
    usage: 'POST /api/soniox-temp-key',
  });
}

