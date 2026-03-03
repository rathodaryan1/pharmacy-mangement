import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthRequest } from "../middleware/auth.js";
import PDFDocument from "pdfkit";

const router = Router();

router.get("/sales-summary", async (req: AuthRequest, res: Response) => {
  try {
    const startStr = String(req.query.start ?? "");
    const endStr = String(req.query.end ?? "");
    const start = startStr ? new Date(startStr) : new Date(new Date().getFullYear(), 0, 1);
    const end = endStr ? new Date(endStr) : new Date();
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        orderStatus: { not: "CANCELLED" },
      },
      include: { items: true },
    });
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const payments = await prisma.payment.aggregate({
      where: { createdAt: { gte: start, lte: end }, status: "PAID" },
      _sum: { amount: true },
    });
    const totalPaid = Number(payments._sum.amount ?? 0);
    const byMonth = new Map<string, { revenue: number; orders: number }>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 7);
      const cur = byMonth.get(key) ?? { revenue: 0, orders: 0 };
      cur.revenue += Number(o.totalAmount);
      cur.orders += 1;
      byMonth.set(key, cur);
    }
    const months = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, data]) => ({ name, total: data.revenue, profit: data.revenue * 0.3, orders: data.orders }));
    return res.json({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalPaid,
      byMonth: months,
    });
  } catch (e) {
    console.error("Sales summary error:", e);
    return res.status(500).json({ message: "Failed to generate sales summary" });
  }
});

router.get("/sales-summary/csv", async (req: AuthRequest, res: Response) => {
  try {
    const startStr = String(req.query.start ?? "");
    const endStr = String(req.query.end ?? "");
    const start = startStr ? new Date(startStr) : new Date(new Date().getFullYear(), 0, 1);
    const end = endStr ? new Date(endStr) : new Date();
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        orderStatus: { not: "CANCELLED" },
      },
      include: { customer: true, items: { include: { product: true } } },
    });
    const headers = ["Order ID", "Date", "Customer", "Total Amount", "Status", "Payment"];
    const rows = orders.map((o) =>
      [
        o.id,
        o.createdAt.toISOString().slice(0, 10),
        o.customer.name,
        Number(o.totalAmount).toFixed(2),
        o.orderStatus,
        o.paymentStatus,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="sales-report-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.csv"`);
    return res.send(csv);
  } catch (e) {
    console.error("Sales CSV error:", e);
    return res.status(500).json({ message: "Failed to generate CSV" });
  }
});

router.get("/sales-summary/pdf", async (req: AuthRequest, res: Response) => {
  try {
    const startStr = String(req.query.start ?? "");
    const endStr = String(req.query.end ?? "");
    const start = startStr ? new Date(startStr) : new Date(new Date().getFullYear(), 0, 1);
    const end = endStr ? new Date(endStr) : new Date();
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        orderStatus: { not: "CANCELLED" },
      },
    });
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="sales-report-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.pdf"`);
    doc.pipe(res);
    doc.fontSize(20).text("Pharmacy Sales Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Period: ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`);
    doc.text(`Total Orders: ${orders.length}`);
    doc.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`);
    doc.moveDown();
    doc.text("Order ID          Date          Amount");
    doc.moveDown(0.5);
    for (const o of orders.slice(0, 100)) {
      doc.text(`${o.id}   ${o.createdAt.toISOString().slice(0, 10)}   ₹${Number(o.totalAmount).toFixed(2)}`);
    }
    if (orders.length > 100) doc.text(`... and ${orders.length - 100} more orders`);
    doc.end();
  } catch (e) {
    console.error("Sales PDF error:", e);
    return res.status(500).json({ message: "Failed to generate PDF" });
  }
});

export default router;
