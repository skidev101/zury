export interface AIProvider {
  generate(request: AIRequest): Promise<AIResponse>;
  health(): Promise<ProviderHealth>;
}

export interface AIRequest {
  prompt: string;
  systemInstruction?: string;
}

export interface AIResponse {
  text: string;
  model: string;
}

export type ProviderHealth =
  | { available: true }
  | { available: false; error: ProviderError };

export interface ProviderError {
  code: "PROVIDER_UNAVAILABLE" | "PROVIDER_RESPONSE_INVALID" | "NOT_IMPLEMENTED";
  message: string;
  retryable: boolean;
}

export class AIProviderError extends Error {
  readonly details: ProviderError;

  constructor(details: ProviderError) {
    super(details.message);
    this.name = "AIProviderError";
    this.details = details;
  }
}
