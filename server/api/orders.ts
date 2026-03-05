import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { CreateOrderBodySchema, UpdateOrderBodySchema } from "../../shared/api-schemas.js";
import type { AuthRequest } from "../middleware/auth.js";
import { Decimal } from "@prisma/client/runtime/library";
import type { Prisma } from "@prisma/client";
import PDFDocument from "pdfkit";

const router = Router();

function orderToResponse(order: {
  id: string;
  customerId: string;
  totalAmount: unknown;
  paymentStatus: string;
  orderStatus: string;
  createdAt: Date;
  customer: { name: string };
  payments?: { method: string }[];
  items: { id: string; productId: string; quantity: number; price: unknown; product: { name: string } }[];
}) {
  return {
    id: order.id,
    customerId: order.customerId,
    customerName: order.customer.name,
    paymentMethod: order.payments?.[0]?.method ?? "PENDING",
    totalAmount: Number(order.totalAmount),
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt.toISOString(),
    products: order.items.map((i) => i.product.name),
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      price: Number(i.price),
    })),
  };
}

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
    const skip = (page - 1) * limit;
    const status = String(req.query.status ?? "").trim();
    const search = String(req.query.search ?? "").trim();
    const where: Record<string, unknown> = {};
    if (status && status !== "All") {
      const statusMap: Record<string, string> = {
        Completed: "COMPLETED",
        Pending: "PENDING",
        Cancelled: "CANCELLED",
        "In progress": "IN_PROGRESS",
      };
      where.orderStatus = statusMap[status] ?? status;
    }
    if (search) {
      where.customer = { name: { contains: search, mode: "insensitive" as const } };
    }
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { customer: true, payments: { take: 1, select: { method: true } }, items: { include: { product: true } } },
      }),
      prisma.order.count({ where }),
    ]);
    const list = items.map((o: { id: string; customer: { name: string }; createdAt: Date; items: { product: { name: string } }[]; payments: { method: string }[]; totalAmount: unknown; paymentStatus: string; orderStatus: string }) => ({
      id: o.id,
      customerName: o.customer.name,
      orderDate: o.createdAt.toISOString().slice(0, 10),
      products: o.items.map((i: { product: { name: string } }) => i.product.name),
      paymentMethod: o.payments[0]?.method ?? "PENDING",
      totalAmount: Number(o.totalAmount),
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
    }));
    return res.json({ items: list, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("Orders list error:", e);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id ?? "");
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, payments: { take: 1, select: { method: true } }, items: { include: { product: true } } },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(orderToResponse(order as Parameters<typeof orderToResponse>[0]));
  } catch (e) {
    console.error("Order get error:", e);
    return res.status(500).json({ message: "Failed to fetch order" });
  }
});

router.get("/:id/invoice", async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id ?? "");
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: { take: 1, orderBy: { createdAt: "desc" }, select: { method: true, status: true, createdAt: true } },
        items: { include: { product: true } },
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    const doc = new PDFDocument({ margin: 44 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.id}.pdf"`);
    doc.pipe(res);

    const totalAmount = Number(order.totalAmount);
    const payment = order.payments[0];

    doc.fontSize(20).text("Invoice", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Invoice #: ${order.id}`);
    doc.text(`Date: ${order.createdAt.toISOString().slice(0, 10)}`);
    doc.text(`Customer: ${order.customer.name}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.text(`Payment Method: ${payment?.method ?? "PENDING"}`);
    doc.moveDown();

    doc.fontSize(11).text("Items", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10).text("Product                               Qty     Unit Price      Line Total");
    doc.moveDown(0.3);

    for (const item of order.items) {
      const unitPrice = Number(item.price);
      const lineTotal = unitPrice * item.quantity;
      const productName = item.product.name.length > 34 ? `${item.product.name.slice(0, 31)}...` : item.product.name;
      doc.text(
        `${productName.padEnd(36)} ${String(item.quantity).padStart(3)}     Rs ${unitPrice
          .toFixed(2)
          .padStart(8)}     Rs ${lineTotal.toFixed(2).padStart(9)}`,
      );
    }

    doc.moveDown();
    doc.fontSize(11).text(`Total Amount: Rs ${totalAmount.toFixed(2)}`, { align: "right" });
    doc.moveDown(0.6);
    doc.fontSize(9).text("Generated by Pharmacy Dashboard", { align: "right" });
    doc.end();
  } catch (e) {
    console.error("Invoice download error:", e);
    return res.status(500).json({ message: "Failed to generate invoice" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreateOrderBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const { customerId, customer, items, paymentMethod } = parsed.data;

    const groupedItemsMap = new Map<string, number>();
    for (const it of items) {
      groupedItemsMap.set(it.productId, (groupedItemsMap.get(it.productId) ?? 0) + it.quantity);
    }
    const groupedItems = Array.from(groupedItemsMap.entries()).map(([productId, quantity]) => ({ productId, quantity }));
    if (groupedItems.length === 0) {
      return res.status(400).json({ message: "At least one order item is required" });
    }

    const createdOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let resolvedCustomerId = customerId ?? "";
      if (resolvedCustomerId) {
        const existing = await tx.customer.findUnique({ where: { id: resolvedCustomerId } });
        if (!existing) throw new Error("Customer not found");
      } else if (customer) {
        const emailFilter = { email: { equals: customer.email, mode: "insensitive" as const } };
        const phone = customer.phone?.trim();
        const existing = await tx.customer.findFirst({
          where: phone ? { OR: [emailFilter, { phone }] } : emailFilter,
          select: { id: true },
        });
        if (existing) {
          resolvedCustomerId = existing.id;
        } else {
          const createdCustomer = await tx.customer.create({
            data: { name: customer.name.trim(), email: customer.email.trim().toLowerCase(), phone: phone || null },
            select: { id: true },
          });
          resolvedCustomerId = createdCustomer.id;
        }
      } else {
        throw new Error("Customer details are required");
      }

      const productIds = groupedItems.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((p: { id: string; name: string; stock: number; sellingPrice: unknown }) => [p.id, p]));
      let totalAmount = 0;

      for (const it of groupedItems) {
        const product = productMap.get(it.productId);
        if (!product) throw new Error(`Product ${it.productId} not found`);
        if (product.stock < it.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }
        totalAmount += Number(product.sellingPrice) * it.quantity;
      }

      for (const it of groupedItems) {
        const updated = await tx.product.updateMany({
          where: { id: it.productId, stock: { gte: it.quantity } },
          data: { stock: { decrement: it.quantity } },
        });
        if (updated.count === 0) {
          const product = productMap.get(it.productId);
          if (!product) throw new Error(`Product ${it.productId} not found`);
          throw new Error(`Stock changed for ${product.name}. Please retry`);
        }
      }

      const computedPaymentStatus = paymentMethod === "PENDING" ? "PENDING" : "PAID";
      const created = await tx.order.create({
        data: {
          customerId: resolvedCustomerId,
          totalAmount: new Decimal(totalAmount),
          paymentStatus: computedPaymentStatus,
          orderStatus: "PENDING",
          items: {
            create: groupedItems.map((it) => {
              const product = productMap.get(it.productId);
              if (!product) throw new Error(`Product ${it.productId} not found`);
              return {
                productId: it.productId,
                quantity: it.quantity,
                price: new Decimal(Number(product.sellingPrice)),
              };
            }),
          },
        },
      });

      if (computedPaymentStatus === "PAID") {
        await tx.payment.create({
          data: {
            orderId: created.id,
            amount: new Decimal(totalAmount),
            method: paymentMethod,
            status: "PAID",
          },
        });
      }

      const full = await tx.order.findUnique({
        where: { id: created.id },
        include: { customer: true, payments: { take: 1, select: { method: true } }, items: { include: { product: true } } },
      });
      if (!full) throw new Error("Order created but fetch failed");
      return full;
    }, { maxWait: 15000, timeout: 15000 });

    return res.status(201).json(orderToResponse(createdOrder as Parameters<typeof orderToResponse>[0]));
  } catch (e) {
    if (e instanceof Error) {
      if (
        e.message.includes("Customer not found") ||
        e.message.includes("Product") ||
        e.message.includes("stock") ||
        e.message.includes("required")
      ) {
        return res.status(400).json({ message: e.message });
      }
    }
    console.error("Order create error:", e);
    return res.status(500).json({ message: "Failed to create order" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const parsed = UpdateOrderBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const data: Record<string, unknown> = {};
    if (parsed.data.paymentStatus !== undefined) data.paymentStatus = parsed.data.paymentStatus;
    if (parsed.data.orderStatus !== undefined) data.orderStatus = parsed.data.orderStatus;
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No updatable fields provided" });
    }

    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.order.update({
        where: { id: String(req.params.id ?? "") },
        data,
      });
      if (parsed.data.paymentStatus === "PAID") {
        const existingPaid = await tx.payment.findFirst({
          where: { orderId: updated.id, status: "PAID" },
          select: { id: true },
        });
        if (!existingPaid) {
          await tx.payment.create({
            data: {
              orderId: updated.id,
              amount: updated.totalAmount,
              method: parsed.data.paymentMethod ?? "CASH",
              status: "PAID",
            },
          });
        }
      }
      const full = await tx.order.findUnique({
        where: { id: updated.id },
        include: { customer: true, payments: { take: 1, select: { method: true } }, items: { include: { product: true } } },
      });
      if (!full) throw new Error("Order not found after update");
      return full;
    }, { maxWait: 15000, timeout: 15000 });

    return res.json(orderToResponse(order as Parameters<typeof orderToResponse>[0]));
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025")
      return res.status(404).json({ message: "Order not found" });
    console.error("Order update error:", e);
    return res.status(500).json({ message: "Failed to update order" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.order.delete({ where: { id: String(req.params.id ?? "") } });
    return res.status(204).send();
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025")
      return res.status(404).json({ message: "Order not found" });
    console.error("Order delete error:", e);
    return res.status(500).json({ message: "Failed to delete order" });
  }
});

export default router;
