/**
 * Input Validation Schemas
 * 
 * Zod schemas for validating API request bodies and query parameters.
 * Prevents injection attacks and ensures data integrity.
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
const uuidSchema = z.string().uuid('Invalid UUID format');
const emailSchema = z.string().email('Invalid email address');
const positiveNumberSchema = z.number().positive('Must be positive');
const nonEmptyStringSchema = z.string().min(1, 'Cannot be empty').trim();

/**
 * Transcript validation schemas
 */
export const transcriptLineSchema = z.object({
  id: z.string(),
  text: nonEmptyStringSchema.max(10000, 'Text too long'),
  timestamp: z.number().int().nonnegative('Invalid timestamp'),
  speaker: z.string().optional(),
});

export const createTranscriptSchema = z.object({
  title: z.string().max(200, 'Title too long').optional(),
  source_language: z.string().min(2, 'Invalid language code').max(10, 'Invalid language code'),
  translations: z.array(transcriptLineSchema).min(1, 'Must have at least one translation'),
  source: z.array(transcriptLineSchema).min(1, 'Must have at least one source line'),
  duration_ms: z.number().int().min(0, 'Invalid duration').max(86400000, 'Duration too long (max 24 hours)'),
});

export const transcriptQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Usage validation schemas
 */
export const recordUsageSchema = z.object({
  minutes: positiveNumberSchema.max(1440, 'Session too long (max 24 hours)'),
});

/**
 * User settings validation schemas
 */
export const updateSettingsSchema = z.object({
  source_language: z.string().min(2).max(10).optional(),
  vad_enabled: z.boolean().optional(),
  silence_threshold: z.number().int().min(100).max(5000).optional(),
  sentence_mode: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

/**
 * Environment validation schema
 */
export const envSchema = z.object({
  // Required
  NODE_ENV: z.enum(['development', 'production', 'test']),
  SONIOX_SECRET_KEY: nonEmptyStringSchema,
  
  // Auth0 (required in production)
  AUTH0_DOMAIN: z.string().optional(),
  AUTH0_CLIENT_ID: z.string().optional(),
  AUTH0_CLIENT_SECRET: z.string().optional(),
  AUTH0_SECRET: z.string().optional(),
  APP_BASE_URL: z.string().url().optional(),
  
  // Supabase (required in production)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
});

/**
 * Validation helper function
 * Throws detailed error with field-level messages
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      throw new ValidationError(
        'Validation failed',
        formattedErrors
      );
    }
    throw error;
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly errors: Array<{ field: string; message: string }>;
  public readonly statusCode = 400;

  constructor(message: string, errors: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Sanitize user input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizeObject(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

