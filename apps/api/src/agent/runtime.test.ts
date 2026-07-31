import assert from "node:assert/strict";
import test from "node:test";
import { AIProviderError, type AIProvider } from "../ai/provider.js";
import { AgentRuntime } from "./runtime.js";

test("runtime delegates generation to its provider", async () => {
  const provider: AIProvider = {
    generate: async (request) => ({ text: request.prompt, model: "test-model" }),
    health: async () => ({ available: true }),
  };
  const runtime = new AgentRuntime(provider);

  assert.deepEqual(await runtime.run({ prompt: "hello" }), {
    ok: true,
    value: { text: "hello", model: "test-model" },
  });
});

test("runtime converts provider failures into structured errors", async () => {
  const provider: AIProvider = {
    generate: async () => {
      throw new AIProviderError({
        code: "PROVIDER_UNAVAILABLE",
        message: "The AI provider is unavailable.",
        retryable: true,
      });
    },
    health: async () => ({ available: true }),
  };
  const runtime = new AgentRuntime(provider);

  assert.deepEqual(await runtime.run({ prompt: "hello" }), {
    ok: false,
    error: {
      code: "PROVIDER_UNAVAILABLE",
      message: "The AI provider is unavailable.",
      retryable: true,
    },
  });
});
