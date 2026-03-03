import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/kpis", async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      lowStock,
      outOfStock,
      completedOrders,
      cancelledOrders,
      pendingPayments,
      revenueResult,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.customer.count(),
      prisma.product.count(),
      prisma.product.count({ where: { stock: { gt: 0, lte: 30 } } }),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.order.count({ where: { orderStatus: "COMPLETED" } }),
      prisma.order.count({ where: { orderStatus: "CANCELLED" } }),
      prisma.order.count({ where: { paymentStatus: "PENDING", orderStatus: { not: "CANCELLED" } } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID", orderStatus: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      }),
    ]);
    const totalRevenue = Number(revenueResult._sum.totalAmount ?? 0);
    const profitEstimate = totalRevenue * 0.3;
    return res.json({
      overview: [
        { title: "Total Profit", value: `₹${profitEstimate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, trend: "+20.1%", isPositive: true },
        { title: "Total Customers", value: totalCustomers.toLocaleString(), trend: "+15.1%", isPositive: true },
        { title: "Total Orders", value: totalOrders.toLocaleString(), trend: "+4.1%", isPositive: true },
        { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, trend: "-1.2%", isPositive: false },
      ],
      products: [
        { title: "Total Products", value: String(totalProducts), trend: `+${totalProducts}`, isPositive: true },
        { title: "Low Stock Items", value: String(lowStock), trend: `-${lowStock}`, isPositive: true },
        { title: "Out of Stock", value: String(outOfStock), trend: `+${outOfStock}`, isPositive: outOfStock === 0 },
      ],
      orders: [
        { title: "Total Orders", value: String(totalOrders), trend: `+${totalOrders}`, isPositive: true },
        { title: "Completed", value: String(completedOrders), trend: `+${completedOrders}`, isPositive: true },
        { title: "Pending Payments", value: String(pendingPayments), trend: `+${pendingPayments}`, isPositive: false },
        { title: "Cancelled", value: String(cancelledOrders), trend: `-${cancelledOrders}`, isPositive: true },
      ],
    });
  } catch (e) {
    console.error("Dashboard KPIs error:", e);
    return res.status(500).json({ message: "Failed to fetch KPIs" });
  }
});

router.get("/sales-chart", async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(String(req.query.year ?? new Date().getFullYear()), 10);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end }, orderStatus: { not: "CANCELLED" } },
      select: { totalAmount: true, createdAt: true },
    });
    const byMonth = new Map<number, number>();
    for (let m = 0; m < 12; m++) byMonth.set(m, 0);
    for (const o of orders) {
      const m = o.createdAt.getMonth();
      byMonth.set(m, (byMonth.get(m) ?? 0) + Number(o.totalAmount));
    }
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = monthNames.map((name, i) => ({
      name,
      total: byMonth.get(i) ?? 0,
      profit: ((byMonth.get(i) ?? 0) * 0.3),
    }));
    return res.json(chartData);
  } catch (e) {
    console.error("Sales chart error:", e);
    return res.status(500).json({ message: "Failed to fetch chart data" });
  }
});

router.get("/recent-orders", async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit), 10) || 5));
    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: { include: { product: true } } },
    });
    return res.json({
      items: orders.map((o) => ({
        id: o.id,
        customerName: o.customer.name,
        orderDate: o.createdAt.toISOString().slice(0, 10),
        products: o.items.map((i) => i.product.name),
        totalAmount: Number(o.totalAmount),
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
      })),
    });
  } catch (e) {
    console.error("Recent orders error:", e);
    return res.status(500).json({ message: "Failed to fetch recent orders" });
  }
});

export default router;
