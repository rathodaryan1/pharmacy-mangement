import { Prisma } from "@prisma/client";
import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthRequest } from "../middleware/auth.js";

type MedicineMasterSearchItem = {
  id: string;
  name: string;
};

const router = Router();

async function searchBySimilarity(query: string): Promise<MedicineMasterSearchItem[]> {
  // pg_trgm fallback for typo-tolerant search when "contains" has no matches.
  try {
    const rows = await prisma.$queryRaw<MedicineMasterSearchItem[]>(Prisma.sql`
      SELECT id, name
      FROM "MedicineMaster"
      WHERE similarity(name, ${query}) > 0.25
      ORDER BY similarity(name, ${query}) DESC, name ASC
      LIMIT 10
    `);
    return rows;
  } catch (error) {
    // Keep search endpoint stable even if pg_trgm extension is unavailable.
    console.warn("Medicine master fuzzy search unavailable:", error);
    return [];
  }
}

router.get("/search", async (req: AuthRequest, res: Response<MedicineMasterSearchItem[] | { message: string }>) => {
  try {
    const rawQuery = req.query.q;
    if (typeof rawQuery !== "string") {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }

    const query = rawQuery.trim();
    if (query.length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }

    // Primary search: fast case-insensitive substring match.
    const containsResults = await prisma.medicineMaster.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 10,
    });

    if (containsResults.length > 0) {
      return res.json(containsResults);
    }

    const fuzzyResults = await searchBySimilarity(query);
    return res.json(fuzzyResults);
  } catch (error) {
    console.error("Medicine master search error:", error);
    return res.status(500).json({ message: "Failed to search medicine master" });
  }
});

export default router;
