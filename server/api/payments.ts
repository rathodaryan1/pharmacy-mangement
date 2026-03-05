import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { CreatePaymentBodySchema } from "../../shared/api-schemas.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { order: { include: { customer: true } } },
      }),
      prisma.payment.count(),
    ]);
    const list = items.map((p: { id: string; orderId: string; order: { customer: { name: string } }; createdAt: Date; amount: unknown; method: string; status: string }) => ({
      id: p.id,
      transactionId: p.id,
      orderId: p.orderId,
      customerName: p.order.customer.name,
      paymentDate: p.createdAt.toISOString(),
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
    }));
    return res.json({ items: list, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("Payments list error:", e);
    return res.status(500).json({ message: "Failed to fetch payments" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreatePaymentBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
    if (!order) return res.status(400).json({ message: "Order not found" });
    const payment = await prisma.payment.create({
      data: {
        orderId: parsed.data.orderId,
        amount: parsed.data.amount,
        method: parsed.data.method,
        status: parsed.data.status ?? "PAID",
      },
    });
    if (parsed.data.status === "PAID") {
      await prisma.order.update({
        where: { id: parsed.data.orderId },
        data: { paymentStatus: "PAID" },
      });
    }
    const withOrder = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { order: { include: { customer: true } } },
    });
    return res.status(201).json({
      id: withOrder!.id,
      transactionId: withOrder!.id,
      orderId: withOrder!.orderId,
      customerName: withOrder!.order.customer.name,
      paymentDate: withOrder!.createdAt.toISOString(),
      amount: Number(withOrder!.amount),
      method: withOrder!.method,
      status: withOrder!.status,
    });
  } catch (e) {
    console.error("Payment create error:", e);
    return res.status(500).json({ message: "Failed to create payment" });
  }
});

export default router;
