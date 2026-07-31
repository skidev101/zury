import {
  AIProviderError,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AIJsonRequest,
  type AIJsonResponse,
  type ProviderError,
} from "../ai/provider.js";

export type RuntimeResult =
  | { ok: true; value: AIResponse }
  | { ok: false; error: RuntimeError };
export type StructuredRuntimeResult = { ok: true; value: AIJsonResponse } | { ok: false; error: RuntimeError };

export interface RuntimeError {
  code: ProviderError["code"] | "RUNTIME_ERROR";
  message: string;
  retryable: boolean;
}

export class AgentRuntime {
  constructor(private readonly provider: AIProvider) {}

  async run(request: AIRequest): Promise<RuntimeResult> {
    try {
      return { ok: true, value: await this.provider.generate(request) };
    } catch (error) {
      return { ok: false, error: toRuntimeError(error) };
    }
  }

  async runStructured(request: AIJsonRequest): Promise<StructuredRuntimeResult> {
    try { return { ok: true, value: await this.provider.generateJson(request) }; }
    catch (error) { return { ok: false, error: toRuntimeError(error) }; }
  }
}

function toRuntimeError(error: unknown): RuntimeError {
  if (error instanceof AIProviderError) {
    return error.details;
  }

  return {
    code: "RUNTIME_ERROR",
    message: "The AI request could not be completed.",
    retryable: false,
  };
}
