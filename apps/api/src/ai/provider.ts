export interface AIProvider {
  generate(request: AIRequest): Promise<AIResponse>;
  generateJson(request: AIJsonRequest): Promise<AIJsonResponse>;
  generateWithDocument(request: AIDocumentRequest): Promise<AIResponse>;
  health(): Promise<ProviderHealth>;
}

export interface AIDocumentRequest extends AIRequest {
  document: {
    data: string;
    mimeType: "application/pdf";
  };
}

export interface AIJsonRequest extends AIRequest {
  jsonSchema: Record<string, unknown>;
}

export interface AIJsonResponse {
  value: unknown;
  model: string;
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
