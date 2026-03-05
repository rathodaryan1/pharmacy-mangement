import { Router, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

type InventoryResult = {
  id: string;
  name: string;
  batchNumber: string;
  sellingPrice: number;
  stock: number;
};

type MedicineMasterResult = {
  id: string;
  name: string;
};

type HybridSearchResponse =
  | { source: "inventory"; results: InventoryResult[] }
  | { source: "medicine_master"; results: MedicineMasterResult[] }
  | { source: "manual"; results: [] };

const router = Router();

router.get("/hybrid-search", async (req: AuthRequest, res: Response<HybridSearchResponse | { message: string }>) => {
  try {
    // Validate query parameter presence and type
    const rawQuery = req.query.q;
    if (typeof rawQuery !== "string") {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }

    const query = rawQuery.trim();
    if (!query) {
      return res.status(400).json({ message: "Query parameter 'q' cannot be empty" });
    }

    // Guard clause: short inputs should not trigger DB lookups
    if (query.length < 4) {
      return res.json({ source: "manual", results: [] });
    }

    // Step 1: Search internal inventory first
    const inventoryRows = await prisma.product.findMany({
      where: {
        name: { contains: query, mode: "insensitive" as const },
        stock: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        batchNumber: true,
        sellingPrice: true,
        stock: true,
      },
      take: 10,
    });

    if (inventoryRows.length > 0) {
      const inventoryResults: InventoryResult[] = inventoryRows.map((row: { id: string; name: string; batchNumber: string; sellingPrice: unknown; stock: number }) => ({
        id: row.id,
        name: row.name,
        batchNumber: row.batchNumber,
        sellingPrice: Number(row.sellingPrice),
        stock: row.stock,
      }));

      return res.json({ source: "inventory", results: inventoryResults });
    }

    // Step 2: Fallback to Medicine Master when inventory has no matches.
    const medicineMasterResults = await prisma.medicineMaster.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 10,
    });
    if (medicineMasterResults.length > 0) {
      return res.json({ source: "medicine_master", results: medicineMasterResults });
    }

    // Step 3: No inventory and no medicine master matches; allow manual product entry.
    return res.json({ source: "manual", results: [] });
  } catch (error) {
    console.error("Product hybrid search error:", error);
    return res.status(500).json({ message: "Failed to perform hybrid product search" });
  }
});

export default router;
