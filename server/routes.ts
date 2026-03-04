import type { Express } from "express";
import type { Server } from "http";
import authRouter from "./api/auth.js";
import productsRouter from "./api/products.js";
import productsHybridSearchRouter from "./api/products-hybrid-search.js";
import customersRouter from "./api/customers.js";
import ordersRouter from "./api/orders.js";
import paymentsRouter from "./api/payments.js";
import suppliersRouter from "./api/suppliers.js";
import purchasesRouter from "./api/purchases.js";
import reportsRouter from "./api/reports.js";
import dashboardRouter from "./api/dashboard.js";
import medicineMasterRouter from "./api/medicine-master.js";
import { requireAuth } from "./middleware/auth.js";
import { prisma } from "./lib/prisma.js";
import { getTwoFactorEnabledForUser, setTwoFactorEnabledForUser } from "./lib/user-security.js";

export async function registerRoutes(_httpServer: Server, app: Express): Promise<Server> {
  // Public auth routes
  app.use("/api/auth", authRouter);

  // Protected: current user
  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const userId = (req as import("./middleware/auth.js").AuthRequest).user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      if (!user) return res.status(404).json({ message: "User not found" });
      const twoFactorEnabled = await getTwoFactorEnabledForUser(user.id);
      return res.json({ ...user, twoFactorEnabled });
    } catch (e) {
      console.error("Me error:", e);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/me", requireAuth, async (req, res) => {
    try {
      const userId = (req as import("./middleware/auth.js").AuthRequest).user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const body = req.body as { name?: string; password?: string; twoFactorEnabled?: boolean };
      const { hashPassword } = await import("./lib/auth.js");
      const data: { name?: string; password?: string } = {};
      let shouldUpdateTwoFactor = false;
      let nextTwoFactorEnabled = false;
      if (typeof body.twoFactorEnabled === "boolean") {
        shouldUpdateTwoFactor = true;
        nextTwoFactorEnabled = body.twoFactorEnabled;
      }
      if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
      if (typeof body.password === "string" && body.password.length >= 6) data.password = await hashPassword(body.password);
      if (Object.keys(data).length === 0 && !shouldUpdateTwoFactor) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      let user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (Object.keys(data).length > 0) {
        user = await prisma.user.update({
          where: { id: userId },
          data,
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
      }

      if (shouldUpdateTwoFactor) {
        await setTwoFactorEnabledForUser(userId, nextTwoFactorEnabled);
      }
      const twoFactorEnabled = await getTwoFactorEnabledForUser(userId);
      return res.json({ ...user, twoFactorEnabled });
    } catch (e) {
      console.error("Me update error:", e);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Protected API routes
  app.use("/api/products", requireAuth, productsHybridSearchRouter);
  app.use("/api/products", requireAuth, productsRouter);
  app.use("/api/customers", requireAuth, customersRouter);
  app.use("/api/orders", requireAuth, ordersRouter);
  app.use("/api/payments", requireAuth, paymentsRouter);
  app.use("/api/suppliers", requireAuth, suppliersRouter);
  app.use("/api/purchases", requireAuth, purchasesRouter);
  app.use("/api/reports", requireAuth, reportsRouter);
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api/medicine-master", requireAuth, medicineMasterRouter);

  return _httpServer;
}
