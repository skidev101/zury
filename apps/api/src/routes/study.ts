import express, { Router, type Router as ExpressRouter } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/middleware.js";
import { MAX_PDF_BYTES, type StudyService } from "../study/service.js";

const questionSchema = z.object({
  question: z.string().trim().min(1).max(4000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(8000),
  })).max(20).default([]),
});

export function createStudyRouter(service: StudyService): ExpressRouter {
  const router = Router();
  const pdfBody = expressRawPdf();

  router.post("/api/study/ask", requireAuth, pdfBody, async (request, response, next) => {
    const parsed = questionSchema.safeParse({
      question: decodeQuestion(request.header("x-zury-question")),
      history: parseHistory(request.header("x-zury-history")),
    });
    if (!parsed.success) {
      response.status(400).json({ error: { code: "INVALID_STUDY_QUESTION", message: "Ask a question about this document." } });
      return;
    }
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      response.status(400).json({ error: { code: "PDF_REQUIRED", message: "Choose a PDF document first." } });
      return;
    }

    try {
      const result = await service.ask(request.body, parsed.data.question, parsed.data.history);
      if (!result.ok) {
        response.status(result.code === "INVALID_PDF" ? 400 : 503).json({ error: { code: result.code, message: result.message } });
        return;
      }
      response.json({ answer: result.answer, model: result.model });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function expressRawPdf() {
  return express.raw({ type: "application/pdf", limit: MAX_PDF_BYTES });
}

function parseHistory(value: string | undefined): unknown {
  if (!value) return [];
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function decodeQuestion(value: string | undefined): unknown {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
