-- Multi-account management tables for Phase 7
-- Migration: 010_create_multi_account_tables.sql

-- Instagram accounts table (extended for multi-account)
CREATE TABLE IF NOT EXISTS instagram_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    instagram_user_id VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    access_token VARCHAR(500) NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token VARCHAR(500),
    profile_pic_url VARCHAR(500),
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    business_account BOOLEAN DEFAULT false,
    account_type VARCHAR(50) DEFAULT 'personal', -- personal, business, creator, brand
    permissions JSONB, -- Available permissions
    metadata JSONB,
    last_used_at TIMESTAMP WITH TIME ZONE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Account sync status table
CREATE TABLE IF NOT EXISTS account_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- profile, followers, following, posts, insights
    status VARCHAR(50) NOT NULL, -- pending, in_progress, completed, failed
    last_synced_at TIMESTAMP WITH TIME ZONE,
    next_sync_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    synced_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Account operations log table
CREATE TABLE IF NOT EXISTS account_operations_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL, -- post, comment, like, follow, dm, story, reel
    operation_details JSONB,
    status VARCHAR(50) NOT NULL, -- pending, in_progress, completed, failed
    result_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Account switching history table
CREATE TABLE IF NOT EXISTS account_switching_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    switch_reason VARCHAR(255),
    switch_context TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_is_active ON instagram_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_is_default ON instagram_accounts(is_default);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_account_type ON instagram_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_account_sync_status_account_id ON account_sync_status(account_id);
CREATE INDEX IF NOT EXISTS idx_account_sync_status_status ON account_sync_status(status);
CREATE INDEX IF NOT EXISTS idx_account_operations_log_account_id ON account_operations_log(account_id);
CREATE INDEX IF NOT EXISTS idx_account_operations_log_user_id ON account_operations_log(user_id);
CREATE INDEX IF NOT EXISTS idx_account_operations_log_status ON account_operations_log(status);
CREATE INDEX IF NOT EXISTS idx_account_operations_log_timestamp ON account_operations_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_account_switching_history_user_id ON account_switching_history(user_id);
CREATE INDEX IF NOT EXISTS idx_account_switching_history_timestamp ON account_switching_history(timestamp);

-- Comments for documentation
COMMENT ON TABLE instagram_accounts IS 'Instagram accounts table with multi-account support';
COMMENT ON TABLE account_sync_status IS 'Account synchronization status tracking';
COMMENT ON TABLE account_operations_log IS 'Account operations log (posts, comments, likes, etc.)';
COMMENT ON TABLE account_switching_history IS 'Account switching history tracking';
