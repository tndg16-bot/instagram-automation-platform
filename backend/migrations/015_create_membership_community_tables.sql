-- Migration: Create membership and community tables for Phase 5
-- Created: 2026-01-31

-- Membership tiers table
CREATE TABLE IF NOT EXISTS membership_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE, -- Free, Premium, VIP, Enterprise
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),
  features JSONB DEFAULT '[]',
  max_instagram_accounts INTEGER DEFAULT 1,
  max_dm_per_day INTEGER DEFAULT 100,
  max_workflows INTEGER DEFAULT 5,
  max_team_members INTEGER DEFAULT 1,
  ai_credits_per_month INTEGER DEFAULT 0,
  priority_support BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User memberships table
CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id INTEGER NOT NULL REFERENCES membership_tiers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, cancelled, expired
  payment_provider VARCHAR(50), -- stripe, paypal
  payment_subscription_id VARCHAR(255),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchased content table (for digital products)
CREATE TABLE IF NOT EXISTS purchased_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- ebook, video, course, template
  content_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  download_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  purchase_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'JPY',
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, content_id)
);

-- Community topics table
CREATE TABLE IF NOT EXISTS community_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50), -- general, help, showcase, tutorial
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community posts (replies) table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  is_solution BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL, -- webinar, workshop, meetup, training
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP,
  timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
  location_type VARCHAR(20) DEFAULT 'online', -- online, offline, hybrid
  location_address TEXT,
  meeting_url VARCHAR(500),
  capacity INTEGER,
  image_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, ongoing, completed, cancelled
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered', -- registered, attended, cancelled, no_show
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attended_at TIMESTAMP,
  notes TEXT,
  UNIQUE(event_id, user_id)
);

-- AI Moderation logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL, -- comment, dm, post, topic, reply
  content_id VARCHAR(255) NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  original_content TEXT,
  toxicity_score DECIMAL(3, 2),
  spam_score DECIMAL(3, 2),
  is_flagged BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  reason TEXT,
  action_taken VARCHAR(50), -- warn, block, remove, none
  moderated_by VARCHAR(50) DEFAULT 'ai', -- ai, admin, system
  moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Welcome DM templates table
CREATE TABLE IF NOT EXISTS welcome_dm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  message_content TEXT NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  personalization_vars JSONB DEFAULT '[]',
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default membership tiers
INSERT INTO membership_tiers (name, display_name, description, price_monthly, price_yearly, features, max_instagram_accounts, max_dm_per_day, max_workflows, max_team_members, ai_credits_per_month, priority_support) VALUES
('Free', 'フリープラン', '個人利用に最適な無料プラン', 0, 0, '["1アカウント連携", "基本DM機能", "月100件までの配信"]', 1, 100, 3, 1, 10, FALSE),
('Starter', 'スタータープラン', '個人事業主・小規模ビジネス向け', 2980, 29800, '["3アカウント連携", "AI返信機能", "ステップ配信", "月10,000件までの配信"]', 3, 1000, 10, 3, 500, FALSE),
('Business', 'ビジネスプラン', '中小企業向けの充実機能', 9800, 98000, '["10アカウント連携", "ワークフロー自動化", "詳細アナリティクス", "優先サポート"]', 10, 5000, 50, 10, 2000, TRUE),
('Pro', 'プロフェッショナルプラン', '大規模運用・マーケティング代理店向け', 29800, 298000, '["30アカウント連携", "API連携", "カスタムワークフロー", "専任サポート"]', 30, 20000, 200, 30, 10000, TRUE),
('VIP', 'VIPプラン', 'エンタープライズ向けカスタムプラン', 0, 0, '["無制限アカウント", "専用サーバー", "カスタム開発", "SLA保証"]', 999999, 999999, 999999, 999999, 100000, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_purchased_content_user_id ON purchased_content(user_id);
CREATE INDEX IF NOT EXISTS idx_community_topics_author_id ON community_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_community_topics_category ON community_topics(category);
CREATE INDEX IF NOT EXISTS idx_community_topics_created_at ON community_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_topic_id ON community_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_content_id ON moderation_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_welcome_dm_templates_user_id ON welcome_dm_templates(user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_membership_tiers_updated_at ON membership_tiers;
CREATE TRIGGER update_membership_tiers_updated_at BEFORE UPDATE ON membership_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_memberships_updated_at ON user_memberships;
CREATE TRIGGER update_user_memberships_updated_at BEFORE UPDATE ON user_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_topics_updated_at ON community_topics;
CREATE TRIGGER update_community_topics_updated_at BEFORE UPDATE ON community_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_welcome_dm_templates_updated_at ON welcome_dm_templates;
CREATE TRIGGER update_welcome_dm_templates_updated_at BEFORE UPDATE ON welcome_dm_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
