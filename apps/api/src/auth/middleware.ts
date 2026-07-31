import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "./auth.js";

export async function sessionMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    request.auth = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!request.auth) {
    response.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Please sign in to continue." },
    });
    return;
  }

  next();
}
