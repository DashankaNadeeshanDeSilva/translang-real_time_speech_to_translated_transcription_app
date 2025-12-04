/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables on application startup.
 * Prevents runtime errors due to missing configuration.
 */

import { z } from 'zod';
import { logger } from './logger';

/**
 * Environment validation schema
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Required API keys
  SONIOX_SECRET_KEY: z.string().min(1, 'SONIOX_SECRET_KEY is required'),

  // Auth0 configuration (required in production)
  AUTH0_DOMAIN: z.string().optional(),
  AUTH0_CLIENT_ID: z.string().optional(),
  AUTH0_CLIENT_SECRET: z.string().optional(),
  AUTH0_SECRET: z.string().optional(),
  APP_BASE_URL: z.string().url().optional(),

  // Supabase configuration (required in production)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  // Optional configuration
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Validate environment variables
 */
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);

    // Additional production checks
    if (env.NODE_ENV === 'production') {
      const missingVars: string[] = [];

      if (!env.AUTH0_DOMAIN) missingVars.push('AUTH0_DOMAIN');
      if (!env.AUTH0_CLIENT_ID) missingVars.push('AUTH0_CLIENT_ID');
      if (!env.AUTH0_CLIENT_SECRET) missingVars.push('AUTH0_CLIENT_SECRET');
      if (!env.AUTH0_SECRET) missingVars.push('AUTH0_SECRET');
      if (!env.APP_BASE_URL) missingVars.push('APP_BASE_URL');
      if (!env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      if (!env.SUPABASE_SERVICE_KEY) missingVars.push('SUPABASE_SERVICE_KEY');

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required environment variables for production: ${missingVars.join(', ')}`
        );
      }
    }

    logger.info('Environment variables validated successfully', {
      nodeEnv: env.NODE_ENV,
      hasAuth0: !!env.AUTH0_DOMAIN,
      hasSupabase: !!env.NEXT_PUBLIC_SUPABASE_URL,
    });

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      
      logger.error('Environment validation failed', new Error(errorMessages.join(', ')));
      console.error('❌ Environment validation failed:');
      errorMessages.forEach((msg) => console.error(`  - ${msg}`));
      
      // In production, fail hard
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    } else {
      logger.error('Unexpected error during environment validation', error as Error);
      throw error;
    }
  }
}

// Export validated environment
export const env = validateEnv();

/**
 * Check if running in production
 */
export const isProduction = env?.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env?.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = env?.NODE_ENV === 'test';

/**
 * Get app base URL
 */
export function getAppUrl(): string {
  if (env?.APP_BASE_URL) return env.APP_BASE_URL;
  
  // Fallback for development
  return `http://localhost:${env?.PORT || 3000}`;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  const envVar = `FEATURE_${feature.toUpperCase()}`;
  return process.env[envVar] === 'true';
}

