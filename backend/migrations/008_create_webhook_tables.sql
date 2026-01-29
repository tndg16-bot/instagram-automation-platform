-- Webhook tables for Phase 6
-- Migration: 008_create_webhook_tables.sql

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'custom',
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(100) NOT NULL UNIQUE,
    events TEXT[] NOT NULL,
    active BOOLEAN DEFAULT true,
    retry_config JSONB,
    total_triggers INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    status VARCHAR(50) NOT NULL,
    http_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email providers table
CREATE TABLE IF NOT EXISTS email_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- sendgrid, mailgun, ses, custom
    api_key VARCHAR(500) NOT NULL,
    api_endpoint VARCHAR(500),
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    config JSONB,
    is_default BOOLEAN DEFAULT false,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES email_providers(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE SET NULL,
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL, -- queued, sent, delivered, failed, bounced, opened, clicked, unsubscribed
    error_message TEXT,
    provider_response JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_type ON webhooks(type);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(active);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_providers_user_id ON email_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider_id ON email_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_subscriber_id ON email_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- Comments for documentation
COMMENT ON TABLE webhooks IS 'Webhook integrations for external services';
COMMENT ON TABLE webhook_logs IS 'Individual webhook call logs for tracking and debugging';
COMMENT ON TABLE email_providers IS 'Email service providers (SendGrid, Mailgun, AWS SES, custom SMTP)';
COMMENT ON TABLE email_logs IS 'Email send logs for tracking delivery status and debugging';
