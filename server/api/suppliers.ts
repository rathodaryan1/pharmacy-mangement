import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { CreateSupplierBodySchema } from "../../shared/api-schemas.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
    return res.json({ items });
  } catch (e) {
    console.error("Suppliers list error:", e);
    return res.status(500).json({ message: "Failed to fetch suppliers" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: String(req.params.id ?? "") } });
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    return res.json(supplier);
  } catch (e) {
    console.error("Supplier get error:", e);
    return res.status(500).json({ message: "Failed to fetch supplier" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreateSupplierBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const supplier = await prisma.supplier.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
      },
    });
    return res.status(201).json(supplier);
  } catch (e) {
    console.error("Supplier create error:", e);
    return res.status(500).json({ message: "Failed to create supplier" });
  }
});

export default router;
