-- Integration marketplace tables for Phase 7
-- Migration: 013_create_integration_tables.sql

-- External integrations table
CREATE TABLE IF NOT EXISTS external_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- google_analytics, facebook_ads, shopify, zapier, webflow, custom
    integration_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    icon_url VARCHAR(500),
    description TEXT,
    api_config JSONB NOT NULL, -- API keys, endpoints, webhooks
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived, error
    capabilities JSONB, -- Available features and actions
    rate_limits JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    usage_stats JSONB, -- Usage metrics and costs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Integration triggers table
CREATE TABLE IF NOT EXISTS integration_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES external_integrations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL, -- event, scheduled, webhook, manual
    trigger_config JSONB NOT NULL,
    target_actions JSONB NOT NULL, -- Actions to perform when trigger fires
    filters JSONB, -- Conditions to filter when trigger should fire
    status VARCHAR(50) DEFAULT 'active', -- active, paused, disabled
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Integration logs table
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES external_integrations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trigger_id UUID REFERENCES integration_triggers(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(50) NOT NULL, -- pending, success, failed, cancelled
    http_status INTEGER,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plugin configurations table
CREATE TABLE IF NOT EXISTS plugin_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plugin_name VARCHAR(255) NOT NULL,
    plugin_version VARCHAR(50),
    config_json JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, beta, deprecated
    permissions JSONB,
    rate_limits JSONB,
    usage_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API proxy configuration table
CREATE TABLE IF NOT EXISTS api_proxy_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    proxy_url VARCHAR(500),
    api_key_encrypted TEXT,
    cache_ttl_seconds INTEGER DEFAULT 300,
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    allowed_methods TEXT[], -- GET, POST, PUT, DELETE, etc.
    request_rules JSONB, -- Request validation and transformation rules
    response_rules JSONB, -- Response caching and transformation rules
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_external_integrations_user_id ON external_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_external_integrations_type ON external_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_external_integrations_status ON external_integrations(status);
CREATE INDEX IF NOT EXISTS idx_integration_triggers_integration_id ON integration_triggers(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_triggers_user_id ON integration_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_triggers_status ON integration_triggers(status);
CREATE INDEX IF NOT EXISTS idx_integration_triggers_last_triggered_at ON integration_triggers(last_triggered_at);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_user_id ON integration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_trigger_id ON integration_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_plugin_configurations_user_id ON plugin_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_plugin_configurations_plugin_name ON plugin_configurations(plugin_name);
CREATE INDEX IF NOT EXISTS idx_plugin_configurations_status ON plugin_configurations(status);
CREATE INDEX IF NOT EXISTS idx_api_proxy_configuration_user_id ON api_proxy_configuration(user_id);
CREATE INDEX IF NOT EXISTS idx_api_proxy_configuration_service_name ON api_proxy_configuration(service_name);
CREATE INDEX IF NOT EXISTS idx_api_proxy_configuration_status ON api_proxy_configuration(status);

-- Comments for documentation
COMMENT ON TABLE external_integrations IS 'External integrations marketplace (Google Analytics, Facebook Ads, etc.)';
COMMENT ON TABLE integration_triggers IS 'Integration triggers for event-based automation';
COMMENT ON TABLE integration_logs IS 'Integration execution logs for debugging and monitoring';
COMMENT ON TABLE plugin_configurations IS 'Plugin configurations for extensibility';
COMMENT ON TABLE api_proxy_configuration IS 'API proxy configuration for rate limiting and caching';
