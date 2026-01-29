-- Analytics tables for Phase 7
-- Migration: 009_create_analytics_tables.sql

-- User behavior analytics table
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    event_type VARCHAR(50) NOT NULL, -- page_view, click, scroll, form_submit, etc.
    page_url VARCHAR(500),
    page_title VARCHAR(255),
    element_id VARCHAR(100),
    element_type VARCHAR(50), -- button, link, form_field, etc.
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_info JSONB,
    location_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campaign performance analytics table
CREATE TABLE IF NOT EXISTS campaign_performance_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    variant_id VARCHAR(100), -- For A/B testing
    metrics_type VARCHAR(50) NOT NULL, -- open_rate, click_rate, conversion_rate, etc.
    metric_value DECIMAL(10,2),
    metric_count INTEGER DEFAULT 0,
    segment_tags TEXT[],
    custom_segment VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- A/B test results table
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
    variant_id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE SET NULL,
    metrics JSONB, -- open_rate, click_rate, conversion_rate, etc.
    sample_size INTEGER DEFAULT 0,
    statistical_significance DECIMAL(5,4),
    is_winner BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Real-time analytics events table
CREATE TABLE IF NOT EXISTS realtime_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- page_view, click, scroll, form_submit, etc.
    event_data JSONB,
    session_id VARCHAR(255),
    page_url VARCHAR(500),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User journey funnel table
CREATE TABLE IF NOT EXISTS user_journey_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES user_journeys(id) ON DELETE CASCADE,
    funnel_step VARCHAR(100) NOT NULL, -- awareness, interest, consideration, intent, evaluation, purchase
    action_type VARCHAR(50), -- page_view, click, scroll, form_submit, etc.
    page_url VARCHAR(500),
    element_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics aggregation cache table
CREATE TABLE IF NOT EXISTS analytics_aggregation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- user_behavior, campaign_performance, ab_test_results
    time_range VARCHAR(50) NOT NULL, -- hourly, daily, weekly, monthly
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    aggregated_data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_user_id ON user_behavior_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_timestamp ON user_behavior_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_event_type ON user_behavior_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_analytics_campaign_id ON campaign_performance_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_realtime_analytics_events_user_id ON realtime_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_analytics_events_timestamp ON realtime_analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_realtime_analytics_events_processed ON realtime_analytics_events(processed);
CREATE INDEX IF NOT EXISTS idx_user_journey_funnel_user_id ON user_journey_funnel(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_funnel_journey_id ON user_journey_funnel(journey_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_funnel_timestamp ON user_journey_funnel(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregation_cache_user_id ON analytics_aggregation_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregation_cache_metric_type ON analytics_aggregation_cache(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregation_cache_time_range ON analytics_aggregation_cache(time_range);

-- Comments for documentation
COMMENT ON TABLE user_behavior_analytics IS 'User behavior analytics tracking (page views, clicks, scrolls, etc.)';
COMMENT ON TABLE campaign_performance_analytics IS 'Campaign performance metrics (open rates, click rates, conversions)';
COMMENT ON TABLE ab_test_results IS 'A/B test results and statistical significance';
COMMENT ON TABLE realtime_analytics_events IS 'Real-time analytics event stream (unprocessed events)';
COMMENT ON TABLE user_journey_funnel IS 'User journey funnel tracking (awareness to purchase)';
COMMENT ON TABLE analytics_aggregation_cache IS 'Analytics data aggregation cache for performance';
