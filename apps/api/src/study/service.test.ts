import assert from "node:assert/strict";
import test from "node:test";
import type { AIProvider } from "../ai/provider.js";
import { AgentRuntime } from "../agent/runtime.js";
import { StudyService } from "./service.js";

test("study answers are grounded in an attached PDF", async () => {
  let receivedDocument = "";
  const provider: AIProvider = {
    generate: async () => ({ text: "unused", model: "test" }),
    generateJson: async () => ({ value: {}, model: "test" }),
    generateWithDocument: async (request) => {
      receivedDocument = request.document.data;
      return { text: "The answer is in the document.", model: "test" };
    },
    health: async () => ({ available: true }),
  };
  const pdf = Buffer.from("%PDF-1.4 test document");
  const result = await new StudyService(new AgentRuntime(provider)).ask(pdf, "What is this?", []);

  assert.equal(result.ok, true);
  assert.equal(receivedDocument, pdf.toString("base64"));
  if (result.ok) assert.equal(result.answer, "The answer is in the document.");
});

test("study rejects content without a PDF signature", async () => {
  const provider: AIProvider = {
    generate: async () => ({ text: "unused", model: "test" }),
    generateJson: async () => ({ value: {}, model: "test" }),
    generateWithDocument: async () => ({ text: "unused", model: "test" }),
    health: async () => ({ available: true }),
  };
  const result = await new StudyService(new AgentRuntime(provider)).ask(Buffer.from("not a pdf"), "Question", []);

  assert.deepEqual(result, { ok: false, code: "INVALID_PDF", message: "Choose a valid PDF document." });
});
