-- DM Inbox Table for managing received messages
-- Migration: 004_create_dm_inbox.sql
-- Auto-generated: 2026-01-22

CREATE TABLE IF NOT EXISTS dm_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id VARCHAR(255) UNIQUE NOT NULL,
  sender_id VARCHAR(255) NOT NULL,
  sender_username VARCHAR(255) NOT NULL,
  recipient_id VARCHAR(255) NOT NULL,
  text TEXT,
  media_url TEXT,
  media_type VARCHAR(50) DEFAULT 'IMAGE',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'ignored', 'processing')),
  replied_at TIMESTAMP WITH TIME ZONE,
  reply_message_id VARCHAR(255),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dm_inbox_user ON dm_inbox(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_inbox_status ON dm_inbox(status);
CREATE INDEX IF NOT EXISTS idx_dm_inbox_timestamp ON dm_inbox(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_dm_inbox_message_id ON dm_inbox(message_id);

-- DM Keyword Rules Table for auto-reply triggers
CREATE TABLE IF NOT EXISTS dm_keyword_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  reply_template_id UUID REFERENCES dm_message_templates(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, keyword)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dm_keyword_rules_user ON dm_keyword_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_keyword_rules_keyword ON dm_keyword_rules(keyword);
CREATE INDEX IF NOT EXISTS idx_dm_keyword_rules_active ON dm_keyword_rules(is_active);
