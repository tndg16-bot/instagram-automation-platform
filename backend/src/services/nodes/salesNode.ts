// Sales FAQ Node for Workflow System
// Handles question classification and response template selection for sales inquiries

import aiService from '../aiService';

/**
 * Question categories for sales FAQ
 */
export type QuestionCategory =
  | 'price'
  | 'reservation_method'
  | 'service_content'
  | 'general'
  | 'unknown';

/**
 * Sales FAQ Question input
 */
export interface SalesFAQInput {
  userId: string;
  question: string;
  context?: {
    previousMessages?: string[];
    userTags?: string[];
    userHistory?: string[];
  };
}

/**
 * Question classification result
 */
export interface QuestionClassification {
  category: QuestionCategory;
  confidence: number;
  keywords: string[];
  reasoning: string;
}

/**
 * Selected response template
 */
export interface ResponseTemplate {
  id: string;
  category: QuestionCategory;
  template: string;
  variables: Record<string, string>;
}

/**
 * Sales FAQ output
 */
export interface SalesFAQOutput {
  classification: QuestionClassification;
  response: string;
  templateUsed: string;
  suggestedActions?: string[];
}

/**
 * Question classification result from AI
 */
interface AIClassificationResult {
  category: QuestionCategory;
  confidence: number;
  keywords: string[];
  reasoning: string;
}

/**
 * Response templates for each category
 */
const RESPONSE_TEMPLATES: Record<QuestionCategory, ResponseTemplate> = {
  price: {
    id: 'price_response',
    category: 'price',
    template:
      'ご質問ありがとうございます！価格については、以下のプランをご用意しております。\n\n' +
      '{{pricing_details}}\n\n' +
      'ご予算やご要望に合わせて、最適なプランをご提案いたします。詳しいお見積もりをご希望の方は、お手数ですが以下の情報をお知らせいただけますか？\n\n' +
      '- ご希望のサービス内容\n- 利用規模（ユーザー数、月次投稿数など）\n- 導入時期\n\n' +
      '担当者より詳細なご提案をお送りさせていただきます。',
    variables: { pricing_details: '{{pricing_details}}' },
  },
  reservation_method: {
    id: 'reservation_method',
    category: 'reservation_method',
    template:
      'ご予約ありがとうございます！以下の手順でご予約をお願いします。\n\n' +
      '{{booking_steps}}\n\n' +
      'ご予約に関するご不明点がございましたら、お気軽にお問い合わせください。',
    variables: { booking_steps: '{{booking_steps}}' },
  },
  service_content: {
    id: 'service_content',
    category: 'service_content',
    template:
      'サービス内容についてのご質問ありがとうございます！\n\n' +
      '{{service_overview}}\n\n' +
      '当サービスの主な特徴は以下の通りです：\n\n' +
      '{{key_features}}\n\n' +
      'さらに詳しい情報が必要な場合は、お気軽にお問い合わせください。',
    variables: {
      service_overview: '{{service_overview}}',
      key_features: '{{key_features}}',
    },
  },
  general: {
    id: 'general_response',
    category: 'general',
    template:
      'ご質問ありがとうございます。\n\n' +
      '{{response}}\n\n' +
      'その他ご不明点がございましたら、お気軽にお問い合わせください。',
    variables: { response: '{{response}}' },
  },
  unknown: {
    id: 'unknown_response',
    category: 'unknown',
    template:
      'お問い合わせありがとうございます。\n\n' +
      '恐れ入りますが、ご質問の内容が十分に理解できませんでした。詳しくお教えいただけますでしょうか？\n\n' +
      'また、以下のカテゴリについてのご質問であれば、スムーズにお答えできます：\n' +
      '- 価格・料金について\n' +
      '- 予約方法について\n' +
      '- サービス内容について\n\n' +
      'お手数をおかけいたしますが、再度ご連絡いただけますと幸いです。',
    variables: {},
  },
};

/**
 * Mock variable values for templates
 * In production, these would be loaded from a database or configuration
 */
const MOCK_VARIABLES: Record<string, string> = {
  pricing_details:
    '• スタンダードプラン: 月額 ¥5,000\n' +
    '• プロフェッショナルプラン: 月額 ¥15,000\n' +
    '• エンタープライズプラン: お問い合わせください',

  booking_steps:
    '1. Webサイトからご予約フォームにアクセス\n' +
    '2. ご希望の日時を選択し、必要事項を入力\n' +
    '3. 予約確認メールをお送りします\n' +
    '4. 当日、Zoomまたは対面で面談を実施',

  service_overview:
    'InstaFlow AIは、Instagram運営を自動化・効率化するためのSaaSプラットフォームです。DM、コメント、投稿の管理をAIがサポートし、ビジネスの成長を加速させます。',

  key_features:
    '• AIによる自動応答・自動投稿\n' +
    '• ワークフローによるカスタマイズ可能な自動化\n' +
    '• 詳細なアナリティクスとレポート\n' +
    '• 複数アカウントの一元管理\n' +
    '• 24時間365日のサポート',
};

class SalesFAQNode {
  /**
   * Classify user question into category
   */
  private async classifyQuestion(
    question: string,
    context?: SalesFAQInput['context']
  ): Promise<QuestionClassification> {
    const contextInfo = context
      ? `\n\nContext:\n${JSON.stringify(context, null, 2)}`
      : '';

    // Build classification prompt
    const classificationPrompt = `You are a sales FAQ classifier. Analyze the user's question and classify it into one of these categories:
- price: Questions about pricing, costs, fees, plans
- reservation_method: Questions about how to book, reserve, schedule appointments
- service_content: Questions about what the service does, features, capabilities
- general: General questions that don't fit specific categories
- unknown: Unclear or ambiguous questions

User question: "${question}"${contextInfo}

Respond in JSON format:
{
  "category": "price" | "reservation_method" | "service_content" | "general" | "unknown",
  "confidence": number (0-1),
  "keywords": ["keyword1", "keyword2"],
  "reasoning": "brief explanation"
}`;

    try {
      // Use AI service for classification
      // For now, use a mock approach since aiService is caption-specific
      const classification = await this.mockClassify(question, context);

      return classification;
    } catch (error) {
      console.error('Question classification error:', error);
      // Fallback to keyword-based classification
      return this.keywordBasedClassification(question);
    }
  }

  /**
   * Mock classification using keyword patterns
   */
  private mockClassify(
    question: string,
    context?: SalesFAQInput['context']
  ): Promise<AIClassificationResult> {
    return Promise.resolve(this.keywordBasedClassification(question));
  }

  /**
   * Keyword-based classification (fallback method)
   */
  private keywordBasedClassification(question: string): QuestionClassification {
    const lowerQuestion = question.toLowerCase();

    // Price keywords
    const priceKeywords = [
      '価格',
      '料金',
      '値段',
      'いくら',
      '費用',
      'プラン',
      'コスト',
      'price',
      'cost',
      'pricing',
      'plan',
      'fee',
      '円',
      '¥',
    ];

    // Reservation method keywords
    const reservationKeywords = [
      '予約',
      '予約方法',
      '予約したい',
      '予約する',
      'ブッキング',
      'booking',
      'reserve',
      'schedule',
      '面談',
      'アポイント',
    ];

    // Service content keywords
    const serviceKeywords = [
      'サービス',
      '機能',
      'できること',
      '使い方',
      '特徴',
      'service',
      'feature',
      'function',
      'capability',
      'content',
      'what',
    ];

    // Check for matches
    const priceMatches = priceKeywords.filter((kw) => lowerQuestion.includes(kw));
    const reservationMatches = reservationKeywords.filter((kw) =>
      lowerQuestion.includes(kw)
    );
    const serviceMatches = serviceKeywords.filter((kw) => lowerQuestion.includes(kw));

    // Determine category based on keyword counts
    if (priceMatches.length > 0) {
      return {
        category: 'price',
        confidence: 0.8 + Math.min(priceMatches.length * 0.05, 0.2),
        keywords: priceMatches,
        reasoning: `Found price-related keywords: ${priceMatches.join(', ')}`,
      };
    } else if (reservationMatches.length > 0) {
      return {
        category: 'reservation_method',
        confidence: 0.8 + Math.min(reservationMatches.length * 0.05, 0.2),
        keywords: reservationMatches,
        reasoning: `Found reservation-related keywords: ${reservationMatches.join(', ')}`,
      };
    } else if (serviceMatches.length > 0) {
      return {
        category: 'service_content',
        confidence: 0.7 + Math.min(serviceMatches.length * 0.05, 0.25),
        keywords: serviceMatches,
        reasoning: `Found service-related keywords: ${serviceMatches.join(', ')}`,
      };
    } else {
      return {
        category: 'general',
        confidence: 0.5,
        keywords: [],
        reasoning: 'No specific category keywords found, treating as general question',
      };
    }
  }

  /**
   * Generate response using selected template
   */
  private generateResponse(
    category: QuestionCategory,
    classification: QuestionClassification
  ): { response: string; templateUsed: string; suggestedActions?: string[] } {
    const template = RESPONSE_TEMPLATES[category];

    // Replace template variables with mock values
    let response = template.template;
    for (const [key, value] of Object.entries(template.variables)) {
      const varName = key.replace('{{', '').replace('}}', '');
      response = response.replace(value, MOCK_VARIABLES[varName] || value);
    }

    // Add suggested actions based on category
    const suggestedActions: string[] = [];
    switch (category) {
      case 'price':
        suggestedActions.push('カスタマーサポートへの詳細なお問い合わせ');
        suggestedActions.push('デモ・トライアルの申請');
        break;
      case 'reservation_method':
        suggestedActions.push('Webサイトから予約フォームにアクセス');
        suggestedActions.push('カレンダーで空き時間を確認');
        break;
      case 'service_content':
        suggestedActions.push('詳細な資料請求');
        suggestedActions.push('デモを見る');
        break;
      case 'general':
        suggestedActions.push('詳細をお知らせいただくと、より的確な回答が可能です');
        break;
      default:
        break;
    }

    return {
      response,
      templateUsed: template.id,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
    };
  }

  /**
   * Execute Sales FAQ Node
   */
  async execute(input: SalesFAQInput): Promise<SalesFAQOutput> {
    // Classify the question
    const classification = await this.classifyQuestion(input.question, input.context);

    // Generate response using appropriate template
    const responseDetails = this.generateResponse(
      classification.category,
      classification
    );

    return {
      classification,
      response: responseDetails.response,
      templateUsed: responseDetails.templateUsed,
      suggestedActions: responseDetails.suggestedActions,
    };
  }

  /**
   * Get available response templates
   */
  getAvailableTemplates(): ResponseTemplate[] {
    return Object.values(RESPONSE_TEMPLATES);
  }

  /**
   * Get template by category
   */
  getTemplateByCategory(category: QuestionCategory): ResponseTemplate | undefined {
    return RESPONSE_TEMPLATES[category];
  }

  /**
   * Update template variables (for future database integration)
   */
  updateTemplateVariable(key: string, value: string): void {
    MOCK_VARIABLES[key] = value;
  }
}

export default new SalesFAQNode();
