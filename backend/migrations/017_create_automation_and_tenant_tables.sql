-- Migration: Create auto-like and auto-follow tables for Phase 2
-- Created: 2026-01-31

-- Auto-like settings table
CREATE TABLE IF NOT EXISTS auto_like_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  target_hashtags TEXT[] DEFAULT '{}',
  target_accounts TEXT[] DEFAULT '{}',
  max_likes_per_day INTEGER DEFAULT 100,
  like_delay_min INTEGER DEFAULT 30,
  like_delay_max INTEGER DEFAULT 120,
  skip_private_accounts BOOLEAN DEFAULT TRUE,
  skip_business_accounts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, instagram_account_id)
);

-- Like logs table
CREATE TABLE IF NOT EXISTS like_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  target_media_id VARCHAR(255) NOT NULL,
  target_username VARCHAR(255),
  status VARCHAR(20) NOT NULL, -- success, failed, skipped
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auto-follow settings table
CREATE TABLE IF NOT EXISTS auto_follow_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  target_hashtags TEXT[] DEFAULT '{}',
  target_locations TEXT[] DEFAULT '{}',
  competitor_accounts TEXT[] DEFAULT '{}',
  max_follows_per_day INTEGER DEFAULT 50,
  max_unfollows_per_day INTEGER DEFAULT 50,
  follow_delay_min INTEGER DEFAULT 60,
  follow_delay_max INTEGER DEFAULT 300,
  auto_unfollow_after_days INTEGER DEFAULT 3,
  skip_private_accounts BOOLEAN DEFAULT TRUE,
  skip_business_accounts BOOLEAN DEFAULT FALSE,
  skip_verified_accounts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, instagram_account_id)
);

-- Follow logs table
CREATE TABLE IF NOT EXISTS follow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  target_user_id VARCHAR(255) NOT NULL,
  target_username VARCHAR(255),
  action VARCHAR(20) NOT NULL, -- follow, unfollow
  status VARCHAR(20) NOT NULL, -- success, failed, skipped
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unfollowed_at TIMESTAMP
);

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  caption TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL, -- image, video, carousel, story, reel
  media_urls JSONB NOT NULL DEFAULT '[]',
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, published, failed
  published_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant tables for Phase 5
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  domain VARCHAR(255),
  plan VARCHAR(20) NOT NULL DEFAULT 'free', -- free, starter, business, pro, enterprise
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, user_id)
);

-- Add tenant_id to existing tables for multi-tenant support
ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE dm_campaigns ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auto_like_settings_user_account ON auto_like_settings(user_id, instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_like_logs_user_account ON like_logs(user_id, instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_like_logs_created_at ON like_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_follow_settings_user_account ON auto_follow_settings(user_id, instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_follow_logs_user_account ON follow_logs(user_id, instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_follow_logs_created_at ON follow_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_auto_like_settings_updated_at ON auto_like_settings;
CREATE TRIGGER update_auto_like_settings_updated_at
  BEFORE UPDATE ON auto_like_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_auto_follow_settings_updated_at ON auto_follow_settings;
CREATE TRIGGER update_auto_follow_settings_updated_at
  BEFORE UPDATE ON auto_follow_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON scheduled_posts;
CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
