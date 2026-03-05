import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.warn(`Static build directory not found: ${distPath}. Skipping static file serving.`);
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
