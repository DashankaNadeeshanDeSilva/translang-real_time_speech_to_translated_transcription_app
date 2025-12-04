/**
 * API Route Handler Wrapper
 * 
 * Provides consistent error handling, rate limiting, and logging for API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from './auth0';
import { getOrCreateUser } from './supabase';
import { applyRateLimit, RateLimitError, RATE_LIMITS } from './rateLimit';
import { ValidationError } from './validation';

export interface ApiContext {
  user: {
    id: string;
    auth0_id: string;
    email: string;
  };
  req: NextRequest;
}

type ApiHandler = (context: ApiContext) => Promise<NextResponse>;

interface ApiOptions {
  requireAuth?: boolean;
  rateLimit?: keyof typeof RATE_LIMITS;
  allowAnonymous?: boolean;
}

/**
 * Wrap API route handler with common functionality
 */
export function withApiHandler(
  handler: ApiHandler,
  options: ApiOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  const {
    requireAuth = true,
    rateLimit = 'api',
    allowAnonymous = false,
  } = options;

  return async (req: NextRequest) => {
    const startTime = Date.now();
    const route = new URL(req.url).pathname;

    try {
      // 1. Authentication
      let user = null;
      if (requireAuth || !allowAnonymous) {
        const session = await auth0.getSession();

        if (!session?.user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        // Get/create user in database
        user = await getOrCreateUser({
          sub: session.user.sub,
          email: session.user.email,
          name: session.user.name,
          picture: session.user.picture,
        });
      }

      // 2. Rate Limiting
      if (rateLimit) {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
        await applyRateLimit(user?.id || null, ip, route, rateLimit);
      }

      // 3. Execute handler
      const response = await handler({ user: user!, req });

      // 4. Add headers
      const duration = Date.now() - startTime;
      response.headers.set('X-Response-Time', `${duration}ms`);

      return response;

    } catch (error: any) {
      // Error handling
      console.error(`[API Error] ${route}:`, error);

      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message, details: error.errors },
          { status: error.statusCode }
        );
      }

      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { 
            error: error.message,
            retryAfter: Math.ceil((error.reset - Date.now()) / 1000),
          },
          { 
            status: error.statusCode,
            headers: {
              'Retry-After': String(Math.ceil((error.reset - Date.now()) / 1000)),
            },
          }
        );
      }

      // Generic error
      const isDevelopment = process.env.NODE_ENV === 'development';
      return NextResponse.json(
        { 
          error: isDevelopment ? error.message : 'Internal server error',
          ...(isDevelopment && { stack: error.stack }),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Error response helper
 */
export function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

