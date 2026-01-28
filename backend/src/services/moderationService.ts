import { query } from '../config/database';
import AIService from './aiService';

interface ModerationResult {
  is_spam: boolean;
  is_inappropriate: boolean;
  toxicity_score: number;
  confidence: number;
  flagged_content: string[];
}

interface ModerationAction {
  action: 'allow' | 'flag' | 'remove' | 'warn';
  reason?: string;
}

class ModerationService {
  /**
   * Moderate content using AI
   */
  async moderateContent(content: string, context?: any): Promise<ModerationResult> {
    if (!content || content.trim().length === 0) {
      return {
        is_spam: false,
        is_inappropriate: false,
        toxicity_score: 0,
        confidence: 0,
        flagged_content: [],
      };
    }

    try {
      // Use AI to analyze content
      const toxicityScore = await this.analyzeToxicity(content);
      const spamScore = await this.detectSpam(content, context);
      const inappropriateScore = await this.detectInappropriate(content);

      const overallScore = Math.max(toxicityScore, spamScore, inappropriateScore);
      
      return {
        is_spam: spamScore > 0.7,
        is_inappropriate: inappropriateScore > 0.7,
        toxicity_score: overallScore,
        confidence: Math.min(toxicityScore + 0.2, 1.0),
        flagged_content: this.getFlaggedReasons(toxicityScore, spamScore, inappropriateScore),
      };
    } catch (error: any) {
      console.error('Moderation error:', error);
      throw new Error('Failed to moderate content');
    }
  }

  /**
   * Analyze toxicity of content
   */
  private async analyzeToxicity(content: string): Promise<number> {
    // Simple rule-based analysis (can be replaced with AI)
    const toxicKeywords = ['hate', 'abuse', 'violence', 'kill', 'threat', 'harass'];
    let toxicityScore = 0;

    const lowerContent = content.toLowerCase();
    for (const keyword of toxicKeywords) {
      if (lowerContent.includes(keyword)) {
        toxicityScore += 0.3;
      }
    }

    return Math.min(toxicityScore, 1.0);
  }

  /**
   * Detect spam patterns
   */
  private async detectSpam(content: string, context?: any): Promise<number> {
    let spamScore = 0;

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7) {
      spamScore += 0.3;
    }

    // Check for excessive links
    const linkCount = (content.match(/https?:\/\/\S+/g) || []).length;
    if (linkCount > 3) {
      spamScore += 0.3;
    }

    // Check for repetitive content
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 5 && uniqueWords.size / words.length < 0.5) {
      spamScore += 0.2;
    }

    // Check for spam keywords
    const spamKeywords = ['buy now', 'free money', 'click here', 'act fast', 'limited time'];
    const lowerContent = content.toLowerCase();
    for (const keyword of spamKeywords) {
      if (lowerContent.includes(keyword)) {
        spamScore += 0.4;
      }
    }

    return Math.min(spamScore, 1.0);
  }

  /**
   * Detect inappropriate content
   */
  private async detectInappropriate(content: string): Promise<number> {
    const inappropriateKeywords = [
      'nsfw', 'adult', 'explicit', 'sexual', 'nude', 'porn',
      'drug', 'illegal', 'violence', 'weapon'
    ];
    
    let score = 0;
    const lowerContent = content.toLowerCase();
    
    for (const keyword of inappropriateKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 0.5;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get flagged reasons
   */
  private getFlaggedReasons(toxicity: number, spam: number, inappropriate: number): string[] {
    const reasons: string[] = [];
    
    if (spam > 0.5) {
      reasons.push('Potential spam content');
    }
    if (toxicity > 0.3) {
      reasons.push('Potentially harmful content');
    }
    if (inappropriate > 0.5) {
      reasons.push('Inappropriate content');
    }

    return reasons;
  }

  /**
   * Determine moderation action
   */
  async getModerationAction(content: string, context?: any): Promise<ModerationAction> {
    const result = await this.moderateContent(content, context);

    if (result.toxicity_score > 0.8) {
      return {
        action: 'remove',
        reason: result.flagged_content.join(', '),
      };
    }

    if (result.toxicity_score > 0.5) {
      return {
        action: 'flag',
        reason: result.flagged_content.join(', '),
      };
    }

    if (result.is_spam) {
      return {
        action: 'flag',
        reason: 'Detected spam content',
      };
    }

    return {
      action: 'allow',
      reason: undefined,
    };
  }

  /**
   * Batch moderate multiple content items
   */
  async batchModerate(contents: { id: string; content: string; context?: any }[]): Promise<Map<string, ModerationResult>> {
    const results = new Map<string, ModerationResult>();

    for (const item of contents) {
      const result = await this.moderateContent(item.content, item.context);
      results.set(item.id, result);
    }

    return results;
  }
}

export default new ModerationService();
