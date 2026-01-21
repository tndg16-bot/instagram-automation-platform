-- DM Keyword Rules Table
-- Migration: 005_create_dm_keyword_rules.sql
-- Auto-generated: 2026-01-22

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
