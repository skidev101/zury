import {
  AIProviderError,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type ProviderError,
  type ProviderHealth,
} from "../provider.js";

export interface OllamaProviderOptions {
  baseUrl: string;
  model: string;
}

export class OllamaProvider implements AIProvider {
  constructor(_options: OllamaProviderOptions) {}

  async generate(_request: AIRequest): Promise<AIResponse> {
    throw new AIProviderError(notImplementedError());
  }

  async health(): Promise<ProviderHealth> {
    return { available: false, error: notImplementedError() };
  }
}

function notImplementedError(): ProviderError {
  return {
    code: "NOT_IMPLEMENTED",
    message: "Ollama provider is not implemented.",
    retryable: false,
  };
}
