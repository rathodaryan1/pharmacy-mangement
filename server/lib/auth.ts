import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET ?? "pharmacy-jwt-secret-change-in-production";
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface TwoFactorChallengePayload extends JwtPayload {
  purpose: "2fa_login";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function signTwoFactorChallenge(payload: JwtPayload): string {
  const challengePayload: TwoFactorChallengePayload = {
    ...payload,
    purpose: "2fa_login",
  };
  return jwt.sign(challengePayload, JWT_SECRET, { expiresIn: "10m" });
}

export function verifyTwoFactorChallenge(token: string): TwoFactorChallengePayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TwoFactorChallengePayload;
    if (decoded.purpose !== "2fa_login") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
