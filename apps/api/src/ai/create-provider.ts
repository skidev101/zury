import type { Env } from "../config/env.js";
import type { AIProvider } from "./provider.js";
import { GoogleAIProvider } from "./providers/google.js";
import { OllamaProvider } from "./providers/ollama.js";

type ProviderFactory = (env: Env) => AIProvider;

const providerFactories: Record<Env["AI_PROVIDER"], ProviderFactory> = {
  google: (env) => new GoogleAIProvider({
    apiKey: requireGoogleApiKey(env),
    model: env.GOOGLE_AI_MODEL,
  }),
  ollama: () => new OllamaProvider({
    baseUrl: "http://localhost:11434",
    model: "not-configured",
  }),
};

export function createAIProvider(env: Env): AIProvider {
  return providerFactories[env.AI_PROVIDER](env);
}

function requireGoogleApiKey(env: Env): string {
  if (!env.GOOGLE_AI_API_KEY) {
    throw new Error("GOOGLE_AI_API_KEY is required when AI_PROVIDER is google");
  }

  return env.GOOGLE_AI_API_KEY;
}
