interface CaptionGenerationOptions {
  keywords: string[];
  tone?: string;
  maxLength?: number;
  includeHashtags?: boolean;
}

interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  confidence: number;
}

class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async generateCaption(options: CaptionGenerationOptions): Promise<GeneratedCaption> {
    const { keywords, tone = 'friendly', maxLength = 500, includeHashtags = true } = options;

    if (!keywords || keywords.length === 0) {
      throw new Error('Keywords are required for caption generation');
    }

    try {
      const caption = await this.callOpenAI(keywords, tone, maxLength);

      const hashtags = includeHashtags ? this.generateHashtags(keywords) : [];

      return {
        caption,
        hashtags,
        confidence: 0.95,
      };
    } catch (error: any) {
      console.error('AI caption generation error:', error);

      throw new Error('Failed to generate caption. Please try again.');
    }
  }

  private async callOpenAI(
    keywords: string[],
    tone: string,
    maxLength: number
  ): Promise<string> {
    if (!this.apiKey) {
      return this.generateMockCaption(keywords, tone);
    }

    const prompt = this.buildPrompt(keywords, tone, maxLength);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional Instagram caption writer. Create engaging, creative captions that resonate with audiences.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxLength,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data: any = await response.json();

    return data.choices[0]?.message?.content?.trim() || this.generateMockCaption(keywords, tone);
  }

  private buildPrompt(keywords: string[], tone: string, maxLength: number): string {
    const keywordsText = keywords.join(', ');
    const toneMap: Record<string, string> = {
      friendly: 'warm, welcoming, and approachable',
      professional: 'formal, sophisticated, and business-oriented',
      casual: 'relaxed, fun, and conversational',
      humorous: 'witty, funny, and entertaining',
      inspiring: 'motivational, uplifting, and encouraging',
    };

    const toneDescription = toneMap[tone] || toneMap.friendly;

    return `Generate an Instagram caption about: ${keywordsText}

Tone: ${toneDescription}
Style: ${toneDescription}
Length: Maximum ${maxLength} characters

Requirements:
- Be creative and engaging
- Use appropriate emoji
- Write as if you're sharing a personal moment
- Make it shareable
- End with a call to action if appropriate

Caption only, no additional text.`;
  }

  private generateHashtags(keywords: string[]): string[] {
    const popularHashtags = ['#InstaFlow', '#Automation', '#SocialMedia', '#InstagramGrowth'];

    const keywordHashtags = keywords
      .slice(0, 5)
      .map((keyword) => `#${keyword.replace(/\s+/g, '')}`);

    return [...new Set([...popularHashtags, ...keywordHashtags])];
  }

  private generateMockCaption(keywords: string[], tone: string): string {
    const captions: Record<string, string> = {
      friendly: `これがAIが生成した素晴らしいInstagramのキャプションです！${keywords.map((k) => `#${k}`).join(' ')} ✨ #InstaFlow #Automation`,
      professional: `AIキャプション生成が、あなたのプロフェッショナルなInstagram投稿をサポートします。${keywords.map((k) => `#${k}`).join(' ')} 💼 #InstaFlow #Automation`,
      casual: `AIが作ったキャプション、どう？${keywords.map((k) => `#${k}`).join(' ')} 🎉 #InstaFlow #Automation`,
      humorous: `これがAIのユーモアあふれるキャプションだよ！${keywords.map((k) => `#${k}`).join(' ')} 😄 #InstaFlow #Automation`,
      inspiring: `AIがインスピレーションを届けます。${keywords.map((k) => `#${k}`).join(' ')} 💪 #InstaFlow #Automation`,
    };

    return captions[tone] || captions.friendly;
  }

  async generateMultipleCaptions(
    options: CaptionGenerationOptions,
    count: number = 3
  ): Promise<GeneratedCaption[]> {
    const captions: GeneratedCaption[] = [];

    for (let i = 0; i < count; i++) {
      const caption = await this.generateCaption(options);
      captions.push(caption);
    }

    return captions;
  }

  async analyzeCaptionPerformance(caption: string): Promise<{
    engagement_score: number;
    readability_score: number;
    suggestions: string[];
  }> {
    return {
      engagement_score: 85,
      readability_score: 90,
      suggestions: [
        'Consider adding more relevant hashtags',
        'Try including a call-to-action',
        'Add 1-2 more emojis for visual appeal',
      ],
    };
  }
}

export default new AIService();
