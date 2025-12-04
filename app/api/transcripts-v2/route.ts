/**
 * Transcripts API Route (V2 - with new API handler)
 * 
 * Example implementation using the new withApiHandler wrapper.
 * This demonstrates best practices for API routes.
 */

import { NextResponse } from 'next/server';
import { withApiHandler, successResponse, errorResponse } from '@/lib/apiHandler';
import { supabaseAdmin } from '@/lib/supabase';
import { validateRequest, createTranscriptSchema, transcriptQuerySchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

/**
 * GET /api/transcripts-v2
 * List user's transcripts with pagination
 */
export const GET = withApiHandler(
  async ({ user, req }) => {
    const { searchParams } = new URL(req.url);
    const queryParams = validateRequest(transcriptQuerySchema, {
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    logger.info('Fetching transcripts', { 
      userId: user.id, 
      limit: queryParams.limit, 
      offset: queryParams.offset 
    });

    const { data: transcripts, error, count } = await supabaseAdmin
      .from('transcripts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(queryParams.offset, queryParams.offset + queryParams.limit - 1);

    if (error) {
      logger.error('Failed to fetch transcripts', error, { userId: user.id });
      return errorResponse('Failed to fetch transcripts', 500);
    }

    return successResponse({
      transcripts: transcripts || [],
      total: count || 0,
      limit: queryParams.limit,
      offset: queryParams.offset,
    });
  },
  { requireAuth: true, rateLimit: 'api' }
);

/**
 * POST /api/transcripts-v2
 * Create new transcript
 */
export const POST = withApiHandler(
  async ({ user, req }) => {
    const body = await req.json();
    const validatedData = validateRequest(createTranscriptSchema, body);

    logger.info('Creating transcript', { 
      userId: user.id, 
      title: validatedData.title 
    });

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
      logger.error('Failed to create transcript', error, { userId: user.id });
      return errorResponse('Failed to create transcript', 500);
    }

    logger.info('Transcript created successfully', { 
      userId: user.id, 
      transcriptId: transcript.id 
    });

    return successResponse({ transcript }, 201);
  },
  { requireAuth: true, rateLimit: 'transcriptCreate' }
);

