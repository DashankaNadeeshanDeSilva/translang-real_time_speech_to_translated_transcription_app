# TransLang - Product Overview & Setup Guide

**Version**: 1.0.0 MVP  
**Last Updated**: December 4, 2025  
**Status**: Production Ready ✅

---

## What is TransLang?

TransLang is a **real-time speech translation web application** that converts spoken language into text and translates it to English instantly. Think of it as "live subtitles + translation" for meetings, interviews, and conversations.

### Core Value Proposition

- **Real-time**: Translations appear as you speak (< 500ms latency)
- **Multi-speaker**: Automatically detects and labels different speakers
- **Accurate**: Powered by Soniox AI for professional-grade transcription
- **Persistent**: Save transcripts and access history
- **Usage-controlled**: Track usage with monthly limits (60 min free)

---

## How It Works (User Flow)

```
1. Visit translang.app
   ↓
2. Click "Start Translating Free"
   ↓
3. Sign in with Google/Email (Auth0)
   ↓
4. Click "Start Translation" in dashboard
   ↓
5. Speak in German/Spanish/etc.
   ↓
6. See real-time English translation
   ↓
7. Save transcript for later
   ↓
8. Export as PDF/Text
```

---

## Technical Architecture

### Stack

**Frontend**:
- Next.js 14 (App Router) + React 18
- TypeScript 5
- Tailwind CSS + Shadcn/UI
- Soniox Web SDK (WebSocket)

**Backend**:
- Next.js API Routes
- Auth0 (authentication)
- Supabase (PostgreSQL database)
- Zod (validation)

**Infrastructure**:
- Docker (containerization)
- AWS ECS Fargate (deployment)
- AWS Secrets Manager (secrets)

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│              Browser                     │
│  ┌─────────────────────────────────┐   │
│  │  Landing Page (Public)          │   │
│  │  - Hero, Features, Pricing      │   │
│  └─────────────────────────────────┘   │
│              │ Login                    │
│              ↓                          │
│  ┌─────────────────────────────────┐   │
│  │  Dashboard (Protected)          │   │
│  │  - Translation Interface         │   │
│  │  - Transcript History            │   │
│  │  - Usage Dashboard               │   │
│  └─────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │ API Calls
                   ↓
┌─────────────────────────────────────────┐
│        Next.js API Routes               │
│  ┌──────────────────────────────────┐  │
│  │  Auth0 Middleware                │  │
│  │  (Protects all routes)           │  │
│  └──────────────────────────────────┘  │
│  - /api/auth/* (Auth0 handlers)       │
│  - /api/soniox-temp-key (Protected)   │
│  - /api/transcripts (CRUD)            │
│  - /api/usage (Tracking)              │
└──────────┬───────────┬──────────────────┘
           │           │
           ↓           ↓
  ┌────────────┐  ┌─────────────┐
  │  Supabase  │  │  Soniox API │
  │ (Database) │  │ (Speech AI) │
  └────────────┘  └─────────────┘
```

---

## Database Schema

### Tables

**1. users** - User accounts (synced from Auth0)
```sql
id          UUID PRIMARY KEY
auth0_id    TEXT UNIQUE         -- Auth0 user ID
email       TEXT UNIQUE
name        TEXT
avatar_url  TEXT
created_at  TIMESTAMPTZ
```

**2. user_settings** - User preferences
```sql
user_id             UUID REFERENCES users
source_language     TEXT (default: 'de')
vad_enabled         BOOLEAN (default: true)
silence_threshold   INTEGER (default: 800ms)
sentence_mode       BOOLEAN (default: false)
theme               TEXT (default: 'system')
```

**3. transcripts** - Saved translations
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users
title           TEXT
source_language TEXT
translations    JSONB    -- Array of transcript lines
source          JSONB    -- Original language lines
duration_ms     INTEGER
created_at      TIMESTAMPTZ
```

**4. usage_records** - Usage tracking
```sql
id       UUID PRIMARY KEY
user_id  UUID REFERENCES users
minutes  DOUBLE PRECISION   -- Session duration
date     TIMESTAMPTZ        -- When session occurred
```

---

## Key Features Implemented

### 1. Authentication & Authorization

- **Auth0 Integration**: Social login (Google, GitHub) + email/password
- **Protected Routes**: Middleware guards `/dashboard/*` and API routes
- **User Context**: Available throughout app via `useUser()` hook
- **Session Management**: Secure token-based authentication

**Files**:
- `lib/auth0.ts` - Auth0 client configuration
- `middleware.ts` - Route protection
- `app/api/auth/[auth0]/route.ts` - Auth handlers

### 2. Real-Time Translation

- **WebSocket Connection**: Persistent connection to Soniox
- **Voice Activity Detection (VAD)**: Auto-detects speech start/end
- **Streaming Results**: Token-by-token translation display
- **Multi-Speaker Diarization**: Labels speakers automatically
- **Pause/Resume**: Control recording without losing connection

**Files**:
- `hooks/useTranslator.ts` - Main translation logic (1000+ lines)
- `components/TranslatorControls.tsx` - UI controls
- `components/StreamingTranscriptDisplay.tsx` - Real-time display

### 3. Transcript Management

- **Save Transcripts**: Store complete translation sessions
- **List View**: Browse all saved transcripts with metadata
- **Detail View**: Read full transcript with speaker labels
- **Export**: Download as Text or JSON
- **Delete**: Remove unwanted transcripts

**Files**:
- `app/dashboard/transcripts/page.tsx` - List view
- `app/dashboard/transcripts/[id]/page.tsx` - Detail view
- `components/dashboard/SaveTranscriptButton.tsx` - Save dialog
- `app/api/transcripts/route.ts` - API endpoints

### 4. Usage Tracking

- **Session Tracking**: Automatic recording of translation duration
- **Monthly Limits**: 60 minutes free, 600 Pro, Unlimited tiers
- **Usage Dashboard**: Visual progress and history
- **Limit Enforcement**: Blocks sessions when limit reached
- **Warnings**: Alert at 80% usage

**Files**:
- `lib/usageTracker.ts` - Session tracker class
- `app/dashboard/usage/page.tsx` - Usage dashboard
- `components/dashboard/UsageIndicator.tsx` - Header indicator
- `app/api/usage/route.ts` - API endpoints

### 5. Landing Page

- **Hero Section**: Compelling headline + CTA
- **Features**: 6 key features with icons
- **Pricing**: 3 tiers (Free, Pro, Unlimited)
- **How It Works**: 3-step process
- **Footer**: Links and branding

**Files**:
- `app/page.tsx` - Landing page entry
- `components/landing/Hero.tsx`
- `components/landing/Features.tsx`
- `components/landing/Pricing.tsx`
- `components/landing/CTA.tsx`
- `components/landing/Footer.tsx`

### 6. Security & Production Hardening

- **Input Validation**: Zod schemas on all API inputs
- **Rate Limiting**: Prevents abuse (60 req/min)
- **Security Headers**: 7 headers including CSP
- **Error Boundaries**: Graceful UI failure handling
- **Logging**: Structured logs for debugging
- **Environment Validation**: Fails fast on misconfiguration

**Files**:
- `lib/validation.ts` - Zod schemas
- `lib/rateLimit.ts` - Rate limiter
- `lib/apiHandler.ts` - Consistent API wrapper
- `lib/logger.ts` - Logging utility
- `lib/env.ts` - Environment validation
- `components/ErrorBoundary.tsx` - Error boundary
- `next.config.js` - Security headers

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Auth0 account
- Supabase account
- Soniox API key

### 1. Clone & Install

```bash
git clone <repository-url>
cd translang-real_time_speech_to_translated_transcription_app
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Soniox (Speech AI)
SONIOX_SECRET_KEY=your_soniox_api_key

# Auth0 (Authentication)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_SECRET=generate_with_openssl_rand_hex_32
APP_BASE_URL=http://localhost:3000

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
```

**Generate Auth0 Secret**:
```bash
openssl rand -hex 32
```

### 3. Auth0 Configuration

1. Create Auth0 Application (Regular Web Application)
2. Configure URLs in Auth0 dashboard:
   - Callback: `http://localhost:3000/api/auth/callback`
   - Logout: `http://localhost:3000`
   - Web Origins: `http://localhost:3000`
3. Enable Google/GitHub social connections (optional)

### 4. Supabase Setup

1. Create Supabase project
2. Run schema from `supabase-schema.sql` in SQL Editor
3. Copy API keys from Settings → API

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Build for Production

```bash
npm run build
npm start
```

Or using Docker:

```bash
docker build -t translang .
docker run -p 3000:3000 --env-file .env.local translang
```

---

## Project Structure

```
translang/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes (backend)
│   │   ├── auth/               # Auth0 handlers
│   │   ├── transcripts/        # Transcript CRUD
│   │   ├── usage/              # Usage tracking
│   │   └── users/              # User management
│   ├── dashboard/              # Protected pages
│   │   ├── transcripts/        # Transcript history
│   │   └── usage/              # Usage dashboard
│   ├── page.tsx                # Landing page (public)
│   └── layout.tsx              # Root layout
│
├── components/                 # React components
│   ├── landing/                # Landing page sections
│   ├── dashboard/              # Dashboard components
│   ├── auth/                   # Auth components
│   └── ui/                     # Shadcn UI primitives
│
├── lib/                        # Utilities & logic
│   ├── auth0.ts                # Auth0 client
│   ├── supabase.ts             # Database client
│   ├── usageTracker.ts         # Session tracking
│   ├── validation.ts           # Input validation
│   ├── rateLimit.ts            # Rate limiting
│   ├── logger.ts               # Logging
│   └── env.ts                  # Environment validation
│
├── hooks/                      # React hooks
│   └── useTranslator.ts        # Main translation hook
│
├── deployment/                 # AWS deployment guides
├── supabase-schema.sql         # Database schema
├── middleware.ts               # Route protection
└── Dockerfile                  # Docker configuration
```

---

## Important Files to Understand

### Core Logic

1. **`hooks/useTranslator.ts`** (1000+ lines)
   - Manages entire translation lifecycle
   - Handles WebSocket, VAD, streaming, error recovery
   - **Key Functions**:
     - `startTranslation()` - Initiates session
     - `stopTranslation()` - Ends session, records usage
     - `handleStreamingTokens()` - Processes real-time results

2. **`lib/supabase.ts`**
   - Database client initialization
   - `getOrCreateUser()` - Syncs Auth0 users
   - Admin client (bypasses RLS) vs public client

3. **`lib/usageTracker.ts`**
   - `SessionTracker` class for accurate timing
   - Excludes paused time from usage
   - Exports utilities: `msToMinutes()`, tier constants

### API Routes

1. **`app/api/auth/[auth0]/route.ts`**
   - Auth0 dynamic route handler
   - Handles login, logout, callback

2. **`app/api/transcripts/route.ts`**
   - GET: List user transcripts (with pagination)
   - POST: Create new transcript

3. **`app/api/usage/route.ts`**
   - GET: Monthly usage stats
   - POST: Record session usage

### UI Components

1. **`components/TranslatorControls.tsx`**
   - Main translation interface
   - Start/Stop/Pause controls
   - Settings panel
   - Export functionality

2. **`components/StreamingTranscriptDisplay.tsx`**
   - Real-time translation display
   - Chat-style message rendering
   - Auto-scroll with user override

3. **`components/dashboard/UsageDashboard.tsx`**
   - Monthly usage visualization
   - Session history
   - Progress bars and stats

---

## Configuration Files

### `middleware.ts` - Route Protection

```typescript
export default auth0.middleware();

export const config = {
  matcher: [
    '/dashboard/:path*',    // Protect dashboard
    '/api/soniox-temp-key', // Protect Soniox key
    '/api/transcripts/:path*',
    '/api/usage/:path*',
    // ... other protected routes
  ],
};
```

### `next.config.js` - Security Headers

Configures 7 security headers:
- Content Security Policy (CSP)
- X-Frame-Options (DENY)
- X-Content-Type-Options (nosniff)
- Strict-Transport-Security (HSTS)
- Referrer-Policy
- Permissions-Policy
- X-XSS-Protection

### `supabase-schema.sql` - Database

Complete schema with:
- 4 tables (users, user_settings, transcripts, usage_records)
- Foreign key relationships
- Indexes for performance
- Row Level Security (RLS) enabled

---

## Usage Limits & Tiers

| Tier | Minutes/Month | Price | Features |
|------|---------------|-------|----------|
| **Free** | 60 | €0 | All features, 5 transcript history |
| **Pro** | 600 | €15 | Unlimited transcripts, priority support |
| **Unlimited** | ∞ | €49 | Everything + custom vocabulary |

**Enforcement**:
- 80% warning (48 min for free tier)
- 100% hard block (60 min for free tier)
- Resets monthly (calendar month)

---

## API Endpoints

### Public

- `GET /api/health` - Health check

### Protected (Requires Auth)

**Authentication**:
- `GET /api/auth/login` - Redirect to Auth0
- `GET /api/auth/logout` - Logout
- `GET /api/auth/callback` - Auth0 callback

**Translation**:
- `GET /api/soniox-temp-key` - Get temporary Soniox key

**Users**:
- `GET /api/users/me` - Get/create current user
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings

**Transcripts**:
- `GET /api/transcripts` - List transcripts (with pagination)
- `POST /api/transcripts` - Create transcript
- `GET /api/transcripts/[id]` - Get transcript by ID
- `DELETE /api/transcripts/[id]` - Delete transcript

**Usage**:
- `GET /api/usage` - Get monthly usage stats
- `POST /api/usage` - Record usage

---

## Security Features

### Authentication

- Auth0 JWT-based authentication
- Social login (Google, GitHub)
- Session management with secure cookies
- Protected routes via middleware

### Input Validation

- Zod schemas for all API inputs
- Type-safe validation with detailed errors
- XSS prevention via sanitization

### Rate Limiting

- In-memory rate limiter (sliding window)
- 60 requests/minute general limit
- 20 transcript creates/hour
- 10 usage records/minute

### Security Headers

- Content Security Policy (CSP)
- HTTPS enforcement (HSTS)
- Clickjacking prevention
- MIME sniffing prevention

### Error Handling

- Error boundaries catch React errors
- Structured logging for debugging
- User-friendly error messages
- Recovery actions (retry, go home)

---

## Deployment

### Docker

**Build**:
```bash
docker build -t translang .
```

**Run**:
```bash
docker run -p 3000:3000 \
  -e SONIOX_SECRET_KEY=xxx \
  -e AUTH0_DOMAIN=xxx \
  ... \
  translang
```

### AWS ECS Fargate

Complete deployment guides in `/deployment` folder:

1. **`AWS-DEPLOYMENT-GUIDE.md`** - Step-by-step deployment
2. **`AWS-ARCHITECTURE.md`** - Architecture diagrams
3. **`deploy.sh`** - Automated deployment script
4. **`task-definition.template.json`** - ECS task template

**AWS Resources Needed**:
- ECR (Docker registry)
- ECS Cluster + Fargate service
- Application Load Balancer
- Secrets Manager (for secrets)
- CloudWatch (for logs)

---

## Testing

### Manual Testing Checklist

1. **Authentication**:
   - [ ] Sign up with email
   - [ ] Sign up with Google
   - [ ] Log in
   - [ ] Log out
   - [ ] Access protected route while logged out

2. **Translation**:
   - [ ] Start translation session
   - [ ] Speak and verify real-time translation
   - [ ] Pause/resume
   - [ ] Stop session
   - [ ] Export transcript

3. **Transcript History**:
   - [ ] Save transcript
   - [ ] View transcript list
   - [ ] Open transcript detail
   - [ ] Export transcript
   - [ ] Delete transcript

4. **Usage Tracking**:
   - [ ] View usage dashboard
   - [ ] Verify usage recorded after session
   - [ ] Trigger 80% warning
   - [ ] Trigger 100% limit block

5. **Landing Page**:
   - [ ] View on mobile
   - [ ] View on desktop
   - [ ] Click all CTAs
   - [ ] Test navigation

---

## Troubleshooting

### Common Issues

**Build Fails**:
- Check Node.js version (18+)
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Auth0 Login Fails**:
- Verify callback URLs in Auth0 dashboard
- Check `AUTH0_SECRET` is 32-byte hex
- Ensure `APP_BASE_URL` matches current URL

**Database Connection Fails**:
- Verify Supabase URL and keys
- Check network connectivity
- Ensure RLS policies are configured

**Translation Not Working**:
- Verify `SONIOX_SECRET_KEY` is set
- Check browser console for WebSocket errors
- Ensure microphone permissions granted

**Usage Not Recording**:
- Check `usage_records` table exists
- Verify `SessionTracker` is initialized
- Check API endpoint `/api/usage` (POST)

---

## Documentation

### For Setup & Testing
- `Phase-Implementation-Guidance.md` - Complete setup for all phases
- `IMPLEMENTATION-PROGRESS.md` - Progress tracking
- `README.md` - Quick start guide

### For Deployment
- `deployment/AWS-DEPLOYMENT-GUIDE.md` - Step-by-step AWS deployment
- `deployment/QUICK-START.md` - Quick deployment reference
- `Dockerfile` - Container configuration

### For Development
- `MVP-TRANSFORMATION-PLAN.md` - Original plan and architecture
- `MVP-COMPLETION-ANALYSIS.md` - Implementation verification
- Phase-specific summaries (PHASE1-6-SUMMARY.md)

---

## Support & Resources

- **Soniox Docs**: https://docs.soniox.com
- **Auth0 Docs**: https://auth0.com/docs/quickstart/webapp/nextjs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Shadcn/UI**: https://ui.shadcn.com

---

## License

[Your License] - See LICENSE file

---

**Last Updated**: December 4, 2025  
**Version**: 1.0.0 MVP  
**Status**: Production Ready ✅

