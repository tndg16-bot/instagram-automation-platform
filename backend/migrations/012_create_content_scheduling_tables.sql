-- Content scheduling and optimization tables for Phase 7
-- Migration: 012_create_content_scheduling_tables.sql

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL,
    media_id UUID REFERENCES media_library(id) ON DELETE SET NULL,
    caption TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, posted, failed, cancelled
    post_id VARCHAR(100), -- Instagram post ID after publishing
    hashtags TEXT[],
    mention_users TEXT[],
    location_tag VARCHAR(100),
    first_comment TEXT,
    optimization_score DECIMAL(5,2),
    ai_suggestions JSONB,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Best time predictions table
CREATE TABLE IF NOT EXISTS best_time_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES instagram_accounts(id) ON DELETE SET NULL,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    hour INTEGER CHECK (hour BETWEEN 0 AND 23),
    engagement_rate DECIMAL(5,2),
    reach_count INTEGER,
    impression_count INTEGER,
    sample_size INTEGER,
    confidence_level VARCHAR(50), -- high, medium, low
    prediction_type VARCHAR(50), -- historical, ai_based
    last_updated TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content performance metrics table
CREATE TABLE IF NOT EXISTS content_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id VARCHAR(100),
    media_type VARCHAR(50), -- image, video, carousel, story, reel
    media_url VARCHAR(500),
    caption_length INTEGER,
    hashtag_count INTEGER,
    mention_count INTEGER,
    likes_count INTEGER,
    comments_count INTEGER,
    shares_count INTEGER,
    saves_count INTEGER,
    impressions_count INTEGER,
    reach_count INTEGER,
    engagement_rate DECIMAL(5,2),
    posted_at TIMESTAMP WITH TIME ZONE,
    performance_score DECIMAL(5,2),
    optimization_applied BOOLEAN DEFAULT false,
    a_b_test_group VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content templates table
CREATE TABLE IF NOT EXISTS content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- post, story, reel, carousel
    caption_template TEXT NOT NULL,
    hashtag_template TEXT[],
    media_requirements JSONB,
    style_config JSONB, -- Visual style preferences
    usage_count INTEGER DEFAULT 0,
    performance_avg DECIMAL(5,2),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content variations table (for A/B testing)
CREATE TABLE IF NOT EXISTS content_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES content_templates(id) ON DELETE SET NULL,
    variation_name VARCHAR(255) NOT NULL,
    caption_variation TEXT,
    media_variation_url VARCHAR(500),
    variation_config JSONB,
    performance_data JSONB,
    conversion_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_account_id ON scheduled_posts(account_id);
CREATE INDEX IF NOT EXISTS idx_best_time_predictions_user_id ON best_time_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_best_time_predictions_day_of_week ON best_time_predictions(day_of_week);
CREATE INDEX IF NOT EXISTS idx_best_time_predictions_hour ON best_time_predictions(hour);
CREATE INDEX IF NOT EXISTS idx_content_performance_metrics_post_id ON content_performance_metrics(post_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_metrics_posted_at ON content_performance_metrics(posted_at);
CREATE INDEX IF NOT EXISTS idx_content_performance_metrics_user_id ON content_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_content_templates_user_id ON content_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_content_templates_template_type ON content_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_content_variations_template_id ON content_variations(template_id);
CREATE INDEX IF NOT EXISTS idx_content_variations_conversion_rate ON content_variations(conversion_rate);

-- Comments for documentation
COMMENT ON TABLE scheduled_posts IS 'Scheduled posts with AI optimization and best time predictions';
COMMENT ON TABLE best_time_predictions IS 'Best time predictions for maximum engagement';
COMMENT ON TABLE content_performance_metrics IS 'Content performance metrics for optimization';
COMMENT ON TABLE content_templates IS 'Reusable content templates for consistency';
COMMENT ON TABLE content_variations IS 'Content variations for A/B testing and optimization';
