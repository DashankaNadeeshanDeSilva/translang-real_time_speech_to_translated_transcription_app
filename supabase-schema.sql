-- TransLang Database Schema for Supabase
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth0_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_language TEXT DEFAULT 'de',
  vad_enabled BOOLEAN DEFAULT true,
  silence_threshold INTEGER DEFAULT 800,
  sentence_mode BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSCRIPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  source_language TEXT NOT NULL,
  translations JSONB NOT NULL DEFAULT '[]'::jsonb,
  source JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USAGE RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minutes DOUBLE PRECISION NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_date ON usage_records(date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Note: Since we're using Auth0 (not Supabase Auth), we handle authorization 
-- in API routes using the service role key. RLS is enabled for defense in depth
-- but policies are permissive when using the service role key.

-- Users table policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (true);  -- API routes will handle auth

CREATE POLICY "Service role can manage users" ON users
  FOR ALL
  USING (true);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage settings" ON user_settings
  FOR ALL
  USING (true);

-- Transcripts policies
CREATE POLICY "Users can view own transcripts" ON transcripts
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage transcripts" ON transcripts
  FOR ALL
  USING (true);

-- Usage records policies
CREATE POLICY "Users can view own usage" ON usage_records
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage usage" ON usage_records
  FOR ALL
  USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE QUERIES (for testing)
-- ============================================

-- Count users
-- SELECT COUNT(*) FROM users;

-- Get user with settings
-- SELECT u.*, us.* 
-- FROM users u 
-- LEFT JOIN user_settings us ON u.id = us.user_id 
-- WHERE u.auth0_id = 'your_auth0_id';

-- Get user's transcripts
-- SELECT * FROM transcripts 
-- WHERE user_id = 'user_uuid' 
-- ORDER BY created_at DESC;

-- Get user's total usage this month
-- SELECT SUM(minutes) as total_minutes 
-- FROM usage_records 
-- WHERE user_id = 'user_uuid' 
-- AND date >= date_trunc('month', CURRENT_DATE);

