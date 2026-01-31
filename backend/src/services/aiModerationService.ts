import { query } from '../config/database';

export interface ModerationResult {
  isFlagged: boolean;
  isBlocked: boolean;
  toxicityScore: number;
  spamScore: number;
  reasons: string[];
  suggestedAction: 'none' | 'warn' | 'flag' | 'block';
}

export interface ContentToModerate {
  content: string;
  contentType: 'comment' | 'dm' | 'post' | 'topic' | 'reply';
  authorId?: string;
  contentId?: string;
}

// Spam keywords and patterns
const SPAM_PATTERNS = [
  /\b(buy now|click here|limited time|act now|order now)\b/gi,
  /(https?:\/\/[^\s]+){3,}/g, // Multiple URLs
  /\b(viagra|cialis|casino|lottery|winner|prize|million dollars)\b/gi,
  /[!?]{3,}/g, // Excessive punctuation
  /[A-Z]{5,}/g, // Excessive caps
  /\b(follow me|follow back|follow for follow|f4f)\b/gi,
];

// Inappropriate content keywords
const INAPPROPRIATE_PATTERNS = [
  /\b(hate|stupid|idiot|kill|die|death|violence)\b/gi,
  /\b(racist|sexist|homophobic)\b/gi,
  /\b(porn|xxx|adult|nude|naked)\b/gi,
];

/**
 * Calculate spam score based on content patterns
 */
export const calculateSpamScore = (content: string): number => {
  let score = 0;
  
  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      score += matches.length * 0.15;
    }
  }
  
  // Check for repetitive characters
  const repetitivePattern = /(.)\1{4,}/g;
  const repetitiveMatches = content.match(repetitivePattern);
  if (repetitiveMatches) {
    score += repetitiveMatches.length * 0.1;
  }
  
  // Check for excessive length (spam often very long)
  if (content.length > 1000) {
    score += 0.1;
  }
  
  // Check for all caps words ratio
  const words = content.split(/\s+/);
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase());
  if (words.length > 0 && capsWords.length / words.length > 0.5) {
    score += 0.2;
  }
  
  return Math.min(score, 1.0);
};

/**
 * Calculate toxicity score based on content
 */
export const calculateToxicityScore = (content: string): number => {
  let score = 0;
  
  // Check inappropriate patterns
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      score += matches.length * 0.25;
    }
  }
  
  // Check for aggressive punctuation
  const aggressivePattern = /[!?]{2,}/g;
  const aggressiveMatches = content.match(aggressivePattern);
  if (aggressiveMatches) {
    score += aggressiveMatches.length * 0.05;
  }
  
  // Check for negative sentiment words
  const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'disgusting', 'pathetic'];
  for (const word of negativeWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      score += matches.length * 0.1;
    }
  }
  
  return Math.min(score, 1.0);
};

/**
 * Get custom moderation rules for a user
 */
export const getUserModerationRules = async (userId: string): Promise<{
  blockSpam: boolean;
  blockToxic: boolean;
  spamThreshold: number;
  toxicityThreshold: number;
  blockedKeywords: string[];
}> => {
  // Default rules - could be customized per user in the future
  return {
    blockSpam: true,
    blockToxic: true,
    spamThreshold: 0.7,
    toxicityThreshold: 0.6,
    blockedKeywords: [],
  };
};

/**
 * Moderate content and return result
 */
export const moderateContent = async (
  content: ContentToModerate,
  userId?: string
): Promise<ModerationResult> => {
  const { content: text, contentType, authorId, contentId } = content;
  
  // Calculate scores
  const spamScore = calculateSpamScore(text);
  const toxicityScore = calculateToxicityScore(text);
  
  // Get user rules if available
  const rules = userId ? await getUserModerationRules(userId) : {
    blockSpam: true,
    blockToxic: true,
    spamThreshold: 0.7,
    toxicityThreshold: 0.6,
    blockedKeywords: [],
  };
  
  const reasons: string[] = [];
  let isFlagged = false;
  let isBlocked = false;
  let suggestedAction: 'none' | 'warn' | 'flag' | 'block' = 'none';
  
  // Check spam
  if (spamScore >= rules.spamThreshold) {
    isFlagged = true;
    reasons.push(`Spam detected (score: ${(spamScore * 100).toFixed(1)}%)`);
    if (rules.blockSpam && spamScore > 0.85) {
      isBlocked = true;
      suggestedAction = 'block';
    } else {
      suggestedAction = 'flag';
    }
  }
  
  // Check toxicity
  if (toxicityScore >= rules.toxicityThreshold) {
    isFlagged = true;
    reasons.push(`Potentially toxic content (score: ${(toxicityScore * 100).toFixed(1)}%)`);
    if (rules.blockToxic && toxicityScore > 0.8) {
      isBlocked = true;
      suggestedAction = 'block';
    } else if (suggestedAction !== 'block') {
      suggestedAction = suggestedAction === 'flag' ? 'block' : 'warn';
    }
  }
  
  // Check blocked keywords
  for (const keyword of rules.blockedKeywords) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      isFlagged = true;
      reasons.push(`Contains blocked keyword: ${keyword}`);
      suggestedAction = 'flag';
    }
  }
  
  // Log moderation action
  await logModerationAction({
    contentType,
    contentId: contentId || 'unknown',
    authorId: authorId || 'unknown',
    originalContent: text.substring(0, 500), // Store first 500 chars
    toxicityScore,
    spamScore,
    isFlagged,
    isBlocked,
    reason: reasons.join(', ') || undefined,
    actionTaken: suggestedAction,
  });
  
  return {
    isFlagged,
    isBlocked,
    toxicityScore,
    spamScore,
    reasons,
    suggestedAction,
  };
};

/**
 * Log moderation action to database
 */
export const logModerationAction = async (data: {
  contentType: string;
  contentId: string;
  authorId: string;
  originalContent: string;
  toxicityScore: number;
  spamScore: number;
  isFlagged: boolean;
  isBlocked: boolean;
  reason?: string;
  actionTaken: string;
  moderatedBy?: string;
  moderatorId?: string;
}): Promise<void> => {
  try {
    await query(
      `INSERT INTO moderation_logs 
       (content_type, content_id, author_id, original_content, toxicity_score, 
        spam_score, is_flagged, is_blocked, reason, action_taken, moderated_by, moderator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        data.contentType,
        data.contentId,
        data.authorId,
        data.originalContent,
        data.toxicityScore,
        data.spamScore,
        data.isFlagged,
        data.isBlocked,
        data.reason,
        data.actionTaken,
        data.moderatedBy || 'ai',
        data.moderatorId,
      ]
    );
  } catch (error) {
    console.error('Error logging moderation action:', error);
  }
};

/**
 * Get moderation logs for a user
 */
export const getModerationLogs = async (
  userId?: string,
  options: {
    limit?: number;
    offset?: number;
    contentType?: string;
    isFlagged?: boolean;
  } = {}
): Promise<{ logs: any[]; total: number }> => {
  const { limit = 50, offset = 0, contentType, isFlagged } = options;
  
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  
  if (userId) {
    params.push(userId);
    whereClause += ` AND author_id = $${params.length}`;
  }
  
  if (contentType) {
    params.push(contentType);
    whereClause += ` AND content_type = $${params.length}`;
  }
  
  if (isFlagged !== undefined) {
    params.push(isFlagged);
    whereClause += ` AND is_flagged = $${params.length}`;
  }
  
  const logsQuery = `
    SELECT * FROM moderation_logs 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  
  const countQuery = `SELECT COUNT(*) as total FROM moderation_logs ${whereClause}`;
  
  const [logsResult, countResult] = await Promise.all([
    query(logsQuery, [...params, limit, offset]),
    query(countQuery, params),
  ]);
  
  return {
    logs: logsResult.rows,
    total: parseInt(countResult.rows[0].total),
  };
};

/**
 * Batch moderate multiple content items
 */
export const batchModerate = async (
  items: ContentToModerate[],
  userId?: string
): Promise<{ results: ModerationResult[]; flaggedCount: number; blockedCount: number }> => {
  const results = await Promise.all(
    items.map(item => moderateContent(item, userId))
  );
  
  const flaggedCount = results.filter(r => r.isFlagged).length;
  const blockedCount = results.filter(r => r.isBlocked).length;
  
  return { results, flaggedCount, blockedCount };
};
