-- Migration: 014_create_ai_enhancement_tables.sql
-- Phase A, B, C, D, E: AI Workflow Enhancement Tables
-- Date: January 29, 2026

-- ============================================
-- 自然言語ワークフロー生成関連テーブル
-- ============================================

-- NL Workflow Generations
CREATE TABLE IF NOT EXISTS nl_workflow_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'ja',
    target_platform VARCHAR(50) DEFAULT 'instagram',
    generated_workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    confidence DECIMAL(5,2),
    alternatives JSONB,
    explanation TEXT,
    applied BOOLEAN DEFAULT false,
    parsing_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AI意思決定関連テーブル
-- ============================================

-- AI Decisions
CREATE TABLE IF NOT EXISTS ai_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_execution_id UUID REFERENCES automation_execution_logs(id) ON DELETE SET NULL,
    node_id UUID REFERENCES automation_workflow_steps(id) ON DELETE SET NULL,
    decision JSONB NOT NULL,
    confidence DECIMAL(5,2),
    reasoning TEXT,
    alternatives JSONB,
    applied BOOLEAN DEFAULT false,
    outcome JSONB,
    enriched_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Decision Feedback
CREATE TABLE IF NOT EXISTS ai_decision_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES ai_decisions(id) ON DELETE CASCADE,
    user_correction TEXT,
    actual_outcome VARCHAR(50), -- positive, neutral, negative
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- スマート推奨システム関連テーブル
-- ============================================

-- Workflow Recommendations
CREATE TABLE IF NOT EXISTS workflow_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50), -- pattern, performance, trend, personalized
    recommended_workflow JSONB NOT NULL,
    reason TEXT,
    expected_impact JSONB,
    difficulty VARCHAR(20), -- easy, medium, advanced
    tags JSONB,
    viewed BOOLEAN DEFAULT false,
    applied BOOLEAN DEFAULT false,
    dismissed BOOLEAN DEFAULT false,
    source VARCHAR(100), -- ai_generated, pattern_analysis, similar_users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 会話文脈保持関連テーブル
-- ============================================

-- Conversation Contexts
CREATE TABLE IF NOT EXISTS conversation_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ig_user_id VARCHAR(255),
    summary JSONB NOT NULL,
    intent JSONB NOT NULL,
    sentiment JSONB NOT NULL,
    entities JSONB,
    funnel_stage VARCHAR(50), -- awareness, consideration, decision, purchase, retention
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

-- ============================================
-- ワークフロー最適化関連テーブル
-- ============================================

-- Workflow Optimizations
CREATE TABLE IF NOT EXISTS workflow_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    original_metrics JSONB NOT NULL,
    proposed_changes JSONB NOT NULL,
    expected_improvement JSONB NOT NULL,
    confidence DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, applied
    user_feedback TEXT,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- A/B Test Results
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optimization_id UUID REFERENCES workflow_optimizations(id) ON DELETE CASCADE,
    variant_id VARCHAR(100),
    metrics JSONB NOT NULL,
    is_winner BOOLEAN DEFAULT false,
    confidence DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Behavior Patterns
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50), -- send_dm, reply_comment, like, follow, create_post
    frequency INTEGER DEFAULT 1,
    time_of_day INTEGER,
    day_of_week INTEGER,
    success_rate DECIMAL(5,2) DEFAULT 1.0,
    avg_response_time INTEGER,
    last_performed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Execution History
CREATE TABLE IF NOT EXISTS execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    nodes_executed INTEGER,
    trigger_data JSONB,
    variables JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- インデックス作成
-- ============================================

-- NL Workflow Generations
CREATE INDEX IF NOT EXISTS idx_nl_generations_user_id ON nl_workflow_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_nl_generations_applied ON nl_workflow_generations(applied);
CREATE INDEX IF NOT EXISTS idx_nl_generations_created_at ON nl_workflow_generations(created_at);

-- AI Decisions
CREATE INDEX IF NOT EXISTS idx_ai_decisions_execution_id ON ai_decisions(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_node_id ON ai_decisions(node_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_applied ON ai_decisions(applied);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_created_at ON ai_decisions(created_at);

-- AI Decision Feedback
CREATE INDEX IF NOT EXISTS idx_decision_feedback_decision_id ON ai_decision_feedback(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_feedback_created_at ON ai_decision_feedback(created_at);

-- Workflow Recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON workflow_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_applied ON workflow_recommendations(applied);
CREATE INDEX IF NOT EXISTS idx_recommendations_dismissed ON workflow_recommendations(dismissed);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON workflow_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON workflow_recommendations(created_at);

-- Conversation Contexts
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_conversation_id ON conversation_contexts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_user_id ON conversation_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_last_updated ON conversation_contexts(last_updated);

-- Workflow Optimizations
CREATE INDEX IF NOT EXISTS idx_optimizations_workflow_id ON workflow_optimizations(workflow_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_status ON workflow_optimizations(status);
CREATE INDEX IF NOT EXISTS idx_optimizations_created_at ON workflow_optimizations(created_at);

-- A/B Test Results
CREATE INDEX IF NOT EXISTS idx_ab_tests_optimization_id ON ab_test_results(optimization_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_is_winner ON ab_test_results(is_winner);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_at ON ab_test_results(created_at);

-- User Behavior Patterns
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_user_id ON user_behavior_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_action_type ON user_behavior_patterns(action_type);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_last_performed ON user_behavior_patterns(last_performed_at);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_created_at ON user_behavior_patterns(created_at);

-- Execution History
CREATE INDEX IF NOT EXISTS idx_execution_history_workflow_id ON execution_history(workflow_id);
CREATE INDEX IF NOT EXISTS idx_execution_history_user_id ON execution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_history_status ON execution_history(status);
CREATE INDEX IF NOT EXISTS idx_execution_history_start_time ON execution_history(start_time);

-- ============================================
-- コメント
-- ============================================

COMMENT ON TABLE nl_workflow_generations IS '自然言語からのワークフロー生成履歴';
COMMENT ON TABLE ai_decisions IS 'AIによる意思決定履歴';
COMMENT ON TABLE ai_decision_feedback IS 'AI意思決定のユーザーフィードバック';
COMMENT ON TABLE workflow_recommendations IS 'スマート推奨ワークフロー';
COMMENT ON TABLE conversation_contexts IS '会話の文脈と要約';
COMMENT ON TABLE workflow_optimizations IS 'ワークフロー最適化提案';
COMMENT ON TABLE ab_test_results IS 'A/Bテストの結果';
COMMENT ON TABLE user_behavior_patterns IS 'ユーザーの行動パターン分析';
COMMENT ON TABLE execution_history IS 'ワークフロー実行履歴';
