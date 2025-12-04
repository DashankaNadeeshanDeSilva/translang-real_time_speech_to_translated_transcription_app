import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase';

/**
 * Get user settings
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

    // Get user from database
    const user = await getOrCreateUser({
      sub: session.user.sub,
      email: session.user.email,
      name: session.user.name,
      picture: session.user.picture,
    });

    // Get user settings
    const { data: settings, error } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error in GET /api/users/settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update user settings
 */
export async function PUT(request: NextRequest): Promise<Response> {
  try {
    // Get Auth0 session
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await getOrCreateUser({
      sub: session.user.sub,
      email: session.user.email,
      name: session.user.name,
      picture: session.user.picture,
    });

    // Get request body
    const body = await request.json();
    
    // Update settings
    const { data: settings, error } = await supabaseAdmin
      .from('user_settings')
      .update({
        source_language: body.source_language,
        vad_enabled: body.vad_enabled,
        silence_threshold: body.silence_threshold,
        sentence_mode: body.sentence_mode,
        theme: body.theme,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error in PUT /api/users/settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

