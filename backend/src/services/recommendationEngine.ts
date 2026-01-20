// Recommendation Engine for Product Suggestions
// Provides intelligent product recommendations based on user attributes and behavior

import {
  Product,
  ProductCategory,
  SubscriptionTier,
  UserAttributes,
  RecommendationResult,
  ProductRecommendation,
  RecommendationWeights,
  MOCK_PRODUCTS,
} from '../types/products';

/**
 * Recommendation Engine Service
 * Analyzes user attributes to recommend optimal products and tiers
 */
class RecommendationEngine {
  private readonly DEFAULT_WEIGHTS: RecommendationWeights = {
    businessSizeMatch: 0.3,
    usagePatternMatch: 0.25,
    featureRelevance: 0.2,
    budgetFit: 0.15,
    popularityBoost: 0.05,
    newProductBoost: 0.03,
    upgradePathBonus: 0.02,
  };

  /**
   * Get personalized product recommendations for a user
   */
  async getRecommendations(
    userAttributes: UserAttributes,
    weights?: Partial<RecommendationWeights>,
    options?: {
      limit?: number;
      excludePurchased?: boolean;
      onlyAffordable?: boolean;
    }
  ): Promise<RecommendationResult> {
    const effectiveWeights = { ...this.DEFAULT_WEIGHTS, ...weights };
    const opts = {
      limit: 5,
      excludePurchased: true,
      onlyAffordable: true,
      ...options,
    };

    // Filter products based on options
    let products = [...MOCK_PRODUCTS];

    if (opts.excludePurchased && userAttributes.pastPurchases) {
      products = products.filter(
        (p) => !userAttributes.pastPurchases?.includes(p.id)
      );
    }

    // Calculate scores for all products
    const scoredProducts = products.map((product) => {
      const { tier, score, reasons, matchStrength } = this.calculateProductScore(
        product,
        userAttributes,
        effectiveWeights
      );

      const recommendation: ProductRecommendation = {
        product,
        tier,
        score,
        reasons,
        matchStrength,
      };

      return recommendation;
    });

    // Sort by score (descending)
    scoredProducts.sort((a, b) => b.score - a.score);

    // Take top N recommendations
    const topRecommendations = scoredProducts.slice(0, opts.limit);

    // Generate overall reasoning
    const reasoning = this.generateRecommendationReasoning(
      topRecommendations,
      userAttributes
    );

    // Calculate overall confidence based on top recommendation score
    const confidence =
      topRecommendations.length > 0 ? topRecommendations[0].score : 0;

    return {
      userId: userAttributes.userId,
      products: topRecommendations,
      reasoning,
      confidence,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate relevance score for a single product
   */
  private calculateProductScore(
    product: Product,
    user: UserAttributes,
    weights: RecommendationWeights
  ): {
    tier: SubscriptionTier;
    score: number;
    reasons: string[];
    matchStrength: 'high' | 'medium' | 'low';
  } {
    let score = 0;
    const reasons: string[] = [];

    // 1. Business Size Match
    const businessSizeScore = this.calculateBusinessSizeMatch(
      product,
      user.businessSize
    );
    score += businessSizeScore * weights.businessSizeMatch;
    if (businessSizeScore > 0.5) {
      reasons.push(
        `ビジネスサイズ（${user.businessSize || '不明'}）に適しています`
      );
    }

    // 2. Usage Pattern Match
    const usagePatternScore = this.calculateUsagePatternMatch(product, user);
    score += usagePatternScore * weights.usagePatternMatch;
    if (usagePatternScore > 0.5) {
      reasons.push('使用パターンに基づき、お勧めの機能が含まれています');
    }

    // 3. Feature Relevance based on tags/interests
    const featureRelevanceScore = this.calculateFeatureRelevance(product, user);
    score += featureRelevanceScore * weights.featureRelevance;
    if (featureRelevanceScore > 0.5) {
      reasons.push('興味関心に合致する機能があります');
    }

    // 4. Budget Fit
    let budgetScore = 1.0;
    if (user.budgetRange && opts.onlyAffordable) {
      budgetScore = this.calculateBudgetFit(product, user.budgetRange);
      if (budgetScore > 0.5) {
        reasons.push('予算内のプランがあります');
      }
    }
    score += budgetScore * weights.budgetFit;

    // 5. Popularity Boost (social proof)
    score += product.popularityScore * weights.popularityBoost;
    if (product.popularityScore > 0.8) {
      reasons.push('人気の高い製品です');
    }

    // 6. New Product Boost (for users without purchases)
    const newProductScore =
      !user.pastPurchases || user.pastPurchases.length === 0 ? 1 : 0;
    score += newProductScore * weights.newProductBoost;

    // 7. Upgrade Path Bonus (for users with past purchases)
    const upgradeScore = this.calculateUpgradePathScore(product, user);
    score += upgradeScore * weights.upgradePathBonus;
    if (upgradeScore > 0.5) {
      reasons.push('既存のプランからのアップグレードが可能です');
    }

    // Determine best tier
    const tier = this.recommendTier(product, user, budgetScore);

    // Determine match strength
    let matchStrength: 'high' | 'medium' | 'low';
    if (score >= 0.75) {
      matchStrength = 'high';
    } else if (score >= 0.5) {
      matchStrength = 'medium';
    } else {
      matchStrength = 'low';
    }

    return { tier, score, reasons, matchStrength };
  }

  /**
   * Calculate business size match score
   */
  private calculateBusinessSizeMatch(
    product: Product,
    userBusinessSize?: string
  ): number {
    if (!userBusinessSize) {
      return 0.5; // Neutral score if unknown
    }

    return product.targetAudience.includes(userBusinessSize as any) ? 1.0 : 0.2;
  }

  /**
   * Calculate usage pattern match score
   */
  private calculateUsagePatternMatch(product: Product, user: UserAttributes): number {
    let matchScore = 0;

    // Check if product category matches user's usage
    switch (product.category) {
      case 'automation':
        if (user.hasUsedAutomation) {
          matchScore += 0.8;
        }
        if (user.averageMonthlyPosts > 0 || user.averageMonthlyDMs > 0) {
          matchScore += 0.6;
        }
        break;
      case 'analytics':
        if (user.hasUsedAnalytics) {
          matchScore += 0.8;
        }
        break;
      case 'engagement':
        if (user.hasUsedEngagement) {
          matchScore += 0.8;
        }
        if (user.instagramAccounts > 0) {
          matchScore += 0.5;
        }
        break;
      case 'growth':
        // Growth is good for everyone
        matchScore += 0.7;
        if (user.averageMonthlyPosts > 10) {
          matchScore += 0.3;
        }
        break;
      case 'enterprise':
        if (user.businessSize === 'enterprise') {
          matchScore += 0.9;
        }
        break;
    }

    return Math.min(matchScore, 1.0);
  }

  /**
   * Calculate feature relevance based on tags and interests
   */
  private calculateFeatureRelevance(product: Product, user: UserAttributes): number {
    const userTags = new Set([...user.tags, ...(user.interests || [])]);
    const productTags = new Set(product.tags);

    let overlap = 0;
    for (const tag of userTags) {
      if (productTags.has(tag)) {
        overlap++;
      }
    }

    // Calculate overlap ratio
    const maxPossibleOverlap = userTags.size || 1;
    const overlapRatio = overlap / maxPossibleOverlap;

    return overlapRatio;
  }

  /**
   * Calculate budget fit score
   */
  private calculateBudgetFit(
    product: Product,
    budgetRange: { min: number; max: number }
  ): number {
    // Check if any tier fits within budget
    for (const tier of product.tiers) {
      const price = tier.price.monthly;
      if (price >= budgetRange.min && price <= budgetRange.max) {
        return 1.0;
      }
    }

    // If no exact fit, check closest match
    const allPrices = product.tiers.map((t) => t.price.monthly);
    const minProductPrice = Math.min(...allPrices);

    if (minProductPrice > budgetRange.max) {
      // All prices are above budget
      return 0.1;
    }

    const maxProductPrice = Math.max(...allPrices);
    if (maxProductPrice < budgetRange.min) {
      // All prices are below budget range
      return 0.3;
    }

    return 0.5;
  }

  /**
   * Calculate upgrade path bonus for existing customers
   */
  private calculateUpgradePathScore(product: Product, user: UserAttributes): number {
    if (!user.pastPurchases || user.pastPurchases.length === 0) {
      return 0;
    }

    // Check if this product is a logical upgrade path
    // For example, if user has "automation-standard", "growth-bundle" would be a good upgrade
    const hasStandardAutomation = user.pastPurchases.includes('automation-standard');
    const hasEngagementGrowth = user.pastPurchases.includes('engagement-growth');

    if (product.id === 'growth-bundle' && (hasStandardAutomation || hasEngagementGrowth)) {
      return 1.0;
    }

    if (product.id === 'analytics-pro' && hasStandardAutomation) {
      return 0.8;
    }

    if (product.id === 'enterprise-suite' && user.pastPurchases.length > 0) {
      return 0.7;
    }

    return 0;
  }

  /**
   * Recommend appropriate tier based on user profile
   */
  private recommendTier(
    product: Product,
    user: UserAttributes,
    budgetScore: number
  ): SubscriptionTier {
    // Determine base tier based on business size and usage
    let recommendedTier: SubscriptionTier = 'starter';

    switch (user.businessSize) {
      case 'enterprise':
        recommendedTier = 'enterprise';
        break;
      case 'medium':
        recommendedTier = 'professional';
        break;
      case 'small':
        recommendedTier = 'professional';
        break;
      case 'solo':
        recommendedTier = 'starter';
        break;
    }

    // Adjust based on usage volume
    if (user.instagramAccounts > 3 || user.averageMonthlyPosts > 100) {
      recommendedTier = 'enterprise';
    } else if (user.instagramAccounts > 1 || user.averageMonthlyPosts > 30) {
      recommendedTier = 'professional';
    }

    // Adjust based on budget
    if (budgetScore < 0.5 && recommendedTier !== 'starter') {
      // Downgrade if budget doesn't match
      const tierOrder: SubscriptionTier[] = ['starter', 'professional', 'enterprise'];
      const currentIndex = tierOrder.indexOf(recommendedTier);
      if (currentIndex > 0) {
        recommendedTier = tierOrder[currentIndex - 1];
      }
    }

    // Ensure the recommended tier exists for this product
    const availableTiers = product.tiers.map((t) => t.tier);
    if (!availableTiers.includes(recommendedTier)) {
      // Fall back to most popular or highest available tier
      const popularTier = product.tiers.find((t) => t.isPopular);
      if (popularTier) {
        recommendedTier = popularTier.tier;
      } else {
        recommendedTier = availableTiers[availableTiers.length - 1];
      }
    }

    return recommendedTier;
  }

  /**
   * Generate overall recommendation reasoning
   */
  private generateRecommendationReasoning(
    recommendations: ProductRecommendation[],
    user: UserAttributes
  ): string {
    if (recommendations.length === 0) {
      return '現状、条件に合う製品が見つかりませんでした。カスタマーサポートまでお問い合わせください。';
    }

    const topProduct = recommendations[0];
    const reasons: string[] = [];

    // Add top reasons from the best product
    if (topProduct.matchStrength === 'high') {
      reasons.push(
        `${topProduct.product.name}は、お客様の状況に非常に適しています。`
      );
    }

    // Add user-specific insights
    if (user.instagramAccounts > 0) {
      reasons.push(`現在${user.instagramAccounts}つのInstagramアカウントをお持ちです。`);
    }

    if (user.averageMonthlyPosts > 0) {
      reasons.push(
        `月平均${user.averageMonthlyPosts}回の投稿実績があります。`
      );
    }

    if (user.hasUsedAutomation) {
      reasons.push('自動化機能をご活用されているため、高度な機能もご満足いただけると考えられます。');
    }

    // Add business size context
    if (user.businessSize) {
      const businessSizeMap: Record<string, string> = {
        solo: '個人',
        small: '小規模ビジネス',
        medium: '中規模ビジネス',
        enterprise: '大企業',
      };
      reasons.push(
        `${businessSizeMap[user.businessSize]}様向けのプランをご提案しています。`
      );
    }

    // Add conversion funnel context
    if (user.conversionFunnelStage === 'decision') {
      reasons.push('最終的な決定段階に基づき、最適なプランを選定しました。');
    }

    return reasons.join('\n\n');
  }

  /**
   * Get all available products
   */
  getAllProducts(): Product[] {
    return [...MOCK_PRODUCTS];
  }

  /**
   * Get product by ID
   */
  getProductById(productId: string): Product | undefined {
    return MOCK_PRODUCTS.find((p) => p.id === productId);
  }

  /**
   * Get products by category
   */
  getProductsByCategory(category: ProductCategory): Product[] {
    return MOCK_PRODUCTS.filter((p) => p.category === category);
  }

  /**
   * Get products by tier
   */
  getProductsByTier(tier: SubscriptionTier): Product[] {
    return MOCK_PRODUCTS.filter((p) => p.tiers.some((t) => t.tier === tier));
  }

  /**
   * Get popular products
   */
  getPopularProducts(threshold: number = 0.75): Product[] {
    return MOCK_PRODUCTS.filter((p) => p.popularityScore >= threshold);
  }

  /**
   * Search products by name or description
   */
  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

// Export singleton instance
const opts = { onlyAffordable: true };
export default new RecommendationEngine();
