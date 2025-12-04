# TransLang MVP Transformation Plan

## Executive Summary

Transform TransLang from a functional prototype into a production-ready MVP with user authentication (Auth0), usage tracking, and proper production infrastructure.

---

## 1. Current State Analysis

### ✅ What's Already Working

| Component | Status | Notes |
|-----------|--------|-------|
| Real-time Speech Translation | ✅ Complete | Soniox API integration |
| Voice Activity Detection | ✅ Complete | @echogarden/fvad-wasm |
| Multi-speaker Diarization | ✅ Complete | Speaker labels working |
| Export (PDF/Text) | ✅ Complete | Multiple formats |
| Error Handling & Retry | ✅ Complete | Exponential backoff |
| WebSocket Streaming | ✅ Complete | Real-time token updates |
| Docker Container | ✅ Complete | Multi-stage build |
| AWS Deployment Guides | ✅ Complete | ECS Fargate documented |
| Health Check Endpoint | ✅ Complete | `/api/health` |
| Dark/Light Theme | ✅ Complete | System preference aware |
| Modern UI | ✅ Complete | Shadcn/UI components |

### ❌ What's Missing for Production MVP

| Component | Priority | Effort |
|-----------|----------|--------|
| User Authentication (Auth0) | 🔴 Critical | Medium |
| Protected API Routes | 🔴 Critical | Low |
| Database (Postgres/Supabase) | 🔴 Critical | Medium |
| User Settings Persistence | 🟠 High | Low |
| Transcript History | 🟠 High | Medium |
| Usage Tracking & Limits | 🟠 High | Medium |
| Landing Page | 🟠 High | Medium |
| Rate Limiting | 🟡 Medium | Low |
| Analytics Integration | 🟡 Medium | Low |
| Billing/Stripe Integration | 🟢 Post-MVP | High |

---

## 2. Architecture Overview

### Current Architecture
```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌─────────────┐  ┌──────────────────────────┐ │
│  │ Microphone  │→ │ Next.js App              │ │
│  └─────────────┘  │ - TranslatorControls     │ │
│                   │ - ChatThread              │ │
│                   │ - useTranslator hook      │ │
│                   └──────────────────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │ WebSocket + API calls
                      ▼
┌─────────────────────────────────────────────────┐
│              Next.js API Routes                  │
│  - /api/soniox-temp-key (UNPROTECTED!)         │
│  - /api/health                                  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              Soniox API (External)               │
└─────────────────────────────────────────────────┘
```

### Target MVP Architecture
```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌───────────────────────────────────────────┐ │
│  │        Landing Page (Public)               │ │
│  │  - Hero, Features, Pricing, CTA           │ │
│  └───────────────────────────────────────────┘ │
│                      │ Login/Signup             │
│                      ▼                          │
│  ┌───────────────────────────────────────────┐ │
│  │     Auth0 Universal Login                  │ │
│  └───────────────────────────────────────────┘ │
│                      │ Authenticated            │
│                      ▼                          │
│  ┌───────────────────────────────────────────┐ │
│  │      Dashboard (Protected)                 │ │
│  │  - Translation Interface                   │ │
│  │  - Transcript History                      │ │
│  │  - Settings                                │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│          Protected Next.js API Routes            │
│  ┌───────────────────────────────────────────┐ │
│  │   Auth0 Middleware (Verify JWT)           │ │
│  └───────────────────────────────────────────┘ │
│  - /api/auth/* (Auth0 handlers)               │
│  - /api/soniox-temp-key (PROTECTED)           │
│  - /api/transcripts/* (CRUD)                  │
│  - /api/usage/* (Track usage)                 │
└─────────────────────┬───────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   Database   │ │ Soniox   │ │ Auth0        │
│  (Supabase)  │ │   API    │ │ (Identity)   │
│              │ │          │ │              │
│ - Users      │ └──────────┘ └──────────────┘
│ - Transcripts│
│ - Usage      │
│ - Settings   │
└──────────────┘
```

---

## 3. MVP Feature Scope

### In Scope (MVP)
1. **User Authentication**
   - Auth0 signup/login (email, Google, GitHub)
   - Protected routes and API endpoints
   - User profile management

2. **Core Translation Features**
   - All existing translation functionality
   - Save transcripts to user account
   - View transcript history
   - Persist user preferences

3. **Usage Management**
   - Track minutes used per user
   - Basic usage limits (e.g., 60 mins/month free)
   - Usage dashboard

4. **Landing Page**
   - Hero section with demo video/GIF
   - Feature highlights
   - Pricing tiers
   - Call-to-action buttons

5. **Basic Analytics**
   - User registration events
   - Translation session events
   - Error tracking

### Out of Scope (Post-MVP)
- Team/organization accounts
- Real-time collaboration
- Stripe billing integration
- Custom vocabulary training
- API access for developers
- Mobile apps

---

## 4. Technology Stack

### Current Stack (Keep)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **UI**: React 18 + Shadcn/UI + Tailwind
- **Speech**: Soniox API
- **Deployment**: AWS ECS Fargate

### New Additions
| Technology | Purpose | Why |
|------------|---------|-----|
| **Auth0** | Authentication | Enterprise-grade, easy setup, social logins |
| **Supabase** | Database | Postgres + real-time + easy setup + built-in client |
| **Vercel Analytics** | Analytics | Simple, privacy-focused |

---

## 5. Implementation Phases

### Phase 1: Auth0 Integration (3-4 days)
**Goal**: Add user authentication to protect the application

#### Tasks:
1. **Auth0 Setup**
   - Create Auth0 tenant and application
   - Configure social connections (Google, GitHub)
   - Set up environment variables

2. **Next.js Auth0 Integration**
   - Install `@auth0/nextjs-auth0`
   - Create auth API routes (`/api/auth/[auth0]`)
   - Add `UserProvider` to layout

3. **Protect Routes**
   - Create auth middleware
   - Protect `/dashboard` route
   - Protect `/api/soniox-temp-key` endpoint

4. **User Context**
   - Create user context/hook
   - Display user info in header
   - Add logout functionality

#### Files to Create/Modify:
```
app/
  api/
    auth/
      [auth0]/
        route.ts          # Auth0 handlers
  layout.tsx              # Add UserProvider
  page.tsx               # Landing page
  dashboard/
    layout.tsx           # Protected layout
    page.tsx             # Existing app (rename)
lib/
  auth.ts                # Auth utilities
middleware.ts            # Route protection
```

#### Environment Variables:
```env
AUTH0_SECRET=           # Random 32-byte string
AUTH0_BASE_URL=         # http://localhost:3000 or production URL
AUTH0_ISSUER_BASE_URL=  # https://your-tenant.auth0.com
AUTH0_CLIENT_ID=        # From Auth0 dashboard
AUTH0_CLIENT_SECRET=    # From Auth0 dashboard
```

---

### Phase 2: Database Setup (2-3 days)
**Goal**: Add database for user data, transcripts, and usage tracking

**Note**: Using Supabase's built-in client instead of Prisma for simplicity. Supabase provides type-safe queries, real-time capabilities, and easier setup for MVP.

#### Tasks:
1. **Supabase Project Setup**
   - Create Supabase project
   - Get API keys (anon key, service role key)
   - Configure environment variables
   - Set up Row Level Security (RLS) policies

2. **Database Schema**
   - Create tables using Supabase SQL Editor or migrations
   - Set up foreign key relationships
   - Configure RLS policies for data security
   - Create indexes for performance

3. **Supabase Client Setup**
   - Install `@supabase/supabase-js`
   - Create Supabase client utility
   - Set up TypeScript types (optional, using Supabase CLI)

4. **API Routes**
   - `/api/transcripts` - CRUD operations using Supabase client
   - `/api/usage` - Usage tracking
   - `/api/users/settings` - User preferences

5. **Sync Auth0 Users**
   - Create user on first login
   - Store user preferences

#### Database Schema (SQL):
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_language TEXT DEFAULT 'de',
  vad_enabled BOOLEAN DEFAULT true,
  silence_threshold INTEGER DEFAULT 800,
  sentence_mode BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  source_language TEXT NOT NULL,
  translations JSONB NOT NULL, -- Array of TranscriptLine
  source JSONB NOT NULL,        -- Array of TranscriptLine
  duration_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage records table
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minutes DOUBLE PRECISION NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX idx_transcripts_created_at ON transcripts(created_at DESC);
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_date ON usage_records(date DESC);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
-- Note: These policies use auth.uid() which requires Supabase Auth
-- Since we're using Auth0, we'll handle authorization in API routes instead
-- RLS can still be enabled for defense in depth
```

#### Supabase Client Example:
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Server-side client (uses service key, bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Client-side client (uses anon key, respects RLS)
export const supabase = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

### Phase 3: Transcript History (2 days)
**Goal**: Allow users to save and view past transcripts

#### Tasks:
1. **Save Transcript**
   - Add "Save" button to translation UI
   - API endpoint to create transcript
   - Show success notification

2. **Transcript List**
   - Create `/dashboard/transcripts` page
   - List all user transcripts
   - Search and filter

3. **View Transcript**
   - Create `/dashboard/transcripts/[id]` page
   - Display saved transcript
   - Re-export functionality

4. **Delete Transcript**
   - Add delete button
   - Confirmation dialog
   - API endpoint

---

### Phase 4: Usage Tracking (2 days)
**Goal**: Track user usage and enforce limits

#### Tasks:
1. **Track Usage**
   - Record translation session duration
   - Calculate minutes used
   - Store in database

2. **Usage Dashboard**
   - Show minutes used this month
   - Progress bar for limit
   - Usage history chart

3. **Enforce Limits**
   - Check usage before starting session
   - Show upgrade prompt when limit reached
   - Grace period handling

4. **Usage Tiers**
   - Free: 60 minutes/month
   - Pro: 600 minutes/month (future)
   - Unlimited (future)

---

### Phase 5: Landing Page (2-3 days)
**Goal**: Create a marketing landing page

#### Tasks:
1. **Hero Section**
   - Compelling headline
   - Animated demo GIF/video
   - CTA button (Start Free)

2. **Features Section**
   - Real-time translation
   - Multi-speaker detection
   - Export options
   - Languages supported

3. **Pricing Section**
   - Free tier details
   - Pro tier (coming soon)
   - Enterprise (contact us)

4. **Footer**
   - Links (Privacy, Terms, Contact)
   - Social links
   - Copyright

#### Design Notes:
- Modern, distinctive aesthetic (not generic AI slop)
- Use unique typography (e.g., DM Sans, Space Grotesk)
- Gradient accents consistent with app theme
- Motion/animations for engagement

---

### Phase 6: Production Hardening (2 days)
**Goal**: Security and reliability improvements

#### Tasks:
1. **Rate Limiting**
   - Install `@upstash/ratelimit`
   - Limit API requests per user
   - Limit translation sessions

2. **Input Validation**
   - Validate all API inputs with Zod
   - Sanitize user content
   - Error boundary components

3. **Security Headers**
   - Configure CSP
   - Add security headers in next.config.js
   - CORS configuration

4. **Error Tracking**
   - Integrate Sentry (optional)
   - Structured logging
   - Error notifications

5. **Environment Configuration**
   - Production environment variables
   - Secrets management
   - Environment validation

---

## 6. File Structure (Target)

```
app/
  (public)/              # Public routes (no auth)
    page.tsx             # Landing page
    privacy/page.tsx     # Privacy policy
    terms/page.tsx       # Terms of service
    
  (protected)/           # Protected routes (require auth)
    layout.tsx           # Auth check wrapper
    dashboard/
      page.tsx           # Main translation app
      transcripts/
        page.tsx         # Transcript history
        [id]/page.tsx    # View transcript
      settings/
        page.tsx         # User settings
      usage/
        page.tsx         # Usage dashboard
        
  api/
    auth/
      [auth0]/route.ts   # Auth0 handlers
    soniox-temp-key/
      route.ts           # Protected - get Soniox key
    transcripts/
      route.ts           # GET (list), POST (create)
      [id]/route.ts      # GET, DELETE
    usage/
      route.ts           # GET usage stats
    users/
      settings/route.ts  # GET, PUT user settings
    health/
      route.ts           # Health check (unchanged)
      
  layout.tsx             # Root layout with providers
  globals.css
  
components/
  (existing components)
  landing/
    Hero.tsx
    Features.tsx
    Pricing.tsx
    Footer.tsx
  dashboard/
    TranscriptList.tsx
    UsageChart.tsx
    SaveTranscriptButton.tsx
  auth/
    LoginButton.tsx
    UserMenu.tsx
    
lib/
  auth.ts               # Auth utilities
  supabase.ts           # Supabase client
  usage.ts              # Usage tracking utilities
  
middleware.ts           # Route protection
```

---

## 7. Environment Variables (Complete)

```env
# Existing
SONIOX_SECRET_KEY=your_soniox_key

# Auth0
AUTH0_SECRET=use_a_random_32_byte_string
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 8. Deployment Updates

### New AWS Resources Needed:
1. **RDS or Supabase** (Database)
   - Supabase recommended (managed, free tier)
   
2. **Secrets Manager Updates**
   - Add Auth0 secrets
   - Add Supabase service key

### Environment Variables in ECS:
```json
{
  "secrets": [
    {"name": "SONIOX_SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:..."},
    {"name": "AUTH0_SECRET", "valueFrom": "arn:aws:secretsmanager:..."},
    {"name": "AUTH0_CLIENT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."},
    {"name": "SUPABASE_SERVICE_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
  ],
  "environment": [
    {"name": "AUTH0_BASE_URL", "value": "https://your-domain.com"},
    {"name": "AUTH0_ISSUER_BASE_URL", "value": "https://your-tenant.auth0.com"},
    {"name": "AUTH0_CLIENT_ID", "value": "your_client_id"},
    {"name": "NEXT_PUBLIC_SUPABASE_URL", "value": "https://your-project.supabase.co"},
    {"name": "NEXT_PUBLIC_SUPABASE_ANON_KEY", "value": "your_anon_key"}
  ]
}
```

---

## 9. Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Auth0 | 3-4 days | None |
| Phase 2: Database | 2-3 days | Phase 1 |
| Phase 3: Transcripts | 2 days | Phase 2 |
| Phase 4: Usage Tracking | 2 days | Phase 2 |
| Phase 5: Landing Page | 2-3 days | Phase 1 |
| Phase 6: Hardening | 2 days | Phase 1-5 |
| Testing & Deployment | 2-3 days | All phases |

**Total: ~2-3 weeks** (working full-time)

---

## 10. Success Metrics

### MVP Launch Criteria:
- [ ] Users can sign up and log in
- [ ] Translation works for authenticated users
- [ ] Transcripts can be saved and viewed
- [ ] Usage is tracked per user
- [ ] Landing page is live
- [ ] Deployed to production

### Post-Launch Metrics:
- User signups per week
- Active users (DAU/MAU)
- Minutes translated per user
- Transcript save rate
- User retention (7-day, 30-day)

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Auth0 rate limits | Medium | Use caching, optimize flows |
| Database costs | Low | Supabase free tier (500MB) |
| Soniox API limits | High | Track usage, implement quotas |
| Scope creep | High | Strict MVP scope, defer features |

---

## 12. Post-MVP Roadmap

### V1.1 (1 month after MVP)
- Stripe billing integration
- Pro tier ($15/month)
- Extended history retention

### V1.2 (2 months)
- Team accounts
- Shared transcripts
- Admin dashboard

### V2.0 (Future)
- Mobile app (React Native)
- API access for developers
- Custom vocabulary
- Additional languages

---

## Next Steps

1. **Create Auth0 Account** - Set up tenant and application
2. **Create Supabase Project** - Set up database and get API keys
3. **Begin Phase 1** - Auth0 integration

Ready to start implementation? Begin with Phase 1: Auth0 Integration.

