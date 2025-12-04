# Phase Implementation Guidance

This document provides setup instructions and testing guidance for all implemented MVP phases.

---

## Phase 1: Auth0 Integration

### Implementation Overview
Integrated Auth0 for user authentication, protecting the application and API routes. Users must log in to access the translation dashboard.

**Key Components:**
- Auth0 SDK v4 client instance
- API routes for login/logout/callback
- Protected routes via middleware
- User menu with profile display

### Setup Instructions

#### 1. Create Auth0 Account & Application
1. Go to https://auth0.com and create account
2. Create new Application → **Regular Web Application**
3. Name it "TransLang" or similar

#### 2. Configure Application Settings
In your Auth0 application settings:
- **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
- **Allowed Logout URLs**: `http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:3000`

For production, add your production URLs.

#### 3. Get Credentials
From the Auth0 application settings, copy:
- Domain (e.g., `your-tenant.auth0.com`)
- Client ID
- Client Secret

#### 4. Configure Environment Variables
Create/update `.env.local`:
```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_SECRET=<generate-this>
APP_BASE_URL=http://localhost:3000
```

Generate `AUTH0_SECRET`:
```bash
openssl rand -hex 32
```

#### 5. Run Application
```bash
npm run dev
```

### Testing Guidance

#### Test 1: Landing Page
1. Visit http://localhost:3000
2. Should see landing page with "Login" and "Sign Up" buttons
3. Should NOT be redirected to dashboard

#### Test 2: Login Flow
1. Click "Login" button
2. Redirected to Auth0 Universal Login
3. Sign up or log in with email/password
4. Redirected back to `/dashboard`
5. Should see translation interface

#### Test 3: Protected Routes
1. Open new incognito window
2. Try to access http://localhost:3000/dashboard directly
3. Should redirect to Auth0 login

#### Test 4: User Menu
1. After login, see user menu in top-right
2. Click menu → shows name, email
3. "Profile" and "Log out" options available

#### Test 5: Logout
1. Click "Log out" from user menu
2. Redirected to landing page
3. Trying to access `/dashboard` redirects to login

---

## Phase 2: Database Setup

### Implementation Overview
Integrated Supabase as PostgreSQL database for storing users, settings, transcripts, and usage data. Auto-syncs Auth0 users to database on first login.

**Key Components:**
- Supabase client (admin & public)
- Database schema with 4 tables
- User sync API routes
- Settings persistence API

### Setup Instructions

#### 1. Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Choose:
   - Organization (or create new)
   - Project name (e.g., "translang")
   - Database password (save this!)
   - Region (choose closest to users)
5. Wait for project to provision (~2 minutes)

#### 2. Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open `supabase-schema.sql` from project root
4. Copy entire contents
5. Paste into SQL Editor
6. Click "Run" or press Cmd/Ctrl + Enter
7. Verify: Check **Table Editor** → should see 4 tables

#### 3. Get API Keys
1. Go to **Settings → API**
2. Copy three values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` ⚠️ Keep secret!

#### 4. Configure Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

#### 5. Restart Application
```bash
npm run dev
```

### Testing Guidance

#### Test 1: User Auto-Creation
1. Log in via Auth0 (from Phase 1)
2. In Supabase dashboard → **Table Editor** → `users`
3. Should see your user row with:
   - `auth0_id` (starts with `auth0|` or `google-oauth2|`)
   - Your email
   - Your name
   - Avatar URL (if using social login)

#### Test 2: Default Settings Creation
1. In Supabase → **Table Editor** → `user_settings`
2. Should see a row for your user with defaults:
   - `source_language`: "de"
   - `vad_enabled`: true
   - `silence_threshold`: 800
   - `sentence_mode`: false
   - `theme`: "system"

#### Test 3: User Sync API
1. Open browser console (F12)
2. Run:
```javascript
fetch('/api/users/me').then(r => r.json()).then(console.log)
```
3. Should return your user object

#### Test 4: Multiple Logins
1. Log out and log in again
2. Check Supabase `users` table
3. Should NOT create duplicate user
4. `updated_at` should be current time

---

## Phase 3: Transcript History

### Implementation Overview
Complete transcript management system allowing users to save, view, and manage translation sessions. Includes list view, detail view, and export functionality.

**Key Components:**
- Save transcript dialog
- Transcript list page with pagination
- Individual transcript viewer
- Delete with confirmation
- Export to Text/JSON
- Navigation in sidebar

### Setup Instructions

Phase 3 requires Phase 1 (Auth0) and Phase 2 (Supabase) to be set up. No additional setup needed.

### Testing Guidance

#### Test 1: Save Transcript
1. Log in to dashboard
2. Click microphone to start translation
3. Speak in German (or selected language)
4. Get some translations (5-10 lines)
5. Click "Stop" button
6. Should see "Save Transcript" button appear
7. Click "Save Transcript"
8. Enter title: "Test Session 1"
9. Click "Save"
10. Should see success state briefly
11. Dialog closes automatically

#### Test 2: View in Supabase
1. In Supabase dashboard → **Table Editor** → `transcripts`
2. Should see new row with:
   - Your title
   - `source_language`: "de" (or what you selected)
   - `translations`: JSONB array
   - `source`: JSONB array
   - `duration_ms`: calculated duration
   - `created_at`: current timestamp

#### Test 3: Transcript List Page
1. In sidebar, click "Transcripts"
2. Should navigate to `/dashboard/transcripts`
3. Should see card with your saved transcript:
   - Title: "Test Session 1"
   - Date (formatted nicely)
   - Duration (MM:SS format)
   - Line count
   - Language pair (DE → EN)
   - "View" and delete buttons

#### Test 4: Empty State
1. Delete all transcripts (see Test 7)
2. Go to Transcripts page
3. Should see:
   - File icon
   - "No transcripts yet" message
   - "Start Translating" button
4. Click button → redirects to `/dashboard`

#### Test 5: View Transcript Details
1. From transcript list, click "View" button
2. Should navigate to `/dashboard/transcripts/[id]`
3. Should see:
   - Title at top
   - Date and duration
   - Language pair
   - "Show Source" button
   - "Export" dropdown
   - All translation lines displayed
   - Speaker labels (if multi-speaker)

#### Test 6: Toggle Source Language
1. On transcript detail page
2. Click "Show Source" button
3. Should display German text below each translation
4. Click "Hide Source"
5. Source text should disappear

#### Test 7: Delete Transcript
1. From transcript list page
2. Click trash icon on a transcript
3. Confirmation dialog appears:
   - "Delete Transcript?" title
   - Warning message
   - "Cancel" and "Delete" buttons
4. Click "Delete"
5. Should see loading state ("Deleting...")
6. Transcript removed from list
7. Check Supabase → should be deleted

#### Test 8: Export Transcript
1. On transcript detail page
2. Click "Export" dropdown
3. Select "Export as Text"
4. File should download with `.txt` extension
5. Open file:
   - Should have header
   - All translations listed
   - If source shown, includes German text
6. Try "Export as JSON"
7. File should download with `.json` extension
8. Open file:
   - Valid JSON format
   - Contains all transcript data
   - Includes metadata

#### Test 9: Back Navigation
1. On transcript detail page
2. Click "Back to Transcripts" button
3. Should return to transcript list
4. Can also use browser back button

#### Test 10: Save Multiple Transcripts
1. Create 3-4 different translation sessions
2. Save each with unique title
3. Go to Transcripts page
4. Should see all transcripts in reverse chronological order
5. Most recent at top

#### Test 11: Pagination (Future)
Currently loads first 50 transcripts. To test:
1. If you have 50+ transcripts, list truncates
2. API supports `?limit=10&offset=0` parameters
3. UI pagination not yet implemented

---

## Phase 4: Usage Tracking

### Implementation Overview
Tracks translation session duration and enforces monthly usage limits. Free tier users get 60 minutes per month. Includes automatic tracking, usage dashboard, pre-flight checks, and limit enforcement.

**Key Components:**
- Session tracker utility (tracks active time, excludes paused time)
- Usage API routes (stats & recording)
- Usage dashboard with progress bars
- Usage limit dialogs (warning & blocking)
- Usage indicator in header
- Integration with translation controls

### Setup Instructions

Phase 4 builds on Phase 2 (database) and Phase 3. No additional external services needed.

The `usage_records` table was already created in Phase 2's `supabase-schema.sql`. Verify it exists:

1. Go to Supabase dashboard → **Table Editor**
2. Should see `usage_records` table with columns:
   - `id` (UUID)
   - `user_id` (UUID, foreign key to users)
   - `minutes` (DOUBLE PRECISION)
   - `date` (TIMESTAMPTZ)

If table doesn't exist, run the relevant section from `supabase-schema.sql`.

### Testing Guidance

#### Test 1: Automatic Usage Tracking
1. Log in to dashboard
2. Click microphone to start translation
3. Translate for ~30 seconds
4. Click "Stop"
5. Check browser console (F12):
   - Should see `⏱️ Started usage tracking`
   - Should see `⏱️ Session duration: X.XX minutes`
   - Should see `✅ Usage recorded successfully`

#### Test 2: Usage Recorded in Database
1. After completing Test 1
2. Go to Supabase → **Table Editor** → `usage_records`
3. Should see new row with:
   - Your `user_id`
   - `minutes`: ~0.5 (for 30 seconds)
   - `date`: current timestamp

#### Test 3: Usage Dashboard
1. In sidebar, click "Usage"
2. Navigate to `/dashboard/usage`
3. Should see:
   - "Usage This Month" heading
   - Current month name
   - Minutes used (e.g., "0m of 60m")
   - Progress bar (should be green, low percentage)
   - Three stat cards:
     - Total Used
     - Sessions (should be 1+)
     - Avg. Session
   - "Recent Sessions" section with your session listed

#### Test 4: Usage Indicator in Header
1. Go to `/dashboard`
2. Look at top-right of header (next to user menu)
3. Should see clock icon with usage (e.g., "0m / 60m")
4. Click it → should navigate to `/dashboard/usage`

#### Test 5: Pause/Resume Tracking
1. Start translation
2. After 10 seconds, click "Pause"
3. Wait 20 seconds
4. Click "Resume"
5. After 10 seconds, click "Stop"
6. Check console: Duration should be ~20 seconds (0.33 min)
7. Paused time should be excluded

#### Test 6: Usage Warning (Near Limit)
**Setup**: Manually add usage records to reach 80%
1. In Supabase → `usage_records` → **Insert row**
2. Add:
   - `user_id`: Your user ID
   - `minutes`: 50 (to reach 50/60 = 83%)
   - `date`: Current timestamp
3. Refresh dashboard page
4. Try to start translation
5. Should see **yellow warning dialog**:
   - "Approaching Usage Limit"
   - Shows remaining minutes
   - "Cancel" and "Continue Anyway" buttons
6. Click "Continue Anyway" → starts translation
7. Click "Cancel" → closes dialog, doesn't start

#### Test 7: Usage Blocking (Over Limit)
**Setup**: Add more usage to exceed limit
1. In Supabase → `usage_records` → **Insert row**
2. Add:
   - `user_id`: Your user ID
   - `minutes`: 15 (total now 65/60 = 108%)
   - `date`: Current timestamp
3. Refresh dashboard
4. Usage indicator should be **red** with warning icon
5. Try to start translation
6. Should see **red blocking dialog**:
   - "Usage Limit Reached"
   - Shows upgrade options (Pro, Unlimited)
   - Only "Close" button (no "Continue")
7. Cannot start translation

#### Test 8: Usage Dashboard Colors
Based on Test 6 & 7 setup:
- **0-79% used**: Green progress bar, no warnings
- **80-99% used**: Yellow progress bar, warning message
- **100%+ used**: Red progress bar, limit reached message

#### Test 9: Monthly Reset
**Manual Test** (can't easily automate):
1. Current month's usage is from `date >= [first day of current month]`
2. Old records from previous months are ignored
3. At start of next month:
   - Dashboard should show 0 minutes used
   - Old records still in database
   - Can start translating again

#### Test 10: Multiple Sessions Tracking
1. Do 3-4 short translation sessions (10-20 seconds each)
2. Go to Usage dashboard
3. "Sessions" card should show count (3 or 4)
4. "Avg. Session" should show average duration
5. "Recent Sessions" should list all sessions with timestamps

#### Test 11: Very Short Sessions Not Recorded
1. Start translation
2. Immediately stop (within 1 second)
3. Check console: Should NOT see "Usage recorded"
4. Check Supabase: No new record (too short to count)

#### Test 12: Usage API Direct
Test the API endpoints directly:

**Get usage stats:**
```javascript
fetch('/api/usage').then(r => r.json()).then(console.log)
```
Should return:
```json
{
  "stats": {
    "totalMinutes": 50.5,
    "limitMinutes": 60,
    "remainingMinutes": 9.5,
    "percentUsed": 84.17,
    "isOverLimit": false
  },
  "records": [...],
  "tier": {"name": "Free", "limitMinutes": 60},
  "monthStart": "2024-12-01T00:00:00.000Z"
}
```

**Record usage manually:**
```javascript
fetch('/api/usage', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({minutes: 0.5})
}).then(r => r.json()).then(console.log)
```

#### Test 13: Clean Up Test Data
After testing, remove test usage records:
1. Supabase → `usage_records` → Delete rows you added
2. Refresh dashboard → should show realistic usage

---

## Common Issues & Solutions

### Auth0 Issues

**Issue**: "Invalid callback URL"
- **Solution**: Check Auth0 dashboard → Application Settings → Allowed Callback URLs includes your exact URL

**Issue**: "Missing AUTH0_SECRET"
- **Solution**: Generate new secret: `openssl rand -hex 32` and add to `.env.local`

**Issue**: Redirect loop
- **Solution**: Clear cookies, check `APP_BASE_URL` matches your actual URL

### Supabase Issues

**Issue**: "supabaseUrl is required"
- **Solution**: Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` (must start with `NEXT_PUBLIC_`)

**Issue**: "Failed to fetch transcripts"
- **Solution**: Check Supabase service key is correct, verify tables exist in Table Editor

**Issue**: User not created in database
- **Solution**: Check browser console for errors, verify `supabase-schema.sql` ran successfully

### General Issues

**Issue**: Environment variables not loading
- **Solution**: Restart dev server after changing `.env.local`

**Issue**: TypeScript errors
- **Solution**: Run `npm install` to ensure all dependencies installed

**Issue**: Build fails
- **Solution**: Ensure all env vars have placeholder values in `lib/supabase.ts`

---

## Environment Variables Checklist

Complete `.env.local` should have:

```env
# Soniox (from original project)
SONIOX_SECRET_KEY=your_soniox_api_key

# Auth0 (Phase 1)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_SECRET=random_32_character_hex_string
APP_BASE_URL=http://localhost:3000

# Supabase (Phase 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

---

## Quick Test Script

Run this sequence to verify all phases:

```bash
# 1. Start application
npm run dev

# 2. Open http://localhost:3000
# 3. Click "Login" → complete Auth0 flow
# 4. Should land on /dashboard
# 5. Click microphone, translate something
# 6. Click "Stop", then "Save Transcript"
# 7. Enter title, save
# 8. Click "Transcripts" in sidebar
# 9. See your saved transcript
# 10. Click "View" → see details
# 11. Click "Export" → download file
# 12. Click trash icon → delete transcript
# 13. Confirm deletion
# 14. Click user menu → "Log out"
# 15. Back to landing page

# All working? ✅ Phases 1-3 complete!
```

---

## Phase 5: Landing Page

### Implementation Overview
Created a modern, minimalist landing page following current web design trends. Features smooth animations, gradient effects, responsive design, and clear call-to-actions. Built with reusable React components for easy maintenance.

**Key Components:**
- Hero section with animated background
- Features grid with hover effects
- Pricing cards (3 tiers)
- CTA section with gradient
- Footer with navigation
- Custom CSS animations

### Setup Instructions

Phase 5 has no external dependencies. All components are self-contained and use existing UI libraries.

### Testing Guidance

#### Test 1: Landing Page Display
1. Log out if logged in
2. Go to http://localhost:3000
3. Should see new modern landing page with:
   - Animated gradient blobs in hero
   - "Break Language Barriers Instantly" headline
   - Two CTA buttons: "Start Translating Free" and "Watch Demo"
   - Stats: "60 minutes free", "10+ languages", "Real-time"

#### Test 2: Responsive Design
1. Open browser DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Test different sizes:
   - **Mobile** (375px): Stack layout, readable text
   - **Tablet** (768px): 2-column grids
   - **Desktop** (1440px): 3-column grids, full layout
4. All sections should resize smoothly
5. Navigation should remain accessible

#### Test 3: Hero Animations
1. On landing page, observe hero section
2. Should see:
   - Three colored blobs moving slowly (7s loop)
   - Pulsing green dot on badge
   - Text fades in from bottom
   - Scroll indicator bouncing at bottom
3. Animations should be smooth, not janky

#### Test 4: Features Section
1. Scroll to "Everything You Need" section
2. Should see 6 feature cards in grid
3. Hover over each card:
   - Border changes to purple
   - Card lifts slightly (translate-y)
   - Icon scales up
   - Shadow increases
4. All hover effects should be smooth

#### Test 5: Pricing Cards
1. Scroll to "Simple, Transparent Pricing"
2. Should see 3 pricing tiers:
   - **Free**: $0/month, white background
   - **Pro**: $15/month, gradient background, "Most Popular" badge, slightly larger
   - **Unlimited**: $49/month, white background
3. Pro card should stand out visually
4. "Start Free" button should be clickable
5. Other buttons show "Coming Soon"

#### Test 6: Navigation & Scroll
1. Click "Learn More" button in hero
2. Should smooth scroll to Features section
3. Click "Pricing" in nav (if added)
4. Should smooth scroll to pricing
5. Scroll behavior should be smooth, not instant

#### Test 7: CTA Section
1. Scroll to bottom CTA section
2. Should have:
   - Purple/pink gradient background
   - Grid pattern overlay (subtle lines)
   - White text
   - "Start Free Today" button
3. Gradient should be vibrant but not overwhelming

#### Test 8: Footer
1. Scroll to footer
2. Should see:
   - TransLang logo and description
   - Social media icons (Twitter, GitHub, LinkedIn)
   - 4 columns: Brand, Product, Company, Legal
   - Copyright year (current year)
3. Hover over links → color changes
4. Social icons hover → background changes

#### Test 9: Dark Mode
1. If system is in dark mode, page adapts
2. Check:
   - Background colors darker
   - Text remains readable
   - Gradients still visible
   - Contrast maintained
3. All sections should look good in dark mode

#### Test 10: Click CTA Buttons
1. Click "Start Translating Free" in hero
2. Should redirect to `/api/auth/login`
3. After login, redirects to `/dashboard`
4. Go back to landing page
5. When logged in, hero might show different state

#### Test 11: Mobile Navigation
1. Switch to mobile view (< 768px)
2. Navigation should:
   - Logo and buttons visible
   - Buttons may stack on very small screens
   - Touch targets large enough (44x44px minimum)
3. Test tapping all buttons

#### Test 12: Performance
1. Open Lighthouse in DevTools
2. Run audit on landing page
3. Should score:
   - **Performance**: 90+ (animations optimized)
   - **Accessibility**: 90+ (proper contrast, ARIA labels)
   - **Best Practices**: 90+
   - **SEO**: 90+ (proper heading hierarchy)

#### Test 13: Animation Performance
1. Open DevTools → Performance tab
2. Record while scrolling through page
3. Check FPS (frames per second)
4. Should maintain 60 FPS
5. No janky animations or layout shifts

---

## Phase 6: Security & Error Handling

### 📝 Concise Explanation
This phase implemented comprehensive security measures and error handling to make the application production-ready. It includes input validation with Zod schemas, rate limiting to prevent abuse, security headers for defense-in-depth, structured logging for debugging, environment validation, and error boundaries for graceful failure handling.

### 🛠️ Setup Instructions

1. **Environment Validation**:
   - The application now validates all required environment variables on startup.
   - In production, missing critical variables will cause the application to exit with an error.
   - Ensure all environment variables from previous phases are correctly set.

2. **Security Headers**:
   - Security headers are automatically applied via `next.config.js`.
   - No additional configuration needed, but review CSP (Content Security Policy) if you add new external services.
   - Headers include: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS, and CSP.

3. **Rate Limiting**:
   - Rate limiting is applied automatically to API routes using the `withApiHandler` wrapper.
   - Current limits:
     - API requests: 60 per minute
     - Transcript creation: 20 per hour
     - Usage recording: 10 per minute
     - Auth attempts: 10 per hour
   - Adjust limits in `lib/rateLimit.ts` if needed.

4. **Logging**:
   - Structured logging is available via `lib/logger.ts`.
   - In development, logs go to console.
   - In production, you can integrate with external services (CloudWatch, Datadog, etc.) by updating `sendToExternalService()` in `lib/logger.ts`.

### 🧪 Testing Guidance

1. **Input Validation**:
   - Try creating a transcript with invalid data (e.g., empty translations, negative duration).
   - API should return a `400 Bad Request` with detailed error messages.
   - Test validation on:
     - POST `/api/transcripts` - invalid transcript data
     - POST `/api/usage` - invalid minutes value (negative, too large)
     - GET `/api/transcripts` - invalid query parameters (limit > 100, negative offset)

2. **Rate Limiting**:
   - Make rapid requests to `/api/transcripts` (more than 60 in a minute).
   - After exceeding the limit, you should receive a `429 Too Many Requests` response with a `Retry-After` header.
   - Wait for the time window to reset, then requests should work again.
   - Test rate limiting on different endpoints with their specific limits.

3. **Security Headers**:
   - Inspect the response headers in your browser's developer tools (Network tab).
   - Verify the following headers are present:
     - `X-Frame-Options: DENY`
     - `X-Content-Type-Options: nosniff`
     - `X-XSS-Protection: 1; mode=block`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Permissions-Policy: camera=(), microphone=(self), geolocation=(), interest-cohort=()`
     - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HTTPS only)
     - `Content-Security-Policy: ...` (Check that it includes your allowed domains)
   - Test that the application cannot be embedded in an iframe (X-Frame-Options).

4. **Error Boundary**:
   - Trigger a React error (e.g., throw an error in a component).
   - Verify that the ErrorBoundary displays a user-friendly error page instead of a blank screen.
   - In development, you should see detailed error information.
   - Test that the "Try Again" button resets the error state and re-renders the component.

5. **Environment Validation**:
   - Remove a required environment variable (e.g., `SONIOX_SECRET_KEY`) from `.env.local`.
   - Try to build or run the application.
   - In development, you should see console warnings.
   - In production build, the application should fail to start with a clear error message listing missing variables.
   - Restore the environment variable and verify the application starts successfully.

6. **Logging**:
   - Check the console output for structured log messages.
   - Logs should include timestamp, log level, message, and context.
   - Trigger an API error and verify that it's logged with appropriate context.

7. **API Handler Wrapper**:
   - Test the new `/api/transcripts-v2` endpoint.
   - Verify that it behaves identically to the original `/api/transcripts`.
   - Check that rate limiting and error handling work correctly.
   - Observe the `X-Response-Time` header in responses to monitor performance.

8. **Validation Error Responses**:
   - Send invalid data to an API endpoint.
   - Verify the error response includes:
     - `error`: General error message
     - `details`: Array of field-level validation errors

9. **Production Build Test**:
   - Run `npm run build` to ensure all security features compile correctly.
   - Start the production build with `npm start`.
   - Verify all features work in production mode.

10. **Security Best Practices Checklist**:
    - [x] All API inputs are validated
    - [x] Rate limiting is enabled
    - [x] Security headers are configured
    - [x] Errors are handled gracefully
    - [x] Sensitive data is not logged
    - [x] Environment variables are validated
    - [x] Error boundary prevents UI crashes
    - [x] HTTPS is enforced in production (via HSTS header)
    - [x] CSP prevents XSS attacks
    - [x] Clickjacking is prevented

---

## Support Resources

- **Auth0 Docs**: https://auth0.com/docs/quickstart/webapp/nextjs
- **Supabase Docs**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Shadcn/UI**: https://ui.shadcn.com
- **Zod Validation**: https://zod.dev
- **Project Issues**: Check browser console and terminal for errors

