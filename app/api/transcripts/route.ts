import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { supabaseAdmin, getOrCreateUser, TranscriptLine } from '@/lib/supabase';

/**
 * Get all transcripts for the current user
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get transcripts
    const { data: transcripts, error, count } = await supabaseAdmin
      .from('transcripts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch transcripts: ${error.message}`);
    }

    return NextResponse.json({ 
      transcripts: transcripts || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error in GET /api/transcripts:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new transcript
 */
export async function POST(request: NextRequest): Promise<Response> {
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
    
    // Validate required fields
    if (!body.translations || !body.source || !body.source_language) {
      return NextResponse.json(
        { error: 'Missing required fields: translations, source, source_language' },
        { status: 400 }
      );
    }

    // Create transcript
    const { data: transcript, error } = await supabaseAdmin
      .from('transcripts')
      .insert({
        user_id: user.id,
        title: body.title || null,
        source_language: body.source_language,
        translations: body.translations,
        source: body.source,
        duration_ms: body.duration_ms || 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transcript: ${error.message}`);
    }

    return NextResponse.json({ transcript }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/transcripts:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

