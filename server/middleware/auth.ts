import type { Request, Response, NextFunction } from "express";
import { verifyToken, getBearerToken } from "../lib/auth.js";
import type { UserRole } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: UserRole };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  req.user = { userId: payload.userId, email: payload.email, role: payload.role };
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
