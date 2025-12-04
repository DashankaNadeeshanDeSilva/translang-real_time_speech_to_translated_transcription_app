import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { supabaseAdmin, getOrCreateUser, TranscriptLine } from '@/lib/supabase';
import { validateRequest, createTranscriptSchema, transcriptQuerySchema, ValidationError } from '@/lib/validation';

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

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = validateRequest(transcriptQuerySchema, {
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    // Get transcripts
    const { data: transcripts, error, count } = await supabaseAdmin
      .from('transcripts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(queryParams.offset, queryParams.offset + queryParams.limit - 1);

    if (error) {
      throw new Error(`Failed to fetch transcripts: ${error.message}`);
    }

    return NextResponse.json({ 
      transcripts: transcripts || [],
      total: count || 0,
      limit: queryParams.limit,
      offset: queryParams.offset,
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.errors },
        { status: error.statusCode }
      );
    }
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

    // Validate request body
    const body = await request.json();
    const validatedData = validateRequest(createTranscriptSchema, body);

    // Create transcript
    const { data: transcript, error } = await supabaseAdmin
      .from('transcripts')
      .insert({
        user_id: user.id,
        title: validatedData.title || null,
        source_language: validatedData.source_language,
        translations: validatedData.translations,
        source: validatedData.source,
        duration_ms: validatedData.duration_ms,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transcript: ${error.message}`);
    }

    return NextResponse.json({ transcript }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.errors },
        { status: error.statusCode }
      );
    }
    console.error('Error in POST /api/transcripts:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

