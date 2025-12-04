import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getOrCreateUser } from '@/lib/supabase';

/**
 * Get or create current user
 * 
 * This endpoint syncs the Auth0 user with our database.
 * Called automatically when user logs in.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Get Auth0 session
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create user in our database
    const user = await getOrCreateUser({
      sub: session.user.sub,
      email: session.user.email,
      name: session.user.name,
      picture: session.user.picture,
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error in /api/users/me:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

