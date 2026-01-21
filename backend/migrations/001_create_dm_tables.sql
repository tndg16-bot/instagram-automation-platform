-- Migration: Create DM broadcast tables
-- Created: 2026-01-20

CREATE TABLE IF NOT EXISTS dm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'TEXT',
  media_url TEXT,
  segment_id UUID REFERENCES dm_segments(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES dm_campaigns(id) ON DELETE CASCADE,
  recipient_id VARCHAR(255) NOT NULL,
  recipient_username VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]',
  is_dynamic BOOLEAN DEFAULT true,
  size INTEGER DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'TEXT',
  media_url TEXT,
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_step_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES dm_campaigns(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  message TEXT NOT NULL,
  media_url TEXT,
  delay_hours INTEGER DEFAULT 0,
  trigger_condition JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES dm_campaigns(id) ON DELETE SET NULL,
  recipient_id VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_campaigns_user_id ON dm_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_campaigns_instagram_account_id ON dm_campaigns(instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_dm_campaigns_status ON dm_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_dm_campaigns_scheduled_at ON dm_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_dm_campaign_recipients_campaign_id ON dm_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dm_campaign_recipients_recipient_id ON dm_campaign_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_dm_campaign_recipients_status ON dm_campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_dm_segments_user_id ON dm_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_segments_instagram_account_id ON dm_segments(instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_dm_message_templates_user_id ON dm_message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_step_sequences_campaign_id ON dm_step_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dm_step_sequences_step_order ON dm_step_sequences(campaign_id, step_order);
CREATE INDEX IF NOT EXISTS idx_dm_logs_user_id ON dm_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_logs_created_at ON dm_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_dm_logs_action ON dm_logs(action);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dm_campaigns_updated_at
  BEFORE UPDATE ON dm_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dm_segments_updated_at
  BEFORE UPDATE ON dm_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dm_message_templates_updated_at
  BEFORE UPDATE ON dm_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
