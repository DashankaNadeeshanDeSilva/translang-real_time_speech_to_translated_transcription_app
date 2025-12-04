import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * Provides both admin (server-side) and client-side Supabase clients.
 * - supabaseAdmin: Uses service role key, bypasses RLS (server-side only)
 * - supabase: Uses anon key, respects RLS (client-side safe)
 */

// Use placeholder values during build if env vars are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-service-key';

// Warn if using placeholders (but allow build to continue)
if (process.env.NODE_ENV === 'production' && supabaseUrl.includes('placeholder')) {
  console.warn('⚠️  WARNING: Using placeholder Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
}

/**
 * Server-side Supabase client (Admin)
 * Uses service role key - bypasses Row Level Security
 * ONLY use this in API routes and server components
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Client-side Supabase client
 * Uses anon key - respects Row Level Security
 * Safe to use in browser/client components
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Database Types
 * These match the schema defined in Supabase
 */

export interface User {
  id: string;
  auth0_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  source_language: string;
  vad_enabled: boolean;
  silence_threshold: number;
  sentence_mode: boolean;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: string;
  user_id: string;
  title: string | null;
  source_language: string;
  translations: TranscriptLine[];
  source: TranscriptLine[];
  duration_ms: number;
  created_at: string;
}

export interface TranscriptLine {
  id: string;
  text: string;
  timestamp: number;
  speaker?: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  minutes: number;
  date: string;
}

/**
 * Helper function to get or create user from Auth0 session
 */
export async function getOrCreateUser(auth0User: { sub: string; email?: string; name?: string; picture?: string }): Promise<User> {
  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('auth0_id', auth0User.sub)
    .single();

  if (existingUser && !fetchError) {
    return existingUser;
  }

  // Create new user
  const { data: newUser, error: createError } = await supabaseAdmin
    .from('users')
    .insert({
      auth0_id: auth0User.sub,
      email: auth0User.email || '',
      name: auth0User.name || null,
      avatar_url: auth0User.picture || null,
    })
    .select()
    .single();

  if (createError || !newUser) {
    throw new Error(`Failed to create user: ${createError?.message}`);
  }

  // Create default settings for new user
  await supabaseAdmin
    .from('user_settings')
    .insert({
      user_id: newUser.id,
      source_language: 'de',
      vad_enabled: true,
      silence_threshold: 800,
      sentence_mode: false,
      theme: 'system',
    });

  return newUser;
}

