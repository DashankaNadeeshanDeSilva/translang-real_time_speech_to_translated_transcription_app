import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

/**
 * Auth0 Route Handler
 * 
 * In Auth0 v4, the middleware handles all auth routes automatically.
 * This catch-all route delegates to the auth0.middleware() function.
 * 
 * Handles all Auth0 authentication routes:
 * - /api/auth/login - Login
 * - /api/auth/logout - Logout  
 * - /api/auth/callback - Auth callback
 * - /api/auth/profile - Get user profile
 */

export async function GET(req: NextRequest) {
  return auth0.middleware(req);
}

export async function POST(req: NextRequest) {
  return auth0.middleware(req);
}
