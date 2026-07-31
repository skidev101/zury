import { GoogleGenAI } from "@google/genai";
import {
  AIProviderError,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type ProviderHealth,
} from "../provider.js";

export interface GoogleAIProviderOptions {
  apiKey: string;
  model: string;
}

export class GoogleAIProvider implements AIProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(options: GoogleAIProviderOptions) {
    this.client = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    try {
      const parameters = {
        model: this.model,
        contents: request.prompt,
        ...(request.systemInstruction
          ? { config: { systemInstruction: request.systemInstruction } }
          : {}),
      };
      const response = await this.client.models.generateContent(parameters);
      const text = response.text?.trim();

      if (!text) {
        throw new AIProviderError({
          code: "PROVIDER_RESPONSE_INVALID",
          message: "The AI provider returned an empty response.",
          retryable: true,
        });
      }

      return { text, model: response.modelVersion ?? this.model };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      throw unavailableError();
    }
  }

  async health(): Promise<ProviderHealth> {
    try {
      await this.client.models.get({ model: this.model });
      return { available: true };
    } catch {
      return { available: false, error: unavailableError().details };
    }
  }
}

function unavailableError(): AIProviderError {
  return new AIProviderError({
    code: "PROVIDER_UNAVAILABLE",
    message: "The AI provider is unavailable.",
    retryable: true,
  });
}
