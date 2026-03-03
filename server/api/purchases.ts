import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { CreatePurchaseOrderBodySchema, UpdatePurchaseOrderBodySchema } from "../../shared/api-schemas.js";
import type { AuthRequest } from "../middleware/auth.js";
import { Decimal } from "@prisma/client/runtime/library";

const router = Router();

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { supplier: true, items: { include: { product: true } } },
      }),
      prisma.purchaseOrder.count(),
    ]);
    const list = items.map((po) => {
      const withR = po as typeof po & { supplier: { name: string }; items: { id: string; productId: string; quantity: number; cost: unknown; product: { name: string } }[] };
      return {
      id: withR.id,
      supplierId: withR.supplierId,
      supplierName: withR.supplier.name,
      totalAmount: Number(withR.totalAmount),
      status: withR.status,
      createdAt: withR.createdAt.toISOString(),
      items: withR.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        cost: Number(i.cost),
      })),
    };
    });
    return res.json({ items: list, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("Purchase orders list error:", e);
    return res.status(500).json({ message: "Failed to fetch purchase orders" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id ?? "");
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, items: { include: { product: true } } },
    });
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    const withR = po as typeof po & { supplier: { name: string }; items: { id: string; productId: string; quantity: number; cost: unknown; product: { name: string } }[] };
    return res.json({
      id: withR.id,
      supplierId: withR.supplierId,
      supplierName: withR.supplier.name,
      totalAmount: Number(withR.totalAmount),
      status: withR.status,
      createdAt: withR.createdAt.toISOString(),
      items: withR.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        cost: Number(i.cost),
      })),
    });
  } catch (e) {
    console.error("Purchase order get error:", e);
    return res.status(500).json({ message: "Failed to fetch purchase order" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreatePurchaseOrderBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const { supplierId, items } = parsed.data;
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) return res.status(400).json({ message: "Supplier not found" });
    let totalAmount = 0;
    for (const it of items) {
      const product = await prisma.product.findUnique({ where: { id: it.productId } });
      if (!product) return res.status(400).json({ message: `Product ${it.productId} not found` });
      totalAmount += it.cost * it.quantity;
    }
    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        totalAmount: new Decimal(totalAmount),
        status: "PENDING",
        items: {
          create: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            cost: it.cost,
          })),
        },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });
    return res.status(201).json({
      id: po.id,
      supplierId: po.supplierId,
      supplierName: po.supplier.name,
      totalAmount: Number(po.totalAmount),
      status: po.status,
      createdAt: po.createdAt.toISOString(),
      items: po.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        cost: Number(i.cost),
      })),
    });
  } catch (e) {
    console.error("Purchase order create error:", e);
    return res.status(500).json({ message: "Failed to create purchase order" });
  }
});

router.put("/:id/receive", async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id ?? "");
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    if (po.status === "RECEIVED") {
      return res.status(400).json({ message: "Purchase order already received" });
    }
    await prisma.$transaction(async (tx) => {
      for (const item of po.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: "RECEIVED" },
      });
    });
    const updated = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, items: { include: { product: true } } },
    });
    const u = updated as typeof updated & { supplier: { name: string }; items: { id: string; productId: string; quantity: number; cost: unknown; product: { name: string } }[] };
    return res.json({
      id: u!.id,
      supplierId: u!.supplierId,
      supplierName: u!.supplier.name,
      totalAmount: Number(u!.totalAmount),
      status: u!.status,
      createdAt: u!.createdAt.toISOString(),
      items: u!.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        cost: Number(i.cost),
      })),
    });
  } catch (e) {
    console.error("Purchase receive error:", e);
    return res.status(500).json({ message: "Failed to receive purchase order" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const parsed = UpdatePurchaseOrderBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const id = String(req.params.id ?? "");
    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: parsed.data,
      include: { supplier: true, items: { include: { product: true } } },
    });
    const withR = po as typeof po & { supplier: { name: string }; items: { id: string; productId: string; quantity: number; cost: unknown; product: { name: string } }[] };
    return res.json({
      id: withR.id,
      supplierId: withR.supplierId,
      supplierName: withR.supplier.name,
      totalAmount: Number(withR.totalAmount),
      status: withR.status,
      createdAt: withR.createdAt.toISOString(),
      items: withR.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        cost: Number(i.cost),
      })),
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025")
      return res.status(404).json({ message: "Purchase order not found" });
    console.error("Purchase order update error:", e);
    return res.status(500).json({ message: "Failed to update purchase order" });
  }
});

export default router;
