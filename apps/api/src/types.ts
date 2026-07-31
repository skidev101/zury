import type { AuthSession } from "./auth/auth.js";

declare global {
  namespace Express {
    interface Request {
      auth: AuthSession | null;
    }
  }
}

export interface ErrorResponse {
  error: string;
}

export {};
