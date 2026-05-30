import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { config } from "../config.js";

export type UserRole = "USER" | "ADMIN";

export type JwtPayload = {
  sub: string;
  username: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
};

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(input: string) {
  return createHmac("sha256", config.jwtSecret)
    .update(input)
    .digest("base64url");
}

export function signJwt(payload: Omit<JwtPayload, "iat" | "exp">) {
  const now = Math.floor(Date.now() / 1000);
  const body: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 24 * 30,
  };

  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = base64Url(JSON.stringify(body));
  const signature = sign(`${header}.${encodedPayload}`);

  return `${header}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) return null;

  try {
    const decodedHeader = JSON.parse(
      Buffer.from(header, "base64url").toString("utf8"),
    ) as {
      alg?: string;
      typ?: string;
    };

    if (decodedHeader.alg !== "HS256" || decodedHeader.typ !== "JWT")
      return null;
  } catch {
    return null;
  }

  const expected = sign(`${header}.${payload}`);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  let decoded: JwtPayload;

  try {
    decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as JwtPayload;
  } catch {
    return null;
  }

  if (decoded.exp <= Math.floor(Date.now() / 1000)) return null;
  if (decoded.role !== "USER" && decoded.role !== "ADMIN") return null;
  if (!decoded.sub || !decoded.username || !decoded.name) return null;

  return decoded;
}

export function getRequestUserId(request: Request) {
  return getRequestUser(request)?.sub ?? null;
}

export function getRequestUser(request: Request) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : undefined;

  return token ? verifyJwt(token) : null;
}
