# 💊 SidStock — Pharmacy Inventory Management System

A full-stack, production-style **Pharmacy Inventory Management System**: a Node.js/Express/PostgreSQL REST API paired with a React (Vite, JavaScript, no TypeScript) admin + staff dashboard.

> Built as an academic/portfolio project demonstrating REST API design, PostgreSQL transactions & normalization, JWT auth with role-based authorization, file uploads, server-side search/filter/sort/pagination, and a polished, non-templated UI.

---

## Project Overview

MedStock manages a pharmacy's medicines ("products"), categories, suppliers, stock levels, batches/expiry dates, and a full audit trail (`inventory_history`) of every stock movement. It ships with two dashboards:

- **Admin Dashboard** — full CRUD over medicines/categories/suppliers/users, inventory operations, reports, and CSV export.
- **Staff Dashboard** — read access to the catalog plus the ability to record stock movements, with all destructive/administrative actions hidden *and independently blocked on the backend*.

## Features

- Medicine (product) CRUD with image upload
- Soft delete for medicines, with an admin-only "Show Deleted" view and one-click restore
- Categories & suppliers management (with "in-use" delete protection)
- Supplier contact validation: Pakistani phone format (`+92XXXXXXXXXX`, `0XXXXXXXXXX`, or `+92-XXX-XXXXXXX`) enforced at both the API and database layer; at least one of email or phone is required per supplier
- Batch tracking (batch number, purchase price, expiry date) per medicine
- Full inventory history / audit trail for every stock change
- Server-side search, multi-field filtering, sortable columns, and pagination — combinable in a single request
- Low stock / out of stock / expired / expiring-soon monitoring, computed live from PostgreSQL
- CSV export of the medicine catalog (respects active filters)
- JWT authentication with Bcrypt password hashing
- Role-based authorization (`admin` / `staff`) enforced on **every** protected route, not just hidden UI
- PostgreSQL transactions for all stock mutations (`BEGIN … COMMIT` / `ROLLBACK`), preventing quantity/history drift and negative stock
- Centralized validation (Joi) and centralized error handling with a consistent JSON envelope
- Responsive, professional healthcare-styled UI (plain CSS3, no UI framework)

## Tech Stack

**Frontend:** React 19 (JavaScript, no TypeScript), Vite, React Router, Axios, plain CSS3, lucide-react icons
**Backend:** Node.js, Express, JWT (`jsonwebtoken`), Bcrypt, Joi, Multer, Helmet, CORS, express-rate-limit, dotenv
**Database:** PostgreSQL (`pg` driver, hand-written parameterized SQL — no ORM)

## Architecture

```
React UI  →  REST API (Express routes)  →  Controllers  →  Services  →  Repositories  →  PostgreSQL
```

- **Routes** wire URL + HTTP verb to middleware (auth/role/validation/upload) + a controller.
- **Controllers** are thin — they parse the request and shape the response envelope.
- **Services** hold business rules (SKU uniqueness, stock math, transactions).
- **Repositories** are the only layer that touches SQL — all parameterized, no string-concatenated queries.

## Database Schema

Six normalized tables (see [`backend/src/config/schema.sql`](backend/src/config/schema.sql) for the full DDL):

```
categories ──┐
             │ 1:N
suppliers ───┼──→ medicines ──┬──→ medicine_batches (1:N)
             │                └──→ inventory_history (1:N) ──→ users
             ↓
        (referenced by id only — no duplicated text on medicines)
```

- **Normalization:** `medicines` stores `category_id` / `supplier_id` foreign keys only — category/supplier names are never duplicated onto the medicine row.
- **Constraints:** `UNIQUE` (email, sku, category name), `CHECK` (`price > 0`, `quantity >= 0`, `minimum_stock >= 0`, `role IN ('admin','staff')`, `transaction_type IN ('IN','OUT')`, **`users.email` must end in `@gmail.com`**, **`suppliers.phone` must match a Pakistani mobile format**), foreign keys with `ON DELETE` behavior.
- **Indexes:** on `sku`, `name` (+ lowercased), `category_id`, `supplier_id`, `price`, `quantity`, `created_at`, `medicine_batches.expiry_date`, `inventory_history.medicine_id`/`created_at`/`user_id`.
- **Soft delete:** `medicines`, `categories`, `suppliers` use `is_deleted` so history/FK integrity survives a "delete" — every query filters `is_deleted = FALSE`.

---

## Installation

### PostgreSQL Setup

1. Install PostgreSQL 14+ locally (or use a hosted instance).
2. Create a database:
   ```bash
   createdb pharmacy_inventory
   # or, from psql:
   CREATE DATABASE pharmacy_inventory;
   ```

### Backend Setup

```bash
cd backend
cp .env.example .env      # then edit DATABASE_URL / JWT_SECRET as needed
npm install
npm run migrate           # creates all tables, constraints, indexes, triggers
npm run dev                 # starts the API on http://localhost:5000 (nodemon)
```
### Frontend Setup

```bash
cd frontend
cp .env.example .env      # VITE_API_URL should point at the backend, e.g. http://localhost:5000/api
npm install
npm run dev                 # starts Vite on http://localhost:5173
```

### Running the Application

Run backend and frontend in two terminals (`npm run dev` in each), then open `http://localhost:5173` and log in with one of the seeded accounts above. Admins land on `/admin/dashboard`, staff on `/user/dashboard`.

---

## Environment Variables

**backend/.env**
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pharmacy_inventory
DB_SSL=false
JWT_SECRET=change_this_to_a_long_random_secret_in_production
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
MAX_UPLOAD_SIZE_MB=5
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=300
SEED_ADMIN_EMAIL=admin@pharmacy.local
SEED_ADMIN_PASSWORD=Admin@12345
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

`.env` files are git-ignored; only `.env.example` is committed. Never commit real database credentials or JWT secrets.

---

## Authentication

JWT-based. `POST /api/auth/login` verifies the password with Bcrypt and returns a signed JWT (`Authorization: Bearer <token>`). Every protected route re-verifies the token **and** re-loads the user from PostgreSQL on each request, so a deactivated account is rejected even with a still-valid token. See [docs/API.md](docs/API.md) for full endpoint details.

## Roles & Permissions

| | Admin | Staff |
|---|:---:|:---:|
| View / search / filter / sort / paginate medicines | ✅ | ✅ |
| View medicine details & inventory history | ✅ | ✅ |
| Stock IN / Stock OUT | ✅ | ✅ |
| Add / edit / delete medicines | ✅ | ❌ |
| Restore a soft-deleted medicine | ✅ | ❌ |
| Manage categories & suppliers | ✅ | ❌ |
| Manage users | ✅ | ❌ |
| Export CSV | ✅ | ❌ |

Authorization is enforced **on the backend** via `authenticate` + `requireRole` middleware on every route — the frontend hiding a button is a UX nicety, never the security boundary.

## API Documentation

Full endpoint reference (query params, request/response bodies, error codes) is in **[docs/API.md](docs/API.md)**.

## Postman Collection

Import **[docs/Pharmacy-Inventory-API.postman_collection.json](docs/Pharmacy-Inventory-API.postman_collection.json)** into Postman. It includes every endpoint grouped by resource, with `{{baseUrl}}`, `{{adminToken}}`, `{{staffToken}}` variables — run "Auth → Login (Admin)" / "Login (Staff)" first; their test scripts auto-populate the token variables for the rest of the collection.

## Testing

A lightweight, dependency-free smoke-test suite (Node's built-in test runner + native `fetch`) exercises the running API end-to-end — auth, role enforcement, transactional stock IN/OUT (including the negative-stock guard), and combined search/sort/pagination:

```bash
cd backend
npm run migrate && npm run seed   # if not already done
npm run dev                        # in one terminal
npm test                           # in another
```

## Project Structure

```
pharmacy-inventory-system/
├── backend/
│   ├── src/
│   │   ├── config/        # db.js, schema.sql, migrate.js, seed.js
│   │   ├── controllers/    # thin HTTP-layer handlers
│   │   ├── services/        # business logic & transactions
│   │   ├── repositories/    # parameterized SQL, the only layer touching pg
│   │   ├── routes/           # Express routers
│   │   ├── middleware/       # auth, role, upload, validation, error handling
│   │   ├── validators/       # Joi schemas
│   │   ├── utils/             # jwt, apiResponse, ApiError, csv, stockStatus
│   │   └── constants/
│   ├── uploads/                # uploaded medicine images (git-ignored)
│   ├── tests/                   # smoke tests
│   ├── docs/                     # mirrored API docs + Postman collection
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/    # Sidebar, Navbar, MedicineTable, forms, Modal, Toast, ...
│       ├── pages/
│       │   ├── auth/        # Login, Register
│       │   ├── admin/        # Dashboard, Medicines, Categories, Suppliers, Users, Reports, ...
│       │   └── user/          # Dashboard, Medicines, Inventory, InventoryHistory, Profile
│       ├── layouts/           # AdminLayout, UserLayout
│       ├── context/            # AuthContext, ToastContext
│       ├── services/            # one file per API resource
│       └── routes/               # ProtectedRoute
└── docs/                             # API.md, Postman collection
```
