-- Enable trigram similarity support for optional fuzzy search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "MedicineMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicineMaster_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MedicineMaster_name_key" ON "MedicineMaster"("name");

-- Improves performance for similarity/LIKE-style lookups on medicine names.
CREATE INDEX "MedicineMaster_name_trgm_idx"
    ON "MedicineMaster"
    USING GIN ("name" gin_trgm_ops);
