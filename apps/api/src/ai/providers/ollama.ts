import {
  AIProviderError,
  type AIDocumentRequest,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AIJsonRequest,
  type AIJsonResponse,
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

  async generateJson(_request: AIJsonRequest): Promise<AIJsonResponse> {
    throw new AIProviderError(notImplementedError());
  }

  async generateWithDocument(_request: AIDocumentRequest): Promise<AIResponse> {
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
