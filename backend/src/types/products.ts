// Product Types for Recommendation Engine

/**
 * Product category
 */
export type ProductCategory =
  | 'automation'
  | 'analytics'
  | 'engagement'
  | 'growth'
  | 'enterprise';

/**
 * Product pricing model
 */
export type PricingModel = 'subscription' | 'usage_based' | 'one_time' | 'free';

/**
 * Product subscription tier
 */
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

/**
 * Product definition
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  pricingModel: PricingModel;
  tiers: ProductTier[];
  features: string[];
  tags: string[];
  targetAudience: string[];
  popularityScore: number; // 0-1, based on usage data
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product tier pricing details
 */
export interface ProductTier {
  tier: SubscriptionTier;
  name: string;
  price: {
    monthly: number;
    yearly?: number;
    currency: string;
  };
  features: string[];
  limits?: {
    users?: number;
    instagramAccounts?: number;
    monthlyPosts?: number;
    monthlyDMs?: number;
    apiCalls?: number;
  };
  isPopular?: boolean;
}

/**
 * User attributes for recommendation
 */
export interface UserAttributes {
  userId: string;
  accountAge: number; // in days
  instagramAccounts: number;
  averageMonthlyPosts: number;
  averageMonthlyDMs: number;
  hasUsedAutomation: boolean;
  hasUsedAnalytics: boolean;
  hasUsedEngagement: boolean;
  tags: string[];
  pastPurchases?: string[]; // product IDs
  interests?: string[];
  businessSize?: 'solo' | 'small' | 'medium' | 'enterprise';
  budgetRange?: {
    min: number;
    max: number;
  };
  lastActivity?: Date;
  conversionFunnelStage?: 'awareness' | 'consideration' | 'decision' | 'retention';
}

/**
 * Recommendation result
 */
export interface RecommendationResult {
  userId: string;
  products: ProductRecommendation[];
  reasoning: string;
  confidence: number; // 0-1
  timestamp: Date;
}

/**
 * Individual product recommendation
 */
export interface ProductRecommendation {
  product: Product;
  tier: SubscriptionTier;
  score: number; // 0-1, relevance score
  reasons: string[];
  matchStrength: 'high' | 'medium' | 'low';
}

/**
 * Recommendation criteria weights
 */
export interface RecommendationWeights {
  businessSizeMatch: number;
  usagePatternMatch: number;
  featureRelevance: number;
  budgetFit: number;
  popularityBoost: number;
  newProductBoost: number; // For users who haven't purchased yet
  upgradePathBonus: number; // For existing users
}

/**
 * Mock product data
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'automation-standard',
    name: 'Automation Standard',
    description:
      'DM、コメント、投稿の自動化を基本機能で実現。小規模〜中規模のビジネスに最適。',
    category: 'automation',
    pricingModel: 'subscription',
    tiers: [
      {
        tier: 'starter',
        name: 'Starter',
        price: { monthly: 5000, yearly: 50000, currency: 'JPY' },
        features: [
          'DM自動応答（月1000件まで）',
          'コメント自動返信（月500件まで）',
          '基本ワークフロー（5個まで）',
          '1つのInstagramアカウント管理',
        ],
        limits: {
          instagramAccounts: 1,
          monthlyPosts: 30,
          monthlyDMs: 1000,
        },
      },
      {
        tier: 'professional',
        name: 'Professional',
        price: { monthly: 15000, yearly: 150000, currency: 'JPY' },
        features: [
          'DM自動応答（月5000件まで）',
          'コメント自動返信（月2000件まで）',
          '高度なワークフロー（20個まで）',
          '3つのInstagramアカウント管理',
          'AI応答テンプレート',
          'カスタムインテグレーション',
        ],
        isPopular: true,
        limits: {
          instagramAccounts: 3,
          monthlyPosts: 100,
          monthlyDMs: 5000,
        },
      },
    ],
    features: ['dm_automation', 'comment_automation', 'workflow', 'ai_templates'],
    tags: ['automation', 'efficiency', 'dm', 'comment'],
    targetAudience: ['small', 'medium', 'solo'],
    popularityScore: 0.85,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: 'analytics-pro',
    name: 'Analytics Pro',
    description: '高度なアナリティクスとレポート機能。データ駆動の意思決定をサポート。',
    category: 'analytics',
    pricingModel: 'subscription',
    tiers: [
      {
        tier: 'professional',
        name: 'Professional',
        price: { monthly: 12000, yearly: 120000, currency: 'JPY' },
        features: [
          'リアルタイムアナリティクス',
          'カスタムダッシュボード（10個まで）',
          'エンゲージメント分析',
          '成長トレンド予測',
          'エクスポート機能（CSV/PDF）',
          'レポート自動配信',
        ],
        isPopular: true,
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        price: { monthly: 30000, yearly: 300000, currency: 'JPY' },
        features: [
          'Professionalプランの全機能',
          '無制限ダッシュボード',
          '高度な予測分析',
          'ホワイトラベルレポート',
          'APIアクセス',
          '専任サポート',
        ],
        limits: { apiCalls: 100000 },
      },
    ],
    features: [
      'realtime_analytics',
      'custom_dashboards',
      'engagement_analysis',
      'growth_prediction',
    ],
    tags: ['analytics', 'data', 'insights', 'reporting'],
    targetAudience: ['medium', 'enterprise'],
    popularityScore: 0.78,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-11-20'),
  },
  {
    id: 'engagement-growth',
    name: 'Engagement Growth',
    description:
      'フォロワー増強とエンゲージメント向上に特化した機能。オーディエンス構築を加速。',
    category: 'engagement',
    pricingModel: 'subscription',
    tiers: [
      {
        tier: 'starter',
        name: 'Starter',
        price: { monthly: 3000, yearly: 30000, currency: 'JPY' },
        features: [
          'インフルエンサー発見ツール',
          'ハッシュタグ最適化',
          'ベスト投稿時間分析',
          '基本的なフォロワー分析',
        ],
        limits: { instagramAccounts: 1, monthlyPosts: 30 },
      },
      {
        tier: 'professional',
        name: 'Professional',
        price: { monthly: 10000, yearly: 100000, currency: 'JPY' },
        features: [
          'Starterプランの全機能',
          'AIによるオーディエンス分析',
          '競合他社比較',
          '自動コメント戦略',
          'キャンペーン管理',
        ],
        isPopular: true,
        limits: { instagramAccounts: 3, monthlyPosts: 100 },
      },
    ],
    features: [
      'influencer_discovery',
      'hashtag_optimization',
      'audience_analysis',
      'competitor_analysis',
    ],
    tags: ['growth', 'engagement', 'followers', 'influencers'],
    targetAudience: ['solo', 'small', 'medium'],
    popularityScore: 0.72,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-15'),
  },
  {
    id: 'growth-bundle',
    name: 'Growth Bundle',
    description: 'Automation + Engagement Growth の最強組み合わせ。急速な成長を。',
    category: 'growth',
    pricingModel: 'subscription',
    tiers: [
      {
        tier: 'professional',
        name: 'Professional',
        price: { monthly: 20000, yearly: 200000, currency: 'JPY' },
        features: [
          'Automation Standard Professionalプランの全機能',
          'Engagement Growth Professionalプランの全機能',
          '統合ダッシュボード',
          'クロス機能ワークフロー',
        ],
        isPopular: true,
        limits: { instagramAccounts: 3, monthlyPosts: 100, monthlyDMs: 5000 },
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        price: { monthly: 50000, yearly: 500000, currency: 'JPY' },
        features: [
          'Professionalプランの全機能',
          '無制限ワークフロー',
          'ホワイトラベル機能',
          'APIアクセス',
          '専任アカウントマネージャー',
          '24/7サポート',
        ],
        limits: { apiCalls: 100000 },
      },
    ],
    features: [
      'full_automation',
      'engagement_tools',
      'analytics',
      'integrated_dashboard',
    ],
    tags: ['bundle', 'growth', 'automation', 'engagement'],
    targetAudience: ['small', 'medium', 'enterprise'],
    popularityScore: 0.90,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: 'enterprise-suite',
    name: 'Enterprise Suite',
    description:
      '大規模組織向けのフル機能スイート。高度なセキュリティ、API統合、専任サポート。',
    category: 'enterprise',
    pricingModel: 'subscription',
    tiers: [
      {
        tier: 'enterprise',
        name: 'Enterprise',
        price: { monthly: 100000, yearly: 1000000, currency: 'JPY' },
        features: [
          '全製品の全機能',
          '無制限Instagramアカウント',
          'SSO（Single Sign-On）',
          '高度なセキュリティとコンプライアンス',
          'カスタムSLA',
          '専任アカウントマネージャー',
          '24/7優先サポート',
          'フルAPIアクセスとWebhook',
          'オンプレミス展開オプション',
          'トレーニングと導入サポート',
        ],
        limits: { apiCalls: 1000000 },
      },
    ],
    features: [
      'full_suite',
      'enterprise_security',
      'sso',
      'api_access',
      'dedicated_support',
    ],
    tags: ['enterprise', 'security', 'api', 'support'],
    targetAudience: ['enterprise'],
    popularityScore: 0.65,
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-11-30'),
  },
];
