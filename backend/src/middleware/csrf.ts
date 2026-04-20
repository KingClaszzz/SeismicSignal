import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const CSRF_HEADER = "x-csrf-token";

function getSession(req: Request) {
  return req.session as any;
}

export function issueCsrfToken(req: Request) {
  const session = getSession(req);
  const token = crypto.randomBytes(32).toString("hex");
  session.csrfToken = token;
  return token;
}

export function ensureCsrfToken(req: Request) {
  const session = getSession(req);
  if (typeof session.csrfToken === "string" && session.csrfToken.length >= 32) {
    return session.csrfToken;
  }

  return issueCsrfToken(req);
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  const session = getSession(req);
  const sessionToken = session.csrfToken;
  const headerToken = req.get(CSRF_HEADER);

  if (
    typeof sessionToken !== "string" ||
    sessionToken.length < 32 ||
    typeof headerToken !== "string" ||
    headerToken.length < 32 ||
    !crypto.timingSafeEqual(Buffer.from(sessionToken), Buffer.from(headerToken))
  ) {
    return res.status(403).json({
      success: false,
      message: "Invalid or missing CSRF token.",
    });
  }

  next();
}

export const csrfHeaderName = CSRF_HEADER;
