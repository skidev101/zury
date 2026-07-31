import assert from "node:assert/strict";
import test from "node:test";
import { AIProviderError } from "../provider.js";
import { OllamaProvider } from "./ollama.js";

test("Ollama provider reports that inference is not implemented", async () => {
  const provider = new OllamaProvider({
    baseUrl: "http://localhost:11434",
    model: "placeholder",
  });

  await assert.rejects(
    provider.generate({ prompt: "hello" }),
    (error: unknown) =>
      error instanceof AIProviderError && error.details.code === "NOT_IMPLEMENTED",
  );
  assert.deepEqual(await provider.health(), {
    available: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Ollama provider is not implemented.",
      retryable: false,
    },
  });
});
