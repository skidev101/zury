import { GoogleGenAI } from "@google/genai";
import {
  AIProviderError,
  type AIDocumentRequest,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AIJsonRequest,
  type AIJsonResponse,
  type ProviderHealth,
} from "../provider.js";
import { logger } from "../../config/logger.js";

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
      logger.warn("Google generation failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "Unknown provider error",
        status: getProviderStatus(error),
      });
      throw unavailableError();
    }
  }

  async generateJson(request: AIJsonRequest): Promise<AIJsonResponse> {
    try {
      const response = await this.generate({
        prompt: `${request.prompt}\n\nReturn one JSON object only. Do not use markdown fences, commentary, or extra keys. Follow this JSON Schema:\n${JSON.stringify(request.jsonSchema)}`,
        systemInstruction: `${request.systemInstruction ?? "Return valid JSON only."} Return JSON only.`,
      });
      const text = response.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      if (!text) throw invalidResponseError();
      try {
        return { value: JSON.parse(text) as unknown, model: response.model };
      } catch {
        throw invalidResponseError();
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      logger.warn("Google structured generation failed", {
        message: error instanceof Error ? error.message : "Unknown provider error",
      });
      throw unavailableError();
    }
  }

  async generateWithDocument(request: AIDocumentRequest): Promise<AIResponse> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [{
          role: "user",
          parts: [
            { inlineData: request.document },
            { text: request.prompt },
          ],
        }],
        ...(request.systemInstruction
          ? { config: { systemInstruction: request.systemInstruction } }
          : {}),
      });
      const text = response.text?.trim();
      if (!text) throw invalidResponseError();
      return { text, model: response.modelVersion ?? this.model };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      logger.warn("Google document generation failed", {
        message: error instanceof Error ? error.message : "Unknown provider error",
        status: getProviderStatus(error),
      });
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

function invalidResponseError(): AIProviderError {
  return new AIProviderError({ code: "PROVIDER_RESPONSE_INVALID", message: "The AI provider returned an invalid structured response.", retryable: true });
}

function getProviderStatus(error: unknown): number | string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = error as { status?: unknown; code?: unknown; response?: { status?: unknown } };
  if (typeof value.status === "number" || typeof value.status === "string") return value.status;
  if (typeof value.response?.status === "number" || typeof value.response?.status === "string") return value.response.status;
  if (typeof value.code === "number" || typeof value.code === "string") return value.code;
  return undefined;
}
