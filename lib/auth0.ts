import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Auth0 Client Instance
 * 
 * This is the main Auth0 client used throughout the application.
 * It handles authentication, session management, and route protection.
 */
export const auth0 = new Auth0Client();

/**
 * User type from Auth0
 */
export interface AuthUser {
  sub: string;           // Auth0 user ID
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  updated_at?: string;
}

