import aiService from '../aiService';

export interface AIProcessInput {
    promptTemplate: string;
    variables: Record<string, string>;
    modelConfig?: {
        temperature?: number;
        maxLength?: number;
    };
}

export interface AIProcessOutput {
    text: string;
    usedPrompt: string;
}

class AINodeService {
    /**
     * Execute AI processing step
     */
    async execute(input: AIProcessInput): Promise<AIProcessOutput> {
        const filledPrompt = this.fillTemplate(input.promptTemplate, input.variables);

        // Call existing AI Service (reusing logic)
        // In a real scenario, we might want a raw completion method, 
        // but here we reuse generateCaption for simplicity or mock it if needed.

        // Since aiService.generateCaption is specific to captions, 
        // we should ideally add a generic method to aiService.
        // For now, we simulate a generic call or use the caption generator if the context fits.

        // Let's assume we use the prompt as 'keywords' for the mock service 
        // just to get a response in this prototype phase.

        try {
            // Mocking a generic completion call since aiService is currently caption-specific
            const captionResult = await aiService.generateCaption({
                keywords: [filledPrompt],
                tone: 'professional',
                includeHashtags: false
            });

            return {
                text: captionResult.caption,
                usedPrompt: filledPrompt
            };
        } catch (error) {
            console.error('AI Node Execution Error:', error);
            // Fallback
            return {
                text: `[Error: Failed to generate text for prompt: "${filledPrompt}"]`,
                usedPrompt: filledPrompt
            };
        }
    }

    private fillTemplate(template: string, variables: Record<string, string>): string {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }
}

export default new AINodeService();
