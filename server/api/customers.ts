import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { CreateCustomerBodySchema, UpdateCustomerBodySchema } from "../../shared/api-schemas.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/options", async (req: AuthRequest, res: Response) => {
  try {
    const search = String(req.query.search ?? "").trim();
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const customers = await prisma.customer.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: "asc" },
      take: 100,
    });
    return res.json({ items: customers });
  } catch (e) {
    console.error("Customers options error:", e);
    return res.status(500).json({ message: "Failed to fetch customer options" });
  }
});

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
    const skip = (page - 1) * limit;
    const search = String(req.query.search ?? "").trim();
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { id: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.customer.count({ where }),
    ]);
    const withStats = await Promise.all(
      items.map(async (c: { id: string; name: string; email: string; phone: string; address: string; createdAt: Date }) => {
        const [ordersCount, lastOrder, ordersSum] = await Promise.all([
          prisma.order.count({ where: { customerId: c.id } }),
          prisma.order.findFirst({ where: { customerId: c.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
          prisma.order.aggregate({ where: { customerId: c.id }, _sum: { totalAmount: true } }),
        ]);
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone ?? "",
          ordersPlaced: ordersCount,
          totalSpend: Number(ordersSum._sum.totalAmount ?? 0),
          lastOrderDate: lastOrder?.createdAt.toISOString().slice(0, 10) ?? "",
          createdAt: c.createdAt.toISOString(),
        };
      })
    );
    return res.json({
      items: withStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("Customers list error:", e);
    return res.status(500).json({ message: "Failed to fetch customers" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id ?? "");
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { orders: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    const [ordersCount, ordersSum] = await Promise.all([
      prisma.order.count({ where: { customerId: customer.id } }),
      prisma.order.aggregate({ where: { customerId: customer.id }, _sum: { totalAmount: true } }),
    ]);
    const lastOrder = (customer as { orders?: { createdAt: Date }[] }).orders?.[0];
    return res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      ordersPlaced: ordersCount,
      totalSpend: Number(ordersSum._sum.totalAmount ?? 0),
      lastOrderDate: lastOrder?.createdAt.toISOString().slice(0, 10) ?? "",
      createdAt: customer.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Customer get error:", e);
    return res.status(500).json({ message: "Failed to fetch customer" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreateCustomerBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const customer = await prisma.customer.create({ data: parsed.data });
    return res.status(201).json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      ordersPlaced: 0,
      totalSpend: 0,
      lastOrderDate: "",
      createdAt: customer.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("Customer create error:", e);
    return res.status(500).json({ message: "Failed to create customer" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const parsed = UpdateCustomerBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const customer = await prisma.customer.update({
      where: { id: String(req.params.id ?? "") },
      data: parsed.data,
    });
    return res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      createdAt: customer.createdAt.toISOString(),
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025")
      return res.status(404).json({ message: "Customer not found" });
    console.error("Customer update error:", e);
    return res.status(500).json({ message: "Failed to update customer" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.customer.delete({ where: { id: String(req.params.id ?? "") } });
    return res.status(204).send();
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025")
      return res.status(404).json({ message: "Customer not found" });
    console.error("Customer delete error:", e);
    return res.status(500).json({ message: "Failed to delete customer" });
  }
});

export default router;
