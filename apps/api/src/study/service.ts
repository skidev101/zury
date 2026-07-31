import type { AgentRuntime } from "../agent/runtime.js";

export const MAX_PDF_BYTES = 15 * 1024 * 1024;

export class StudyService {
  constructor(private readonly runtime: AgentRuntime) {}

  async ask(document: Buffer, question: string, history: StudyHistoryMessage[]) {
    if (!isPdf(document)) {
      return { ok: false as const, code: "INVALID_PDF", message: "Choose a valid PDF document." };
    }

    const result = await this.runtime.runWithDocument({
      document: { data: document.toString("base64"), mimeType: "application/pdf" },
      prompt: JSON.stringify({
        question: question.trim(),
        history: history.slice(-8),
      }),
      systemInstruction:
        "You are Zury's study companion. Answer the student's question using the attached PDF as the primary source. Use conversation history only to resolve follow-up references. If the document does not contain enough information, say so clearly. Do not invent quotations, page numbers, facts, or citations. Keep the answer clear and useful for studying, using concise markdown when helpful.",
    });

    if (!result.ok) {
      return {
        ok: false as const,
        code: result.error.code,
        message: "Zury couldn't read that document just now. Please try again.",
      };
    }

    return { ok: true as const, answer: result.value.text, model: result.value.model };
  }
}

export interface StudyHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

function isPdf(document: Buffer): boolean {
  return document.length >= 5 && document.subarray(0, 5).toString("ascii") === "%PDF-";
}
