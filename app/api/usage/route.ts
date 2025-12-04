import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase';
import { calculateUsageStats, USAGE_TIERS } from '@/lib/usageTracker';
import { validateRequest, recordUsageSchema, ValidationError } from '@/lib/validation';

/**
 * Get usage statistics for current month
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

    // Get current month start date
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get usage records for current month
    const { data: records, error } = await supabaseAdmin
      .from('usage_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monthStart.toISOString())
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch usage records: ${error.message}`);
    }

    // Calculate total minutes used
    const totalMinutes = (records || []).reduce(
      (sum, record) => sum + record.minutes,
      0
    );

    // Get user tier (for now, everyone is on free tier)
    const tier = USAGE_TIERS.free;

    // Calculate stats
    const stats = calculateUsageStats(totalMinutes, tier);

    return NextResponse.json({
      stats,
      records: records || [],
      tier,
      monthStart: monthStart.toISOString(),
    });
  } catch (error: any) {
    console.error('Error in GET /api/usage:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Record usage for a session
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
    const validatedData = validateRequest(recordUsageSchema, body);

    // Record usage
    const { data: record, error } = await supabaseAdmin
      .from('usage_records')
      .insert({
        user_id: user.id,
        minutes: validatedData.minutes,
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record usage: ${error.message}`);
    }

    return NextResponse.json({ record }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.errors },
        { status: error.statusCode }
      );
    }
    console.error('Error in POST /api/usage:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

