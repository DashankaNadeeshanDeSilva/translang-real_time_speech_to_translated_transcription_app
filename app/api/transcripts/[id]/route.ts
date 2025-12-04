import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase';

/**
 * Get a specific transcript
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
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

    // Get transcript
    const { data: transcript, error } = await supabaseAdmin
      .from('transcripts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user owns this transcript
      .single();

    if (error || !transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error(`Error in GET /api/transcripts/${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete a transcript
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
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

    // Delete transcript (user ownership checked in query)
    const { error } = await supabaseAdmin
      .from('transcripts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete transcript: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error in DELETE /api/transcripts/${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

