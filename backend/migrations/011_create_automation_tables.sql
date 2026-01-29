-- Automation tables for Phase 7
-- Migration: 011_create_automation_tables.sql

-- Automation workflows table
CREATE TABLE IF NOT EXISTS automation_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL, -- manual, scheduled, event_based, webhook_based, ai_decision
    trigger_config JSONB NOT NULL, -- Complex trigger configuration
    status VARCHAR(50) DEFAULT 'inactive', -- active, paused, archived, completed, failed
    steps JSONB NOT NULL, -- Workflow steps definition
    start_conditions JSONB, -- Conditions to start workflow
    end_conditions JSONB, -- Conditions to end workflow
    error_handling JSONB, -- Error handling rules
    retry_policy JSONB, -- Retry policy configuration
    metrics JSONB, -- Performance metrics
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Automation workflow steps table
CREATE TABLE IF NOT EXISTS automation_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES automation_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- action, decision, delay, webhook, api_call, ai_analysis
    step_config JSONB NOT NULL, -- Step-specific configuration
    dependencies JSONB, -- Other steps this step depends on
    conditions JSONB, -- Conditions to execute this step
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed, skipped
    result_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI decision rules table
CREATE TABLE IF NOT EXISTS ai_decision_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- content_quality, timing, audience, engagement, compliance
    rule_config JSONB NOT NULL, -- Rule parameters and thresholds
    conditions JSONB, -- Conditions to apply this rule
    actions JSONB NOT NULL, -- Actions to take when rule matches
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_applied_at TIMESTAMP WITH TIME ZONE,
    total_applied INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Automation execution logs table
CREATE TABLE IF NOT EXISTS automation_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES automation_workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    step_id UUID REFERENCES automation_workflow_steps(id) ON DELETE SET NULL,
    execution_type VARCHAR(50) NOT NULL, -- manual, scheduled, trigger_based, ai_based
    trigger_data JSONB,
    execution_status VARCHAR(50) NOT NULL, -- started, in_progress, completed, failed, cancelled
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    result_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content optimization rules table
CREATE TABLE IF NOT EXISTS content_optimization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- best_time, content_performance, engagement_prediction, a_b_testing
    rule_config JSONB NOT NULL,
    conditions JSONB,
    recommendations JSONB,
    confidence_score DECIMAL(5,2),
    applied_count INTEGER DEFAULT 0,
    last_applied_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_automation_workflows_user_id ON automation_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_status ON automation_workflows(status);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_next_run_at ON automation_workflows(next_run_at);
CREATE INDEX IF NOT EXISTS idx_automation_workflow_steps_workflow_id ON automation_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflow_steps_status ON automation_workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_automation_workflow_steps_step_order ON automation_workflow_steps(step_order);
CREATE INDEX IF NOT EXISTS idx_ai_decision_rules_user_id ON ai_decision_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_decision_rules_type ON ai_decision_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_ai_decision_rules_is_active ON ai_decision_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_decision_rules_priority ON ai_decision_rules(priority);
CREATE INDEX IF NOT EXISTS idx_automation_execution_logs_workflow_id ON automation_execution_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_execution_logs_user_id ON automation_execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_execution_logs_execution_status ON automation_execution_logs(execution_status);
CREATE INDEX IF NOT EXISTS idx_automation_execution_logs_start_time ON automation_execution_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_content_optimization_rules_user_id ON content_optimization_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_content_optimization_rules_type ON content_optimization_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_content_optimization_rules_is_active ON content_optimization_rules(is_active);

-- Comments for documentation
COMMENT ON TABLE automation_workflows IS 'Automation workflows with trigger conditions and AI-based decisions';
COMMENT ON TABLE automation_workflow_steps IS 'Individual workflow steps with dependencies and conditions';
COMMENT ON TABLE ai_decision_rules IS 'AI decision rules for content optimization and automation';
COMMENT ON TABLE automation_execution_logs IS 'Automation execution logs for tracking and debugging';
COMMENT ON TABLE content_optimization_rules IS 'Content optimization rules for timing, performance, and engagement';
