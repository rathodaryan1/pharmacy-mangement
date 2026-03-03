import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, signToken } from "../lib/auth.js";
import { RegisterBodySchema, LoginBodySchema } from "../../shared/api-schemas.js";
import { verifyPassword } from "../lib/auth.js";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const parsed = RegisterBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const { name, email, password, role } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return res.status(201).json({ user, token });
  } catch (e) {
    console.error("Register error:", e);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = LoginBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const { password: _p, ...safe } = user;
    return res.json({ user: safe, token });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ message: "Login failed" });
  }
});

export default router;
