-- Newsletter tables for Phase 6
-- Migration: 007_create_newsletter_tables.sql

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active',
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    subscription_source VARCHAR(100),
    tags TEXT[], -- For segmenting subscribers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter campaigns table
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    description TEXT,
    content_template_id UUID,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sent, cancelled
    target_audience TEXT, -- JSON: tags, custom_segments
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter content templates table
CREATE TABLE IF NOT EXISTS newsletter_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    subject_template TEXT NOT NULL,
    content_template TEXT NOT NULL,
    template_variables JSONB, -- For dynamic variable substitution
    is_html BOOLEAN DEFAULT true,
    design_config JSONB, -- For template styling
    preview_html TEXT,
    preview_text TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter schedule table
CREATE TABLE IF NOT EXISTS newsletter_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
    send_type VARCHAR(50) DEFAULT 'immediate', -- immediate, scheduled, recurring
    recurring_type VARCHAR(50), -- daily, weekly, monthly
    recurring_interval INTEGER DEFAULT 1,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    send_time TIME,
    timezone VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter logs table
CREATE TABLE IF NOT EXISTS newsletter_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE SET NULL,
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter analytics table
CREATE TABLE IF NOT EXISTS newsletter_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_unsubscribed INTEGER DEFAULT 0,
    open_rate DECIMAL(5,2) DEFAULT 0,
    click_rate DECIMAL(5,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_user_id ON newsletter_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_user_id ON newsletter_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_scheduled_at ON newsletter_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_templates_user_id ON newsletter_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_schedule_campaign_id ON newsletter_schedule(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_campaign_id ON newsletter_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_subscriber_id ON newsletter_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_analytics_campaign_id ON newsletter_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_analytics_date ON newsletter_analytics(date);

-- Comments for documentation
COMMENT ON TABLE newsletter_subscribers IS 'Newsletter subscribers with segmentation support';
COMMENT ON TABLE newsletter_campaigns IS 'Newsletter campaigns with analytics tracking';
COMMENT ON TABLE newsletter_templates IS 'Reusable email templates with variable substitution';
COMMENT ON TABLE newsletter_schedule IS 'Newsletter scheduling with recurring and time zone support';
COMMENT ON TABLE newsletter_logs IS 'Individual email send logs for tracking and debugging';
COMMENT ON TABLE newsletter_analytics IS 'Daily aggregated analytics for newsletter campaigns';
