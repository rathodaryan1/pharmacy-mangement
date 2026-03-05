import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { CreateProductBodySchema, UpdateProductBodySchema } from "../../shared/api-schemas.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Antibiotics: ["amoxicillin", "azithromycin", "ciprofloxacin", "doxycycline", "cef", "penicillin"],
  "Pain Relievers": ["ibuprofen", "paracetamol", "acetaminophen", "diclofenac", "naproxen", "pain"],
  "Blood Pressure": ["amlodipine", "losartan", "telmisartan", "atenolol", "metoprolol", "bp"],
  Antacids: ["omeprazole", "pantoprazole", "antacid", "ranitidine", "esomeprazole"],
  Vitamins: ["vitamin", "b12", "d3", "multivitamin", "zinc", "folic"],
  "First Aid": ["bandage", "gauze", "antiseptic", "cotton", "first aid", "ointment"],
};

function inferCategory(name: string): string {
  const normalized = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => normalized.includes(k))) return category;
  }
  return "Uncategorized";
}

function buildCategoryFilter(category: string): Record<string, unknown> | null {
  if (!category || category === "All") return null;

  if (category === "Uncategorized") {
    const allKeywords = Object.values(CATEGORY_KEYWORDS).flat();
    return {
      AND: allKeywords.map((kw) => ({ name: { not: { contains: kw, mode: "insensitive" as const } } })),
    };
  }

  const keywords = CATEGORY_KEYWORDS[category];
  if (!keywords?.length) return null;
  return {
    OR: keywords.map((kw) => ({ name: { contains: kw, mode: "insensitive" as const } })),
  };
}

function toProductRow(p: {
  id: string;
  name: string;
  batchNumber: string;
  stock: number;
  purchasePrice: unknown;
  sellingPrice: unknown;
  expiryDate: Date;
  createdAt: Date;
}) {
  const status =
    p.stock === 0 ? "out of stock" : p.stock <= 30 ? "low stock" : "in stock";
  return {
    id: p.id,
    name: p.name,
    category: inferCategory(p.name),
    batchNumber: p.batchNumber,
    stock: p.stock,
    purchasePrice: Number(p.purchasePrice),
    sellingPrice: Number(p.sellingPrice),
    expiryDate: p.expiryDate.toISOString().slice(0, 10),
    status,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
    const skip = (page - 1) * limit;
    const search = String(req.query.search ?? "").trim();
    const category = String(req.query.category ?? "").trim();

    const andFilters: Record<string, unknown>[] = [];
    if (search) {
      andFilters.push({
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { batchNumber: { contains: search, mode: "insensitive" as const } },
          { id: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }
    const categoryFilter = buildCategoryFilter(category);
    if (categoryFilter) andFilters.push(categoryFilter);
    const where = andFilters.length ? { AND: andFilters } : {};
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.product.count({ where }),
    ]);
    return res.json({
      items: items.map(toProductRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("Products list error:", e);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.get("/meta/categories", async (_req: AuthRequest, res: Response) => {
  try {
    const allProducts = await prisma.product.findMany({ select: { name: true } });
    const counts: Record<string, number> = {
      All: allProducts.length,
      Antibiotics: 0,
      "Pain Relievers": 0,
      "Blood Pressure": 0,
      Antacids: 0,
      Vitamins: 0,
      "First Aid": 0,
      Uncategorized: 0,
    };
    for (const p of allProducts) {
      const category = inferCategory(p.name);
      counts[category] = (counts[category] ?? 0) + 1;
    }
    return res.json({ counts });
  } catch (e) {
    console.error("Product category meta error:", e);
    return res.status(500).json({ message: "Failed to fetch product categories" });
  }
});

router.get("/search", async (req: AuthRequest, res: Response) => {
  try {
    const query = String(req.query.q ?? "").trim();
    const category = String(req.query.category ?? "").trim();
    if (query.length === 0) {
      return res.json([]);
    }

    const where: Record<string, unknown> = {
      name: { contains: query, mode: "insensitive" as const },
      stock: { gt: 0 },
    };
    const categoryFilter = buildCategoryFilter(category);
    if (categoryFilter) {
      where.AND = [categoryFilter];
    }

    const items = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        batchNumber: true,
        sellingPrice: true,
        stock: true,
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    return res.json(
      items.map((item: { id: string; name: string; batchNumber: string; sellingPrice: unknown; stock: number }) => ({
        id: item.id,
        name: item.name,
        batchNumber: item.batchNumber,
        sellingPrice: Number(item.sellingPrice),
        stock: item.stock,
        category: inferCategory(item.name),
      })),
    );
  } catch (e) {
    console.error("Product search error:", e);
    return res.status(500).json({ message: "Failed to search products" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: String(req.params.id ?? "") } });
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(toProductRow(product));
  } catch (e) {
    console.error("Product get error:", e);
    return res.status(500).json({ message: "Failed to fetch product" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const parsed = CreateProductBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const { name, batchNumber, stock, purchasePrice, sellingPrice, expiryDate } = parsed.data;
    const expiry = new Date(expiryDate);
    const product = await prisma.product.create({
      data: {
        name,
        batchNumber,
        stock,
        purchasePrice,
        sellingPrice,
        expiryDate: expiry,
      },
    });
    return res.status(201).json(toProductRow(product));
  } catch (e) {
    console.error("Product create error:", e);
    return res.status(500).json({ message: "Failed to create product" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const parsed = UpdateProductBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    }
    const data: Record<string, unknown> = { ...parsed.data };
    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate as string);
    const product = await prisma.product.update({
      where: { id: String(req.params.id ?? "") },
      data,
    });
    return res.json(toProductRow(product));
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025")
      return res.status(404).json({ message: "Product not found" });
    console.error("Product update error:", e);
    return res.status(500).json({ message: "Failed to update product" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: String(req.params.id ?? "") } });
    return res.status(204).send();
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025")
      return res.status(404).json({ message: "Product not found" });
    console.error("Product delete error:", e);
    return res.status(500).json({ message: "Failed to delete product" });
  }
});

export default router;
