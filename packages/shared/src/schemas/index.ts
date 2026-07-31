import { z } from "zod";

// Calendar event schemas
export const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  allDay: z.boolean().default(false),
});

export const updateEventSchema = createEventSchema.partial();

// Study note schemas
export const createStudyNoteSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const updateStudyNoteSchema = createStudyNoteSchema.partial();

// Agent query schema
export const agentQuerySchema = z.object({
  message: z.string().min(1).max(4000),
  context: z
    .object({
      date: z.coerce.date().optional(),
      isOffline: z.boolean().optional(),
    })
    .optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Inferred types
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateStudyNoteInput = z.infer<typeof createStudyNoteSchema>;
export type UpdateStudyNoteInput = z.infer<typeof updateStudyNoteSchema>;
export type AgentQueryInput = z.infer<typeof agentQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
