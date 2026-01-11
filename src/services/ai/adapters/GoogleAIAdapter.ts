// Google AI Studio Adapter (Gemini + Gemma)
// Extended with Vision support for Product AI Creator
// Gemma 3 models: 14,400 RPD free tier, multi-modal capable

import {
  BaseAdapter,
  AICompletionRequest,
  AICompletionResponse,
  AIVisionRequest,
  ProviderConfig
} from './BaseAdapter';

const GOOGLE_AI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Gemma 3 models - multi-modal capable with high free tier limits
const GOOGLE_MODELS = [
  'gemma-3-27b-it',         // 14,400 RPD, 30 RPM - best for vision
  'gemma-3-12b-it',         // 14,400 RPD, 30 RPM
  'gemma-3-4b-it',          // 14,400 RPD, 30 RPM
  'gemma-3-1b-it',          // 14,400 RPD, 30 RPM - fastest
  'gemini-2.0-flash',       // Lower limits but good quality
  'gemini-2.5-flash-lite',  // 20 RPD only - use sparingly
];

// Models that support vision
const VISION_CAPABLE_MODELS = [
  'gemma-3-27b-it',
  'gemma-3-12b-it',
  'gemma-3-4b-it',
  'gemini-2.0-flash',
];

export class GoogleAIAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super(
      {
        ...config,
        baseUrl: config.baseUrl || GOOGLE_AI_BASE_URL,
        defaultModel: config.defaultModel || 'gemma-3-27b-it',
        rateLimitRpm: config.rateLimitRpm || 30,
        rateLimitRpd: config.rateLimitRpd || 14400,
      },
      'Google AI Studio'
    );
  }

  supportsVision(): boolean {
    return true;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();
    const model = request.model || this.config.defaultModel!;

    // Build the prompt with system instruction if provided
    let fullPrompt = request.prompt;
    if (request.systemPrompt) {
      fullPrompt = `${request.systemPrompt}\n\n${request.prompt}`;
    }

    const url = `${this.config.baseUrl}/${model}:generateContent?key=${this.config.apiKey}`;

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: request.temperature ?? 0.3,
            maxOutputTokens: request.maxTokens ?? 2000,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      },
      60000 // 60s timeout for longer responses
    );

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Content blocked by safety filters');
      }
      throw new Error('Invalid Google AI response format');
    }

    return {
      content: data.candidates[0].content.parts[0].text,
      model: model,
      tokensUsed: data.usageMetadata?.totalTokenCount,
      latencyMs,
      finishReason: data.candidates[0].finishReason,
    };
  }

  async completeWithVision(request: AIVisionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();
    const model = request.model || 'gemma-3-27b-it';

    // Verify model supports vision
    if (!VISION_CAPABLE_MODELS.includes(model)) {
      throw new Error(`Model ${model} does not support vision. Use one of: ${VISION_CAPABLE_MODELS.join(', ')}`);
    }

    // Build content parts with images and text
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Add images first
    for (const image of request.images) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64,
        }
      });
    }

    // Add text prompt
    let fullPrompt = request.prompt;
    if (request.systemPrompt) {
      fullPrompt = `${request.systemPrompt}\n\n${request.prompt}`;
    }
    parts.push({ text: fullPrompt });

    const url = `${this.config.baseUrl}/${model}:generateContent?key=${this.config.apiKey}`;

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts
          }],
          generationConfig: {
            temperature: request.temperature ?? 0.3,
            maxOutputTokens: request.maxTokens ?? 4000,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      },
      90000 // 90s timeout for vision requests
    );

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google AI Vision error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Vision content blocked by safety filters');
      }
      throw new Error('Invalid Google AI Vision response format');
    }

    return {
      content: data.candidates[0].content.parts[0].text,
      model: model,
      tokensUsed: data.usageMetadata?.totalTokenCount,
      latencyMs,
      finishReason: data.candidates[0].finishReason,
    };
  }

  async testConnection(): Promise<{ success: boolean; error?: string; latencyMs?: number }> {
    try {
      const startTime = Date.now();
      const model = this.config.defaultModel || 'gemma-3-4b-it';
      const url = `${this.config.baseUrl}/${model}:generateContent?key=${this.config.apiKey}`;

      const response = await this.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Say OK' }]
            }],
            generationConfig: {
              maxOutputTokens: 5,
            },
          }),
        },
        15000
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `${response.status}: ${errorText}` };
      }

      return { success: true, latencyMs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  getAvailableModels(): string[] {
    return GOOGLE_MODELS;
  }

  getVisionCapableModels(): string[] {
    return VISION_CAPABLE_MODELS;
  }
}
