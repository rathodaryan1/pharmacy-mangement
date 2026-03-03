# Pharmacy Management System – Setup & Migration

This app uses **Express API routes** (not Next.js), **PostgreSQL**, **Prisma**, **JWT**, **bcrypt**, and **Zod**. Follow these steps to run with a real database.

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Copy the example env and set your values:

```bash
cp .env.example .env
```

Edit `.env`:

- **DATABASE_URL** – PostgreSQL connection string, e.g.  
  `postgresql://user:password@localhost:5432/pharmacy?schema=public`
- **JWT_SECRET** – Long random string for signing JWTs (required in production).

## 3. Database migration (Prisma)

Generate the Prisma client and create the database schema:

```bash
# Generate Prisma client
npm run db:generate

# Create database and run migrations
npm run db:migrate
```

When prompted, name the migration (e.g. `init`).

To only push the schema without migration history (e.g. for a quick dev DB):

```bash
npx prisma db push
```

## 4. (Optional) Seed or first user

There is no seed script by default. Create the first user via the UI:

1. Run the app (see below).
2. Open the app in the browser; you’ll see the **Login** page.
3. Use **“Need an account? Register”** and register with name, email, and password.
4. You’ll be logged in and can use the dashboard.

Or create a user via Prisma Studio:

```bash
npm run db:studio
```

Then run a one-off script or use the Register API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"secret123","role":"ADMIN"}'
```

## 5. Run the app

**Development:**

```bash
npm run dev
```

- Backend and Vite dev server run together.
- Default port: **5000** (or the one set in `PORT`).
- Open `http://localhost:5000` and log in (or register).

**Production:**

```bash
npm run build
npm start
```

- Serves the built client and API from the same process.

## 6. API overview

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`
- **Me:** `GET /api/me` (Bearer token required)
- **Products:** `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id`
- **Customers:** `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/:id`
- **Orders:** `GET/POST /api/orders`, `GET/PUT/DELETE /api/orders/:id`
- **Payments:** `GET/POST /api/payments`
- **Suppliers:** `GET/POST /api/suppliers`, `GET /api/suppliers/:id`
- **Purchases:** `GET/POST /api/purchases`, `GET /api/purchases/:id`, `PUT /api/purchases/:id/receive`
- **Reports:** `GET /api/reports/sales-summary`, `.../sales-summary/csv`, `.../sales-summary/pdf`
- **Dashboard:** `GET /api/dashboard/kpis`, `GET /api/dashboard/sales-chart`, `GET /api/dashboard/recent-orders`

All routes under `/api` except `/api/auth/*` require:

```http
Authorization: Bearer <jwt_token>
```

## 7. Folder structure (backend)

- **prisma/schema.prisma** – Data models and DB schema
- **server/lib/prisma.ts** – Prisma client
- **server/lib/auth.ts** – JWT and bcrypt helpers
- **server/middleware/auth.ts** – Auth and optional role middleware
- **server/api/** – Route handlers (auth, products, customers, orders, payments, suppliers, purchases, reports, dashboard)
- **server/routes.ts** – Mounts API routes and `/api/me`
- **shared/api-schemas.ts** – Zod schemas for request validation

## 8. Troubleshooting

- **“PrismaClient is unable to run in the browser”** – Ensure Prisma and API code run only in Node (server), not in the Vite bundle.
- **401 on /api/me or other APIs** – Send a valid JWT in `Authorization: Bearer <token>` after login.
- **Migration fails** – Check that PostgreSQL is running and `DATABASE_URL` is correct; ensure the database exists if your URL does not auto-create it.
