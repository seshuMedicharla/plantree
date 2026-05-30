import type { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
};

type RateEntry = {
  count: number;
  resetAt: number;
};

function clientKey(request: Request) {
  return `${request.ip ?? request.socket.remoteAddress ?? "unknown"}:${request.method}:${request.path}`;
}

export function securityHeaders(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Cross-Origin-Resource-Policy", "same-site");
  response.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), payment=(), usb=()",
  );
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  );
  next();
}

export function createRateLimit({ windowMs, max, message }: RateLimitOptions) {
  const hits = new Map<string, RateEntry>();

  return (request: Request, response: Response, next: NextFunction) => {
    const now = Date.now();
    const key = clientKey(request);
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;

    if (current.count > max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      response.setHeader("Retry-After", String(retryAfterSeconds));
      response.status(429).json({ message });
      return;
    }

    next();
  };
}
