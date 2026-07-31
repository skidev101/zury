import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_CALENDAR_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALENDAR_REDIRECT_URI: z.string().url().optional(),
  CALENDAR_TOKEN_ENCRYPTION_KEY: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_REDIRECT_URI: z.string().url().optional(),
  AI_PROVIDER: z.enum(["google", "ollama"]).default("google"),
  GOOGLE_AI_API_KEY: z.string().min(1, "GOOGLE_AI_API_KEY is required").optional(),
  GOOGLE_AI_MODEL: z.string().min(1).default("gemini-3.5-flash-lite"),
  WEB_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
}).superRefine((values, context) => {
  if (values.AI_PROVIDER === "google" && !values.GOOGLE_AI_API_KEY) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["GOOGLE_AI_API_KEY"],
      message: "GOOGLE_AI_API_KEY is required when AI_PROVIDER is google",
    });
  }
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("\n[startup] Invalid environment variables:\n");
    const errors = result.error.flatten().fieldErrors;
    for (const [key, messages] of Object.entries(errors)) {
      console.error(`  ${key}: ${messages?.join(", ")}`);
    }
    console.error("\nCopy .env.example to .env and fill in the required values.\n");
    throw new Error("Invalid environment configuration");
  }

  return result.data;
}

export const env = validateEnv();
export type Env = typeof env;

export function getCalendarEnv(input: Env = env) {
  return z
    .object({
      GOOGLE_CALENDAR_CLIENT_ID: z.string().min(1, "GOOGLE_CALENDAR_CLIENT_ID is required"),
      GOOGLE_CALENDAR_CLIENT_SECRET: z.string().min(1, "GOOGLE_CALENDAR_CLIENT_SECRET is required"),
      GOOGLE_CALENDAR_REDIRECT_URI: z.string().url(),
      CALENDAR_TOKEN_ENCRYPTION_KEY: z.string().refine(
        (value) => {
          try {
            return Buffer.from(value, "base64").length === 32;
          } catch {
            return false;
          }
        },
        "CALENDAR_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key",
      ),
    })
    .parse(input);
}

export function getGitHubEnv(input: Env = env) {
  const result = z.object({
    GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
    GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
    GITHUB_REDIRECT_URI: z.string().url(),
    CALENDAR_TOKEN_ENCRYPTION_KEY: z.string().min(1),
  }).safeParse(input);
  return result.success ? result.data : null;
}
