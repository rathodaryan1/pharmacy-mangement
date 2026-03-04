import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, signToken, signTwoFactorChallenge, verifyTwoFactorChallenge } from "../lib/auth.js";
import { RegisterBodySchema, LoginBodySchema } from "../../shared/api-schemas.js";
import { verifyPassword } from "../lib/auth.js";
import { getTwoFactorEnabledForUser } from "../lib/user-security.js";
import { sendSupabaseLoginOtp, verifySupabaseEmailOtp } from "../lib/supabase-auth.js";

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
    return res.status(201).json({ user: { ...user, twoFactorEnabled: false }, token });
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

    const twoFactorEnabled = await getTwoFactorEnabledForUser(user.id);
    if (twoFactorEnabled) {
      try {
        await sendSupabaseLoginOtp(user.email);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send OTP";
        return res.status(500).json({ message: `Two-factor delivery failed: ${message}` });
      }

      const challengeToken = signTwoFactorChallenge({ userId: user.id, email: user.email, role: user.role });
      return res.status(202).json({
        twoFactorRequired: true,
        challengeToken,
        provider: "supabase",
        message: "OTP or magic link sent from Supabase to your email.",
      });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const { password: _p, ...safe } = user;
    return res.json({ twoFactorRequired: false, user: { ...safe, twoFactorEnabled }, token });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const body = req.body as { challengeToken?: string; otp?: string };
    const challengeToken = typeof body.challengeToken === "string" ? body.challengeToken : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!challengeToken || !otp) {
      return res.status(400).json({ message: "challengeToken and otp are required" });
    }

    const challenge = verifyTwoFactorChallenge(challengeToken);
    if (!challenge) {
      return res.status(401).json({ message: "Invalid or expired challenge token" });
    }

    try {
      await verifySupabaseEmailOtp(challenge.email, otp);
    } catch {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    const user = await prisma.user.findUnique({
      where: { id: challenge.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const twoFactorEnabled = await getTwoFactorEnabledForUser(user.id);
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return res.json({ user: { ...user, twoFactorEnabled }, token });
  } catch (e) {
    console.error("Verify OTP error:", e);
    return res.status(500).json({ message: "OTP verification failed" });
  }
});

router.post("/resend-otp", async (req: Request, res: Response) => {
  try {
    const body = req.body as { challengeToken?: string };
    const challengeToken = typeof body.challengeToken === "string" ? body.challengeToken : "";
    if (!challengeToken) return res.status(400).json({ message: "challengeToken is required" });

    const challenge = verifyTwoFactorChallenge(challengeToken);
    if (!challenge) {
      return res.status(401).json({ message: "Invalid or expired challenge token" });
    }

    await sendSupabaseLoginOtp(challenge.email);
    return res.status(204).send();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to resend OTP";
    console.error("Resend OTP error:", e);
    return res.status(500).json({ message });
  }
});

export default router;
