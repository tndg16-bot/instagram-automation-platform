-- Comment Management Tables
-- Auto-generated: 2026-01-22

-- Comments Table
CREATE TABLE IF NOT EXISTS instagram_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  media_id VARCHAR(255) NOT NULL,
  media_type VARCHAR(50) NOT NULL DEFAULT 'IMAGE',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'ignored')),
  replied_at TIMESTAMP WITH TIME ZONE,
  reply_message_id VARCHAR(255),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comment Reply Templates Table
CREATE TABLE IF NOT EXISTS comment_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comment Keyword Rules Table
CREATE TABLE IF NOT EXISTS comment_keyword_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_instagram_comments_user ON instagram_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_comments_media ON instagram_comments(media_id);
CREATE INDEX IF NOT EXISTS idx_instagram_comments_status ON instagram_comments(status);
CREATE INDEX IF NOT EXISTS idx_instagram_comments_timestamp ON instagram_comments(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_comment_reply_templates_user ON comment_reply_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_keyword_rules_user ON comment_keyword_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_keyword_rules_keyword ON comment_keyword_rules(keyword);
